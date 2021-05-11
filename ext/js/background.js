// Defining states required
var translations;
var sellang = "hi"


chrome.storage.local.set({"sellang": "hi"})
chrome.storage.local.set({"iftranslate": "false"})


var iftranslate = false

Array.prototype.removeDuplicates = function () {
    return this.filter(function (item, index, self) {
        return self.indexOf(item) == index;
    });
};

function getPageSource() {
    // Keep this function isolated - it can only call methods you set up in content scripts
    var htmlCode = document.documentElement.outerHTML;
    return htmlCode;
}

function downloadFile(options) {
    if (!options.url) {
        var blob = new Blob([options.content], {
            type: options.type
        });
        options.url = window.URL.createObjectURL(blob);
    }
    chrome.downloads.download({
        url: options.url,
        filename: options.filename
    })
}

function executeScripts(tabId, injectDetailsArray) {
    function createCallback(tabId, injectDetails, innerCallback) {
        return function () {
            chrome.tabs.executeScript(tabId, injectDetails, innerCallback);
        };
    }

    var callback = null;

    for (var i = injectDetailsArray.length - 1; i >= 0; --i)
        callback = createCallback(tabId, injectDetailsArray[i], callback);

    if (callback !== null)
        callback(); // execute outermost function
}



// To connect with content script for translation in DOM
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    
    if (request.type == "langselect") {
        // sellang = 
        chrome.storage.local.set({"sellang": request.phrase})
        // console.log("Hello")
    }

    if (request.type == "contentscript") {
        console.log("Hello")
        if (request.phrase == "True") {
            chrome.tabs.executeScript({
                file: 'js/jquery.js'
            });
            chrome.tabs.executeScript({
                file: 'js/content.js'
            });
            chrome.tabs.executeScript({
                file: 'css/content.css'
            });
        } else {
            
        }
    }

    if (request.type == "get-iftranslate") {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                text: "are_you_there_content_script?"
            }, function (msg) {
                msg = msg || {};
                if (msg.status != 'yes') {
                    iftranslate = false
                } else {
                    iftranslate = msg.state
                }

                sendResponse({
                    "iftranslate": iftranslate
                });
            });
            // chrome.tabs.sendMessage(tabs[0].id, {
            //     phrase: "iftranslate",
            //     action: iftranslate.toString()
            // }, function (response) {});
        });
        

        

        // chrome.tabs.insertCSS(tabId, {
        //     file: "css/mystyle.css"
        // });
        // chrome.tabs.executeScript(tabId, {
        //     file: "js/content.js"
        // });

        
    }

    if (request.type == 'set-iftranslate') {
        iftranslate = request.phrase

        // chrome.storage.local.set({
        //     globaltoggle: iftranslate
        // });
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                text: "are_you_there_content_script?"
            }, function (msg) {
                msg = msg || {};
                if (msg.status != 'yes') {
                    chrome.tabs.insertCSS(tabs[0].id, {
                        file: "css/content.css"
                    });
                    chrome.tabs.executeScript(tabs[0].id, {
                        file: "js/jquery.js"
                    }, function() {
                        chrome.tabs.executeScript(tabs[0].id, {
                            file: "js/content.js"
                        })
                    });
                }
            });

            chrome.tabs.sendMessage(tabs[0].id, {
                phrase: "iftranslate",
                action: iftranslate.toString()
            }, function (response) {});
        });

        // Setting the user sites to be translated
        // var userSites = [];
        // var checked = iftranslate;

        // chrome.storage.local.get({
        //     userSites: []
        // }, function (result) {
        //     userSites = result.userSites;
        //     if (checked == true) {
        //         userSites.push(request.currentURL);
        //     } else {
        //         userSites.splice(userSites.indexOf(request.currentURL), 1);
        //     }
        //     chrome.storage.local.set({
        //         userSites: userSites.removeDuplicates()
        //     }, function () {
        //         chrome.storage.local.get('userSites', function (result) {
        //             console.log(result.userSites)
        //         });
        //     });
        // });

        // console.log(iftranslate, userSites)


        // chrome.tabs.query({
        //     active: true,
        //     currentWindow: true
        // }, function (tabs) {
            
        // });
    }

    if (request.type == "translated") {
        translations.push({
            "xpath": request.xpath,
            "source": request.source,
            "target": request.target
        })
    }

    if (request.type == "savetranslations") {

        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                phrase: "savetranslations",
            }, function (response) {
                downloadFile({
                    filename: "translations.json",
                    content: JSON.stringify(response.translations),
                    type: "text/json"
                });
            });
        });

        
    }

    if (request.type == "savehtml") {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                phrase: "savehtml",
            }, function (response) {
                downloadFile({
                    filename: "page.html",
                    content: response.html,
                    type: "text/html"
                });
            });
        });
    }

    var translation;
    if (request.type == "content-translate"){
        console.log(request.phrase)
        // chrome.notifications.create('worktimer-notification', request.options, function () {});
        chrome.storage.local.get(['sellang'], function (result) {
            sellang = result.sellang
            $.ajax({
                type: "POST",
                url: "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=" + sellang,
                headers: {
                    'Ocp-Apim-Subscription-Key': config['Ocp-Apim-Subscription-Key'],
                },
                contentType: 'application/json; charset=utf-8',
                data: "[{'Text':'" + request.phrase + "'}]",
                success: function (result) {
                    // $("#translatesent").val(result[0]["translations"][0]["text"]);
                    translation = result[0]["translations"][0]["text"]
                    console.log(result)
                    sendResponse({
                        "translation": translation
                    });
                },
            });
        });
        
    }
    return true;
});