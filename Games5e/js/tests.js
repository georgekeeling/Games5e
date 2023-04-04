"use strict";
/*
 * Test functions
 * Search for 'end game' to find all five
 */
function test() {
    showPileRace();
}
function showPileRace() {
    // we have one pile with nCards in it and race 2 versions of showCards
    // 1) draws every card even if it is immediately covered by next card
    // 2) more complicated, if card is completely covered by card on top, does not drraw card
    let nCards = 2000;
    let angle = 45;
    table.piles = [];
    table.addPile();
    for (let cardI = 0; cardI < nCards; cardI++) {
        table.piles[0].addCardP(cardI % 52, 10, 10, true, angle);
    }
    console.log("Racing " + nCards + " at angle " + angle + "°");
    showCards1();
    showCards2();
}
// results were
// Racing 2000 at angle 0°
// 1. Show time simple 1412 ms
// 2. Show time crafty 1 ms
// Racing 2000 at angle 0°
// 1. Show time simple 1308 ms
// 2. Show time crafty 1 ms
// Racing 2000 at angle 0°
// 1. Show time simple 1464 ms
// 2. Show time crafty 0 ms
// Racing 2000 at angle 0°
// 1. Show time simple 1313 ms
// 2. Show time crafty 1 ms
// Racing 2000 at angle 45°
// 1. Show time simple 1930 ms
// 2. Show time crafty 2 ms
// Racing 2000 at angle 45°
// 1. Show time simple 1739 ms
// 2. Show time crafty 1 ms
// Racing 2000 at angle 45°
// 1. Show time simple 1495 ms
// 2. Show time crafty 1 ms
function showCards1(area) {
    const startT = new Date();
    if (typeof (area) == 'undefined') {
        area = new Area(0, 0, table.width, table.height);
    }
    else {
        // avoid smearing, due to rounding errors?
        area.left -= 2;
        area.top -= 2;
        area.right += 2;
        area.bottom += 2;
    }
    table.ctx.clearRect(area.left, area.top, (area.right - area.left), (area.bottom - area.top));
    for (let pileIx = 0; pileIx <= table.piles.length - 1; pileIx++) {
        let thisPile = table.piles[pileIx];
        if (!area.overlaps(thisPile.area)) {
            continue;
        }
        ;
        showPile(thisPile);
    }
    if (dragPile.cards.length > 0) {
        showPile(dragPile);
    }
    ;
    let endT = new Date();
    let elapsedMs = Math.round(endT.getSeconds() * 1000 + endT.getMilliseconds() -
        startT.getSeconds() * 1000 - startT.getMilliseconds());
    console.log("1. Show time simple " + elapsedMs + " ms");
    function showPile(aPile) {
        table.ctx.save();
        table.ctx.scale(table.cardScale, table.cardScale);
        let hadFirstVisible = false;
        for (let cardI = 0; cardI <= aPile.cards.length - 1; cardI++) {
            let thisCard = aPile.cards[cardI];
            if (area.overlaps(thisCard.area) || hadFirstVisible) {
                hadFirstVisible = true;
                let CardImg = pack.cards52[thisCard.cards52I];
                if (!thisCard.faceUp) {
                    CardImg = pack.cardBack;
                }
                ;
                if (thisCard.angle != 0) {
                    // need some work: Draw from centre of card
                    let centX = (thisCard.x + table.cardWidth / 2) / table.cardScale;
                    let centY = (thisCard.y + table.cardHeight / 2) / table.cardScale;
                    table.ctx.save();
                    table.ctx.translate(centX, centY);
                    table.ctx.rotate(thisCard.angle * Math.PI / 180);
                    table.ctx.drawImage(CardImg, -table.cardWidth / 2 / table.cardScale, -table.cardHeight / 2 / table.cardScale);
                    table.ctx.restore();
                }
                else {
                    table.ctx.drawImage(CardImg, thisCard.x / table.cardScale, thisCard.y / table.cardScale);
                }
            }
        }
        table.ctx.restore();
    }
}
function showCards2(area) {
    const startT = new Date();
    if (typeof (area) == 'undefined') {
        area = new Area(0, 0, table.width, table.height);
    }
    else {
        // avoid smearing, due to rounding errors?
        area.left -= 2;
        area.top -= 2;
        area.right += 2;
        area.bottom += 2;
    }
    table.ctx.clearRect(area.left, area.top, (area.right - area.left), (area.bottom - area.top));
    for (let pileIx = 0; pileIx <= table.piles.length - 1; pileIx++) {
        let thisPile = table.piles[pileIx];
        if (!area.overlaps(thisPile.area)) {
            continue;
        }
        ;
        showPile(thisPile);
    }
    if (dragPile.cards.length > 0) {
        showPile(dragPile);
    }
    ;
    let endT = new Date();
    let elapsedMs = Math.round(endT.getSeconds() * 1000 + endT.getMilliseconds() -
        startT.getSeconds() * 1000 - startT.getMilliseconds());
    console.log("2. Show time crafty " + elapsedMs + " ms");
    function showPile(aPile) {
        table.ctx.save();
        table.ctx.scale(table.cardScale, table.cardScale);
        let hadFirstVisible = false;
        for (let cardI = 0; cardI <= aPile.cards.length - 1; cardI++) {
            let thisCard = aPile.cards[cardI];
            if (cardI < aPile.cards.length - 1) {
                // check if next card directly on top of this
                let nextCard = aPile.cards[cardI + 1];
                if (nextCard.x == thisCard.x && nextCard.y == thisCard.y &&
                    nextCard.angle == thisCard.angle) {
                    continue;
                }
            }
            if (area.overlaps(thisCard.area) || hadFirstVisible) {
                hadFirstVisible = true;
                let CardImg = pack.cards52[thisCard.cards52I];
                if (!thisCard.faceUp) {
                    CardImg = pack.cardBack;
                }
                ;
                if (thisCard.angle != 0) {
                    // need some work: Draw from centre of card
                    let centX = (thisCard.x + table.cardWidth / 2) / table.cardScale;
                    let centY = (thisCard.y + table.cardHeight / 2) / table.cardScale;
                    table.ctx.save();
                    table.ctx.translate(centX, centY);
                    table.ctx.rotate(thisCard.angle * Math.PI / 180);
                    table.ctx.drawImage(CardImg, -table.cardWidth / 2 / table.cardScale, -table.cardHeight / 2 / table.cardScale);
                    table.ctx.restore();
                }
                else {
                    table.ctx.drawImage(CardImg, thisCard.x / table.cardScale, thisCard.y / table.cardScale);
                }
            }
        }
        table.ctx.restore();
    }
}
function SSbug230312() {
    /*
    Bug in seven and six spotted 12/3/23
    Twice in game (and once a few weeks ago) I had a run (in pile 0) that I could
    not move. Second time the run was like 654321. I could move 4321. Not sure
    where split was first time but it was similar and in pile 0.
  
    Theory is that, in the end, both SevenAndSix.click and SevenAndSix.requestDrop
    ultimately use dragPile.moveTo(x,y) to move the dragpile into position.
    The former via table.flyPile, the latter directly.
  
    The x coordinate is copied from the card they are landing on.
  
    moveTo does a subtraction then invokes moveBy. POSSIBLY the subtraction causes
    a rounding error sometimes. And so the pile that is apparently lined up is not quite.
  
    To see if this can happen, we must create a pile at some random x between 0 and 1000
    Then move it to another random x using moveTo and testing if it gets exactly to that x
    in 100 tests got these 14 errors:
    Error (at i=3) moving from 724.1456587913075 to 56.68108298501748
    Error (at i=9) moving from 881.0220385983209 to 190.59941557168992
    Error (at i=34) moving from 613.9658583093858 to 247.3480235183334
    Error (at i=38) moving from 855.3057788213965 to 239.14001522303334
    Error (at i=43) moving from 885.5120428102902 to 130.53647171235443
    Error (at i=49) moving from 126.449625768859 to 819.3024785546762
    Error (at i=50) moving from 819.3024785546763 to 226.74563967724143
    Error (at i=52) moving from 680.6673370377441 to 194.05285629289867
    Error (at i=77) moving from 811.1076349047671 to 142.79580421872944
    Error (at i=79) moving from 896.5416875944522 to 143.07106698007553
    Error (at i=83) moving from 839.9913406320723 to 176.9175337070365
    Error (at i=87) moving from 428.80568662494113 to 35.96894967581361
    Error (at i=96) moving from 500.5888665753512 to 115.50620772133684
    14 errors found in 100 tests. Rate = 14%
  
    Rate was 15% over 1000 tests
  
    After fix rate was 0% :-)
    */
    let testPile = new Pile(1, 10, 10); // creates pile with 1 card in it at 10,10
    let testCard = testPile.cards[0];
    let errors = 0;
    let tests = 100;
    for (let i = 1; i <= tests; i++) {
        let fromX = testCard.x;
        let toX = Math.random() * 900;
        testPile.moveTo(toX, 20);
        if (toX != testCard.x) {
            errors++;
            console.log("Error (at i=" + i + ") moving from " + fromX + " to " + toX);
        }
    }
    console.log(errors + " errors found in " + tests + " tests. Rate = " + Math.round(100 * errors / tests) + "%");
}
function dramaticDeal() {
    // deal in 7&6 or UR when ace falls on K-2 sequence thus creating a book
    // set up talon and other piles for the deal.
    switch (selGame.codeName) {
        case "UncleRemus":
            URdrama1();
            break;
        case "SandS":
            SSdrama();
            break;
        default:
            alert("Oops - no drama");
    }
}
function URdrama1() {
    // first three columns contain K-2, Talon contains suitable Aces
    let suit = 0;
    for (let pileI = 0; pileI <= 2; pileI++) {
        let pile = table.piles[pileI];
        let yPos = pile.endCard().y;
        for (let cardI = 12; cardI > 0; cardI--) {
            yPos += table.yStep;
            pile.addCardP(cardI + suit * 13, pile.x, yPos, true, 0);
        }
        suit++;
    }
    let ace1 = 0; // can be chaged in debug
    let ace2 = 13;
    let ace3 = 26;
    let pile = table.piles[selGame.talonPileI];
    let cardI = pile.cards.length - 1;
    pile.cards[cardI--].cards52I = ace1;
    pile.cards[cardI--].cards52I = ace2;
    pile.cards[cardI--].cards52I = ace3;
    table.showCards();
}
function SSdrama() {
    // first nPiles columns contain ONLY K-2, Talon contains nPiles suitable Aces
    let suit = 0;
    const aces = [0, 13, 39, 13, 0, 13, 0, 13]; // can change aces and nPiles in debug for variations
    const nPiles = aces.length;
    for (let pileI = 0; pileI < 13; pileI++) {
        table.piles[pileI].cards = [];
    }
    for (let pileI = 0; pileI < nPiles; pileI++) {
        let pile = table.piles[pileI];
        let yPos = pile.y;
        for (let cardI = 12; cardI > 0; cardI--) {
            pile.addCardP(cardI + suit * 13, pile.x, yPos, true, 0);
            suit = 1 - suit; // flip between 1 and 0 = hearts and spades
            yPos += table.yStep;
        }
        suit = 1 - suit;
    }
    let pile = table.piles[selGame.talonPileI];
    pile.cards = [];
    for (let cardI = 0; cardI < nPiles; cardI++) {
        pile.addCardP(aces[nPiles - cardI - 1], pile.x + cardI, pile.y, false);
    }
    table.showCards();
}
function endGames() {
    // all the end game s
    switch (selGame.codeName) {
        case "AuntyAlice":
            AAendGame();
            break;
        case "UncleRemus":
            URendGame();
            break;
        case "SandS":
            SSendGame();
            break;
        case "SeniorWrangler":
            SWendGame();
            break;
        case "Kings":
            KingsEndGame();
            break;
        default:
            alert("Oops - no end game");
    }
}
function SWendGame() {
    // senior wrangler end game
    // empty all piles
    // K and Q in 0,1
    // Ace-King in all key card piles except 15 which is ace
    // 2-to Jack in pile 23
    let pile;
    table.gameData = 9; // no more dealing allowed!
    for (pile of table.piles) {
        pile.cards = [];
    }
    table.showCards();
    pile = table.piles[0];
    pile.addCardP(12, pile.x, pile.y);
    pile = table.piles[1];
    pile.addCardP(11, pile.x, pile.y);
    for (let pileI = 8; pileI <= 14; pileI++) {
        pile = table.piles[pileI];
        for (let cardI = 0; cardI <= 12; cardI++) {
            pile.addCardP(cardI, pile.x, pile.y);
        }
    }
    pile = table.piles[15];
    pile.addCardP(0, pile.x, pile.y);
    pile = table.piles[23];
    for (let cardI = 1; cardI <= 10; cardI++) {
        pile.addCardP(cardI, pile.x, pile.y);
    }
    table.showCards();
}
function KingsEndGame() {
    // run this after new game. Kings end game
    for (let pileI = 0; pileI < 4; pileI++) {
        for (let cardI = 0; cardI < 12; cardI++) {
            let pile = table.piles[pileI];
            pile.addCardP(11 - cardI, pile.x, pile.y);
        }
    }
    for (let pileI = 4; pileI < 8; pileI++) {
        for (let cardI = 0; cardI < 11; cardI++) {
            let pile = table.piles[pileI];
            pile.addCardP(cardI, pile.x, pile.y);
        }
    }
    for (let pileI = 8; pileI < 23; pileI++) {
        table.piles[pileI].cards = [];
    }
    for (let pileI = 8; pileI < 12; pileI++) {
        let pile = table.piles[pileI];
        pile.addCardP(11, pile.x, pile.y);
    }
    table.showCards();
}
function KingsDealAll() {
    // place all cards from talon into piles 8,19 and 21
    let pileI = 8;
    let talonPile = table.piles[KiTalonI];
    for (let card of talonPile.cards) {
        let tPile = table.piles[pileI];
        tPile.addCardP(card.cards52I, tPile.x, tPile.y, false, 0);
        pileI++;
        if (pileI == 20) {
            pileI++;
        }
        if (pileI == 22) {
            pileI = 8;
        }
    }
    for (pileI = 8; pileI <= 19; pileI++) {
        table.piles[pileI].endCard().faceUp = true;
    }
    talonPile.cards = [];
    table.showCards();
}
function testCalcArea() {
    let pile = table.piles[10];
    if (pile.cards.length == 0) {
        pile.addCardP(0, pile.x, pile.y, false, 0);
        pile.addCardP(1, pile.x - table.cardWidth / 4, pile.y, true);
    }
    for (let cardI = 0; cardI < pile.cards.length; cardI++) {
        let card = pile.cards[cardI];
        if (card.faceUp) {
            card.x -= table.cardWidth / 4;
            card.area.left -= table.cardWidth / 4;
            card.area.right -= table.cardWidth / 4;
        }
    }
    pile.recalcArea();
    table.showCards(pile.area);
}
function KingsDeal() {
    // Put A, 3, 2, 5, 3 at top of talon 
    let cards = [2, 4, 1, 2, 0];
    let talonPile = table.piles[selGame.talonPileI];
    let talonI = talonPile.cards.length - cards.length;
    for (let cardI = 0; cardI < cards.length; cardI++) {
        talonPile.cards[talonI++].cards52I = cards[cardI];
    }
}
function clockTest() {
    let toShow = [2, 3, 4, 10, 6, 7, 8, 9, 10, 11, 12, 13];
    table.showClock(table.piles[16], toShow);
    toShow = [2, 3, 4, 5, 5, 5, 5, 9, 10, 11, 12, 10];
    table.showClock(table.piles[17], toShow);
}
function SWextremeDeal() {
    // do a deal with kings and queens at the beginning
    // call at end of initialiseTable()
    for (let cardI = 103; cardI > 103 - 26; cardI -= 2) {
        table.piles[SWtalonI].cards[cardI].cards52I = 12;
        table.piles[SWtalonI].cards[cardI - 1].cards52I = 11;
    }
}
function SSendGame() {
    // Seven and Six end game
    if (selGame.codeName != "SandS") {
        return;
    }
    // 1. Clear all piles includung Talon
    for (let pileI = 0; pileI <= 13; pileI++) {
        table.piles[pileI].cards = [];
        table.piles[pileI].recalcArea();
    }
    // 2. fill 0-6 random piles with a book, 7,8 runs.
    let randomPiles = [];
    let botSuit = 0;
    let mySelGame = selGame;
    pack.makeShuffledArray(randomPiles, 13);
    for (let i = 0; i < 7; i++) {
        let pile = table.piles[randomPiles[i]];
        if (choices.suits != 1) {
            botSuit = 1 - botSuit;
        } // switch between Spades, Hearts for King bottom card
        AddCards(pile, botSuit, 12, 0);
        mySelGame.wrapIfDeadBook(pile);
    }
    AddCards(table.piles[randomPiles[7]], botSuit, 12, 4);
    AddCards(table.piles[randomPiles[8]], 1 - botSuit, 3, 0);
    table.showCards();
}
function AddCards(pile, suit, from, to) {
    let y = pile.y;
    let x = pile.x;
    for (let card52I = from; card52I >= to; card52I--) {
        y += table.yStep;
        pile.addCardP(card52I + suit * 13, x, y);
        if (choices.suits != 1) {
            suit = 1 - suit;
        } // switch between Spades, Hearts
    }
}
function SSendGame2() {
    // Seven and Six slight end game
    let pile = table.piles[0];
    let suit = pile.endCard().suit();
    if (selGame.codeName != "SandS") {
        return;
    }
    if (choices.suits != 1) {
        suit = 0;
    }
    AddCards(table.piles[0], 11, 4);
    AddCards(table.piles[1], 3, 0);
    table.showCards();
    function AddCards(pile, from, to) {
        let game = selGame;
        let endCard = pile.endCard();
        let y = endCard.y;
        let x = pile.x;
        if (endCard.x == pile.x) {
            x += game.jinkOffset;
        }
        for (let card52I = from; card52I >= to; card52I--) {
            y += table.yStep;
            pile.addCardP(card52I + suit * 13, x, y);
            if (choices.suits != 1) {
                suit = 1 - suit;
            } // switch between Spades, Hearts
        }
    }
}
function testShuffle() {
    let randomOrderPiles = [];
    let length = 10;
    pack.makeShuffledArray(randomOrderPiles, length);
    for (let x of randomOrderPiles) {
        let y = x;
        let z = y;
    }
    // this.shuffleArray(randomOrderPiles);
}
function shuffleArray(array) {
    // from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}
function testDealJinkDealN() {
    // test jinking on deal in 7&6 . 
    // Top card on each pile = 2, 3, 4...Q, K, A
    if (choices.suits == 1) {
        let suitOffset = table.piles[0].endCard().suit() * 13;
        for (let pileI = 0; pileI < 13; pileI++) {
            table.piles[pileI].endCard().cards52I = suitOffset + (pileI + 1) % 13;
        }
        // cards in talon from top = A, 2,3, ...K
        let cards52I = suitOffset;
        for (let cardI = table.piles[13].cards.length - 1; cardI > table.piles[13].cards.length - 14; cardI--) {
            table.piles[13].cards[cardI].cards52I = cards52I++;
        }
    }
    else {
        // Multi suite
        // Top card on each pile = 2, 3, 4...Q, K, A. No suit change
        for (let pileI = 0; pileI < 13; pileI++) {
            let suitOffset = table.piles[pileI].endCard().suit() * 13;
            table.piles[pileI].endCard().cards52I = suitOffset + (pileI + 1) % 13;
        }
        // cards in talon from top = A, 2,3, ...K. No suit change
        let cardRank = 0;
        for (let cardI = table.piles[13].cards.length - 1; cardI > table.piles[13].cards.length - 14; cardI--) {
            let card = table.piles[13].cards[cardI];
            card.cards52I = card.suit() * 13 + cardRank++;
        }
    }
    table.showCards();
}
function testDealJinkDeal0() {
    // must be called from SevenAndSix.initialiseTable()
    // 104 cards in talon 103-26 = 77, 
    // cards in talon from top-26 = A, 2,3, ...K; X, A, 2,3, ...Q; No suit change
    let cardRank = 0;
    for (let cardI = 77; cardI > 64; cardI--) {
        let card = table.piles[13].cards[cardI];
        card.cards52I = card.suit() * 13 + cardRank++;
    }
    cardRank = 0;
    for (let cardI = 63; cardI > 51; cardI--) {
        let card = table.piles[13].cards[cardI];
        card.cards52I = card.suit() * 13 + cardRank++;
    }
}
function URendGame() {
    // set up UR so that we are near end game. 7 packs in discard. 13 cards to play. Assume we have dealt.
    let disPile = table.piles[URdiscardPile];
    disPile.cards = [];
    let x = disPile.x;
    let y = disPile.y;
    for (let card52I = 0; card52I < 7 * 13; card52I++) {
        disPile.addCardP(card52I % 52, x, y);
        if (card52I % 13 == 12) {
            y += table.cardHeight / 4;
        }
    }
    // ace to 9 spades, 10th column empty
    let pileI = 0;
    for (let card52I = 0; card52I < 9; card52I++) {
        if (pileI > 9) {
            pileI = 0;
        }
        let pile = table.piles[pileI];
        if (card52I <= 9) {
            pile.cards = [];
        }
        pile.addCardP(card52I, pile.x, pile.y + ((card52I > 9) ? 10 : 0), true, 0);
        pileI++;
    }
    table.piles[9].cards = [];
    // 10-K in talon
    let talonPile = table.piles[selGame.talonPileI];
    talonPile.cards = [];
    for (let card52I = 9; card52I < 13; card52I++) {
        talonPile.addCardP(card52I, talonPile.x + (card52I - 9) * 5, talonPile.y, false, 0);
    }
    table.showCards();
}
function URtestBook1() {
    // in UR set up table so that book can be created, no new card to turnover
    URtestBook2();
    table.showCards();
}
function URtestBook2() {
    // in UR set up table so that book can be created, new card to turnover. 
    // Assumes start with two face down, one face up in pile 2
    table.piles[2].endCard().faceUp = false;
    URtestBook0();
    table.showCards();
}
function URtestBook3() {
    // in UR set up table so that book could be created, if only some K,Q face up
    // Assumes start with two face down, one face up in pile 2
    URtestBook0();
    table.piles[2].cards[2].faceUp = false;
    table.piles[2].cards[3].faceUp = false; // king face down
    // table.piles[2].cards[4].faceUp = false
    table.showCards();
}
function URtestBook4() {
    // in UR set up table so that book could be created on pile that becomes empty
    // Assumes start with two face down, one face up in pile 2
    table.piles[2].cards = [];
    URtestBook0();
    table.showCards();
}
function URtestBook0() {
    // in UR set up table for above 3. 
    table.piles[0].endCard().cards52I = 1; // 2 of spades
    table.piles[1].endCard().cards52I = 0; // ace of spades
    let pile = table.piles[2];
    let x = pile.x;
    let y = pile.y;
    if (pile.cards.length > 0) {
        y = pile.endCard().y + table.yStep;
    }
    let cards52I = 12;
    while (cards52I >= 2) {
        pile.addCardP(cards52I, x, y);
        y += table.yStep;
        cards52I--;
    }
}
function fly_out_back() {
    // test pile fly out and back from first plie in bottom row (AA)
    table.flyOutBack(table.piles[24], 1, table.piles[3]);
}
function testFonts() {
    // adapted from Table.youWin()
    let fontSize = 30;
    let fontFamilies = ["Serif", "Sans-Serif", "Monospace", "Cursive", "Fantasy"];
    // list of fonts from https://blog.hubspot.com/website/web-safe-html-css-fonts
    // answer to google question "What font styles are available in HTML?"
    for (let i = 0; i < fontFamilies.length; i++) {
        table.ctx.font = fontSize + "px " + fontFamilies[i];
        table.ctx.fillText(fontFamilies[i], 40, fontSize + fontSize * i);
    }
}
function test_trig_function_time() {
    // test how long it takes to do all thos sine / cosine calculations
    let times = 10;
    let card = table.piles[9].cards[0];
    const startT = new Date();
    for (let i = 1; i <= times; i++) {
        card.setAngle(5);
    }
    let endT = new Date();
    console.log(times + " calculations took " +
        (endT.getMilliseconds() - startT.getMilliseconds()) + " ms");
    table.showCards();
    /* and the results were
  10 calculations took 0 ms
  100 calculations took 0 ms
  1000 calculations took 6 ms
  10000 calculations took 2 ms
  100000 calculations took 10 ms
  1000000 calculations took -864 ms (1000-864 = 136)
  1000000 calculations took 118 ms
  1000000 calculations took 128 ms
  No need to worry then
  */
}
function test_rotate() {
    // rotate card 0, pile 9 by 45°, draw bounding rectangle
    let pile = table.piles[9];
    let card = pile.cards[0];
    let area = new Area;
    card.cards52I = 0; // ace, so it will fly
    area.clone(pile.area);
    card.setAngle(card.angle + 45);
    area.addAreas(area, pile.area);
    table.showCards(area);
    table.ctx.strokeRect(card.area.left, card.area.top, (card.area.right - card.area.left), (card.area.bottom - card.area.top));
}
function debuggingRotator() {
    // not much use now
    // see https://en.wikipedia.org/wiki/Rotation_matrix
    let card = new Card(null, 1, 50, 100, false, 0);
    card.angle = 45;
    let halfWidth = table.cardWidth / 2;
    let halfHeight = table.cardHeight / 2;
    let x0 = card.x + halfWidth;
    let y0 = card.y + halfHeight;
    let tlX = -halfWidth, tlY = -halfHeight, trX = halfWidth, trY = -halfHeight;
    let blX = -halfWidth, blY = halfHeight, brX = halfWidth, brY = halfHeight;
    let radians = -card.angle * Math.PI / 180;
    let ntrX = rotateX(trX, trY);
    let ntrY = rotateY(trX, trY);
    let ntlX = rotateX(tlX, tlY);
    let ntlY = rotateY(tlX, tlY);
    let nblX = rotateX(blX, blY);
    let nblY = rotateY(blX, blY);
    let nbrX = rotateX(brX, brY);
    let nbrY = rotateY(brX, brY);
    card.area.left = x0 + Math.min(ntrX, ntlX, nblX, nbrX);
    card.area.right = x0 + Math.max(ntrX, ntlX, nblX, nbrX);
    card.area.top = y0 + Math.min(ntrY, ntlY, nblY, nbrY);
    card.area.bottom = y0 + Math.max(ntrY, ntlY, nblY, nbrY);
    function rotateX(x, y) {
        return (x * Math.cos(radians) - y * Math.sin(radians));
    }
    function rotateY(x, y) {
        return (x * Math.sin(radians) + y * Math.cos(radians));
    }
}
function AAendGame() {
    // Aunty Alice end game. deal close to winning. All except pile 23 done
    for (let pileI = 0; pileI < 23; pileI++) {
        let pile = table.piles[pileI];
        pile.cards = [];
        for (let cardI = 0; cardI <= 3; cardI++) {
            let cardIx = Math.floor((pileI / 8)) + 1 + cardI * 3;
            pile.addCardP(cardIx, pile.x, pile.y + cardI * 2);
        }
    }
    let pile23 = table.piles[23];
    pile23.cards = [];
    pile23.addCardP(3, pile23.x, pile23.y); // 4 of spades
    for (let pileI = 24; pileI < 32; pileI++) {
        table.piles[pileI].cards = [];
    }
    table.piles[24].addCardP(6, table.piles[24].x, table.piles[24].y);
    table.piles[25].addCardP(9, table.piles[25].x, table.piles[25].y);
    table.piles[26].addCardP(12, table.piles[26].x, table.piles[26].y);
    table.piles[32].cards = [];
    table.showCards();
}
function testDeleteArray() {
    // clear the table!
    // https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
    let pile1 = table.piles[1]; // mysteriously saves one element. Look at pile1 table.pile in debug
    table.piles = [];
}
function areaRound(a) {
    a.top = Math.round(a.top);
    a.left = Math.round(a.left);
    a.bottom = Math.round(a.bottom);
    a.right = Math.round(a.right);
}
function logAreas(a1, a2, a3) {
    areaRound(a1);
    areaRound(a2);
    areaRound(a3);
    console.log("1:" + a1.left + "," + a1.top + "," + a1.right + "," + a1.bottom + "," +
        "2:" + a2.left + "," + a2.top + "," + a2.right + "," + a2.bottom + "," +
        "3:" + a3.left + "," + a3.top + "," + a3.right + "," + a3.bottom);
}
function logCoords(where) {
    console.log(where + " p left " + dragPile.area.left + ". c left " +
        dragPile.cards[0].area.left + ". c x " + dragPile.cards[0].x);
}
function AAdeal_test() {
    // fixed deal for Aunty Alice FIXinitialiseTable replacing AA.initialiseTable
    // copy of dealQuick, with 
    let dx = table.cardWidth / 4;
    let target = new DealTarget;
    FIXinitialiseTable();
    while (selGame.nextDealTargets(target)) {
        let targetPile = table.piles[target.pileI];
        let newCard = table.piles[selGame.talonPileI].cards.pop();
        targetPile.addCardP(newCard.cards52I, target.x, target.y, target.faceUp, 0);
        if (targetPile.cards.length == 1) {
            // on first card addCard does not calculate areas correctly MSTERY
            targetPile.recalcArea();
        }
    }
    undo.reset();
    table.showCards();
}
function FIXinitialiseTable() {
    // copy of AA.initialiseTable, with a fix on shuufle and this ->selGame / AAgame
    let pileI;
    const offsetX = table.cardWidth + 10;
    const offsetY = table.cardHeight + 10;
    table.piles = [];
    for (let row = 0; row <= 3; row++) {
        for (let col = 0; col <= 7; col++) {
            pileI = table.piles.length;
            table.addPile();
            table.piles[pileI].area.left = Math.round(10 + offsetX * col);
            table.piles[pileI].area.right = table.piles[pileI].area.left;
            table.piles[pileI].area.top = Math.round(10 + offsetY * row);
            table.piles[pileI].area.bottom = table.piles[pileI].area.top;
        }
    }
    // do the talon pile
    pileI = table.piles.length;
    selGame.talonPileI = pileI;
    let talonX = Math.round(table.width / 3);
    const talonY = Math.round(table.height * .9);
    // pack.doShuffle(2); replaced
    doShuffle(2);
    // end of repalcement
    table.addPile(pack.shuffled[0], talonX, talonY, false, 0);
    for (let shIx = 1; shIx <= 103; shIx++) {
        talonX += 2;
        table.addCardT(selGame.talonPileI, pack.shuffled[shIx], talonX, talonY, false, 0);
        if (shIx % 8 == 0) {
            talonX += 4;
        }
    }
    // the acePile
    let AAgame = selGame; // to get at acePile
    AAgame.acePileI = table.piles.length;
    table.addPile();
    let acePileArea = table.piles[AAgame.acePileI].area;
    acePileArea.left = table.piles[7].area.left + 2 * table.cardWidth;
    acePileArea.right = acePileArea.left;
    acePileArea.top = table.piles[7].area.top;
    acePileArea.bottom = acePileArea.top;
}
function doShuffle(numPacks) {
    // copy of pack.doShuffle, adjusted
    const orderedCards = [];
    let endOrderedCards = 52 * numPacks - 1;
    let shuffledI = 0;
    for (let i = 0; i <= endOrderedCards; i++) {
        orderedCards[i] = i % 52;
    }
    for (let i = 0; i <= 52 * numPacks - 1; i++) {
        pack.shuffled[shuffledI++] = i % 8;
    }
}
function testFormula() {
    // test something on AA.click
    let rank = 5;
    let candidatePileIa = 2;
    candidatePileIa = ((rank - 2) % 3) * 8;
}
// ***********************************
// creating a copy of an object is not simple
function testdragPile1() {
    // changes to dragPile are changes to table.pile[3]. dragPile is a 'pointer' to table.pile[3]
    dragPile = table.piles[3];
    dragPile.moveBy(10, 5);
}
function testdragPile2() {
    // changes to dragPile.area are NOT changes to table.pile[3].area
    // changes to dragPile.cards are changes to table.pile[3].cards
    dragPile.area.left = table.piles[3].area.left;
    dragPile.area.top = table.piles[3].area.top;
    dragPile.area.right = table.piles[3].area.right;
    dragPile.area.bottom = table.piles[3].area.bottom;
    dragPile.cards = table.piles[3].cards.slice(0, table.piles[3].cards.length);
    dragPile.moveBy(10, 5);
}
function testdragPile3() {
    // changes to dragPile.area are NOT changes to table.piles[3].area
    // changes to dragPile.cards are changes to table.piles[3].cards
    dragPile.area.left = table.piles[3].area.left;
    dragPile.area.top = table.piles[3].area.top;
    dragPile.area.right = table.piles[3].area.right;
    dragPile.area.bottom = table.piles[3].area.bottom;
    for (let i = 0; i < table.piles[3].cards.length; i++) {
        dragPile.cards[i] = table.piles[3].cards[i];
    }
    dragPile.moveBy(10, 5);
}
function testdragPile4() {
    // https://www.javascripttutorial.net/object/3-ways-to-copy-objects-in-javascript/
    // changes to dragPile are NOT changes to table.piles[3]
    // but "dragPile.move is not a function"
    dragPile = JSON.parse(JSON.stringify(table.piles[3]));
    dragPile.moveBy(10, 5);
}
// ***********************************
// I have asked
// https://stackoverflow.com/questions/74488847/copy-instance-of-class-in-javascript-typescript
// ***********************************
function testoverlaps() {
    // area overlaps
    // first remove empty piles, so last two are the las to moved (in default game)
    for (let i = 0; i < table.piles.length; i++) {
        if (table.piles[i].cards.length == 0) {
            table.piles.splice(i, 1);
        }
    }
    let lastPile = table.piles.length - 1;
    let area1 = table.piles[lastPile - 1].area;
    let area2 = table.piles[lastPile].area;
    let result = area1.overlaps(area2);
    if (result) {
        document.getElementById("cardsInfo").innerHTML = "Overlap";
    }
    else {
        document.getElementById("cardsInfo").innerHTML = "dont overlap";
    }
}
function testRand() {
    // test random number generator ****************
    const resultCount = [];
    const sample = 52;
    for (let i = 0; i <= sample - 1; i++) {
        resultCount[i] = 0;
    }
    for (let i = 1; i <= sample * 100; i++) {
        resultCount[Math.floor(Math.random() * 52)]++;
    }
}
//# sourceMappingURL=tests.js.map