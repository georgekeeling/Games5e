"use strict";

/*
 * Senior Wrangler
 * piles
 * 0-7    the 8 long columns / long piles
 * 8-15   key cards (foundation / base cards)  
 * 16-23  the 'pile' per rules (lowPiles). The piles where cards from the 8 long columns are moverd to
 * 24     Talon pile. After the initial dal, there is no Talon pile
 */
const SWtalonI = 24;

class SeniorWrangler extends Game {

  constructor() {
    super();
    this.cardsAcross = 9;
    // max cards in long pile is 19.
    // Vertically they use yStep pixels each
    // + 2 * yStep for spacing gap in in initial deal
    // + 4 * yStep for top card
    // yStep = cardHeight / 6
    // so long piles need (19+2+4) * yStep  = 25 / 6 * cardHeight = 4.17 cardHeights
    // add 2 cards for key cards and piles 16-23
    this.cardsDown = 6.5;
    this.name = "Senior Wrangler";
    this.codeName = "SeniorWrangler";
  }

  //override undoExtras() {

  override resizeExtras() {
    // SW is exceptional, it has no talon pile, but two rows of 6 at bottom
    if (table.piles.length == 0) { return }     // no cards on table
    for (let pileI = 8; pileI < 16; pileI++) {
      let pile = table.piles[pileI];
      pile.moveTo(pile.x, Math.round(table.height - table.cardHeight * 2.1))
    }
    for (let pileI = 16; pileI < 24; pileI++) {
      let pile = table.piles[pileI];
      pile.moveTo(pile.x, Math.round(table.height - table.cardHeight))
    }
  }

  override requestDrag(pileI: number, cardI: number): number {
    // Can card at pileI, cardI be dragged?
    // Return 0 if not. Infinity  if yes

    // must be in piles 0-7 and the top card.
    if (pileI < 0 || pileI > 7) { return 0 }
    let pile = table.piles[pileI];
    if (cardI == pile.cards.length - 1) { return Infinity }
    return 0;
  }

  override requestDrop(pileI: number, cardI: number, x?: number, y?: number): boolean {
    // Can dragPile, which only contains 1 card, be dropped on pileI, cardI
    // x,y are used if drop was not on a pile when pileI == -1
    // Return false if not: the dragPile will fly back to whence it came
    // Return true if yes: and do something

    // pileI must be in one of bottom 2 rows. On key card or card below is acceptable.

    if (pileI < 8 || pileI > 23) { return false }
    if (pileI <= 15) { pileI += 8 }   // always on lowPiles where we would move to
    if (dragPile.cards[0].rank() != this.calcRankNeeded(pileI - 8)) { return false }

    // we can drop into pileI
    let pile = table.piles[pileI];
    let dragArea = new Area();
    dragArea.clone(dragPile.area);
    let redrawArea = new Area();
    redrawArea.addAreas(dragPile.area, pile.area);
    dragPile.moveTo(pile.x, pile.y);
    pile.addDrag();
    table.showCards(redrawArea);
    this.checkBook(pileI - 8);
    this.checkWin();
    return true;
  }

  private calcRankNeeded(keyPileI: number): number {
    let lowPileI = keyPileI + 8;
    let keyCard = table.piles[keyPileI].cards[0];
    if (table.piles[keyPileI].cards.length >= 13) { return 14 }
    let lRank = 0;
    if (table.piles[lowPileI].cards.length > 0) {
      lRank = table.piles[lowPileI].endCard().rank();
    }
    return this.calcRankNeeded2(keyCard.rank(), lRank);
  }

  private calcRankNeeded2(kRank: number, lRank: number): number {
    // -1's +1's needed because rank is 1 not 0 based
    if (lRank == 0) {
      return (kRank * 2 - 1) % 13 + 1;
    } else {
      return (kRank + lRank - 1) % 13 + 1;
    }
  }

