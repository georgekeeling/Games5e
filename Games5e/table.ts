"use strict";

class DealTarget {
  // info for next card in deal
  pileI: number;
  x: number;
  y: number;
  faceUp: boolean;
  angle: number;

  constructor() {
    this.pileI = -1;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.faceUp = true;
  }
}

class Coords {      // increasing x goes more to the right, increasing y goes more down =upside down Cartesian
                    // an unfortunate error by early computer programmers which we still suffer from :-(
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  rotate(angle: number) {
    // rotate clockwise by angle in degrees
    // see https://en.wikipedia.org/wiki/Rotation_matrix
    angle = -angle * Math.PI / 180;  // anticlockwise in radians
    let x = this.x;
    let y = this.y;
    this.x = x * Math.cos(angle) - y * Math.sin(angle);
    this.y = x * Math.sin(angle) + y * Math.cos(angle);
  }

}

/*
 * Rectangular area, often used to show total area affected by card or pile
 * I often get confused by area because you might expect top > bottom
 * But because Y coordinates are upside down we always have bottom > top
 */
class Area {
  left: number;     // could have been x1,y1,x2,y2
  top: number; 
  right: number;
  bottom: number;

  constructor(l?: number, t?: number, r?: number, b?: number) {
    this.left = Nor0(l);
    this.top = Nor0(t);  
    this.right = Nor0(r);
    this.bottom = Nor0(b);

    function Nor0(n ?: number): number {
      if (typeof (n) == 'undefined') { return 0 } else { return n }
    }
  }

  clone(fromArea: Area) {
    this.left = fromArea.left;
    this.top = fromArea.top;
    this.right = fromArea.right;
    this.bottom = fromArea.bottom;
  }

  addAreas(area1: Area, area2: Area) {
    this.left = (area1.left < area2.left) ? area1.left : area2.left;
    this.top = (area1.top < area2.top) ? area1.top : area2.top;
    this.right = (area1.right > area2.right) ? area1.right : area2.right;
    this.bottom = (area1.bottom > area2.bottom) ? area1.bottom : area2.bottom;
  }

  overlaps(area2: Area): boolean {
    // return true if two areas overlap
    // thanks: https://stackoverflow.com/questions/20925818/algorithm-to-check-if-two-boxes-overlap
    if (!this.overlapsRange(this.left, this.right, area2.left, area2.right)) {
      return false;
    }
    if (!this.overlapsRange(this.top, this.bottom, area2.top, area2.bottom)) {
      return false;
    }
    return true;
  }

  private overlapsRange(xMin1: number, xMax1: number, xMin2: number, xMax2: number) : boolean {
    return (xMax1 >= xMin2 && xMax2 >= xMin1);
  }
}

class Card {
  // a card at a position usually in a pile.
  cards52I: number;     // index into cards.cards52 so you know what card it is, 0 = Ace Spades
  x: number;          // x,y pos of top left of card when it is not rotated
  y: number;
  faceUp: boolean;
  angle: number;      // rotation angle, clockwise in degrees. Range 0-179
  visible: boolean;   // false if next card in pile is at same position and angle.
  area: Area;         // top, left of area = x,y when not rotated. Otherwise different
  pile: Pile;         // the pile it is on

  constructor(pile: Pile, cards52I: number, xPos: number, yPos: number, faceUp: boolean, angle: number) {
    this.pile = pile;
    this.cards52I = cards52I;
    //this.x = Math.round(xPos);  Rounding has bad effect on seven and six, and we abandoned tidiness effort in Dec 2022
    //this.y = Math.round(yPos);
    this.x = xPos;
    this.y = yPos;
    this.faceUp = faceUp;
    this.angle = angle;
    this.visible = true;
    this.area = new Area(this.x, this.y, xPos + table.cardWidth, yPos + table.cardHeight);
    this.angle = this.angle % 180;  // range +/- 179°
    if (this.angle < 0) { this.angle += 180 }   // range 0-179
    if (this.angle != 0) {
      // card is rotated about centre by angle
      this.calcRotate();
    }
  }

