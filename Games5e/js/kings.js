"use strict";
/*
 * Kings
 * piles
 * 0    8     9     10      4
 * 1    11    12    13      3
 * 2    14    15    16      6
 * 3    17    18    19      7
 *
 * 20                           21
 * 22
 *
•	0-7 are the King piles
•	8-19 are the cards in the play area: Play piles
•	20 is a pile where a play pile may be moved to for manipulation.
             Nominally in a fan (Rule 3, para 1,2): Fan pile
             In fact in a horizontal cascaded pile
•	21 is the pile of face down cards: Face down pile
•	22 is the talon pile

 */
const KiFanPileI = 20;
const KiFaceDownPileI = 21;
const KiTalonI = 22;
class Kings extends Game {
    constructor() {
        super();
        this.realDealPileI = 0;
        this.dragSourcePile = 0;
        // Top row central 3 piles may be horizontal, allow 2 card widths each, total 8
        // max cards in fan pile 9, width = (1 + 8/3) * cardWidth
        // + 1.5 * cardWidth for FaceDownPile.
        // total width =  (2.5 + 8/3) * cardWidth = 5 * cardWidth
        this.cardsAcross = 8;
        this.cardsDown = 7;
        this.name = "Kings";
        this.codeName = "Kings";
    }
    //override undoExtras() {
    //  // anything extra needed after undo in a game. 
    //}
    resizeExtras() {
        // anything extra needed for resize, usually just talon pile which is at bottom of screen
        // nothing, not even talon pile because it's relative to top
    }
    requestDrag(pileI, cardI) {
        // Can card at pileI, cardI be dragged?
        // Return 0 if not (and farty sound made).
        // 1 if yes (and cards will be moved to dragPile and drag commences)
        // No other action required. Infinity not used
        // we can drag cards within fan pile to alter order
        // or any card from fan pile to suitable king pile
        // or top card of play piles to suitable king pile
        // ...................................
        if (pileI == KiFanPileI) {
            this.dragSourcePile = pileI;
            return 1;
        }
        if (8 <= pileI && pileI <= 19) {
            let pile = table.piles[pileI];
            if (cardI == pile.cards.length - 1) {
                if (cardI > 0) {
                    let revealedCard = pile.cards[cardI - 1];
                    this.dragSourcePile = pileI;
                    revealedCard.visible = true;
                }
                return Infinity; // top card on pile so use Infinity not 1, as is traditional
            }
        }
        this.dragSourcePile = 0;
        return 0;
    }
    requestDrop(pileI, cardI, x, y) {
        // Can dragPile be dropped on pileI, cardI
        // x,y are used if drop was not on a pile when pileI == -1
        // Return false if not: the dragPile will fly back to whence it came
        // Return true if yes after taking necessary actions, such as adding dragPile to pileI pile, showing cards etc
        // We must either drop on suitable King pile,
        // or if from fan pile can be back in fan pile to sort it
        let requiredRank = -1;
        let requiredSuit = -1;
        if (pileI == -1) {
            return false;
        }
        let pile = table.piles[pileI];
        let topCard = pile.endCard();
        let dragCard = dragPile.cards[0];
        let redrawArea = new Area;
        redrawArea.clone(pile.area);
        redrawArea.addAreas(redrawArea, dragPile.area);
        if (0 <= pileI && pileI <= 7) {
            if (pile.cards.length == 13) {
                return false;
            } // we are done with that pile (in a duh way)
            requiredSuit = topCard.suit();
            if (0 <= pileI && pileI <= 3) {
                // left kings
                requiredRank = topCard.rank() - 1;
            }
            else {
                // right kings
                if (topCard.rank() == 13) {
                    requiredRank = 1;
                }
                else {
                    requiredRank = topCard.rank() + 1;
                }
            }
            if (requiredRank != dragCard.rank()) {
                return false;
            }
            if (requiredSuit != dragCard.suit()) {
                return false;
            }
            dragPile.moveTo(topCard.x, topCard.y);
            pile.addDrag();
            pile.endCard().setAngle(0);
            if (pile.cards.length == 13) {
                sound.soundSmallTrumpet();
            } // we are done with that pile (in a good way)
            table.showCards(redrawArea);
            if (8 <= this.dragSourcePile && this.dragSourcePile <= 19) {
                pile = table.piles[this.dragSourcePile];
                if (pile.cards.length > 0) {
                    if (!pile.endCard().faceUp) {
                        pile.endCard().faceUp = true;
                        undo.reset();
                        table.showCards(pile.area);
                    }
                }
            }
            this.checkWin();
            return true;
        }
        if (pileI == KiFanPileI) {
            if (this.dragSourcePile != KiFanPileI) {
                return false;
            }
            // insert dragCard into fan pile(=pile) according to x coordinate
            dragCard.area.top = pile.y;
            dragCard.area.bottom = pile.y + table.cardHeight;
            pile.addCardP(dragCard.cards52I, dragCard.x, pile.y, true, 0);
            dragPile.emptyDrag();
            pile.cards.sort(sortByX);
            this.linearFan(pile);
            redrawArea.addAreas(redrawArea, pile.area);
            table.showCards(redrawArea);
            return true;
        }
        return false;
        function sortByX(cardA, cardB) {
            return (cardA.x - cardB.x); // worked first time!
        }
    }
    click(pileI, cardI) {
        // possibly do something when cardI in pileI has been clicked
        // click on talon => deal, click play pile => rotate pile,
        // click on face down pile => fly to pick up pile and fly all to fan pile
        let myThis = this;
        let targetPile;
        if (pileI == this.talonPileI) {
            // deal more
            table.dealN();
            return;
        }
        if (8 <= pileI && pileI <= 19) {
            // rotate cards (see tips for why). Pointless but fun it pile already fanned
            let pile = table.piles[pileI];
            if (pile.cards.length > 0) {
                let redrawArea = new Area;
                undo.saveState();
                redrawArea.clone(pile.area);
                for (let card of pile.cards) {
                    card.setAngle(card.angle + 45);
                }
                redrawArea.addAreas(redrawArea, pile.area);
                table.showCards(redrawArea);
                return;
            }
            sound.soundFail(); // clicked empty pile
            return;
        }
        if (table.piles[KiTalonI].cards.length > 0) {
            sound.soundFail(); // must click talon until empty
            return;
        }
        if (pileI != KiFaceDownPileI && pileI != KiFanPileI) {
            sound.soundFail(); // when talon empty, only click allowed is on face down pile or fan pile
            return;
        }
        // table.gameData stores where fan pile came from
        switch (pileI) {
            case KiFaceDownPileI:
                // Card turns over and flies up to indicated play pile,
                // then that card and pile fly down to fan pile where they are laid out
                // face up, horizontally and overlapping
                if (table.piles[KiFanPileI].cards.length > 0) {
                    sound.soundFail(); // fan pile must be empty too 
                    return;
                }
                let fdPile = table.piles[KiFaceDownPileI];
                if (fdPile.cards.length == 0) {
                    sound.soundFail();
                    return;
                }
                undo.reset();
                fdPile.endCard().faceUp = true;
                table.gameData = 7 + fdPile.endCard().rank();
                targetPile = table.piles[table.gameData];
                fdPile.spliceToDrag(fdPile.cards.length - 1);
                if (fdPile.cards.length > 0) {
                    fdPile.endCard().visible = true;
                }
                table.flyPile(targetPile, targetPile.x, targetPile.y, fly2);
                return;
            case KiFanPileI:
                // fan pile becomes real fan and flies back to fanPileFromI where it came from
                let fanPile = table.piles[KiFanPileI];
                if (fanPile.cards.length == 0) {
                    table.gameData = 0;
                    return;
                }
                // first straighten pile, then fan pile at angleInc° interval
                const angleInc = 13;
                let angle0 = fanPile.cards.length / 2 * -angleInc;
                let redrawArea = new Area;
                undo.saveState();
                redrawArea.clone(fanPile.area);
                fanPile.area.left = fanPile.x;
                fanPile.area.top = fanPile.y;
                fanPile.area.right = fanPile.x + table.cardWidth;
                ;
                fanPile.area.bottom = fanPile.y + table.cardHeight;
                for (let card of fanPile.cards) {
                    card.x = fanPile.x;
                    card.y = fanPile.y;
                    card.area.clone(fanPile.area);
                }
                for (let cardI = 0; cardI < fanPile.cards.length; cardI++) {
                    let card = fanPile.cards[cardI];
                    card.setAngle(angle0 + angleInc * cardI);
                }
                redrawArea.addAreas(redrawArea, fanPile.area);
                table.showCards(redrawArea);
                fanPile.spliceToDrag(0);
                targetPile = table.piles[table.gameData];
                table.flyPile(targetPile, targetPile.x, targetPile.y);
                table.gameData = 0;
                return;
            default:
                sound.soundFail();
                return;
        }
        function fly2() {
            // fan out target pile and fly to fan pile  
            let redrawArea = new Area;
            redrawArea.clone(targetPile.area);
            myThis.linearFan(targetPile);
            redrawArea.addAreas(redrawArea, targetPile.area);
            table.showCards(redrawArea);
            targetPile.spliceToDrag(0);
            let fanPile = table.piles[KiFanPileI];
            table.flyPile(fanPile, fanPile.x, fanPile.y);
        }
    }
    linearFan(pile) {
        for (let cardI = 0; cardI < pile.cards.length; cardI++) {
            let card = pile.cards[cardI];
            card.angle = 0;
            card.faceUp = true;
            card.x = pile.x + cardI * table.yStep;
            card.y = pile.y;
            card.area.left = card.x;
            card.area.top = card.y;
            card.area.right = card.x + table.cardWidth;
            card.area.bottom = card.y + table.cardHeight;
            card.visible = true;
        }
        pile.recalcArea();
    }
    checkWin() {
        // call table.youWin() if player has won, otherwise nothing
        for (let pileI = 0; pileI <= 7; pileI++) {
            if (table.piles[pileI].cards.length < 13) {
                return;
            }
        }
        table.youWin();
    }
    nextDealTargets(target) {
        // first deal in game
        // the machine (table.dealX) is about to deal the next card off the talon pile.
        // say what pile it should go on and where (x,y) and angle and faceUp
        // 'this' does not work here (due to call from table.dealX). Use selGame instead
        return null; // do nothing. All done in nextDealNTargets
    }
    nextDealNTargets(target) {
        // subsequent deal in game
        // parameters as nextDealTargets
        // deal 13 or more cards to piles 8-19 and FaceDownPile.
        // If card matches position it goes to pile FaceDownPile, offset and face up until next
        // deal when it gets tidied.
        let myThis = selGame;
        target.pileI++;
        target.angle = 0;
        if (target.pileI == 0) {
            target.pileI = 8;
        }
        if (target.pileI == 8) {
            tidyFaceDownPile();
        }
        if (target.pileI > KiFaceDownPileI) {
            // either finished this deal or previous card was diverted.
            if (myThis.realDealPileI != KiFaceDownPileI) {
                target.pileI = myThis.realDealPileI;
                target.angle = 45;
            }
            else {
                return null;
            }
        }
        if (target.pileI == KiFanPileI) {
            target.pileI = KiFaceDownPileI;
        }
        if (table.piles[KiTalonI].cards.length < 1) {
            setTimeout(tidyFaceDownPile, 5000);
            // turn all cards in play piles face down except top cards
            for (let pileI = 8; pileI < 20; pileI++) {
                let pile = table.piles[pileI];
                for (let cardI = 0; cardI < pile.cards.length - 1; cardI++) {
                    pile.cards[cardI].faceUp = false;
                }
            }
            return null;
        }
        let dealCard = table.piles[KiTalonI].endCard();
        let targetPile = table.piles[target.pileI];
        if (targetPile.cards.length > 0) {
            if (target.angle == 45 && targetPile.endCard().angle != 45) {
                targetPile.setAngle(45);
            }
            target.angle = targetPile.endCard().angle;
        }
        target.faceUp = (target.pileI != KiFaceDownPileI);
        target.x = targetPile.x;
        target.y = targetPile.y;
        myThis.realDealPileI = target.pileI;
        if (dealCard.rank() == target.pileI - 7) {
            // divert to face down pile
            target.pileI = KiFaceDownPileI;
            targetPile = table.piles[KiFaceDownPileI];
            target.x = targetPile.x - table.cardWidth / 4;
            for (let cardI = 0; cardI < targetPile.cards.length; cardI++) {
                let card = targetPile.cards[cardI];
                if (card.faceUp) {
                    card.x -= table.cardWidth / 4;
                    card.area.left -= table.cardWidth / 4;
                    card.area.right -= table.cardWidth / 4;
                }
            }
            targetPile.recalcArea();
            target.faceUp = true;
            target.angle = 0;
            target.y = targetPile.y;
        }
        return targetPile;
        function tidyFaceDownPile() {
            // tidy face down pile
            let pile = table.piles[KiFaceDownPileI];
            let redrawArea = new Area();
            redrawArea.clone(pile.area);
            pile.area.left = pile.x;
            pile.area.top = pile.y;
            pile.area.right = pile.x + table.cardWidth;
            pile.area.bottom = pile.y + table.cardHeight;
            for (let fdpI = 0; fdpI < pile.cards.length; fdpI++) {
                let card = pile.cards[fdpI];
                card.x = pile.x;
                card.y = pile.y;
                card.faceUp = false;
                card.area.clone(pile.area);
            }
            table.showCards(redrawArea);
        }
    }
    initialiseTable() {
        // initialise the table before a new deal.
        // Put Kings in King piles in s,h,d,c order
        // Create empty piles, fan pile, face down pile
        // Create the talon pile with a shuffled pack except Kings in it.
        // 'this' does not work here (due to call from table.deal0). Use selGame instead
        let kingsFound = [];
        table.piles = [];
        pack.doShuffle(2);
        for (let i = 0; i < pack.shuffled.length; i++) {
            if (pack.shuffled[i] % 13 == 12) {
                // it's a king
                kingsFound[kingsFound.length] = pack.shuffled[i];
                pack.shuffled.splice(i, 1);
                i--; // after spice must go back one
            }
        }
        if (kingsFound.length != 8) {
            alert("Missing kings! Go debug");
        }
        kingsFound.sort(); // kings in pairs which go in King piles
        // king piles
        const leftKingsX = Math.round(table.cardWidth * .1);
        const rightKingsX = Math.round(table.cardWidth * 1.1 + 3 * (table.cardHeight * 1.1));
        for (let pileI = 0; pileI < 8; pileI++) {
            let rowI = pileI % 4;
            let x = leftKingsX;
            if (pileI > 3) {
                x = rightKingsX;
            }
            table.addPile(kingsFound[(pileI * 2) % 8], x, table.yStep + (table.cardHeight + table.yStep) * rowI, true, 0);
        }
        // Play piles.
        // Middle column half way between kings
        // Left/right column half way between middle & king -/+ bias.
        // Perfect spacing so that middle cards can rotate and fan. Kings cannot rotate
        const bias = (table.cardHeight - table.cardWidth) / 4;
        const midColX = leftKingsX + (rightKingsX - leftKingsX) / 2;
        const leftColX = leftKingsX + (midColX - leftKingsX) / 2 - bias;
        const rightColX = midColX + (rightKingsX - midColX) / 2 + bias;
        const colXs = [leftColX, midColX, rightColX];
        for (let pileI = 8; pileI < 20; pileI++) {
            let colI = (pileI - 8) % 3;
            let rowI = Math.floor((pileI - 8) / 3);
            table.addPile(-1, colXs[colI], table.yStep + (table.cardHeight + table.yStep) * rowI);
        }
        // Fan pile
        table.addPile(-1, leftKingsX, table.yStep + (table.cardHeight + table.yStep) * 4.5); // y as above with rowI=4.5
        // face down pile
        table.addPile(-1, rightKingsX, table.yStep + (table.cardHeight + table.yStep) * 4.5); // y as above
        if (table.piles.length != KiFaceDownPileI + 1) {
            alert("Kings: error in initialiseTable. Go debug");
        }
        // talon pile is half off bottom of screen. It will be emptied fairly quickly
        selGame.talonPileI = KiTalonI;
        const talonX = Math.round(table.cardWidth * .2);
        const talonY = table.yStep + (table.cardHeight + table.yStep) * 5.5; // y as above with 4.5 -> 5.5 
        table.addPile(pack.shuffled[0], talonX, talonY, false, 0);
        for (let shIx = 1; shIx < pack.shuffled.length; shIx++) {
            table.addCardT(KiTalonI, pack.shuffled[shIx], talonX + shIx * 3, talonY, false, 0);
        }
    }
    hint() {
        if (this.hintEasy()) {
            return;
        }
        // give the pesky user a hint.
        table.showCards(); // clears previous hint messages
        if (table.piles[KiTalonI].cards.length > 0) {
            this.hintShow("You must deal all cards. Click / tap talon pile here.");
            return;
        }
        let randomOrderPiles = [];
        pack.makeShuffledArray(randomOrderPiles, 13); // play cards + fan pile
        for (let pileI of randomOrderPiles) {
            pileI += 8;
            let pile = table.piles[pileI];
            if (pile.cards.length == 0) {
                continue;
            }
            if (pileI <= 19) {
                // in play piles
                let kingPile = searchKingPiles(pile.endCard().suit(), pile.endCard().rank());
                if (kingPile) {
                    table.flyOutBack(pile, pile.cards.length - 1, kingPile);
                    return;
                }
            }
            else {
                // pile = fan pile. try each card in fan pile
                let randomCardsI = [];
                pack.makeShuffledArray(randomCardsI, pile.cards.length);
                for (let cardI of randomCardsI) {
                    let card = pile.cards[cardI];
                    let kingPile = searchKingPiles(card.suit(), card.rank());
                    if (kingPile) {
                        table.flyOutBack(pile, cardI, kingPile, 0, true);
                        return;
                    }
                }
            }
        }
        // no cards to move except ...
        if (table.piles[KiFanPileI].cards.length > 0) {
            this.hintShow("Click / tap fan pile.");
            return;
        }
        let theHint = "Click / tap face down pile";
        if (selGame.gameState == GameState.Won) {
            theHint = "You won. New Game";
        }
        else {
            if (table.piles[KiFaceDownPileI].cards.length == 0) {
                selGame.gameState = GameState.Lost;
                theHint = "You lost. New Game";
            }
        }
        this.hintShow(theHint);
        return;
        function searchKingPiles(suit, rank) {
            let kingPiles = [];
            pack.makeShuffledArray(kingPiles, 8);
            for (let pileI of kingPiles) {
                let pile = table.piles[pileI];
                let requiredRank = 0;
                let topCard = pile.endCard();
                if (topCard.suit() != suit) {
                    continue;
                }
                if (pileI < 4) {
                    requiredRank = topCard.rank() - 1;
                }
                else {
                    if (topCard.rank() == 13) {
                        requiredRank = 1;
                    }
                    else {
                        requiredRank = topCard.rank() + 1;
                    }
                }
                if (requiredRank == rank) {
                    return pile;
                }
            }
            return null;
        }
    }
}
//# sourceMappingURL=kings.js.map