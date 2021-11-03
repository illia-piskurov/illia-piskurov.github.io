let simpleLevelPlan = [
    "                      ",
    "                      ",
    "  x              = x  ",
    "  x         o o    x  ",
    "  x @      xxxxx   x  ",
    "  xxxxx            x  ",
    "      x!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxx  ",
    "                      "
];

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    plus(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    times(factor) {
        return new Vector(this.x * factor, this.y * factor);
    }
}

class Player {
    constructor(pos) {
        this.pos   = pos.plus(new Vector(0, -0.5));
        this.size  = new Vector(0.8, 1.5);
        this.speed = new Vector(0, 0);
    }

    type = "player";
}

class Lava {
    constructor(pos, ch) {
        this.pos  = pos;
        this.size = new Vector(1, 1);

        switch (ch) {
            case "=":
                this.speed = new Vector(2, 0);
                break;
            case "|":
                this.speed = new Vector(0, 2);
                break;
            case "v":
                this.speed = new Vector(0, 3);
                this.repeatPos = pos;
        }
    }

    type = "lava";
}

class Coin {
    constructor(pos) {
        this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
        this.size    = new Vector(0.6, 0.6);
        this.wobble  = Math.random() * Math.PI * 2;
    }

    type = "coin";
}

let actorChars = {
    "@" : Player,
    "o" : Coin,
    "=" : Lava, "|": Lava, "v": Lava
}

class Level {

    constructor(plan) {
        this.width  = plan[0].length;
        this.height = plan.length;
        this.grid   = [];
        this.actors = [];

        for (let y = 0; y < this.height; y++) {
            let line = plan[y], gridLine = [];
            for (let x = 0; x < this.width; x++) {
                let ch = line[x], fieldType = null;
                let Actor = actorChars[ch];
                if (Actor)
                    this.actors.push(new Actor(new Vector(x, y), ch));
                else if (ch == "x")
                    fieldType = "wall";
                else if (ch == "!")
                    fieldType = "lava";
                gridLine.push(fieldType);
            }
            this.grid.push(gridLine);
        }

        this.player = this.actors.filter(function(actor) {
            return actor.type == "player";
        })[0];

        this.status = this.finishDelay = null;
    }

    isFinished() {
        return this.status != null && this.finishDelay < 0;
    }
}

function elt(name, className) {
    let elt = document.createElement(name);
    if (className)
        elt.className = className;
    return elt;
}
// Move to DOMDisplay
let scale = 40;

class DOMDisplay {
    constructor(parent, level) {
        this.wrap = parent.appendChild(elt("div", "game"));
        this.level = level;

        this.wrap.appendChild(this.drawBackground());
        this.actorLayer = null;
        this.drawFrame();
    }

    drawBackground() {
        let table = elt("table", "background");
        table.style.width = this.level.width * scale + "px";
        this.level.grid.forEach(function(row) {
            let rowElt = table.appendChild(elt("tr"));
            rowElt.style.height = scale + "px";
            row.forEach(function(type) {
                rowElt.appendChild(elt("td", type));
            });
        });
        return table;
    }

    drawActors() {
        let wrap = elt("div");
        this.level.actors.forEach(function(actor) {
            let rect = wrap.appendChild(elt("div",
                                            "actor " + actor.type));
            rect.style.width  = actor.size.x * scale + "px";
            rect.style.height = actor.size.y * scale + "px";
            rect.style.left   = actor.pos.x * scale + "px";
            rect.style.top    = actor.pos.y * scale + "px";
        });
        return wrap;
    }

    drawFrame() {
        if (this.actorLayer)
            this.wrap.removeChild(this.actorLayer);
        this.actorLayer = this.wrap.appendChild(this.drawActors());
        this.wrap.className = "game" + (this.level.status || "");
        this.scrollPlayerIntoView();
    }

    scrollPlayerIntoView() {
        let width  = this.wrap.clientWidth;
        let height = this.wrap.clientHeight;
        let margin = width / 3;

        // The viewport
        let left = this.wrap.scrollLeft, right = left + width;
        let top  = this.wrap.scrollTop, bottom = top + height;

        let player = this.level.player;
        let center = player.pos.plus(player.size.times(0.5))
                        .times(scale);

        if (center.x < left + margin)
            this.wrap.scrollLeft = center.x - margin;
        else if (center.x > right -  margin)
            this.wrap.scrollLeft = center.x + margin - width;
        else if (center.y < top + margin)
            this.wrap.scrollTop = center.y - margin;
        else if (center.y > bottom - margin)
            this.wrap.scrollTop = center.y + margin - height;
    }

    clear() {
        this.wrap.parentNode.removeChild(this.wrap);
    }

    obstacleAt(pos, size) {
        let xStart = Math.floor(pos.x);
        let yStart = Math.floor(pos.y);
        let xEnd   = Math.ceil(pos.x + size.x);
        let yEnd   = Math.ceil(pos.y + size.y);

        if (xStart < 0 || xEnd > this.width || yStart < 0)
            return "wall";
        if (yEnd > this.height)
            return "lava";
        for (let y = yStart; y < yEnd; y++) {
            for (let x = xStart; x < xEnd; x++) {
                let fieldType = this.grid[y][x];
                if (fieldType) return fieldType;
            }
        }
    }

    actorAt(actor) {
        for (let i = 0; i < this.actors.length; i++) {
            let other = this.actors[i];
            if (other != actor &&
                actor.pos.x + actor.size.x > other.pos.x &&
                actor.pos.x < other.pos.x + other.size.x &&
                actor.pos.y + actor.size.y > other.pos.y &&
                actor.pos.y < other.pos.y + other.size.y
                )
                return other;
        }
    }
}