  private calcRotate() {
    // calculate area used by card that is rotated
    // method: rotate card centred on origin, then map back new area to the card
    let halfWidth = table.cardWidth / 2;
    let halfHeight = table.cardHeight / 2;

    let tl = new Coords(-halfWidth, -halfHeight);
    let tr = new Coords(halfWidth, -halfHeight);
    let bl = new Coords(-halfWidth, halfHeight);
    let br = new Coords(halfWidth, halfHeight);

    tl.rotate(this.angle);
    tr.rotate(this.angle);
    bl.rotate(this.angle);
    br.rotate(this.angle);

    this.area.left = this.x + halfWidth + Math.min(tr.x, tl.x, bl.x, br.x);
    this.area.right = this.x + halfWidth + Math.max(tr.x, tl.x, bl.x, br.x);
    this.area.top = this.y + halfHeight + Math.min(tr.y, tl.y, bl.y, br.y);
    this.area.bottom = this.y + halfHeight + Math.max(tr.y, tl.y, bl.y, br.y);
  }

  setAngle(angle: number) {
    this.angle = angle;
    this.calcRotate();
    this.pile.recalcArea();
  }

  suit(): number {
    return Math.floor(this.cards52I / 13);
  }
  rank(): number {
    return this.cards52I % 13 + 1;    // not zero base. Ace = 1, 2=2, king = 13
  }

  jinkable(cardOnTop: Card): boolean{
    // See side ways jinking in Seven and Six. Returns true it two cards could be jinked.
    let colourThis = 0;
    let colourTopper = 0;
    if (this.suit() == 1 || this.suit() == 2) { colourThis = 1 }
    if (cardOnTop.suit() == 1 || cardOnTop.suit() == 2) { colourTopper = 1 }
    if (this.rank() == cardOnTop.rank() + 1) {
      if (colourTopper != colourThis || choices.suits == 1) { return false }
    }
    return true;
  }
}

class Pile {
  // a pile of cards often cascaded. Once placed on table x,y should never change. 
  // Unless its the dragPile or the window / table is being resized
  area: Area;   // the total extent of the pile
  x: number; y: number;     // x,y = official left top of pile. same as area.left, area.top 
                            // unless pile contains rotated or jinked  cards
  cards: Card[] = [];   // cards in the pile. Obviously!

  // expect 0, 3 or 5 parameters
  constructor(cardIx?: number, x?: number, y?: number, faceUp?: boolean, angle?: number) {
    if (typeof (cardIx) == 'undefined') {
      this.area = new Area(-10, -10, -10, -10);
      this.x = -10;
      this.y = -10;
      return;
    }
    this.area = new Area(x, y, x + table.cardWidth, y + table.cardHeight);
    this.x = x;
    this.y = y;
    if (cardIx >= 0) {
      this.addCardP(cardIx, x, y, faceUp, angle);
      if (angle != 0) { this.recalcArea() }     // not sure that ever happens
    }
  }

  clone(fromPile: Pile) {
    this.x = fromPile.x;
    this.y = fromPile.y;
    this.area.clone(fromPile.area);
    for (let i = 0; i < fromPile.cards.length; i++) {
      let thisC = fromPile.cards[i];
      this.addCardP(thisC.cards52I, thisC.x, thisC.y, thisC.faceUp, thisC.angle);
      this.cards[i].area.clone(thisC.area);
    } 
  }

  addCardP(cardI: number, x: number, y: number, faceUp?: boolean, angle?: number) {
    let newI = this.cards.length;
    if (typeof (faceUp) == 'undefined') { faceUp = true };
    if (typeof (angle) == 'undefined') { angle = 0 };
    this.cards[newI] = new Card(this, cardI, x, y, faceUp, angle);
    this.cards[newI].visible = true;
    if (newI > 0) {
      if (this.cards[newI].x == this.cards[newI - 1].x &&
        this.cards[newI].y == this.cards[newI - 1].y &&
        this.cards[newI].angle == this.cards[newI - 1].angle) {
        this.cards[newI - 1].visible = false;
      } 
    }
    this.recalcArea();
  }

  recalcArea() {
    let cardI = this.cards.length;
    if (cardI > 0) {
      this.area.clone(this.cards[0].area);
      cardI--;
      while (cardI >= 1) {
        this.area.addAreas(this.area, this.cards[cardI].area);
        cardI--;
      }
    } else {
      // 0 cards 
      this.area.left = this.x;
      this.area.top = this.y;
      this.area.right = this.x + table.cardWidth;
      this.area.bottom = this.y + table.cardHeight;
    }
  }