  override click(pileI: number, cardI: number) {
    // possibly do something when cardI in pileI has been clicked
    // deal pile or fly cards if possible 
    if (pileI > 7) {
      sound.soundFail();
      return;
    }
    let pile = table.piles[pileI];
    let keyPileI: number;
    let myThis = this;
    if (pile.cards.length - 1 == cardI) {
      // clicked on top card in long pile: look for card to move to 
      let randomOrderKeyPiles = [];
      pack.makeShuffledArray(randomOrderKeyPiles, 8);
      for (keyPileI of randomOrderKeyPiles) {
        keyPileI += 8;
        if (this.calcRankNeeded(keyPileI) == pile.endCard().rank()) {
          undo.saveState();
          pile.spliceToDrag(cardI);
          let lowCardsPile = table.piles[keyPileI + 8];
          table.flyPile(lowCardsPile, lowCardsPile.x, lowCardsPile.y, checkBook2)
          return;
        }
      }
    } else {
      // clicked on other card in long pile. Do new deal if possible
      if (table.gameData < 8) {
        // move dealPile to talon (which is empty) in reverse order and deal the talon to empty again
        undo.saveState();
        let dealPile = table.piles[table.gameData++];
        let talonPile = table.piles[this.talonPileI];
        for (let cardI = dealPile.cards.length - 1; cardI >= 0; cardI--) {
          talonPile.addCardP(dealPile.cards[cardI].cards52I, talonPile.x, talonPile.y);
        }
        dealPile.cards = [];
        dealPile.recalcArea();
        table.showCards();
        table.dealN(false);
        return;
      }
    }
    sound.soundFail();
    return;

    function checkBook2() {
      myThis.checkBook(keyPileI);
    }
  }

  private checkBook(keyPileI: number) {
    // We may have formed complete book. If so collapse
    let keyCardsPile = table.piles[keyPileI];
    let lowCardsPile = table.piles[keyPileI + 8];
    if (lowCardsPile.endCard().rank() == 13) {
      let redrawArea = new Area();
      redrawArea.addAreas(lowCardsPile.area, keyCardsPile.area);
      lowCardsPile.spliceToDrag(0);
      dragPile.moveTo(keyCardsPile.x, keyCardsPile.y + 2);
      keyCardsPile.addDrag();
      table.showCards(redrawArea);
      sound.soundSmallTrumpet();
    }
  }

  override checkWin() {
    // call table.youWin() if player has won, otherwise nothing
    // we have won if piles 0-7 are empty
    for (let pileI = 0; pileI < 8; pileI++) {
      if (table.piles[pileI].cards.length > 0) { return }
    }
    table.youWin(table.piles[8].y - 60);
  }

  override nextDealTargets(target: DealTarget): Pile {
    // return info in target on next card in initial deal
    // return null if nothing to do (talon pile empty)
    // see rules for rather complicated dealing (The initial lay-out and object of the game)
    // for some reason 'this' does not work here. Use selGame instead
    // something to do with the indirect way it is called in table.deal
    if (table.piles[SWtalonI].cards.length == 0) { return null }
    target.faceUp = true;
    target.angle = 0;
    let dealCard = table.piles[SWtalonI].endCard();
    if (dealCard.rank() == 13) { return nextLongPile () }   // Kings always in long piles
    if (table.piles[15].cards.length == 0) {
      // still have key cards to do
      for (let tpileI = 8; tpileI < 16; tpileI++) {
        let tPile = table.piles[tpileI];
        if (tPile.cards.length == 0) {
          target.x = tPile.x;
          target.y = tPile.y;
          target.pileI = tpileI;
          return tPile;
        }
        if (tPile.endCard().rank() == dealCard.rank()) {
          return nextLongPile();
        }
      }
      // should be impossible to get here
      alert ("SW: Error in deal. Go debug.")
    }
    return nextLongPile();

    function nextLongPile(): Pile  {
      // find next available long pile. Pile 0 must have most cards. Therefore pile is pile 0
      // or first pile with one less card.
      let pile0Cards = table.piles[0].cards.length;
      for (let pileI = 1; pileI < 8; pileI++) {
        let candiPile = table.piles[pileI];
        if (candiPile.cards.length == pile0Cards - 1) {
          return returnLongPile(candiPile);
        }
      }
      // none found must be pile 0
      return returnLongPile(table.piles[0]);
    }

    function returnLongPile(candiPile: Pile): Pile {
      target.x = candiPile.x;
      target.y = candiPile.y + candiPile.cards.length * table.yStep;
      if (candiPile.cards.length > 7) {
        target.y += table.yStep * 2;
      }
      return candiPile;
    }
  }

