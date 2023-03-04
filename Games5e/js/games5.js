"use strict";
/*
 * Parent class  for all game classes
 */
var GameState;
(function (GameState) {
    GameState[GameState["Welcome"] = 0] = "Welcome";
    GameState[GameState["Playing"] = 1] = "Playing";
    GameState[GameState["Won"] = 2] = "Won"; // won (by Game.player)
})(GameState || (GameState = {}));
class Game {
    constructor() {
        this.cardsAcross = 1; // number of cards we need to have laid out across screen
        this.cardsDown = 5; // and number down. Used to calculate card size so they all fit on screen. Exagerate!
        this.talonPileI = -1; // thie pile containnng the talon (cards that have not been dealt!)
        this.name = "no game";
        this.codeName = "XX"; // cookie / HTML element name
        this.cheated = 0; // count of cheats
        this.player = "unknown";
    }
    undoExtras() {
        // anything extra needed after undo in a game. Aunty Alice uses it
    }
    resizeExtras() {
        // anything extra needed for resize, usually just talon pile which is at bottom of screen
        if (this.talonPileI >= 0) {
            let pile = table.piles[this.talonPileI];
            pile.moveTo(pile.x, Math.round(table.height - table.cardHeight / 3));
        }
    }
    requestDrag(pileI, cardI) {
        // Can card at pileI, cardI be dragged?
        // return nr of cards that can be dragged, Infinity => all cards to end of pile can be dragged
        // 0 if none: and farty sound made by mouse class.
        // otherwise: cards will be moved to dragPile by mouse class and drag commences
        // If cardI is top card on pile, Infinity rather than 1 usually returned
        // No other action required. 
        return 0;
    }
    requestDrop(pileI, cardI, x, y) {
        // Can dragPile be dropped on pileI, cardI
        // x,y are used if drop was not on a pile when pileI == -1
        // Return false if not: the dragPile will fly back to whence it came
        // Return true if yes after taking necessary actions, such as adding dragPile to pileI pile, showing cards etc
        return false;
    }
    click(pileI, cardI) {
        // possibly do something when cardI in pileI has been clicked
    }
    checkWin() {
        // call table.youWin() if player has won, otherwise nothing
    }
    nextDealTargets(target) {
        // first deal in game
        // the machine (table.dealX) is about to deal the next card off the talon pile.
        // say what pile it should go on and where (x,y) and angle and faceUp
        // 'this' does not work here (due to call from table.dealX). Use selGame instead
        return null; // nothing more to do
    }
    nextDealNTargets(target) {
        // subsequent deal in game
        // otherwise same as nextDealTargets
        return null;
    }
    initialiseTable() {
        // initialise the table before a new deal.
        // Create a lot of empty piles
        // Create the talon pile with a shuffled pack in it.
        // 'this' does not work here (due to call from table.deal0). Use selGame instead
    }
    hint() {
        // give the pesky user a hint.
    }
    hintEasy() {
        // check quick exit conditions. Should not be overrisen
        if (table.isLocked()) {
            return true;
        }
        if (table.piles.length == 0) {
            this.hintShow("New Game");
            return true;
        }
        return false;
    }
    hintDeal() {
        // last resort, possibly called by hint functions.
        let theHint = "Deal";
        if (table.youWon) {
            theHint = "You won. New Game";
        }
        else {
            if (table.piles[this.talonPileI].cards.length == 0) {
                theHint = "You lost. New Game";
            }
        }
        this.hintShow(theHint);
    }
    hintShow(theHint, messageY) {
        // show theHint centred above centre of hint button
        if (typeof (messageY) == 'undefined') {
            messageY = table.height * .97;
        }
        let messageX = document.getElementById("btnHint").offsetLeft +
            document.getElementById("btnHint").offsetWidth / 2 - document.getElementById("myCanvas").offsetLeft;
        table.ctx.fillStyle = "#ffff00"; // yellow belly!
        table.ctx.font = "20px Sans-Serif";
        table.ctx.textAlign = "center";
        table.ctx.fillText(theHint, messageX, messageY);
    }
}
//# sourceMappingURL=games5.js.map