  collapse(fromCardI: number, toCardI: number) {
    // collapse part of pile and redraw
    let redrawArea = new Area(this.area.left, this.area.top, this.area.right, this.area.bottom)
    let prevCard: Card
    let thisCard: Card

    for (let cardI = fromCardI + 2; cardI <= toCardI; cardI++) {
      prevCard = this.cards[cardI - 1]
      thisCard = this.cards[cardI]
      thisCard.y = prevCard.y
      thisCard.area.top = prevCard.area.top
      thisCard.area.bottom = prevCard.area.bottom
      prevCard.visible = false
    }

    prevCard.visible = true;
    thisCard.y += table.yStep / 4
    thisCard.area.top += table.yStep / 4
    thisCard.area.bottom += table.yStep / 4

    if (toCardI < this.cards.length - 1) {
      // there are more cards to go
      let dy = this.cards[toCardI + 1].y - thisCard.y - table.yStep   // amount cards moved up
      for (let cardI = toCardI + 1; cardI < this.cards.length; cardI++) {
        thisCard = this.cards[cardI]
        thisCard.y -= dy
        thisCard.area.top -= dy
        thisCard.area.bottom -= dy
      }
    }
    this.recalcArea()
    table.showCards(redrawArea)
  }

  uncollapse(fromCardI: number, toCardI: number) {
    // uncollapse part of pile and redraw
    let prevCard: Card
    let thisCard: Card

    for (let cardI = fromCardI + 1; cardI <= toCardI; cardI++) {
      prevCard = this.cards[cardI - 1]
      thisCard = this.cards[cardI]
      thisCard.y = prevCard.y + table.yStep
      thisCard.area.top = prevCard.area.top + table.yStep
      thisCard.area.bottom = prevCard.area.bottom + table.yStep
      prevCard.visible = true
    }

    if (toCardI < this.cards.length - 1) {
      // there are more cards to go
      let dy = this.cards[toCardI + 1].y - thisCard.y - table.yStep   // amount cards moved down
      for (let cardI = toCardI + 1; cardI < this.cards.length; cardI++) {
        thisCard = this.cards[cardI]
        thisCard.y -= dy
        thisCard.area.top -= dy
        thisCard.area.bottom -= dy
      }
    }

    this.recalcArea()
    table.showCards(this.area)
  }

  endCard(): Card {
    // return card at end (or top) of pile. This is done a zillion times
    return this.cards[this.cards.length - 1]
  }

  moveTo(x: number, y: number) {
    // this.moveBy(x - this.x, y - this.y); Gets wrong answer by ~.0000000000001 15% of time, See tests / SSbug230312
    // This, more complex version, uses the input x,y wherever possible
    let origX = this.x;
    let dx = x - this.x;
    let origY = this.y;
    let dy = y - this.y;

    this.area.left = moveToX(this.area.left);
    this.area.right = moveToX(this.area.right);
    this.area.top = moveToY(this.area.top);
    this.area.bottom = moveToY(this.area.bottom);
    this.x = moveToX(this.x);
    this.y = moveToY(this.y);
    for (let cardI = 0; cardI < this.cards.length; cardI++) {
      let card = this.cards[cardI];
      card.x = moveToX(card.x);
      card.y = moveToY(card.y);
      card.area.left = moveToX(card.area.left);
      card.area.top = moveToY(card.area.top);
      card.area.right = moveToX(card.area.right);
      card.area.bottom = moveToY(card.area.bottom);
    }

    function moveToX(thisX: number): number{
      if (thisX == origX) { return x };
      return thisX + dx;
    }
    function moveToY(thisY: number): number {
      if (thisY == origY) { return y };
      return thisY + dy;
    }
  }

  moveBy(dx: number, dy: number) {
    this.area.left += dx;
    this.area.right += dx;
    this.area.top += dy;
    this.area.bottom += dy;
    this.x += dx;
    this.y += dy;
    for (let cardI = 0; cardI < this.cards.length; cardI++) {
      let card = this.cards[cardI];
      card.x += dx;
      card.y += dy;
      card.area.left += dx;
      card.area.top += dy;
      card.area.right += dx;
      card.area.bottom += dy;
    }
  }

  spliceToDrag(fromCardI: number) {
    // move cards in pile from fromCardI to dragPile
    dragPile.cards = this.cards.splice(fromCardI);
    dragPile.setCpiles();
    dragPile.x = dragPile.cards[0].x;
    dragPile.y = dragPile.cards[0].y;
    dragPile.recalcArea();
    this.recalcArea();
  }

  addDrag() {
    // append dragPile to pile. Delete dragPile
    this.cards = this.cards.concat(dragPile.cards);
    this.setCpiles();
    this.recalcArea();
    dragPile.emptyDrag();
  }

  private setCpiles() {
    for (let card of this.cards) {
      card.pile = this;
    }
  }

