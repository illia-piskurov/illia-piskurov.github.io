// test: no

(function() {
    "use strict";

    let active = null;

    function Animated(world) {

        this.wallImg   = document.getElementById("wall");
        this.groundImg = document.getElementById("ground");
        this.plantImg  = document.getElementById("plant");
        this.animalImg = document.getElementById("animal");

        this.world = world;
        this.canvas = document.getElementById("myCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.graphOutput();

        let outer = (window.__sandbox ? window.__sandbox.output.div : document.body), doc = outer.ownerDocument;
        let node = outer.appendChild(doc.createElement("div"));
        node.style.cssText = "position: relative; width: intrinsic; width: fit-content;";
        this.button = node.appendChild(doc.createElement("div"));
        this.button.style.cssText = "position: absolute; bottom: 20px; right: -4.5em; color: white; font-family: tahoma, arial; " +
            "background: #4ab; cursor: pointer; border-radius: 18px; font-size: 100%; width: 3.5em; text-align: center;";
        this.button.innerHTML = "stop";
        let self = this;
        this.button.addEventListener("click", function() { self.clicked(); });
        this.disabled = false;
        if (active) active.disable();
        active = this;
        this.interval = setInterval(function() { self.tick(); }, 333);
    }

    Animated.prototype.clicked = function() {
        if (this.disabled) return;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            this.button.innerHTML = "start";
        } else {
            let self = this;
            this.interval = setInterval(function() { self.tick(); }, 333);
            this.button.innerHTML = "stop";
        }
    };

    Animated.prototype.tick = function() {
        this.world.turn();
        this.graphOutput();
    };

    Animated.prototype.disable = function() {
        this.disabled = true;
        clearInterval(this.interval);
        this.button.innerHTML = "Disabled";
        this.button.style.color = "red";
    };

    Animated.prototype.getImageFromLegend = function(ch) {
        switch (ch) {
            case "#":
                return this.wallImg;
            case " ":
                return this.groundImg;
            case "*":
                return this.plantImg;
            case "O":
                return this.animalImg;
        }
        return this.wallImg;
    }

    Animated.prototype.graphOutput = function() {
        let str = this.world.toString();
        str = str.split('\n');

        for (let y = 0; y < str.length; y++)
            for (let x = 0; x < str[y].length; x++)
                this.graphOutputOneTile(this.getImageFromLegend(str[y][x]), 32*x, 32*y);

    };

    Animated.prototype.graphOutputOneTile = function(img, x, y) {
        if (img == this.animalImg || img == this.plantImg) {
            this.ctx.drawImage(this.groundImg, x, y);
            this.ctx.drawImage(img, x, y);
        } else {
            this.ctx.drawImage(img, x, y);
        }
    }

    window.animateWorld = function(world) { new Animated(world); };

})();
