"use strict";
/*
 * Seven and Six
 * piles
 * 0-6    top play piles
 * 7-12   lower play piles
 * 13     talon pile
 */
class SevenAndSix extends Game {
    constructor() {
        super();
        this.nextCheckPile = -1; // used when checking all piles for book-ism after deal
        this.cardsAcross = 10; // seven working columns, 10 just fits on screen
        this.cardsDown = 7; // set by trial and error. But we do get long piles 8-> 7
        this.name = "Seven and Six";
        this.codeName = "SandS";
    }
    //override undoExtras() {
    //override resizeExtras() {
    requestDrag(pileI, cardI) {
        // Can card at pileI, cardI be dragged?
        // Return 0 if not. true if Infinity 
        // must be in piles 0-12
        // Either card at top of pile (bottom of screen) or 
        // cards above it are in alternating colours and descending rank
        if (pileI < 0 || pileI > 12) {
            return 0;
        }
        let pile = table.piles[pileI];
        let card = pile.cards[cardI];
        if (!card.faceUp) {
            return 0;
        }
        // all cards from cardI to top card must be in alternating colours and descending rank
        // card above must be face down or not in sequence. Face up cards in sequence have same x coord
        let cardAbove = new Card(null, 0, 0, 0, false, 0); // fake and face down if no card above
        if (cardI > 0) {
            cardAbove = pile.cards[cardI - 1];
        }
        for (let testCardI = cardI; testCardI < pile.cards.length; testCardI++) {
            let testCard = pile.cards[testCardI];
            if (testCardI == cardI) {
                if (cardAbove.faceUp && testCard.x == cardAbove.x) {
                    // Attempt to break run: Breaks marriage rule
                    return 0;
                }
            }
            else {
                if (testCard.x != cardAbove.x) {
                    return 0; // not in run
                }
            }
            cardAbove = testCard;
        }
        // it might be a completed book 
        if (cardI == 0 && pile.cards.length == 13) {
            return 0;
        }
        return Infinity;
    }
    requestDrop(pileI, cardI, x, y) {
        // Can dragPile be dropped on pileI, cardI
        // x,y are used if drop was not on a pile when pileI == -1
        // Return false if not: the dragPile will fly back to whence it came
        // Return true if yes: and do something
        // pileI must be 0 to 12.
        // If it is empty can only drop king.
        // if not card 0 on drag must be unjinkable with top card on pile
        if (pileI < 0 || pileI > 12) {
            return false;
        }
        let pile = table.piles[pileI];
        let dragArea = new Area();
        dragArea.clone(dragPile.area);
        let redrawArea = new Area();
        if (pile.cards.length == 0) {
            if (dragPile.cards[0].rank() != 13) {
                return false;
            }
            dragPile.moveTo(pile.x, pile.y);
            finishUp(this);
            return true;
        }
        let endCard = pile.endCard();
        if (!endCard.jinkable(dragPile.cards[0])) {
            // card 0 on drag must be different colour and one junior to top card on pile
            dragPile.moveTo(endCard.x, endCard.y + table.yStep);
            finishUp(this);
            return true;
        }
        return false;
        function finishUp(myThis) {
            let coveredCardI = pile.cards.length - 1;
            pile.addDrag();
            redrawArea.addAreas(dragArea, pile.area);
            myThis.alignAngles(pile, coveredCardI);
            myThis.wrapIfDeadBook(pile);
            table.showCards(redrawArea);
            // turn over the face down card if it has been exposed. (Must be cardI 0 or 1)
            for (let checkPileI = 0; checkPileI < 13; checkPileI++) {
                if (table.piles[checkPileI].cards.length > 0 && table.piles[checkPileI].cards.length < 3) {
                    let topCard = table.piles[checkPileI].endCard();
                    if (!topCard.faceUp) {
                        topCard.faceUp = true;
                        undo.reset();
                        table.showCards(topCard.area);
                        break; // can only have one face down top card
                    }
                }
            }
            myThis.checkWin();
        }
    }
    click(pileI, bottomCardI) {
        // possibly do something when bottomCardI in pileI has been clicked
        // favour un-collapse over fly because cards can always be m oved by dragging
        // 1) deal, 2) collapse / uncollapse if enough, 3) fly cards if possible
        let myThis = this;
        if (pileI == this.talonPileI) {
            // deal more
            table.dealN(true, tidyAllOnLanding);
            return;
        }
        // for un_collapse, cards must be large enough unjinked group,
        // for move. cards must be unjinked to top (end) card
        let pile = table.piles[pileI];
        let bottomCard = pile.cards[bottomCardI];
        let topCardI;
        if (!bottomCard.faceUp) {
            sound.soundFail();
            return;
        }
        if (this.isFinishedBook(pile)) {
            sound.soundFail();
            return;
        }
        for (topCardI = bottomCardI + 1; topCardI < pile.cards.length; topCardI++) {
            if (pile.cards[topCardI].x != bottomCard.x) {
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
        // and card under  bottom card must be facedown or in other sequence
        if (bottomCardI > 0) {
            let cardUnderBottom = pile.cards[bottomCardI - 1];
            if (cardUnderBottom.faceUp && cardUnderBottom.x == bottomCard.x) {
                sound.soundFail();
                return;
            }
        }
        let otherPileI = this.checkOthers(pileI, bottomCard);
        if (otherPileI == -1) {
            sound.soundFail();
            return;
        }
        undo.saveState();
        pile.spliceToDrag(bottomCardI);
        if (bottomCardI > 0) {
            if (!pile.endCard().faceUp) {
                undo.reset();
                pile.endCard().faceUp = true;
            }
        }
        let otherPile = table.piles[otherPileI];
        let coveredcardI = otherPile.cards.length - 1;
        let toX = otherPile.x;
        let toY = otherPile.y;
        if (table.piles[otherPileI].cards.length > 0) {
            toX = otherPile.endCard().x;
            toY = otherPile.endCard().y + table.yStep;
        }
        table.flyPile(otherPile, toX, toY, tidyOnLanding);
        function tidyOnLanding() {
            // we just added cards to otherPile.
            // 1) set angle of added cards to same as landed on card
            // 2) Wrap up if dead book
            myThis.alignAngles(otherPile, coveredcardI);
            myThis.wrapIfDeadBook(otherPile);
            myThis.checkWin();
        }
        function tidyAllOnLanding() {
            // we just dealt cards .
            // Check each pile and wrap up if dead book
            for (let pileI = 0; pileI < 13; pileI++) {
                let pile = table.piles[pileI];
                if (pile.cards.length > 0) {
                    if (pile.endCard().faceUp) {
                        myThis.wrapIfDeadBook(pile);
                    }
                }
            }
            myThis.checkWin();
        }
        function un_collapse() {
            // copied from Uncle remus
            let topCard = pile.cards[topCardI];
            if (topCard.y - bottomCard.y < (topCardI - bottomCardI) * table.yStep - 1) {
                undo.saveState();
                pile.uncollapse(bottomCardI, topCardI);
                return true;
            }
            if (topCardI - bottomCardI > 2) {
                undo.saveState();
                pile.collapse(bottomCardI, topCardI);
                return true;
            }
            return false;
        }
    }
    alignAngles(pile, coveredcardI) {
        // align angles when joining runs of cards. in pile from coveredcardI
        let coveredCardAngle = 0;
        if (coveredcardI >= 0) {
            coveredCardAngle = pile.cards[coveredcardI].angle;
        }
        if (coveredCardAngle != pile.endCard().angle) {
            let redrawArea = new Area();
            redrawArea.clone(pile.area);
            for (let cardI = coveredcardI + 1; cardI < pile.cards.length; cardI++) {
                pile.cards[cardI].setAngle(coveredCardAngle);
            }
            redrawArea.addAreas(redrawArea, pile.area);
            table.showCards(redrawArea);
        }
    }
    wrapIfDeadBook(pile) {
        // would be private, but needed by test function
        // if all 13 in pile are not jinkable then collapse and turn Ace over
        if (pile.cards.length != 13) {
            return;
        }
        if (!pile.cards[0].faceUp) {
            return;
        }
        let lowerCard = pile.cards[0];
        for (let cardI = 1; cardI < pile.cards.length; cardI++) {
            let upperCard = pile.cards[cardI];
            if (lowerCard.jinkable(upperCard)) {
                return;
            }
            lowerCard = upperCard;
        }
        // it is indeed a lonely book
        sound.soundSmallTrumpet();
        pile.endCard().faceUp = false;
        pile.collapse(0, 12);
    }
    checkOthers(thisPileI, bottomCard) {
        // have run of cards in thisPileI from bottomCard to top
        // return otherPileI that we can move to. If bottomCard is King, must be empty pile
        // otherwise empty pile not allowed. 
        // never move king pile from otherwise empty row
        // -1 if none
        let KingAtBottom = (bottomCard.rank() == 13);
        if (KingAtBottom && bottomCard === table.piles[thisPileI].cards[0]) {
            return -1;
        }
        let randomOrderPiles = [];
        pack.makeShuffledArray(randomOrderPiles, 13);
        for (let otherPileI of randomOrderPiles) {
            if (otherPileI == thisPileI) {
                continue;
            }
            let otherPile = table.piles[otherPileI];
            if (this.isFinishedBook(otherPile)) {
                continue;
            }
            if (otherPile.cards.length == 0) {
                if (KingAtBottom) {
                    return otherPileI;
                }
                else {
                    continue;
                }
            }
            if (!otherPile.endCard().jinkable(bottomCard)) {
                return otherPileI;
            }
        }
        return -1;
    }
    checkWin() {
        // call table.youWin() if player has won, otherwise nothing
        // we have won if we have 8 finished books and 5 empty piles on the table.
        let finishedBooks = 0;
        let emptyPiles = 0;
        for (let pileI = 0; pileI < 13; pileI++) {
            let pile = table.piles[pileI];
            if (pile.cards.length == 0) {
                emptyPiles++;
            }
            if (this.isFinishedBook(pile)) {
                finishedBooks++;
            }
        }
        if (emptyPiles == 5 && finishedBooks == 8) {
            table.youWin();
        }
    }
    nextDealTargets(target) {
        // return info in target on next card in initial deal
        // return null if nothing to do
        // for some reason 'this' does not work here. Use selGame (er myThis) instead
        // something to do with the indirect way it is called in table.deal
        let myThis = selGame;
        myThis.jinkOffset = table.cardWidth / 5;
        target.pileI++; // makes it 0 first time in
        let tPile = table.piles[target.pileI];
        if (target.pileI > 12) {
            target.pileI = 0;
            tPile = table.piles[target.pileI];
            if (tPile.cards.length * 13 >= choices.dealCards76) {
                return null;
            }
        }
        target.x = tPile.x;
        switch (choices.dealCards76) {
            case 26:
                target.faceUp = (tPile.cards.length == 1);
                break;
            case 39:
                target.faceUp = (tPile.cards.length == 2);
                break;
            case 52:
                target.faceUp = (tPile.cards.length >= 2);
                if (tPile.cards.length == 3) {
                    let dealCard = table.piles[13].endCard(); // pile 13 = talon pile
                    let pileCard = tPile.endCard();
                    if (pileCard.jinkable(dealCard)) {
                        target.x += myThis.jinkOffset;
                    }
                }
                break;
            default:
                alert("Unknown # cards in 7 and 6. Go debug");
        }
        if (tPile.cards.length == 0) {
            target.y = tPile.y;
        }
        else {
            let endCard = tPile.endCard();
            if (endCard.faceUp) {
                target.y = endCard.y + table.yStep;
            }
            else {
                target.y = endCard.y + table.yStep / 2;
            }
        }
        target.angle = 0;
        return tPile;
    }
    nextDealNTargets(target) {
        // subsequent deal in game
        // otherwise same as nextDealTargets
        let myThis = selGame;
        target.pileI++; // makes it 0 first time in
        // dont deal to empty piles or piles with full book. 
        while (target.pileI <= 13) {
            let pile = table.piles[target.pileI];
            if (pile.cards.length == 0 || myThis.isFinishedBook(pile)) {
                target.pileI++;
                continue;
            }
            break;
        }
        if (target.pileI > 12 || table.piles[13].cards.length == 0) {
            return null;
        }
        target.angle = 0;
        target.faceUp = true;
        let pile = table.piles[target.pileI];
        target.x = pile.x;
        target.y = pile.endCard().y + table.yStep;
        let dealCard = table.piles[13].endCard(); // pile 13 = talon pile
        let pileCard = pile.endCard();
        if (pileCard.jinkable(dealCard)) {
            if (pileCard.x < pile.x + myThis.jinkOffset / 2) {
                target.x += myThis.jinkOffset;
            }
            // if dealcard is unjinkable with card at top of run, barring pileCard, then rotate by 90°
            for (let cardI = 0; cardI < pile.cards.length - 1; cardI++) {
                let lowerCard = pile.cards[cardI];
                let upperCard = pile.cards[cardI + 1];
                if (!lowerCard.faceUp) {
                    continue;
                }
                if (!lowerCard.jinkable(upperCard)) {
                    continue;
                }
                // lowerCard is top card of run
                if (!lowerCard.jinkable(dealCard)) {
                    target.angle = 90;
                    break;
                }
            }
        }
        else {
            // dealCard unjinkable: in run joined to pileCard
            target.x = pileCard.x;
            target.angle = pileCard.angle;
        }
        return pile;
    }
    isFinishedBook(pile) {
        return (pile.cards.length == 13 && !pile.endCard().faceUp);
    }
    initialiseTable() {
        // create all the empty piles on the table
        // for some reason 'this' does not work here. Use selGame instead
        // something to do with the indirect way it is called in table.deal
        const offsetX = table.cardWidth * 1.4;
        let y = Math.round(table.cardHeight * .1);
        table.piles = [];
        for (let col = 0; col <= 6; col++) {
            let x = Math.round(table.cardWidth * .1 + offsetX * col);
            table.addPile(-1, x, y);
        }
        y = Math.round(table.height * .45);
        for (let col = 7; col <= 12; col++) {
            let x = Math.round(table.cardWidth * .8 + offsetX * (col - 7));
            table.addPile(-1, x, y);
        }
        // do the talon pile
        table.initTalon(table.piles.length, 2, SandSbreaks);
        // testDealJinkDeal0(); // fix it!
        function SandSbreaks(shIx) {
            // shIx is index in pack.shuffled
            // break in talon pile every thirteen cards 
            return ((shIx) % 13 == 0);
        }
    }
    hint() {
        if (this.hintEasy()) {
            return;
        }
        // give the pesky user a hint.
        // find run of cards at top of pile, then see if it will move elsewhere
        // runs of cards cannot be broken (marriage rule). They have same x coordinate (not including facedown cards)
        let randomOrderPiles = [];
        pack.makeShuffledArray(randomOrderPiles, 13);
        for (let pileI of randomOrderPiles) {
            let pile = table.piles[pileI];
            if (pile.cards.length == 0) {
                continue;
            }
            let runX = pile.endCard().x;
            let cardI = pile.cards.length - 1;
            while (--cardI >= 0) {
                let card = pile.cards[cardI];
                if (card.x != runX || !card.faceUp) {
                    break;
                }
            }
            cardI++;
            // run goes from cardI to top
            let otherPileI = this.checkOthers(pileI, pile.cards[cardI]);
            if (otherPileI != -1) {
                table.flyOutBack(pile, cardI, table.piles[otherPileI], table.yStep);
                return;
            }
        }
        // found nothing
        this.hintDeal();
    }
}
//# sourceMappingURL=SandS.js.map