  emptyDrag() {
    // should only be used on dragpile.
    if (this !== dragPile) { alert("Pile error: Go debug") }
    this.area.left = -10;
    this.area.top = -10;
    this.area.right = -10;
    this.area.bottom = -10;
    this.cards = [];
  }

  setAngle(angle: number) {
    // set angle of all cars in pile. Used in Kings. All cards are in same position.
    if (this.cards.length == 0) { return }
    this.cards[0].setAngle(angle);  // takes care of areas
    for (let cardI = 1; cardI < this.cards.length; cardI++) {
      this.cards[cardI].angle = angle;
      this.cards[cardI].area.clone(this.cards[0].area);
    }
  }
}

class Table {
  cardScale = 1;
  readonly SVGwidth = 360;   // 360 = width from SVG file.
  readonly SVGheight = 540;
  cardWidth: number;
  cardHeight: number;
  yStep: number;    // vertical distance between cards in pile. Just big enough to see rank & suit

  width = 1000;
  height = 600;
  ctx: CanvasRenderingContext2D;
  youWon = false;
  siteWindow: SiteWindow;
  lockLevel = 0;
  gameData: number;     // gamedata that needs to be faved / restored through undos

  piles: Pile[] = [];   // piles of cards on the table. Obviously!

  constructor(empty: boolean) {
    if (empty) { return };
    let c = document.getElementById("myCanvas") as HTMLCanvasElement;

    this.ctx = c.getContext("2d");

    this.siteWindow = new SiteWindow;
    this.resize1();
  }

  clone(fromTable: Table) {
    this.cardScale = fromTable.cardScale;
    this.cardWidth = fromTable.cardWidth;
    this.cardHeight = fromTable.cardHeight;
    this.yStep = fromTable.yStep;
    this.width = fromTable.width;
    this.height = fromTable.height;
    this.ctx = fromTable.ctx;
    this.youWon = fromTable.youWon;
    this.siteWindow = fromTable.siteWindow;
    this.lockLevel = fromTable.lockLevel
    this.gameData = fromTable.gameData;
    for (let i = 0; i < fromTable.piles.length; i++) {
      this.piles[i] = new Pile;
      this.piles[i].clone(fromTable.piles[i]);
    }
  }

  lock() { this.lockLevel++ }
  unlock() { if (this.lockLevel > 0) { this.lockLevel-- } }
  isLocked(): boolean { return (this.lockLevel > 0) }

  resize() {
    if (table.isLocked()) { return }
    let oldScale = this.cardScale;
    this.resize1();
    let reScale = this.cardScale / oldScale;
    for (let pileIx = 0; pileIx <= this.piles.length - 1; pileIx++) {
      let pile = this.piles[pileIx];
      pile.area.left *= reScale;
      pile.area.right *= reScale;
      pile.area.top *= reScale;
      pile.area.bottom *= reScale;
      pile.x *= reScale;
      pile.y *= reScale;
      for (let cardI = 0; cardI <= pile.cards.length - 1; cardI++) {
        let card = pile.cards[cardI];
        card.x *= reScale;
        card.y *= reScale;
        card.area.left *= reScale;
        card.area.right *= reScale;
        card.area.top *= reScale;
        card.area.bottom *= reScale;
      }
      pile.recalcArea();
    }
    selGame.resizeExtras();
    this.showCards();
    document.getElementById("cardsInfo").innerHTML =
      " w: " + this.width + " h: " + this.height;
  }

  resize1() {
    let btnH;
    this.siteWindow.resize();
    btnH = document.getElementsByTagName("button")[0].offsetHeight;
    if (this.siteWindow.onMobile) {
      if (window.innerHeight > window.innerWidth) { btnH *= 3 }
    } else {
      // Enable test button and info if on desktop and js/tests.js module is present
      if (typeof (test) == 'function') {
        document.getElementById("testButton").hidden = false;
        document.getElementById("cardsInfo").hidden = false;
      }
    }
    this.width = window.innerWidth - 18;
    this.height = window.innerHeight - btnH - 30;
    document.getElementById("myCanvas").setAttribute("width", this.width.toString());
    document.getElementById("myCanvas").setAttribute("height", this.height.toString());
    this.setScale();
  }

  setScale() {
    // set scale so we can get cardsAcross and cardsDown on table / canvas 
    let scaleX = (this.width / selGame.cardsAcross) / this.SVGwidth;
    let scaleY = (this.height / selGame.cardsDown) / this.SVGheight;
    if (scaleX < scaleY) {
      this.cardScale = scaleX;
    } else {
      this.cardScale = scaleY;
    }
    this.cardWidth = Math.round(100 * this.SVGwidth * this.cardScale) / 100;
    this.cardHeight = Math.round(100 * this.SVGheight * this.cardScale) / 100;
    this.yStep = this.cardHeight / 6;
  }

