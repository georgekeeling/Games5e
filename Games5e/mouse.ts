"use strict";
// MouseEvent Properties and Methods https://www.w3schools.com/jsref/obj_mouseevent.asp

/* This class (which only has one instance) contains all the stuff for 
 * mouse, keyboard and touch input
 * */
class Mouse {
  mouseUp = true;
  dragging = false;
  dragCancelled = false;
  x = 0; y = 0;
  downX = -1; downY = -1;
  sourcePileI = -1;
  sourceX = 0; sourceY = 0; 
  previousClickTime = 0;
  prevTouchX = -1;
  prevTouchY = -1;
  keyPressed = -1;
  // First three: y,z,e. Next 13: 0,1 ...9, J, Q, K. Next four; s,h,d,c. Last one: ESC
  keyCodes=    [89, 90, 69, 48,49,50,51,52,53,54,55,56,57, 74, 81, 75, 83, 72, 68, 67, 27];
  translateKey=[51, 52, 69, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13,100,113,126,139, 27];

  constructor() {
    // can't think of anytng to do!
  }

  // ****************************************
  // mouse / touch functions
  // ****************************************
  // typical mouse event sequence drag
  //Mouse Down
  //Mouse Move
  //Mouse Move ... lots
  //Mouse Move
  //Mouse Up
  //Mouse Click

  // mouse events for click
  //Mouse Down
  //Mouse Up
  //Mouse Click

  // touch functions.
  // Typical touch sequences for a drag
  //Touch Start 360, 126
  //Touch Move 376, 129.5
  //Touch Move ... lots mopre ..
  //Touch Move 464, 149
  //Touch End

  // Typical sequence for a click was. Let Mouse Up look after it
  //Touch Start 370.5, 206
  //Touch End
  //Mouse Down
  //Mouse Up
  //Mouse Click
  // ****************************************

  keyPress(event) {
    if (table.isLocked()) { return }
    let i = this.keyCodes.indexOf(event.which);
    // console.log("evw: " + event.which + ", i: " + i);
    if (i >= 0) {
      this.keyPressed = this.translateKey[i];
      switch (this.keyPressed) {
        case 52:          // z,Z, ^Z, ^z
          undo.undo();
          break;
        case 51:          // y, Y, ^Y, ^y
          undo.redo();
          break;
        case 27:          // escape
          this.dragAbort();
          break;
        case 69:          // e, E (for displaying numbers in Ellipse)
          if (selGame.codeName == "SeniorWrangler") {
            let game = selGame as SeniorWrangler;
            game.hintEllipse();
          }
          break;
        default:
          if (typeof (test) != 'function') { break }    // if test.js not loaded, dont cheat!
          return;   // keep value of key pressed if A,2...K, s,h,d,c
      }
    }
    this.keyPressed = -1;
  }

  down(message) {
    if (table.isLocked()) { return }
    // just note that mouse is down. Drag may start if mouse moves while it is down
    this.down1(message.offsetX, message.offsetY);
  }

  up(message) {
    if (table.isLocked()) { return }
    this.up1(message.offsetX, message.offsetY);
  }

  move(message) {
    if (table.isLocked()) { return }
    this.move1(message.offsetX, message.offsetY);
  }

  tStart(message) {
    if (table.isLocked()) { return }
    let mouseX = message.touches[0].clientX - message.touches[0].target.offsetLeft;
    let mouseY = message.touches[0].clientY - message.touches[0].target.offsetTop;
    this.down1(mouseX, mouseY);
  }

  tMove(message) {
    if (table.isLocked()) { return }
    let mouseX = message.touches[0].clientX - message.touches[0].target.offsetLeft;
    let mouseY = message.touches[0].clientY - message.touches[0].target.offsetTop;
    this.move1(mouseX, mouseY);
  }

  tEnd(message) {
    if (table.isLocked()) { return }
    this.up1(this.x, this.y);
  }

  disableTchDefault(message: TouchEvent) {
    // disables back / forward behaviour to go back / forward a page in Chrome
    // and disables scroll down which can cause refresh in chrome / android and safari
    // if two (or more) fingers used then allow default behaviour, which is zoom in / out
    // this is necessary because user zone can zoom when name / password being entered
    // and we need to get back to 100% zoom
    if (message.touches.length == 1) {
      message.preventDefault();
    }
  }

