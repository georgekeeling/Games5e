/*
 * File for small, independent classes
 */
"use strict";
class Undo {
    constructor() {
        this.undoLimit = 20; // max nr of undos
        this.undoTables = [];
        this.redoTables = [];
        this.tempTable = new Table(true);
    }
    saveState() {
        this.saveTable(this.undoTables);
        this.redoTables = [];
        this.doButtons();
    }
    saveStateMaybe() {
        this.tempTable.clone(table);
    }
    saveStateConfirm() {
        if (this.tempTable.piles.length == 0) {
            return;
        }
        let tableSize = this.undoTables.length;
        if (tableSize >= this.undoLimit) {
            this.undoTables.shift();
            tableSize--;
        }
        this.undoTables[tableSize] = new Table(true);
        this.undoTables[tableSize].clone(this.tempTable);
        this.redoTables = [];
        this.doButtons();
    }
    undo() {
        if (table.isLocked()) {
            return;
        }
        if (this.undoTables.length == 0) {
            return;
        }
        this.saveTable(this.redoTables);
        let oldScale = table.cardScale;
        table = this.undoTables.pop();
        if (oldScale != table.cardScale) {
            table.resize();
        }
        else {
            table.showCards();
        }
        selGame.undoExtras();
        this.doButtons();
    }
    redo() {
        if (table.isLocked()) {
            return;
        }
        if (this.redoTables.length == 0) {
            return;
        }
        this.saveTable(this.undoTables);
        let oldScale = table.cardScale;
        table = this.redoTables.pop();
        if (oldScale != table.cardScale) {
            table.resize();
        }
        else {
            table.showCards();
        }
        selGame.undoExtras();
        this.doButtons();
    }
    reset() {
        this.undoTables = [];
        this.redoTables = [];
        this.tempTable.piles = [];
        this.doButtons();
    }
    saveTable(urTable) {
        // save table on undo or redo stack
        let tableSize = urTable.length;
        if (tableSize >= this.undoLimit) {
            urTable.shift();
            tableSize--;
        }
        urTable[tableSize] = new Table(true);
        urTable[tableSize].clone(table);
    }
    doButtons() {
        let btnUndo = document.getElementById("btnUndo");
        let btnRedo = document.getElementById("btnRedo");
        if (this.undoTables.length > 0) {
            btnUndo.disabled = false;
        }
        else {
            btnUndo.disabled = true;
        }
        if (this.redoTables.length > 0) {
            btnRedo.disabled = false;
        }
        else {
            btnRedo.disabled = true;
        }
    }
}
class Choices {
    constructor() {
        // originally called options / Options. Does not work!
        this.speed = 2; // 2 = human, 1 = machine, 0 = instant
        this.playSound = true;
        this.suits = 1;
        this.prevGameValue = "";
        this.cookies = false;
        this.decodedCookie = "";
        this.dealCardsUR = 50;
        this.dealCards76 = 52;
        this.gameElem0 = "";
        this.suitsElem0 = "";
        this.user = "";
        // load options from cookies, set defaults if none
        this.decodedCookie = decodeURIComponent(document.cookie);
        this.cookies = (this.decodedCookie != "");
        this.SelectGame2(this.getCookie("game"));
        let dealCardsUR = this.getCookie("URcards");
        if (dealCardsUR == "") {
            this.dealCardsUR = 50;
        }
        else {
            this.dealCardsUR = parseInt(dealCardsUR);
        }
        let dealCards76 = this.getCookie("76cards");
        if (dealCards76 == "") {
            this.dealCards76 = 52;
        }
        else {
            this.dealCards76 = parseInt(dealCards76);
        }
        let speed = this.getCookie("speed");
        if (speed == "") {
            this.speed = 2;
        }
        else {
            this.speed = parseInt(speed);
        }
        let suits = this.getCookie("suits");
        if (suits == "") {
            this.suits = 4;
        }
        else {
            this.suits = parseInt(suits);
        }
        let playSound = this.getCookie("playSound");
        if (playSound == "") {
            this.playSound = true;
        }
        else {
            this.playSound = (playSound == "yes");
        }
        let user = this.getCookie("user");
        if (user == "") {
            // special name so scores can be picked if / when player creates profile on database
            this.user = "unknown";
        }
        else {
            this.user = user;
        }
    }
    getCookie(cname) {
        // from https://www.w3schools.com/js/js_cookies.asp
        let name = cname + "=";
        let ca = this.decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    updateCookie(cname, cvalue) {
        // also from https://www.w3schools.com/js/js_cookies.asp
        const d = new Date();
        let days = -10;
        if (this.cookies) {
            days = 365;
        }
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        let expires = "expires=" + d.toUTCString();
        if (this.cookies) {
            // set the cookie
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        }
        else {
            // delete cookie
            document.cookie = cname + "=;" + expires + ";path=/";
        }
    }
    initOptions() {
        let gameElem = document.getElementById("selGame");
        let suitsElem = document.getElementById("suits");
        let cardsURElem = document.getElementById("URcards");
        let cards76Elem = document.getElementById("76cards");
        let speedElem = document.getElementById("speed");
        let soundsElem = document.getElementById("sounds");
        let saveElem = document.getElementById("save");
        gameElem.value = selGame.codeName;
        suitsElem.value = this.suits.toString(10);
        cardsURElem.value = this.dealCardsUR.toString(10);
        cards76Elem.value = this.dealCards76.toString(10);
        speedElem.value = this.speed.toString(10);
        soundsElem.checked = this.playSound;
        saveElem.checked = this.cookies;
        this.gameElem0 = gameElem.value;
        this.suitsElem0 = suitsElem.value;
    }
    endOptions() {
        // Only do redeal if necessary and only on exit. 
        // Previous arrangement could have multiple redeals and 
        let gameElem = document.getElementById("selGame");
        let suitsElem = document.getElementById("suits");
        if (gameElem.value != this.gameElem0 || suitsElem.value != this.suitsElem0) {
            this.SelectGame2(gameElem.value);
            this.updateCookie("game", selGame.codeName);
            this.suits = parseInt(suitsElem.value);
            this.updateCookie("suits", this.suits.toString(10));
            this.quickDeal();
        }
        document.getElementById("mainPage").hidden = false;
        document.getElementById("optionsPage").hidden = true;
        document.getElementById("rulesPage").hidden = true;
    }
    SelectGame2(codeName) {
        switch (codeName) {
            case "UncleRemus":
                selGame = new UncleRemus;
                break;
            case "SandS":
                selGame = new SevenAndSix;
                break;
            case "SeniorWrangler":
                selGame = new SeniorWrangler;
                break;
            case "Kings":
                selGame = new Kings;
                break;
            default:
            case "AuntyAlice":
                selGame = new AuntyAlice;
                break;
        }
    }
    quickDeal() {
        // doing a slow deal can cause havoc if another deal starts quicly
        let timeWasted = 0; // in seconds
        let saveSpeed = this.speed;
        let saveSound = this.playSound;
        this.speed = 0;
        this.playSound = false;
        table.setScale();
        table.deal0();
        // wait until deal has finished before restoring speed and sound
        // fortunately table is locked while dealing
        const id = setInterval(checkFinish, 100);
        function checkFinish() {
            if (table.isLocked()) {
                timeWasted += 0.1;
                if (timeWasted < 5) {
                    return;
                }
                ; // something is wrong after 5 seconds
            }
            clearInterval(id);
            choices.speed = saveSpeed;
            choices.playSound = saveSound;
        }
    }
    select76cards() {
        let element = document.getElementById("76cards");
        this.dealCards76 = parseInt(element.value);
        this.updateCookie("76cards", this.dealCards76.toString(10));
    }
    selectURcards() {
        let element = document.getElementById("URcards");
        this.dealCardsUR = parseInt(element.value);
        this.updateCookie("URcards", this.dealCardsUR.toString(10));
    }
    selectSpeed() {
        let element = document.getElementById("speed");
        this.speed = parseInt(element.value);
        this.updateCookie("speed", this.speed.toString(10));
    }
    selectSound() {
        let element = document.getElementById("sounds");
        this.playSound = element.checked;
        this.updateCookie("playSound", (this.playSound) ? "yes" : "no");
    }
    selectSave() {
        let element = document.getElementById("save");
        this.cookies = element.checked;
        // update all cookies and they will be deleted if this.cookies = false
        this.updateCookie("game", selGame.codeName);
        this.updateCookie("suits", this.suits.toString(10));
        this.updateCookie("76cards", this.dealCards76.toString(10));
        this.updateCookie("URcards", this.dealCardsUR.toString(10));
        this.updateCookie("speed", this.speed.toString(10));
        this.updateCookie("playSound", (this.playSound) ? "yes" : "no");
    }
}
class UpdateDB {
    constructor() {
    }
    post(result) {
        // post Won / Start to database
        this.xmlhttpDo(selGame.player + "/Post/" + selGame.codeName + "/" + result, handleResponse);
        function handleResponse(response) {
            if (response != "Result: OK") {
                selGame.hintShow("Database " + response);
            }
        }
    }
    xmlhttpDo(message, responseFunc) {
        const xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", "db/dbInterface.php", true);
        xmlhttp.setRequestHeader("Content-Type", message);
        xmlhttp.onreadystatechange = function () {
            // The variable xmlhttp not available here. But since this function is a member of xmlhttp, this=xmlhttp
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                responseFunc(this.responseText);
            }
        };
        xmlhttp.send();
    }
}
class Sound {
    constructor() {
        // trumpets from https://pixabay.com/sound-effects/search/trumpet/
        this.thankYou = document.getElementById("audioTy1");
        this.acePlease = document.getElementById("audioAp1");
        this.trumpet = document.getElementById("audioTr1");
        this.smallTrumpet = document.getElementById("audioTr2");
        this.endTime = 0;
    }
    sayThankYou() {
        if (!choices.playSound) {
            return;
        }
        ;
        this.thankYou.volume = 0.05;
        this.queue(this.thankYou);
    }
    sayAcePlease() {
        if (!choices.playSound) {
            return;
        }
        ;
        this.acePlease.volume = 0.05;
        this.queue(this.acePlease);
    }
    soundTrumpet() {
        // not compiling for some reason
        if (!choices.playSound) {
            return;
        }
        ;
        this.trumpet.volume = 0.05;
        this.queue(this.trumpet);
    }
    soundSmallTrumpet() {
        if (!choices.playSound) {
            return;
        }
        ;
        this.smallTrumpet.volume = 0.04;
        this.queue(this.smallTrumpet);
    }
    soundFail() {
        if (!choices.playSound) {
            return;
        }
        ;
        let i = Math.floor(Math.random() * 4);
        let fail = document.getElementById("audiofl" + i);
        fail.volume = 0.02;
        fail.play();
    }
    queue(thisSound) {
        // do not play sound until previous sound(s) finished 
        const now = new Date();
        const nowMs = now.getTime();
        const thisDuration = thisSound.duration * 1000;
        if (nowMs > this.endTime) {
            this.endTime = nowMs + thisDuration;
            thisSound.play();
        }
        else {
            this.endTime += thisDuration;
            const playStartTime = this.endTime - thisDuration;
            setTimeout(playIt, playStartTime - nowMs, thisSound);
        }
        function playIt(thisSound) {
            thisSound.play();
        }
    }
}
//# sourceMappingURL=smallClasses.js.map