  setBigRandomFont(): number {
    let fontSize = 30;
    let fontFamilies = ["Serif", "Sans-Serif", "Monospace", "Cursive", "Fantasy"];
    // list of fonts from https://blog.hubspot.com/website/web-safe-html-css-fonts
    // answer to google question "What font styles are available in HTML?"
    let fontFI = Math.floor(Math.random() * fontFamilies.length);
    this.ctx.font = fontSize + "px " + fontFamilies[fontFI];
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#ffffc8";   // sickly yellow from colour picker  https://g.co/kgs/JspJG1
    return fontSize;
  }

  youWin(messageY?: number) {
    let DBmessage = "Won";
    if (choices.suits != 4) {
      if (selGame.codeName != "SeniorWrangler") {
        DBmessage += " suits: " + choices.suits;
      }
    }
    if (selGame.codeName == "UncleRemus") {
      if (choices.dealCardsUR < 50) {
        DBmessage += " deal0: " + choices.dealCardsUR;
      }
    }
    if (selGame.codeName == "SandS") {
      if (choices.dealCards76 < 52) {
        DBmessage += " deal0: " + choices.dealCards76;
      }
    }

    if (typeof (messageY) == 'undefined') {
      messageY = this.height * 0.8;
    }
    let fontSize = this.setBigRandomFont();
    let text = "Congratulations " + selGame.player + ", you won!";
    this.ctx.fillText(text, this.width / 2, messageY);
    switch (selGame.cheated) {
      case 0: 
        text = "";
        break;
      case 1:
        text = "But you cheated once."
        DBmessage += " 1 cheat";
        break;
      case 2:
        text = "But you cheated twice."
        DBmessage += " 2 cheats";
        break;
      default:
        text = "But you cheated " + selGame.cheated + " times."
        DBmessage += " " + selGame.cheated + " cheats";
    }
    this.ctx.fillText(text, this.width / 2, messageY + fontSize);
    sound.soundTrumpet();
    selGame.gameState = GameState.Won;
    undo.reset();
    updateDB.post(DBmessage);
    this.youWon = true;
  }

