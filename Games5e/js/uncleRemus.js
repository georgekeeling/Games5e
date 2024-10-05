"use strict";
/*
 * Uncle Remus
 * piles
 * 0-9    play piles
 * 10     talon piles
 * 11     discard pile
 */
const URdiscardPile = 11;
class UncleRemus extends Game {
    constructor() {
        super();
        this.nextCheckPile = -1; // used when checking all piles for book-ism after deal
        this.cardsAcross = 12; // ten working columns + discard pile
        this.cardsDown = 6; // set by trial and error. But we do get long piles
        this.name = "Uncle Remus";
        this.codeName = "UncleRemus";
    }
    //override undoExtras() {
    //override resizeExtras() {
    requestDrag(pileI, cardI) {
        // Can card at pileI, cardI be dragged?
        // Return 0 if not. Infinity if yes
        // must be in piles 0-9
        // Either card at top of pile (bottom of screen) or cards above it are in same suit and descending rank
        if (pileI < 0 || pileI > 9) {
            return 0;
        }
        let pile = table.piles[pileI];
        if (cardI == pile.cards.length - 1) {
            return Infinity;
        }
        let card = pile.cards[cardI];
        if (!card.faceUp) {
            return 0;
        }
        for (let i = cardI + 1; i < pile.cards.length; i++) {
            if (card.suit() != pile.cards[i].suit()) {
                return 0;
            }
            let rankNeeded = card.rank() - i + cardI;
            if (rankNeeded != pile.cards[i].rank()) {
                return 0;
            }
        }
        return Infinity;
    }
    requestDrop(pileI, cardI, x, y) {
        // Can dragPile be dropped on pileI, cardI
        // x,y are used if drop was not on a pile when pileI == -1
        // Return false if not: the dragPile will fly back to whence it came
        // Return true if yes: and do something
        // pile I must be 0 to 9.
        // If it is empty can drop anything.
        // if not card 0 on drag must be same suit and one junior to top card on pile
        if (pileI < 0 || pileI > 9) {
            return false;
        }
        let pile = table.piles[pileI];
        let dragArea = new Area();
        dragArea.clone(dragPile.area);
        let redrawArea = new Area();
        if (pile.cards.length == 0) {
            dragPile.moveTo(pile.x, pile.y);
            finishUp(this);
            return true;
        }
        let topCard = pile.endCard();
        if (topCard.rank() - 1 == dragPile.cards[0].rank()) {
            dragPile.moveTo(topCard.x, topCard.y + table.yStep);
            finishUp(this);
            return true;
        }
        return false;
        function finishUp(myThis) {
            pile.addDrag();
            redrawArea.addAreas(dragArea, pile.area);
            table.showCards(redrawArea);
            for (let checkPileI = 0; checkPileI < 10; checkPileI++) {
                if (table.piles[checkPileI].cards.length > 0) {
                    let topCard = table.piles[checkPileI].endCard();
                    if (!topCard.faceUp) {
                        topCard.faceUp = true;
                        undo.reset();
                        table.showCards(topCard.area);
                        break; // can only have one face down top card
                    }
                }
            }
            myThis.checkBookAndFly(pile);
        }
    }
    checkBookAndFly(pile, checkNext) {
        // if we have formed a book. Do something
        // must have more than 13 cards in the pile. Top 13 must be face up, in order K,Q,J ... 2,1
        // for testing see URtestBook1,2,3 ...
        // after deal we need to check every pile 
        if (typeof (checkNext) == 'undefined') {
            checkNext = function nothing() { };
        }
        let cardI = pile.cards.length - 1;
        if (cardI < 12) {
            checkNext();
            return; // not a book
        }
        let theSuit = pile.cards[cardI].suit();
        for (let rank = 1; rank <= 13; rank++) {
            let checkCard = pile.cards[cardI];
            if (!checkCard.faceUp) {
                checkNext();
                return;
            }
            if (checkCard.suit() == theSuit && checkCard.rank() == rank) {
                cardI--;
            }
            else {
                checkNext();
                return; // not a book
            }
        }
        // found a book. collapse and fly it to discard pile 
        cardI++;
        sound.soundSmallTrumpet();
        pile.collapse(cardI, pile.cards.length - 1);
        pile.spliceToDrag(cardI);
        if (pile.cards.length > 0) {
            if (!pile.endCard().faceUp) {
                pile.endCard().faceUp = true;
                undo.reset();
            }
        }
        let discardPile = table.piles[URdiscardPile];
        let y = discardPile.y;
        if (discardPile.cards.length > 0) {
            y = discardPile.endCard().y + table.yStep;
        }
        table.flyPile(discardPile, discardPile.x, y, checkNext);
    }
    checkNext() {
        let myThis = selGame; // as ever, this not working
        if (myThis.nextCheckPile > 10) {
            return;
        }
        myThis.checkBookAndFly(table.piles[myThis.nextCheckPile++], myThis.checkNext);
    }
    dealFinished() {
        // need to check every pile to see if a book has formed.
        // Concievable (though super unlikely) that game could be won at this stage.
        // test code in URdrama1 (by doing that test three times, fool it into thinking you have won)
        let myThis = selGame; // as ever, this not working
        myThis.nextCheckPile = 1;
        myThis.checkBookAndFly(table.piles[0], myThis.checkNext);
    }
    click(pileI, cardI) {
        // possibly do something when cardI in pileI has been clicked
        // favour un-collapse over fly because cards can always be moved by dragging
        // 1) deal, 2) collapse / uncollapse if enough, 3) fly cards if possible
        if (pileI == URdiscardPile) {
            return; // bug 15.5.23, click / press on discard pile has no effect
        }
        if (pileI == this.talonPileI) {
            // deal more
            table.dealN(true, this.dealFinished);
            return;
        }
        // for collapse or move, cards must be same suit in sequence to top (end) card
        let pile = table.piles[pileI];
        let bottomCard = pile.cards[cardI];
        if (!bottomCard.faceUp) {
            sound.soundFail();
            return;
        }
        let suitNeeded = bottomCard.suit();
        let topCardI;
        for (topCardI = cardI + 1; topCardI < pile.cards.length; topCardI++) {
            if (pile.cards[topCardI].suit() != suitNeeded ||
                pile.cards[topCardI].rank() != pile.cards[topCardI - 1].rank() - 1) {
                break;
            }
        }
        topCardI--;
        // topCardI is now top card in sequence. May also be top card on pile
        if (un_collapse()) {
            return;
        }
        ;
        // topCardI must be top card on pile for fly
        if (topCardI != pile.cards.length - 1) {
            sound.soundFail();
            return;
        }
        // topCardI is top card on pile too. Look for place to move it to
        // if nothing, un/collapse
        let otherPileI = this.checkOthers(pileI, bottomCard, true, false);
        if (otherPileI == -1) {
            otherPileI = this.checkOthers(pileI, bottomCard, false, false);
        }
        if (otherPileI == -1) {
            otherPileI = this.checkOthers(pileI, bottomCard, false, true);
        }
        if (otherPileI == -1) {
            sound.soundFail();
            return;
        }
        undo.saveState();
        pile.spliceToDrag(cardI);
        if (cardI > 0) {
            if (!pile.endCard().faceUp) {
                undo.reset();
                pile.endCard().faceUp = true;
            }
        }
        let otherPile = table.piles[otherPileI];
        let myThis = this;
        if (table.piles[otherPileI].cards.length == 0) {
            table.flyPile(otherPile, otherPile.x, otherPile.y);
        }
        else {
            table.flyPile(otherPile, otherPile.endCard().x, otherPile.endCard().y + table.yStep, checkBook2);
        }
        return;
        function checkBook2() {
            // We may have formed complete book. If so fly it on to discard pie
            myThis.checkBookAndFly(otherPile);
        }
        function un_collapse() {
            let topCard = pile.cards[topCardI];
            if (topCard.y - bottomCard.y < (topCardI - cardI) * table.yStep - 1) {
                undo.saveState();
                pile.uncollapse(cardI, topCardI);
                return true;
            }
            if (topCardI - cardI > 2) {
                undo.saveState();
                pile.collapse(cardI, topCardI);
                return true;
            }
            return false;
        }
    }
    checkOthers(thisPileI, bottomCard, matchSuit, allowEmpty) {
        // have run of cards in thisPileI from bottomCard to top
        // return otherPileI that we can move to. Empty pile alway possible. -1 if none
        let randomOrderPiles = [];
        pack.makeShuffledArray(randomOrderPiles, 10);
        for (let otherPileI of randomOrderPiles) {
            if (otherPileI == thisPileI) {
                continue;
            }
            if (table.piles[otherPileI].cards.length == 0) {
                if (allowEmpty) {
                    return otherPileI;
                }
                else {
                    continue;
                }
            }
            if (table.piles[otherPileI].endCard().rank() - 1 == bottomCard.rank()) {
                if (!matchSuit) {
                    return otherPileI;
                }
                if (table.piles[otherPileI].endCard().suit() == bottomCard.suit()) {
                    return otherPileI;
                }
            }
        }
        return -1;
    }
    checkWin() {
        // call table.youWin() if player has won, otherwise nothing
        // we have won if 104 cards in discard pile
        if (table.piles[URdiscardPile].cards.length == 104) {
            table.youWin();
        }
    }
    nextDealTargets(target) {
        // return info in target on next card in initial deal
        // return null if nothing to do
        // for some reason 'this' does not work here. Use selGame instead
        // something to do with the indirect way it is called in table.deal
        let cardsDealt = 0;
        for (let pileI = 0; pileI < 10; pileI++) {
            cardsDealt += table.piles[pileI].cards.length;
        }
        if (cardsDealt >= choices.dealCardsUR) {
            return null;
        }
        target.pileI++;
        let tPile = table.piles[target.pileI];
        if (target.pileI > 9) {
            target.pileI = 0;
            tPile = table.piles[0];
        }
        target.x = tPile.x;
        target.y = tPile.y + table.yStep / 2 * tPile.cards.length;
        target.faceUp = (cardsDealt >= choices.dealCardsUR - 10);
        target.angle = 0;
        return tPile;
    }
    nextDealNTargets(target) {
        // subsequent deal in game
        // otherwise same as nextDealTargets
        target.pileI++; // makes it 0 first time in
        if (target.pileI > 9) {
            return null;
        }
        target.angle = 0;
        target.faceUp = true;
        let pile = table.piles[target.pileI];
        target.x = pile.x;
        if (pile.cards.length == 0) {
            target.y = pile.y;
        }
        else {
            target.y = pile.cards[pile.cards.length - 1].y + table.yStep;
        }
        return pile;
    }
    initialiseTable() {
        // create all the empty piles on the table
        // for some reason 'this' does not work here. Use selGame instead
        // something to do with the indirect way it is called in table.deal
        const offsetX = table.cardWidth * 1.1;
        let y = Math.round(table.cardHeight * .1);
        table.piles = [];
        for (let col = 0; col <= 9; col++) {
            let x = Math.round(table.cardWidth * .1 + offsetX * col);
            table.addPile(-1, x, y);
        }
        // do the talon pile
        table.initTalon(table.piles.length, 2, URbreaks);
        // and discard pile
        if (table.piles.length != URdiscardPile) {
            alert("UR: problem with discard pile! Go debug!");
        }
        table.addPile(-1, table.piles[9].x + 1.5 * table.cardWidth, table.piles[9].y + table.cardHeight);
        function URbreaks(shIx) {
            // shIx is index in pack.shuffled, >= 1
            // choices.dealCardsUR will be dealt
            // break in talon pile every ten cards, so that first subsequent deal consumes one set of 10 
            let FirstBreak = (104 - choices.dealCardsUR) % 10 - 1;
            return ((shIx - FirstBreak) % 10 == 0);
        }
    }
    hint() {
        if (this.hintEasy()) {
            return;
        }
        // give the pesky user a hint.
        // only give hints to move runs of cards: It is rarely useful to split a run (but sometimes vital!)
        // do piles starting at random pile, pileA
        let randomOrderPiles = [];
        pack.makeShuffledArray(randomOrderPiles, 10);
        for (let pileI of randomOrderPiles) {
            let pile = table.piles[pileI];
            if (pile.cards.length == 0) {
                continue;
            }
            let topCard = pile.endCard();
            let bottomCard = topCard;
            let cardI = pile.cards.length - 2;
            while (cardI >= 0) {
                let testCard = pile.cards[cardI];
                if (testCard.suit() == topCard.suit() && testCard.rank() - 1 == bottomCard.rank() && testCard.faceUp) {
                    bottomCard = testCard;
                }
                else {
                    cardI++;
                    break;
                }
                cardI--;
            }
            if (cardI == -1) {
                cardI = 0;
            } // case when run is only thing in column 
            // we now have a run of cards in pileI from bottomCard at cardI to the topCard
            // possibly only a run of 1. Will it go anywhere? Check others as in click()
            let otherPileI = this.checkOthers(pileI, bottomCard, true, false);
            if (otherPileI != -1) {
                table.flyOutBack(pile, cardI, table.piles[otherPileI], table.yStep);
                return;
            }
            otherPileI = this.checkOthers(pileI, bottomCard, false, false);
            if (otherPileI != -1) {
                table.flyOutBack(pile, cardI, table.piles[otherPileI], table.yStep);
                return;
            }
            otherPileI = this.checkOthers(pileI, bottomCard, false, true);
            if (otherPileI != -1 && cardI > 0) {
                // do not allow moving run in otherwise empty col to other col
                table.flyOutBack(pile, cardI, table.piles[otherPileI], table.yStep);
                return;
            }
        }
        this.hintDeal();
    }
}
//# sourceMappingURL=uncleRemus.js.map