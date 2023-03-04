"use strict";
class SiteWindow {
    constructor() {
        // manages css for all pages on site
        this.onMobile = false;
        this.fakeMobile = false;
        this.welcomFont = 30;
        if (screen.width <= 480 || screen.height <= 480 || this.fakeMobile) {
            // mobile phone -
            this.onMobile = true;
        }
        else {
            this.onMobile = false;
            this.addCss("g5Desk.css");
            this.welcomFont = 50;
        }
    }
    addCss(cssFile) {
        const linkNode = document.createElement("link");
        const element = document.getElementById("sCss");
        element.remove();
        linkNode.setAttribute("id", "sCss");
        linkNode.setAttribute("rel", "stylesheet");
        linkNode.setAttribute("href", cssFile);
        document.head.appendChild(linkNode);
    }
    resize() {
        if (this.onMobile) {
            if (window.innerHeight > window.innerWidth) {
                this.addCss("g5MobilePortrait.css");
                this.welcomFont = 80;
            }
            else {
                this.addCss("g5MobileLandscape.css");
                this.welcomFont = 30;
            }
        }
    }
}
//# sourceMappingURL=siteWindow.js.map