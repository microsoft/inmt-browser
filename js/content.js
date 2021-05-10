var translations = []
var injectState = false
var iftranslate = true

function getPageSource() {
    // Keep this function isolated - it can only call methods you set up in content scripts
    var htmlCode = document.documentElement.outerHTML;
    return htmlCode;
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function getXPath(node) {
    var comp, comps = [];
    var parent = null;
    var xpath = '';
    var getPos = function (node) {
        var position = 1,
            curNode;
        if (node.nodeType == Node.ATTRIBUTE_NODE) {
            return null;
        }
        for (curNode = node.previousSibling; curNode; curNode = curNode.previousSibling) {
            if (curNode.nodeName == node.nodeName) {
                ++position;
            }
        }
        return position;
    }

    if (node instanceof Document) {
        return '/';
    }

    for (; node && !(node instanceof Document); node = node.nodeType == Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode) {
        comp = comps[comps.length] = {};
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                comp.name = 'text()';
                break;
            case Node.ATTRIBUTE_NODE:
                comp.name = '@' + node.nodeName;
                break;
            case Node.PROCESSING_INSTRUCTION_NODE:
                comp.name = 'processing-instruction()';
                break;
            case Node.COMMENT_NODE:
                comp.name = 'comment()';
                break;
            case Node.ELEMENT_NODE:
                comp.name = node.nodeName;
                break;
        }
        comp.position = getPos(node);
    }

    for (var i = comps.length - 1; i >= 0; i--) {
        comp = comps[i];
        xpath += '/' + comp.name;
        if (comp.position != null) {
            xpath += '[' + comp.position + ']';
        }
    }

    return xpath;

}

function _x(STR_XPATH) {
    var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
    var xnodes = [];
    var xres;
    while (xres = xresult.iterateNext()) {
        xnodes.push(xres);
    }

    return xnodes;
}

var dialoger = `
<link rel="stylesheet" type="text/css" href="${chrome.extension.getURL("css/bootstrap.min.css")}"></link>
<link rel="stylesheet" type="text/css" href="${chrome.extension.getURL("css/fix.css")}"></link>
<script src="${chrome.extension.getURL("js/jquery.js")}"></script>
<script src="${chrome.extension.getURL("js/popper.js")}"></script>
<script src="${chrome.extension.getURL("js/bootstrap.min.js")}"></script>
<div id="dialoger" class="shadow mb-5 carder rounded bg-light">
        <div class="align-middle" style="background-color: #222; height: 40px; color:#eee;">
            <div style="float:left; margin:8px;" class="">Translate Dialog</div>
            <div id="closedialog" class="rounded">&#x2715;</div>
        </div>
        <div class="row p-2">
            <div class="col-sm-8 border-right">
                <span>Detected Sentence</span>
                <div class="input-group pb-2">
                    <textarea id="sourcesent"class="form-control"></textarea>
                </div>
                <span>Sentence Translation</span>
                <div class="input-group">
                    <textarea id="translatesent" class="form-control"></textarea>
                </div>
                <div class="pt-3 text-muted">
                    <span><select class="form-control form-control-sm" style="width:110px; display:inline-block"
                            disabled>
                            <option>Sans Serif</option>
                        </select> <i class="fas fa-bold px-2"></i><i class="fas fa-italic px-2"></i><i
                            class="fas fa-underline px-2 border-right"></i>
                        <i class="fas fa-align-left px-2 border-left"></i><i class="fas fa-outdent px-2"></i><i
                            class="fas fa-indent px-2"></i></span>
                </div>
                <div class="pt-3">
                    <button type="button" id="di-replace" class="btn btn-primary btn-sm"><i class="fas fa-stamp"></i>&nbsp; Replace</button>
                    <button type="button" id="di-resend" class="btn btn-info btn-sm"><i class="fas fa-retweet"></i>&nbsp; Resend</button>
                    <button type="button" id="di-reset" class="btn btn-primary btn-sm"><i class="fas fa-undo-alt"></i>&nbsp; Reset</button>
                    <!-- <button type="button" class="btn btn-primary btn-sm" disabled><i class="fas fa-save"></i>&nbsp; Save</button>
                    <button type="button" class="btn btn-danger btn-sm" disabled><i class="far fa-trash-alt"></i>&nbsp; Del</button> -->
                </div>
            </div>
            <div class="col-sm-4 border-left">
                <div class="mt-2">
                Quality
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                        aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 60%"></div>
                </div>
                </div>
                <div class="mt-2">
                Fidelity
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-info" role="progressbar"
                        aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style="width: 75%"></div>
                </div>
                </div>

                <div class="mt-2">
                    Fluency
                    <div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" role="progressbar"
                            aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width: 50%"></div>
                    </div>
                </div>

                <div class="mt-2">
                    Verity Fix
                    <div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-danger"
                            role="progressbar" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100"
                            style="width: 30%"></div>
                    </div>
                </div>

                <div class="input-group mt-3">
                    <div>Proof Comments</div>
                    <textarea class="form-control" rows="1" disabled></textarea>
                </div>
            </div>
        </div>
        
    </div>    
    
    `

