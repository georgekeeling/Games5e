"use strict";
var table;
var selGame;
const destinationURL = "https://p5g.racingdemon.net/";
function moving() {
    selGame = new Game;
    table = new Table(false);
    movingNotice();
}
function movingNotice() {
    //adapted from table.welcome & setBigRandomFont
    table.ctx.clearRect(0, 0, table.width, table.height);
    table.ctx.font = "30px Sans-Serif";
    table.ctx.textAlign = "center";
    table.ctx.fillStyle = "#ffffc8"; // sickly yellow from colour picker  https://g.co/kgs/JspJG1
    let spacing = table.siteWindow.welcomFont;
    table.setCtxFontSize(table.siteWindow.welcomFont);
    spacing += 3;
    let baseY = table.height / 2 - spacing * 3;
    table.ctx.fillText("The Five Great Games", table.width / 2, baseY + spacing);
    table.ctx.fillText("of Patience", table.width / 2, baseY + spacing * 2);
    table.ctx.fillText("are on the move.", table.width / 2, baseY + spacing * 3);
    table.ctx.fillText("Come back here very soon.", table.width / 2, baseY + spacing * 5);
}
function moved() {
    selGame = new Game;
    table = new Table(false);
    let waitTime = 5;
    setInterval(movedNotice, waitTime * 1000 / 4);
    movedNotice();
    function movedNotice() {
        //adapted from table.welcome & setBigRandomFont
        table.ctx.clearRect(0, 0, table.width, table.height);
        table.ctx.font = "30px Sans-Serif";
        table.ctx.textAlign = "center";
        table.ctx.fillStyle = "#ffffc8"; // sickly yellow from colour picker  https://g.co/kgs/JspJG1
        let spacing = table.siteWindow.welcomFont;
        table.setCtxFontSize(table.siteWindow.welcomFont);
        spacing += 3;
        let baseY = table.height / 2 - spacing * 3;
        table.ctx.fillText("The Five Great Games", table.width / 2, baseY + spacing);
        table.ctx.fillText("of Patience", table.width / 2, baseY + spacing * 2);
        table.ctx.fillText("have moved.", table.width / 2, baseY + spacing * 3);
        table.ctx.fillText("You will forwarded in " + waitTime + " seconds", table.width / 2, baseY + spacing * 4);
        table.ctx.fillText("Or click here:", table.width / 2, baseY + spacing * 6);
        underline(table.ctx, destinationURL, table.width / 2, baseY + spacing * 7, 30, table.ctx.fillStyle, 2, -20);
        table.ctx.fillText(destinationURL, table.width / 2, baseY + spacing * 7);
        if (waitTime-- <= 0) {
            window.location.href = destinationURL;
        }
    }
}
function underline(ctx, text, x, y, size, color, thickness, offset) {
    // from https://stackoverflow.com/questions/4627133/is-it-possible-to-draw-text-decoration-underline-etc-with-html5-canvas-text
    var width = ctx.measureText(text).width;
    switch (ctx.textAlign) {
        case "center":
            x -= (width / 2);
            break;
        case "right":
            x -= width;
            break;
    }
    y += size + offset;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
}
function clicked() {
    window.location.href = destinationURL;
}
//# sourceMappingURL=migration.js.map