  welcome() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.setBigRandomFont();
    let spacing = this.siteWindow.welcomFont;
    this.setCtxFontSize(this.siteWindow.welcomFont);
    spacing += 3;
    let baseY = table.height / 2 - spacing * 3;
    let uName = " " + choices.user;
    if (uName == " unknown") {
      uName = "";
    }
    this.ctx.fillText("Welcome"+ uName + " to", this.width / 2, baseY + spacing);
    this.ctx.fillText("the Five Great Games", this.width / 2, baseY + spacing * 2);
    this.ctx.fillText("of patience", this.width / 2, baseY + spacing * 3);
    this.setCtxFontSize(this.siteWindow.welcomFont / 2);
    this.ctx.fillText("xx.x.xxx", this.width / 2, baseY + spacing * 4);
    this.setCtxFontSize(this.siteWindow.welcomFont);
    this.ctx.font = this.siteWindow.welcomFont + "px ";
    baseY += spacing;
    this.ctx.fillText("Next up:", this.width / 2, baseY + spacing * 5);
    this.ctx.fillText(selGame.name, this.width / 2, baseY + spacing * 6);
    selGame.gameState = GameState.Welcome;
  }

  setCtxFontSize(size: number) {
    // font in form nnnpx font-name. change nnn to size
    let font = this.ctx.font;
    let pxPos = font.search("px"); 
    font = size.toString() + font.slice(pxPos); 
    this.ctx.font = font;
  }

  showCards(area?: Area) {
    const startT = new Date();
    if (typeof (area) == 'undefined') {
      area = new Area(0, 0, this.width, this.height);
    } else {
      // avoid smearing, due to rounding errors?
      area.left -= 2;
      area.top -= 2;
      area.right += 2;
      area.bottom += 2;
    }
    this.ctx.clearRect(area.left, area.top,
      (area.right - area.left), (area.bottom - area.top));
    for (let pileIx = 0; pileIx <= this.piles.length - 1; pileIx++) {
      let thisPile = this.piles[pileIx];
      if (!area.overlaps(thisPile.area)) { continue };
      showPile(thisPile);
    }
    if (dragPile.cards.length > 0) { showPile(dragPile) };
    let endT = new Date();
    document.getElementById("cardsInfo").innerText = " Show time " +
      (endT.getMilliseconds() - startT.getMilliseconds()) + " ms";

    function showPile(aPile: Pile) {
      table.ctx.save();
      table.ctx.scale(table.cardScale, table.cardScale);
      let hadFirstVisible = false;
      for (let cardI = 0; cardI <= aPile.cards.length - 1; cardI++) {
        let thisCard = aPile.cards[cardI];
        if (!thisCard.visible) { continue };
        if (area.overlaps(thisCard.area) || hadFirstVisible) {
          hadFirstVisible = true;
          let CardImg = pack.cards52[thisCard.cards52I];
          if (!thisCard.faceUp) { CardImg = pack.cardBack };
          if (thisCard.angle != 0) {
            // need some work: Draw from centre of card
            let centX = (thisCard.x + table.cardWidth / 2) / table.cardScale;
            let centY = (thisCard.y + table.cardHeight / 2) / table.cardScale;
            table.ctx.save();
            table.ctx.translate(centX, centY);
            table.ctx.rotate(thisCard.angle * Math.PI / 180);
            table.ctx.drawImage(CardImg, -table.cardWidth / 2 / table.cardScale,
              -table.cardHeight / 2 / table.cardScale);
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

  showClock(pile: Pile, ranks: number[]) {
    // show rank numbers (1,2,...13 => A,2, ...10,J,Q,K) on pile.
    // numbers drawn as on elliptical clock face. See ellipse on cards.xlsx for some calculations
    const a = table.cardWidth / 2;              // ellipse parameters. See https://en.wikipedia.org/wiki/Ellipse
    const b = table.cardHeight / 2;             // we have b > a which is different from wiki and defies convention!
    const e2 = 1 - a * a / (b * b);             // eccentricity squared
    const centreX = pile.x + a;
    const centreY = pile.y + b;
    const rankText = ["*", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    let θ = 1.571;      //about 90°
    const dθ = 0.436;   // about 25°

    table.ctx.font = "10px Sans-Serif";
    //table.ctx.textAlign = "center";

    for (let rankI = 0; rankI < ranks.length; rankI++) {
      const r = 0.9 * a / Math.sqrt(1 - e2 * Math.sin(θ) * Math.sin(θ));
      const x = centreX + r * Math.cos(θ);
      const y = centreY - r * Math.sin(θ);
      table.ctx.fillStyle = "#000000";            // black
      table.ctx.fillRect (x - 3, y - 9 ,  14 , 12)
      table.ctx.fillStyle = "#FFFF00";            // yellow belly!
      table.ctx.fillText(rankText[ranks[rankI]], x, y);
      θ -= dθ;
    }
  }

  addPile(cardIx?: number, x?: number, y?: number, faceUp?: boolean, angle?: number) {
    this.piles[this.piles.length] = new Pile(cardIx, x, y, faceUp, angle);
  }

  addCardT(pile: number, cardIx: number, x: number, y: number, faceUp?: boolean, angle?: number) {
    this.piles[pile].addCardP(cardIx, x, y, faceUp, angle);
  }

  checkDealOK(): boolean{
    if (table.piles.length == 0 || table.youWon) { return true }
    return confirm("This will deal a new hand.\n" +
      "That cannot be undone.\nPress OK to proceed.");
  }

  deal() {
    if (table.isLocked()) { return }
    if (this.checkDealOK()) {this.deal0() }
  }

  deal0() {
    // initial deal
    this.youWon = false;
    selGame.gameState = GameState.Playing;
    selGame.player = choices.user;
    updateDB.post("Start");
    selGame.cheated = 0;
    this.dealX(selGame.initialiseTable, selGame.nextDealTargets, true, this.doNothing);
  }

  private doNothing() {
  }

  initTalon(pileI: number, packs?: number, breaker?: Function) {
    // fill the talon pile where undealt cards are kept
    // breaker function produces small extra offset between cards
    if (typeof (packs) == 'undefined') {
      packs = 2;    // it's always 2. For the moment
    }
    if (typeof (breaker) == 'undefined') {
      breaker = function () { return false }
    }

    selGame.talonPileI = pileI;
    // avoid talon being too cloose to hint button
    // document.getElementById("btnHint").offsetLeft = 0 if dealing from options screen
    let talonX = table.width * .5;    // take a guess!
    if (document.getElementById("btnHint").offsetLeft) {
      talonX = document.getElementById("btnHint").offsetLeft +
        document.getElementById("btnHint").offsetWidth * 1.5;  // not too close to hint button
    } 
    const talonY = Math.round(table.height - table.cardHeight / 3);
    pack.doShuffle(packs);
    table.addPile(pack.shuffled[0], talonX, talonY, false, 0);
    for (let shIx = 1; shIx <= 103; shIx++) {
      talonX += 2;
      table.addCardT(selGame.talonPileI, pack.shuffled[shIx], talonX, talonY, false, 0);
      if (breaker(shIx) ) { talonX += 4 }
    }

  }

  dealN(undoReset?: boolean, afterDeal?: Function) {
    // subsequent deals
    if (typeof (undoReset) == 'undefined') { undoReset = true }
    if (typeof (afterDeal) == 'undefined') { afterDeal = this.doNothing}
    this.dealX(this.doNothing, selGame.nextDealNTargets, undoReset, afterDeal);
  }

  dealX(initDeal: Function, nextInDeal: Function, undoReset: boolean, afterDeal: Function) {
    // dragPile contains 1 card which is flying out
    // pile [0,1,2,3....] contain real piles which are added to
    // last pile, talonPileI contains cards to be dealt.
    // dragPile emptied and afterDeal called at end. afterDeal is used to check if an new books formed (SS,UR)
    let target = new DealTarget;
    let areaBefore = new Area();
    let areaRedraw = new Area();
    let targetPile: Pile;
    let incX: number;
    let incY: number;
    let moves: number;
    let interval: number;
    switch (choices.speed) {
      case 2:
        moves = 10;
        interval = 50;
        break;
      case 1:
        moves = 10;
        interval = 20;
        break;
      case 0:
        moves = 1;
        interval = 1;
    }
    let pos = moves + 1;

    initDeal();
    dragPile.emptyDrag();
    table.showCards();
    table.lock()
    const id = setInterval(deal1, interval);

    function deal1() {
      if (pos >= moves) {
        pos = 0;
        if (dragPile.cards.length > 0) {
          // add dragpile card to destination pile with properties as in target
          targetPile.addCardP(dragPile.cards[0].cards52I, target.x, target.y, target.faceUp, target.angle);
        }

        targetPile = nextInDeal(target);
        if (table.piles[selGame.talonPileI].cards.length == 0) { targetPile = null } // safety if nextInDeal forgot.
        dragPile.emptyDrag();
        if (targetPile == null) {
          clearInterval(id);
          if (undoReset) { undo.reset() }
          table.showCards();
          table.unlock()
          afterDeal();
          return;
        }
        let nextCard = table.piles[selGame.talonPileI].cards.pop();
        dragPile.addCardP(nextCard.cards52I,nextCard.x, nextCard.y, target.faceUp, target.angle);
        incX = (target.x - nextCard.x) / moves;
        incY = (target.y - nextCard.y) / moves;
      }

      areaBefore.clone(dragPile.area);
      dragPile.moveBy(incX, incY);
      areaRedraw.addAreas(areaBefore, dragPile.area);
      table.showCards(areaRedraw);
      pos++;
    }
  }

  flyPile(targetPile: Pile, x: number, y: number, endFunction?:Function) {
    // fly dragPile to x,y and add it to target pile
    if (typeof (endFunction) == 'undefined') {
      endFunction = function nothing() { };
    }
    let moves = 10;
    let pos = 0;
    let interval = 20;
    let areaBefore = new Area();
    let areaRedraw = new Area();
    switch (choices.speed) {
      case 2:
        moves = 10;
        interval = 50;
        break;
      case 1:
        moves = 10;
        interval = 20;
        break;
      case 0:
        moves = 1;
        interval = 1;
    }
    let incX = (x - dragPile.x) / moves;
    let incY = (y - dragPile.y) / moves;
    table.lock()
    const id = setInterval(fly1, interval);

    function fly1() {
      if (pos >= moves) {
        clearInterval(id);
        dragPile.moveTo(x, y);
        targetPile.addDrag();
        table.showCards(targetPile.area);
        selGame.checkWin();
        endFunction();       // can even chain flyPile's. As Uncle Remus must in click method
        table.unlock();
        return;
      }
      areaBefore.clone(dragPile.area);
      dragPile.moveBy(incX, incY);
      areaRedraw.addAreas(areaBefore, dragPile.area);
      table.showCards(areaRedraw);
      pos++;
    }
  }

  flyOutBack(sourcePile: Pile, sourceCardI: number, targetPile: Pile, yOffset?: number, extract1Card?: boolean) {
    // fly cards from sourcePile, sourceCardI to bottom of targetPile, then fly them back
    // maybe more than one card from sourcePile.
    // if extract1Card = true, extract sourceCardI from sourdePile and just fly that out and back
    if (typeof (yOffset) == 'undefined') {
      yOffset = 0;
    }
    if (typeof (extract1Card) == 'undefined') {
      extract1Card = false;;
    }
    let sourceCard = sourcePile.cards[sourceCardI];
    let returnX = sourceCard.x;
    let returnY = sourceCard.y;
    if (extract1Card) {
      dragPile.emptyDrag();
      dragPile.x = sourceCard.x;
      dragPile.y = sourceCard.y;
      dragPile.addCardP(sourceCard.cards52I, sourceCard.x, sourceCard.y);
      sourceCard.visible = false;
    } else {
      sourcePile.spliceToDrag(sourceCardI);
    }
    let x: number;
    let y: number;
    if (targetPile.cards.length == 0) {
      x = targetPile.x;
      y = targetPile.y + yOffset;
    } else {
      x = targetPile.endCard().x
      y = targetPile.endCard().y + yOffset
    }

    let moves = 20;
    let pos = 0;
    let interval = 50;
    let areaBefore = new Area();
    let areaRedraw = new Area();

    let incX = (x - dragPile.x) / moves * 2;
    let incY = (y - dragPile.y) / moves * 2;
    table.lock()
    const id = setInterval(fly1, interval);

    function fly1() {
      if (pos == moves / 2) {
        // fly back
        incX = -incX;
        incY = -incY;
      }
      if (pos >= moves) {
        clearInterval(id);
        if (extract1Card) {
          sourceCard.visible = true;
          dragPile.emptyDrag();
        } else {
          dragPile.moveTo(returnX, returnY);
          sourcePile.addDrag();
        }
        table.showCards(sourcePile.area);
        table.unlock()
        return;
      }
      areaBefore.clone(dragPile.area);
      dragPile.moveBy(incX, incY);
      areaRedraw.addAreas(areaBefore, dragPile.area);
      table.showCards(areaRedraw);
      pos++;
    }

  }

}

class Pack {
  readonly cards52 = [];     // 52 card images
  cardBack = document.getElementById("cBack0");
  readonly suitLetters = ['s', 'h', 'd', 'c'];
  readonly shuffled = [];

  constructor() {
    let j = 0;
    for (let letter of this.suitLetters) {
      for (let rank = 1; rank <= 13; rank++) {
        this.cards52[j++] = document.getElementById(letter + rank);
      }
    }
    j = Math.floor(Math.random() * 5);
    this.cardBack = document.getElementById("cBack" + j);
  }

  doShuffle(numPacks: number) {
    // create unshuffled pack in this.shuffled, then shuffle it
    let endShuffled = 52 * numPacks - 1;
    for (let i = 0; i <= endShuffled; i++) {
      this.shuffled[i] = i % 52;
    }
    if (choices.suits == 3) {
      for (let i = 0; i <= 12; i++) {
        this.shuffled[i] = this.shuffled[i + 13];
        this.shuffled[i + 52] = this.shuffled[i + 13 + 52];
      }
    }
    if (choices.suits == 2) {
      for (let i = 0; i <= 25; i++) {
        this.shuffled[i] = this.shuffled[i + 26];
        this.shuffled[i + 52] = this.shuffled[i + 26 + 52];
      }
    }
    if (choices.suits == 1) {
      let randomSuitBase = Math.floor(Math.random() * 4) * 13;
      for (let i = 0; i <= 12; i++) {
        this.shuffled[i] = this.shuffled[i + randomSuitBase];
        this.shuffled[i + 13] = this.shuffled[i + randomSuitBase];
        this.shuffled[i + 26] = this.shuffled[i + randomSuitBase];
        this.shuffled[i + 39] = this.shuffled[i + randomSuitBase];
        this.shuffled[i + 52] = this.shuffled[i + randomSuitBase];
        this.shuffled[i + 65] = this.shuffled[i + randomSuitBase];
        this.shuffled[i + 78] = this.shuffled[i + randomSuitBase];
        this.shuffled[i + 91] = this.shuffled[i + randomSuitBase];
      }
    }
    this.shuffleArray(this.shuffled);
  }

  shuffleArray(array: number[]) {
    // from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  makeShuffledArray(array: number[], length: number) {
    // create array with length length and randomised numbers 0 to (length-1) in it
    // used by hint and clink functions to randomise pile chosen
    for (let i = 0; i < length; i++) {
      array[i] = i;
    }
    this.shuffleArray(array);
  }

}