// $('body *').addClass("disabledbutton");

// var allelements = $('body *').contents().filter(function () {
//     return (this.nodeType == 3) && this.nodeValue.match(/\S/);
// }).parents().addClass("disabledbutton")

$('a').on('click', function (e) {
    e.preventDefault();
})

// chrome.runtime.sendMessage( {myQuestion: "Is it ON or OFF?"}, function(response) {
//   console.log( "Extension state is: " + response.state); // should be ON
//   if(response.state !== "ON") return;

//   // Put the code you want to execute on every tab below:
//   // ....
// });



const injectedDiv = document.createElement('div');
const shadowRoot = injectedDiv.attachShadow({
    mode: 'open'
});
shadowRoot.innerHTML = dialoger;

function injectModal() {
    document.body.appendChild(injectedDiv);

    var allelements = $('body *').contents().filter(function () {
        return (this.nodeType == 3) && this.nodeValue.match(/\S/);
    }).wrap("<spanda class='translateelement918273645'></spanda>")

    $(".translateelement918273645").each(function () {
        $(this).addClass("enabledbutton");
    });

    $("html").append(`    <div id="left"></div>
<div id="right"></div>
<div id="top"></div>
<div id="bottom"></div>`)
    // console.log(injectedDiv);
}

function ejectModal() {
    // $(".translateelement918273645").each(function () {
    //     $(this).addClass("enabledbutton");
    // });
    // console.log($('.translateelement918273645'))
    $('.translateelement918273645').each(function () {
        var t = $(this);
        t.replaceWith(t.html());
    });

    $("#top").remove();
    $("#left").remove();
    $("#right").remove();
    $("#bottom").remove();
    // console.log($('.translateelement918273645'))
    // console.log(injectedDiv);
}

// document.body.appendChild(htmlToElement(dialoger));

// chrome.runtime.sendMessage({
//     type: "get-iftranslate",
// }, function (res) {
//     // if (res.iftranslate == 'false') {
//     //     ejectModal();
//     // }
//     if (res.iftranslate == 'true') {
//         injectModal();
//     }
// });

if (injectState == false) {
    injectModal();
    injectState = true
}

var source, target;



// $('span').each(function () {
//     // if ($(this).parents('#dialoger').length == 1) {
//     //     $(this).addClass('nointeract')
//     // }
// })



// $(".translateelement918273645").mouseenter(function () {
//     $(this).addClass("bg-hover")
// }).mouseleave(function () {
//     $(this).removeClass("bg-hover")
// });

var sellang = "hi"