  override nextDealNTargets(target: DealTarget): Pile {
    // subsequent deal in game. One of the long piles has been put in the talon.
    // Deal cards from there. target.pileI = -1 first time in
    if (++target.pileI > 7) { target.pileI = 0 };
    target.angle = 0;
    target.faceUp = true;
    let pile = table.piles[target.pileI]
    target.x = pile.x
    if (pile.cards.length == 0) {
      target.y = pile.y;
    }
    else {
        if (pile.cards.length == 8) {
            target.y = pile.endCard().y + table.yStep * 3;
        }
        else {
            target.y = pile.endCard().y + table.yStep;
        }
    }
    return pile;
  }

  override initialiseTable() {
    // create all the empty piles on the table
    // for some reason 'this' does not work here. Use selGame instead
    // something to do with the indirect way it is called in table.deal
    table.piles = [];
    table.gameData = 0;        //  next pile for deal

    // first 8 columns 
    make8piles(Math.round(table.cardHeight * .1));
    make8piles(Math.round(table.height - table.cardHeight * 2.1));
    make8piles(Math.round(table.height - table.cardHeight));

    // talon pile is just off bottom of screen. It will be emptied
    selGame.talonPileI = SWtalonI;
    pack.doShuffle(2);
    const talonX = Math.round(table.width / 2);
    const talonY = Math.round(table.height * 0.9);

    table.addPile(pack.shuffled[0], talonX, talonY, true, 0);
    for (let shIx = 1; shIx <= 103; shIx++) {
      table.addCardT(SWtalonI, pack.shuffled[shIx], talonX, talonY, true, 0);
    }

    // SWextremeDeal();

    function make8piles(y: number) {
      const offsetX = table.cardWidth * 1.1;
      for (let col = 0; col < 8; col++) {
        let x = Math.round(table.cardWidth * .1 + offsetX * col);
        table.addPile(-1, x, y);
      }
    }
  }

  hintEllipse() {
    // draw next cards required on each lowPile in elliptic formation
    // not really a cheat but met with Alexander's disapproval and looks messy or illegible on phone
    for (let pileI = 16; pileI < 24; pileI++) {
      if (table.piles[pileI - 8].cards.length > 1) { continue }
      let ranksNeeded: number[] = [];
      let keyCardRank = table.piles[pileI - 8].cards[0].rank();
      let lowCardRank = 0;
      let pile = table.piles[pileI];
      if (pile.cards.length > 0) { lowCardRank = pile.endCard().rank() }
      ranksNeeded[ranksNeeded.length] = this.calcRankNeeded2(keyCardRank, lowCardRank);
      while (ranksNeeded[ranksNeeded.length - 1] != 13) {
        ranksNeeded[ranksNeeded.length] = this.calcRankNeeded2(keyCardRank,
          ranksNeeded[ranksNeeded.length - 1]);
        if (ranksNeeded.length > 14) {
          alert("SW: Mathematics has failed! Inform God.");
          return;
        }
      }
      table.showClock(pile, ranksNeeded);
    }
  }

  override hint() {
    if (this.hintEasy()) { return }
    // give the pesky user a hint.
    let randomOrderUpperPiles = [];
    pack.makeShuffledArray(randomOrderUpperPiles, 8);
    for (let pileI of randomOrderUpperPiles) {
      if (table.piles[pileI].cards.length == 0) { continue }
      let pile = table.piles[pileI];
      let randomOrderKeyPiles = [];
      pack.makeShuffledArray(randomOrderKeyPiles, 8);
      for (let keyPileI of randomOrderKeyPiles) {
        keyPileI += 8;
        if (table.piles[keyPileI].cards.length > 1) { continue }
        if (this.calcRankNeeded(keyPileI) == pile.endCard().rank()) {
          table.flyOutBack(pile, pile.cards.length - 1, table.piles[keyPileI]);
          return;
        }
      }
      
    }

    let theHint = "?????";
    if (table.piles.length == 0) {
      theHint = "New Game"
    } else {
      if (selGame.gameState == GameState.Won) {
        theHint = "You won. New Game"
      } else {
        if (table.gameData < 8) {
          theHint = "Deal. (Click / tap in long piles at top)."
        } else {
          this.gameStateSet(GameState.Lost);
          theHint = "You lost. New Game"
        }
      }
    }
    this.hintShow(theHint, table.piles[8].y - 30);
  }

}