  disableTchDefaultxVscroll(message: TouchEvent) {
    // variation on disableTchDefault which does vertical scrolling rather badly in rules page
    if (message.touches.length == 1) {
      message.preventDefault();
    }
    if (message.touches.length == 0) { return }
    const scrollAmount = 30;
    if (this.prevTouchY < message.touches[0].clientY) {
      // scrolling down
      if (window.scrollY > 0) {
        window.scrollBy(0, -scrollAmount);
      }
    } else {
      window.scrollBy(0, scrollAmount);
    }
    this.prevTouchY = message.touches[0].clientY;
  }

  //TEST_disableTchDefaultxVscroll(message: TouchEvent) {
  //  // variation on disableTchDefault which allows default vertical scrolling except scroll down at top
  //  // this only seemed worked on Chrome and Edge so I have now reverted to the older version below.
  //  if (message.defaultPrevented) {
  //    console.log("default Prevented");
  //  } else {
  //    console.log("default not Prevented");
  //  }
  //  if (message.touches.length != 1) {
  //    message.preventDefault();
  //    console.log("Prevent default");
  //    return;
  //  }

  //  if (Math.abs(this.prevTouchX - message.touches[0].clientX) > 2) {
  //    preventDefault(this);
  //    return;
  //  }
  //  if (this.prevTouchY < message.touches[0].clientY) {
  //    // scrolling down 
  //    if (window.scrollY == 0) {
  //      preventDefault(this);
  //      return;
  //    }
  //  }
  //  this.prevTouchX = message.touches[0].clientX;
  //  this.prevTouchY = message.touches[0].clientY;
  //  console.log("Use default " + message.touches[0].clientX + " , " + message.touches[0].clientY);

  //  function preventDefault(myThis: Mouse) {
  //    myThis.prevTouchX = message.touches[0].clientX;
  //    myThis.prevTouchY = message.touches[0].clientY;
  //    message.preventDefault();
  //    console.log("Prevent default " + message.touches[0].clientX + " , " + message.touches[0].clientY);
  //  }
  //}

  // ****************************************
  // private functions
  // ****************************************
  private down1(x: number, y: number) {
    this.mouseUp = false;
    this.x = x;
    this.y = y;
    this.downX = x;
    this.downY = y;
    this.showMouseXY();
  }

  private move1(x: number, y: number) {
    let dX = x - this.x;
    let dY = y - this.y;
    this.showMouseXY();
    if (!this.mouseUp) {
      if (this.dragging) {
        this.dragContinue(dX, dY);
      } else {
        // we might be starting a drag, if we have just moved from a down
        if (this.downX == this.x && this.downY == this.y) {
          this.dragStart(this.downX, this.downY);
        }
      }
    }
    this.x = x;
    this.y = y;
  }

  private up1(x: number, y: number) {
    // finalise drag or invoke click (but not too often)
    this.downX = -1;
    this.downY = -1;
    if (this.dragging) {
      this.dragEnd(x, y);
      this.dragging = false;
    } else {
      let cpFound = this.findCardUnderMouse(x, y);
      if (this.dragCancelled) {
        cpFound.cardI = -1;
        this.dragCancelled = false;
      }
      if (cpFound.cardI >= 0) {
        let date = new Date();
        let mSeconds = date.getTime();
        if ((mSeconds - this.previousClickTime) > 100) {
          if (this.keyPressed == -1) {
            selGame.click(cpFound.pileI, cpFound.cardI);
          }
          else {
            // change the card, cheat
            let card = table.piles[cpFound.pileI].cards[cpFound.cardI];
            if (this.keyPressed >= 100) {
              // change suit
              card.cards52I = card.rank() - 1 + (this.keyPressed - 100);
            } else {
              card.cards52I = (this.keyPressed - 1) + card.suit() * 13;
            }
            this.keyPressed = -1;
            table.showCards(card.area);
            selGame.cheated++;
          }
        }
        this.previousClickTime = mSeconds;
      }
    }
    this.mouseUp = true;
    this.showMouseXY();
  }

