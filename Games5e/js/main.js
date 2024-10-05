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
    choices = new Choices;
    table = new Table(false);
    pack = new Pack();
    sound = new Sound();
    table.welcome();
}
//# sourceMappingURL=main.js.map