$(".translateelement918273645").on('click', function () {
    $(".translateelement918273645").removeClass("bg-select");
    console.log($(this).text())
    source = $(this).text().trim();
    console.log(source)
    chrome.runtime.sendMessage({
        type: "content-translate",
        phrase: source
    }, function (res) {
        // console.log(res.translation)
        target = res.translation
        $(shadowRoot).find("#translatesent").val(target)
    });
    focuselement = $(this);
    $(this).addClass("bg-select");
    var elem_height = $(this).height();
    var elem_width = $(this).width();
    var elem_top_offset = $(this).offset().top
    var elem_left_offset = $(this).offset().left
    var window_width = $(window).width()
    
    console.log(elem_height, elem_width, elem_top_offset, elem_left_offset)
    var dialog_width = $(shadowRoot).find('#dialoger').width()
    if ((elem_left_offset + elem_width / 2 - dialog_width / 2) < 10 ) {
        elem_left_offset = 10 - elem_width / 2 + dialog_width / 2
    }

    if ((elem_left_offset + elem_width / 2 + dialog_width / 2 + 10) > window_width) {
        elem_left_offset = window_width - 10 - elem_width / 2 - dialog_width / 2
    }


    // if ((elem_left_offset + elem_width / 2 + dialog_width / 2) > 10) {
    //     elem_left_offset = 10
    // }
    // console.log(dialog_width)
    $(shadowRoot).find('#dialoger').css('left', elem_left_offset + elem_width / 2 - dialog_width / 2).css('top', elem_top_offset + elem_height + 15)
    //    $("#dialoger").css('display', 'block')
    $(shadowRoot).find('#dialoger').fadeIn(200);
    $(shadowRoot).find("#sourcesent").val($(this).text().trim())
})

$(shadowRoot).find("#closedialog").on('click', function () {
    $(shadowRoot).find('#dialoger').fadeOut(100);
    focuselement.removeClass("bg-select")
})

$(shadowRoot).find("#di-resend").on('click', function () {
    chrome.runtime.sendMessage({
        type: "content-translate",
        phrase: $(shadowRoot).find("#sourcesent").val()
    }, function (res) {
        // console.log(res.translation)
        $(shadowRoot).find("#translatesent").val(res.translation)
    });
})

$(shadowRoot).find("#di-replace").on('click', function () {
    // chrome.runtime.sendMessage({
    //     type: "translated",
    //     xpath: ,
    //     source: ,
    //     target: 
    // });

    translations.push({
        "xpath": getXPath(focuselement[0]),
        "source": source,
        "target": target
    })
    focuselement.html($(shadowRoot).find("#translatesent").val());
    $(shadowRoot).find('#dialoger').fadeOut(100);
    focuselement.removeClass("bg-select")
    
    // console.log(focuselement, focuselement.get(0), focuselement[0], getXPath(focuselement[0]))
    // console.log($(_x(getXPath(focuselement[0]))).text())
})

function search(nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
        if (myArray[i].xpath === nameKey) {
            return myArray[i];
        }
    }
}

$(shadowRoot).find("#di-reset").on('click', function () {
    var xpath = getXPath(focuselement[0])
    console.log(translations)
    var elemobj = search(xpath, translations);
    // translations.push({
    //     "xpath": ,
    //     "source": source,
    //     "target": target
    // })
    console.log(elemobj)

    focuselement.text(elemobj.source);
    $(shadowRoot).find('#dialoger').fadeOut(100);
    focuselement.removeClass("bg-select")
})

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     if (request.action == "iftranslate") {
//         console.log("Hellooooehhh")
//     }
// })

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.phrase == 'iftranslate') {
        if (msg.action == 'false' && injectState == true) {
            ejectModal();
            injectState = false
            iftranslate = false
        }
        if (msg.action == 'true' && injectState == false) {
            injectModal();
            injectState = true
            iftranslate = true
        }
    }

    if (msg.phrase == 'savetranslations') {
        console.log(translations)
        sendResponse({
            "translations": translations
        });
    }

    if (msg.text === 'are_you_there_content_script?') {
        console.log('I am here')
        sendResponse({
            status: "yes",
            state: iftranslate
        });
    }

    if (msg.phrase == 'savehtml') {
        print(getPageSource())
        sendResponse({
            "html": getPageSource()
        });
    }
});