var currentURL;

$('#langselect').attr('disabled', true);
$('#langselect').css('opacity', '0.5');
$('#savetranslation').attr('disabled', true);
$('#savetranslation').css('opacity', '0.5');
$('#savehtml').attr('disabled', true);
$('#savehtml').css('opacity', '0.5');
$('#savepdf').attr('disabled', true);
$('#savepdf').css('opacity', '0.5');
$('#loadtranslation').attr('disabled', true);
$('#loadfile').attr('disabled', true);
$('#loadtranslation').css('opacity', '0.5');

chrome.tabs.query({
    'active': true,
    'lastFocusedWindow': true
}, function (tabs) {
    currentURL = tabs[0].url
    $("#urldisp").text(shortenURL(currentURL));
});

$(document).ready(function() {
    chrome.storage.local.get(['sellang'], function (result) {
        $(".langselect").val(result.sellang)
    });

    console.log("Hello")
    chrome.runtime.sendMessage({
        type: "get-iftranslate",
    }, function (response) {
        console.log(response.iftranslate)
        console.log("What?")
        if (response.iftranslate == true) {
            $('#globaltoggle').bootstrapToggle('on')
        }
    });

    console.log("Sir")

    // chrome.storage.local.get({userSites: []}, function (result) {
    //     userSites = result.userSites;
    //     if (userSites.includes(currentURL)) {
    //         $('#highlighter').bootstrapToggle('on')
    //         chrome.runtime.sendMessage({
    //             type: "contentscript",
    //             phrase: "True"
    //         });
    //     } else {
    //         $('#highlighter').bootstrapToggle('off')
    //     }
    // });

    // chrome.storage.local.get(['globaltoggle'], function (result) {
    //     if (result.globaltoggle) {
    //         $('#globaltoggle').bootstrapToggle(result.globaltoggle)
    //     } else {
    //         $('#globaltoggle').bootstrapToggle('on')
    //         chrome.storage.local.set({
    //             globaltoggle: 'on'
    //         });
    //     }
    // });
});

Array.prototype.removeDuplicates = function () {
    return this.filter(function (item, index, self) {
        return self.indexOf(item) == index;
    });
};

function shortenURL(url) {
    var maxLength = 20 + 3;
    maxLength = maxLength-3;
    var newURL = url
    if (url.length > maxLength){
        // newURL = url.slice(0, maxLength/2 + 7) + '...' + url.slice(url.length-maxLength/2)
        newURL = url.slice(8).split("/")
        newURL = url.slice(0,8) + newURL[0] + '/.../' + newURL[newURL.length -2] + '/'
    }
    return newURL
}
var userSites;

// $("#globaltoggle").change(function () {
    
//     var checked = $(this).prop('checked')

//     chrome.runtime.sendMessage({
//         type: "set-iftranslate",
//         phrase: checked,
//         currentURL: currentURL
//     });
// })

$("#globaltoggle").change(function () {
    var checked = $(this).prop('checked')
    console.log(checked)
    if (checked) {
        // $('body').css('background-color', '#eee');
        // $('body').css('opacity', '1');
        
        // chrome.storage.local.set({
        //     globaltoggle: 'on'
        // });
        chrome.runtime.sendMessage({
            type: "set-iftranslate",
            phrase: true
        });

        // $('#highlighter').attr('disabled', false);
        // $('#highlighter-tooltip').css('color', '#000');
        $('#langselect').attr('disabled', false);
        $('#langselect').attr('opacity', '1');
        $('#savetranslation').attr('disabled', false);
        $('#savetranslation').css('opacity', '1');
        $('#savehtml').attr('disabled', false);
        $('#savehtml').css('opacity', '1');
        // $('#loadtranslation').attr('disabled', false);
        // $('#loadfile').attr('disabled', false);
        // $('#loadtranslation').css('opacity', '1');
    } else {
        // $('body').css('opacity', '0.5');
        // $('body').css('background', 'repeating-linear-gradient(45deg, #cccccc 10%, #dddddd 10%)');
        // chrome.storage.local.set({
        //     globaltoggle: 'off'
        // });
        chrome.runtime.sendMessage({
            type: "set-iftranslate",
            phrase: false
        });
        // $('#highlighter').attr('disabled', true);
        // $('#highlighter-tooltip').css('color', '#777');
        $('#langselect').attr('disabled', true);
        $('#langselect').css('opacity', '0.5');
        $('#savetranslation').attr('disabled', true);
        $('#savetranslation').css('opacity', '0.5');
        $('#savehtml').attr('disabled', true);
        $('#savehtml').css('opacity', '0.5');
        // $('#loadtranslation').attr('disabled', true);
        // $('#loadfile').attr('disabled', true);
        // $('#loadtranslation').css('opacity', '0.5');
    }
})

$(".langselect").change(function () {
    chrome.runtime.sendMessage({
        type: "langselect",
        phrase: $(this).val()
    });
})

$('#savetranslation').click(function(){
    chrome.runtime.sendMessage({
        type: "savetranslations"
    });
})

$('#savehtml').click(function () {
    chrome.runtime.sendMessage({
        type: "savehtml"
    });
})