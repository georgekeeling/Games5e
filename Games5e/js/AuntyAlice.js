"use strict";
/* Aunty Allis (often misspelt Alice)
 * piles
 * 0-7      2's row
 * 8-15     3's row
 * 16-22    4's row
 * 24-31    bottom row (rubbish row as MK calls it)
 * 32 talon
 * 33 discard pile for aces
 */
const acePileI = 33; // ideally this should be a member of AuntyAlice, but ...
class AuntyAlice extends Game {
    constructor() {
        super();
        this.emptyPileI = -1; // one pile (<=23) might be empty.Must be filled
        if (table) {
            this.cardsAcross = Math.round(9 * table.SVGheight / table.SVGwidth); // sometimes cards are turned 90°
        }
        else {
            this.cardsAcross = 14;
        }
        this.cardsDown = 6; // 3 ordinary rows + 1 bottom row which has many cards piled + talon
        this.name = "Aunty Allis";
        this.codeName = "AuntyAlice";
    }
    findEmptyPile() {
        this.emptyPileI = -1;
        for (let i = 0; i <= 23; i++) {
            if (table.piles[i].cards.length == 0) {
                this.emptyPileI = i;
                return;
            }
        }
    }
    undoExtras() {
        this.findEmptyPile();
    }
    click(pileI, cardI) {
        // automatically move clicked card if you can.
        // if can't then rotate card by 45° 
        if (pileI > this.talonPileI) {
            sound.soundFail();
            return;
        }
        if (pileI == this.talonPileI) {
            // deal more
            if (this.emptyPileI != -1) {
                sound.soundFail();
                return;
            }
            table.dealN();
            return;
        }
        let pile = table.piles[pileI];
        let card = pile.cards[cardI];
        let suit = card.suit();
        let rank = card.rank();
        if (24 <= pileI && pileI <= 31) {
            // bottom row, rotate card
            let prevArea = new Area();
            prevArea.clone(card.area);
            undo.saveState();
            card.setAngle(card.angle + 45);
            prevArea.addAreas(prevArea, card.area);
            table.showCards(prevArea);
            return;
        }
        if (cardI != pile.cards.length - 1) {
            sound.soundFail();
            return;
        }
        if (this.emptyPileI != -1) {
            // we must move a card into the empty pile
            let rankNeeded = Math.floor(this.emptyPileI / 8) + 2;
            if (rank == rankNeeded) {
                let emptyPile = table.piles[this.emptyPileI];
                undo.saveState();
                pile.spliceToDrag(cardI);
                table.flyPile(emptyPile, emptyPile.x, emptyPile.y);
                this.emptyPileI = -1;
                if (pileI <= 23) {
                    this.emptyPileI = pileI;
                }
            }
            return;
        }
        if (rank == 1) {
            // ace. Fly it to ace pile
            if (this.emptyPileI != -1) {
                // but not if there is an empty pile needing filling
                sound.soundFail();
                return;
            }
            let acePile = table.piles[acePileI];
            let x = acePile.x;
            let y = acePile.y + acePile.cards.length * table.yStep;
            undo.saveState();
            pile.spliceToDrag(cardI);
            table.flyPile(acePile, x, y);
            if (pileI <= 23) {
                this.emptyPileI = pileI;
            }
            return;
        }
        // ordinary move. The clicked card must move to cover card rank three less and same suit.
        if (pileI <= 23 && pile.cards.length > 1) {
            sound.soundFail();
            return;
        }
        ;
        let candidatePileIa = (rank - 2) % 3 * 8; // checking from this pile
        let checkPiles = [];
        pack.makeShuffledArray(checkPiles, 8);
        for (let candidateI of checkPiles) {
            candidateI += candidatePileIa;
            let candiPile = table.piles[candidateI];
            let candiCard = candiPile.endCard();
            if (candiCard.rank() == rank - 3 && candiCard.suit() == suit) {
                if (rank > 7 && candiPile.cards.length == 1) {
                    continue;
                }
                ;
                let x = candiPile.x;
                let y = candiPile.y;
                if (candiPile.cards.length > 0) {
                    y += 4;
                }
                undo.saveState();
                pile.spliceToDrag(cardI);
                table.flyPile(candiPile, x, y);
                if (pileI <= 23) {
                    this.emptyPileI = pileI;
                }
                return;
            }
        }
        sound.soundFail();
    }
    checkWin() {
        // all piles in first three rows must contain 4 cards to win
        for (let pileI = 0; pileI < 24; pileI++) {
            if (table.piles[pileI].cards.length < 4) {
                return;
            }
        }
        table.youWin();
    }
    requestDrag(pileI, cardI) {
        // Can card at pileI, cardI be dragged?
        // Return 0 if not. Infinity if yes
        let pile = table.piles[pileI];
        // cannot drag from pile in first three rows with more thatn one card in it.
        if (pileI < 24 && pile.cards.length == 1) {
            return Infinity;
        }
        // can only drag one (top) card out of piles in bottom row
        if (pileI >= 24 && pileI < 32 && pile.cards.length - 1 == cardI) {
            //pile.cards[cardI].setAngle(0);
            return Infinity;
        }
        return 0;
    }
    requestDrop(pileI, cardI, x, y) {
        // Can dragPile be dropped on pileI, cardI?
        // x,y are used if drop was not on a pile when pileI == -1
        // Return false if not: the dragPile will fly back to whence it came
        // Do something and return true if yes:
        let dragArea = new Area();
        dragArea.clone(dragPile.area);
        let redrawArea = new Area();
        let card = dragPile.cards[0]; // only ever drag one card.
        if (pileI == -1) {
            // if ace then fly it to ace pile 
            if (card.rank() == 1 && this.emptyPileI == -1) {
                let pile = table.piles[acePileI];
                redrawArea.clone(dragArea);
                dragPile.cards[0].setAngle(0);
                redrawArea.addAreas(redrawArea, dragPile.area);
                table.showCards(redrawArea);
                this.findEmptyPile();
                table.flyPile(pile, pile.x, pile.y + table.piles[acePileI].cards.length * table.yStep);
                return true;
            }
            else {
                return false;
            }
        }
        if (pileI == this.talonPileI) {
            return false;
        }
        let pile = table.piles[pileI];
        if (this.emptyPileI != -1) {
            // must drop 2,3 or 4 on empty pile in correct row
            if (pileI != this.emptyPileI) {
                return false;
            }
            if (card.rank() > 4) {
                return false;
            }
            let row = Math.floor(pileI / 8) + 2;
            if (row != card.rank()) {
                return false;
            }
            dragPile.moveTo(pile.x, pile.y);
            finishUp(this);
            return true;
        }
        if (card.rank() == 1) {
            // ace. must drop on ace pile
            if (pileI != acePileI) {
                return false;
            }
            dragPile.moveTo(pile.x, pile.y +
                table.piles[acePileI].cards.length * table.yStep);
            finishUp(this);
            return true;
        }
        // must be 5 or higher and must go onto card with same suit, rank three less, in correct row
        // and correct nr of cards already in pile
        if (card.rank() < 5) {
            return false;
        }
        if (pile.cards.length == 0) {
            return false;
        }
        let targetCard = pile.endCard();
        if (card.suit() != targetCard.suit()) {
            return false;
        }
        if (card.rank() != targetCard.rank() + 3) {
            return false;
        }
        let pileBaseRank = Math.floor(pileI / 8) + 2; // 2,3 or 4
        let neededBaseRank = (card.rank() - 5) % 3 + 2;
        if (neededBaseRank != pileBaseRank) {
            return false;
        }
        let neededCardsBelow = Math.floor((card.rank() - 5) / 3) + 1;
        if (neededCardsBelow != pile.cards.length) {
            return false;
        }
        dragPile.moveTo(pile.x, pile.y + 4);
        finishUp(this);
        return true;
        function finishUp(myThis) {
            dragPile.cards[0].angle = 0;
            pile.addDrag();
            redrawArea.addAreas(dragArea, pile.area);
            table.showCards(redrawArea);
            myThis.findEmptyPile();
            myThis.checkWin();
        }
    }
    nextDealTargets(target) {
        // return info in target on next card in initial deal
        // return null if nothing to do
        // for some reason 'this' does not work here. Use selGame instead
        // something to do with the indirect way it is called in table.deal
        target.pileI++;
        if (target.pileI >= selGame.talonPileI) {
            return null;
        }
        let tPile = table.piles[target.pileI];
        target.x = tPile.x;
        target.y = tPile.y;
        target.angle = 0;
        target.faceUp = true;
        let dealCard = table.piles[selGame.talonPileI].endCard();
        if (target.pileI < 24) {
            // in top three rows
            if (target.pileI % 8 == 0 && choices.speed == 2) {
                // first card in one of top three rows
                sound.sayAcePlease();
            }
            if (dealCard.rank() == 1 && choices.speed == 2) {
                sound.sayThankYou();
            }
        }
        else {
            // bottom row
            if (dealCard.rank() >= 11) {
                target.angle = 45;
            }
        }
        return tPile;
    }
    nextDealNTargets(target) {
        // deal 8 more cards into bottom row
        // return info in target on next card or null
        // for some reason 'this' does not work here. Use selGame instead
        // something to do with the indirect way it is called in table.deal
        if (target.pileI == -1) {
            target.pileI = 23; // 24 is start of bottom row
        }
        target.pileI++;
        if (target.pileI == 32) {
            return null;
        }
        let dealCard = table.piles[selGame.talonPileI].endCard();
        let pile = table.piles[target.pileI];
        target.angle = 0;
        target.faceUp = true;
        if (pile.cards.length > 0) {
            let card = pile.endCard();
            target.x = card.x;
            target.y = card.y + table.yStep;
            if (dealCard.rank() >= 11 && card.angle == 45) {
                target.angle = 45;
            }
        }
        else {
            target.x = pile.x;
            target.y = pile.y;
            if (dealCard.rank() >= 11) {
                target.angle = 45;
            }
        }
        target.faceUp = true;
        return pile;
    }
    initialiseTable() {
        // for some reason 'this' does not work here. Use selGame instead
        // something to do with the indirect way it is called in table.deal?
        let pileI;
        const offsetX = table.cardHeight + 2;
        const offsetY = table.cardHeight + 10;
        table.piles = [];
        for (let row = 0; row <= 3; row++) {
            for (let col = 0; col <= 7; col++) {
                pileI = table.piles.length;
                table.addPile(-1, Math.round(10 + offsetX * col), Math.round(10 + offsetY * row));
            }
        }
        // do the talon pile
        table.initTalon(table.piles.length, 2, AAbreaker);
        // the acePile
        if (table.piles.length != acePileI) {
            alert("AA: problem with ace pile! Go debug!");
        }
        table.addPile(-1, table.piles[7].x + 2 * table.cardWidth, table.piles[7].y);
        function AAbreaker(shIx) {
            // shIx is index in pack.shuffled
            // break in talon pile every eight cards
            return (shIx % 8 == 0);
        }
    }
    hint() {
        if (this.hintEasy()) {
            return;
        }
        // give the pesky user a hint
        // this form of function declaration ensures that 'this' refers to rhe 'this' of hint. 
        // Otherwise selGame must be used
        let checkAces = (pile0, pileN) => {
            let randomOrderPiles = [];
            pack.makeShuffledArray(randomOrderPiles, pileN - pile0);
            for (let pileI of randomOrderPiles) {
                pileI += pile0;
                let pile = table.piles[pileI];
                if (pile.cards.length > 0) {
                    if (pile.endCard().rank() == 1) {
                        table.flyOutBack(pile, pile.cards.length - 1, table.piles[acePileI]);
                        return true;
                    }
                }
            }
            return false;
        };
        // if there is an empty pile and a card that can move to it, hint that or hint undo
        if (this.emptyPileI != -1) {
            let epRow = Math.floor(this.emptyPileI / 8);
            let rankNeeded = epRow + 2;
            for (let row = 0; row < 4; row++) {
                if (row == epRow) {
                    continue;
                }
                ;
                for (let col = 0; col < 8; col++) {
                    let pile = table.piles[row * 8 + col];
                    if (pile.cards.length != 1) {
                        continue;
                    }
                    ;
                    if (pile.cards[0].rank() == rankNeeded) {
                        table.flyOutBack(pile, 0, table.piles[this.emptyPileI]);
                        return;
                    }
                }
            }
            this.hintShow("Undo");
            return;
        }
        // if there is an ace in the bottom row, hint it
        if (checkAces(24, 32)) {
            return;
        }
        // if there is a card in the bottom row which will go on a card in the top three rows, hint it
        if (checkCard(24, 32)) {
            return;
        }
        // if there is an ace in another row, hint it
        if (checkAces(0, 24)) {
            return;
        }
        // if there is a card in the top three rows which will go on another card in the top three rows, hint it
        if (checkCard(0, 24)) {
            return;
        }
        // nothing left
        this.hintDeal();
        function checkCard(pile0, pileN) {
            let randomOrderPiles = [];
            pack.makeShuffledArray(randomOrderPiles, pileN - pile0);
            for (let pileI of randomOrderPiles) {
                pileI += pile0;
                let pile = table.piles[pileI];
                if (pile.cards.length > 0) {
                    if (pile0 == 0) {
                        if (pile.cards.length > 1) {
                            continue; // do not suggest moving card off top of part formed book
                        }
                    }
                    let rankCandi = pile.endCard().rank();
                    let suitCandi = pile.endCard().suit();
                    if (rankCandi > 4) {
                        let targetRowI = (rankCandi - 2) % 3;
                        for (let targetPileI = targetRowI * 8; targetPileI < targetRowI * 8 + 8; targetPileI++) {
                            let targetPile = table.piles[targetPileI];
                            let targetCard = targetPile.endCard();
                            if (targetCard.rank() == rankCandi - 3 && targetCard.suit() == suitCandi) {
                                // almost there, but not if targetCard is alone and Candi card rank > 7
                                if (targetPile.cards.length == 1 && rankCandi > 7) {
                                    continue;
                                }
                                table.flyOutBack(pile, pile.cards.length - 1, targetPile);
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
    }
}
//# sourceMappingURL=AuntyAlice.js.map