  private dragStart(mouseX: number, mouseY: number) {
    let cpFound = this.findCardUnderMouse(mouseX, mouseY);
    if (cpFound.cardI >= 0) {
      let cardsToDrag = selGame.requestDrag(cpFound.pileI, cpFound.cardI);
      if (cardsToDrag == 0) {
        sound.soundFail()
        return;
      }
      undo.saveStateMaybe();
      let oldPileI = cpFound.pileI;
      let oldCardI = cpFound.cardI;
      let redrawArea = new Area();
      let oldPile = table.piles[oldPileI];
      this.dragging = true;
      this.dragCancelled = false;
      this.sourcePileI = oldPileI;
      this.sourceX = oldPile.cards[oldCardI].x;
      this.sourceY = oldPile.cards[oldCardI].y;
      if (cardsToDrag == Infinity) {
        // move rest of pileI to drag pile and redraw
        oldPile.spliceToDrag(oldCardI);
      } else {
        // move cardI to drag pile 
        let oldCard = oldPile.cards[oldCardI];
        dragPile.emptyDrag();
        dragPile.x = oldCard.x;
        dragPile.y = oldCard.y;
        dragPile.addCardP(oldCard.cards52I, oldCard.x, oldCard.y, true, 0);
        oldPile.cards.splice(oldCardI, 1);
      }
      redrawArea.clone(oldPile.area)
      redrawArea.addAreas(oldPile.area, dragPile.area)
      table.showCards(redrawArea);
    } 
    this.showMouseXY();
  }

  private dragContinue(mouseDx: number, mouseDy: number) {
    // console.log("Drag continue " + mouseDx + "," + mouseDy);
    let area1 = new Area(dragPile.area.left, dragPile.area.top, dragPile.area.right, dragPile.area.bottom);
    dragPile.moveBy(mouseDx, mouseDy);
    let area3 = new Area();
    area3.addAreas(area1, dragPile.area);
    table.showCards(area3);
  }

  private dragEnd(mouseX: number, mouseY: number) {
    let cpFound = this.findCardUnderMouse(mouseX, mouseY);
    if (selGame.codeName != "Kings" || this.sourcePileI != KiFanPileI) {
      if (cpFound.pileI == this.sourcePileI) {
        // Putting drag card back in pile where it came from has no effect, except in the fan pile in Kings
        this.dragAbort();
        return;
      }
    }
    if (!selGame.requestDrop(cpFound.pileI, cpFound.cardI, mouseX, mouseY)) {
      sound.soundFail();
      this.dragAbort();
      return;
    }
    undo.saveStateConfirm();
    this.dragging = false;
  }

  private dragAbort() {
    table.flyPile(table.piles[this.sourcePileI], this.sourceX, this.sourceY);
    this.dragging = false;
    this.dragCancelled = true;
    this.mouseUp = true;
    this.sourcePileI = -1;
  }

  private showMouseXY() {
    let pos = " At: (" + Math.floor(this.x) + "," + Math.floor(this.y) + ")";
    if (this.mouseUp) {
      document.getElementById("cardsInfo").innerHTML = pos + "UP";
    }
    else {
      document.getElementById("cardsInfo").innerHTML = pos + "down";
    }
  }

  private findCardUnderMouse(mouseX: number, mouseY: number) {
    // return pile and card under mouse
    let pileI: number;
    let cardI: number;
    for (pileI = 0; pileI < table.piles.length; pileI++) {
      let pile = table.piles[pileI];
      let pArea = pile.area;
      if (pArea.left < mouseX && mouseX < pArea.right &&
        pArea.top < mouseY && mouseY < pArea.bottom) {
        for (cardI = pile.cards.length - 1; cardI >= 0; cardI--) {
          let card = pile.cards[cardI];
          if (card.visible) {
            if (card.angle == 0) {
              if (card.x < mouseX && mouseX < (card.x + table.cardWidth) &&
                card.y < mouseY && mouseY < (card.y + table.cardHeight)) {
                return { pileI, cardI };
              }
            }
            else {
              // rotate mouse coords about card centre. Then check if mouse is in
              // area where card would be at angle 0
              // origin = center of card
              let halfWidth = table.cardWidth / 2;
              let halfHeight = table.cardHeight / 2;
              let mXY = new Coords(mouseX - card.x - halfWidth,
                mouseY - card.y - halfHeight);
              mXY.rotate(card.angle);   // should be -card.angle?? But this works!
              //drawPoint(mouseX, mouseY, "#FF0000");
              //drawPoint(card.x + halfWidth + mXY.x, card.y + halfHeight + mXY.y, "#00FFFF");
              if (-halfWidth < mXY.x && mXY.x < halfWidth &&
                -halfHeight < mXY.y && mXY.y < halfHeight) {
                return { pileI, cardI };
              }
            }
          }
        }
        cardI = -1;
        return { pileI, cardI };  // clicking / dropping on empty pile
      }
    }
    pileI = -1;
    cardI = -1;
    return { pileI, cardI };
  }
}

//function drawPoint(x: number, y: number, fill: string) {
//  let pointL = 2;
//  x = (x - pointL);
//  y = (y - pointL);
//  table.ctx.fillStyle = fill;
//  table.ctx.fillRect(x, y, pointL * 2 , pointL * 2);
//}
