// here are the main objects
// some can be created immediately, others must wait until page loaded which calls Initialise()
// That loads data-include files, then does other initialisation
var pack;
var table;
var sound;
var selGame;
var choices;
var updateDB = new UpdateDB;
var dragPile = new Pile; // pile being dragged or even flyiing!
var mouse = new Mouse;
var undo = new Undo;
var userZone = new UserZone;
function toPage(target) {
    if (table.isLocked()) {
        return;
    }
    document.getElementById("mainPage").hidden = true;
    document.getElementById("UserZonePage").hidden = true;
    document.getElementById("rulesPage").hidden = true;
    document.getElementById(target).hidden = false;
    if (target == "optionsPage") {
        choices.initOptions();
    }
    if (target == "UserZonePage") {
        userZone.initialise(true, true);
    }
}
function Initialise() {
    // from https://github.com/LexmarkWeb/csi.js/blob/master/src/csi.js
    // we are loading html 'include' files given in <div data-include elements
    // everything inside <body></body> gets loaded
    let filesWaiting = 0;
    let elements = document.getElementsByTagName('*');
    for (let i in elements) {
        if (elements[i].hasAttribute && elements[i].hasAttribute('data-include')) {
            filesWaiting++;
            fragment(elements[i], elements[i].getAttribute('data-include'));
        }
    }
    function fragment(el, url) {
        var localTest = /^(?:file):/, xmlhttp = new XMLHttpRequest(), status = 0;
        xmlhttp.onreadystatechange = function () {
            /* if we are on a local protocol, and we have response text, we'll assume
       *  				things were sucessful */
            if (xmlhttp.readyState == 4) {
                status = xmlhttp.status;
            }
            if (localTest.test(location.href) && xmlhttp.responseText) {
                status = 200;
            }
            if (xmlhttp.readyState == 4 && status == 200) {
                el.outerHTML = xmlhttp.responseText;
                if (--filesWaiting == 0) {
                    // finally all files loaded ** ASSUMES AT LEAST ONE data-include in file ***
                    choices = new Choices;
                    table = new Table(false);
                    pack = new Pack();
                    sound = new Sound();
                    table.welcome();
                }
            }
        };
        try {
            xmlhttp.open("GET", url, true);
            xmlhttp.send();
        }
        catch (err) {
            /* todo catch error */
            console.log("Error " + err + " including " + url);
        }
    }
}
//# sourceMappingURL=main.js.map