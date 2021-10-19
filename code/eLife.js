let plan = ["############################",
            "#      #    #      o      ##",            
            "#                          #",            
            "#          #####           #",            
            "##         #   #    ##     #",            
            "###           ##     #     #",            
            "#           ###      #     #",            
            "#   ####                   #",            
            "#   ##       o             #",            
            "# o  #         o       ### #",            
            "#    #                     #",           
            "############################"];

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    plus(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }
}

class Grid {
    constructor(width, height) {
        this.space = new Array(width * height);
        this.width = width;
        this.height = height;
    }

    forEach(f) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let value = this.space[x + y * this.width];
                if (value != null)
                    f(value, new Vector(x, y));
            }
        }
    }

    inInside(vector) {
        return vector.x >= 0 && vector.x < this.width &&
               vector.y >= 0 && vector.y < this.height;
    }

    get(vector) {
        return this.space[vector.x + this.width * vector.y];
    }    

    set(vector, value) {
        this.space[vector.x + this.width * vector.y] = value;
    }
}

let directions = {
    "n":  new Vector( 0, -1),
    "ne": new Vector( 1, -1),
    "e":  new Vector( 1,  0),
    "se": new Vector( 1,  1),
    "s":  new Vector( 0,  1),
    "sw": new Vector(-1,  1),
    "w":  new Vector(-1,  0),
    "nw": new Vector(-1, -1),
}

//Может быть пихнуть в directions
function randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
}
//нужна в двух классах
function charFromElement(element) {
    if (element == null)
        return " ";
    else
        return element.originChar;
}

function elementFromChar(legend, ch) {
    if (ch == " ")
        return null;
    let element = new legend[ch]();
    element.originChar = ch;
    return element;
}

class BouncingCritter {
    constructor() {
        this.direction = randomElement(Object.keys(directions));
    }

    act(view) {
        if (view.look(this.direction) != " ")
            this.direction = view.find(" ") || "s";
        return {type: "move", direction: this.direction};
    }
}

class World {

    constructor(map, legend) {
        let grid = new Grid(map[0].length, map.length);
        this.grid = grid;
        this.legend = legend;

        map.forEach((line, y) => {
            for (let x = 0; x < line.length; x++)
                this.grid.set(new Vector(x, y),
                              elementFromChar(legend, line[x]));
        });        
    }

    turn() {
        let acted = [];
        this.grid.forEach((critter, vector) => {
            if (critter.act && acted.indexOf(critter) == -1) {
                acted.push(critter);
                this.letAct(critter, vector);
            }
        })
    }

    letAct(critter, vector) {
        let action = critter.act(new View(this, vector));
        if (action && action.type == "move") {
            let dest = this.checkDestination(action, vector);
            if (dest && this.grid.get(dest) == null) {
                this.grid.set(vector, null);
                this.grid.set(dest, critter);
            }
        }
    }

    checkDestination(action, vector) {
        if (directions.hasOwnProperty(action.direction)) {
            let dest = vector.plus(directions[action.direction]);
            if (this.grid.inInside(dest)) {
                return dest;
            }
        }
    }

    toString() {
        let output = "";
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                let element = this.grid.get(new Vector(x, y));
                output += charFromElement(element);
            }
            output += "\n";
        }
        return output;
    }
}

class View {

    constructor(world, vector) {
        this.world = world;
        this.vector = vector;
    }

    look(dir) {
        let target = this.vector.plus(directions[dir]);
        if (this.world.grid.inInside(target))
            return charFromElement(this.world.grid.get(target));
        else
            return "#";
    }

    findAll(ch) {
        let found = [];
        for (let dir in directions)
            if (this.look(dir) == ch)
                found.push(dir);
        return found;
    }

    find(ch) {
        let found = this.findAll(ch);
        if (found.length == 0) 
            return null;
        return randomElement(found);
    }
}

class Wall {

}

let directionNames = Object.keys(directions);

//Можно положить в класс
function dirPlus(dir, n) {
    let index = directionNames.indexOf(dir);
    return directionNames[(index + n + 8) % 8];
}

class WallFollower {

    constructor() {
        this.dir = "s";
    }

    act(view) {
        let start = this.dir;
        if (view.look(dirPlus(this.dir, -3)) != " ")
            start = this.dir = dirPlus(this.dir, -2);
        while (view.look(this.dir) != " ") {
            this.dir = dirPlus(this.dir, 1);
            if (this.dir == start) break;
        }
        return {type: "move", direction: this.dir};
    }
}

let actionTypes = Object.create(null);

actionTypes.grow = function(critter) {
    critter.energy += 0.5;
    return true;
}

actionTypes.move = function(critter, vector, action) {
    let dest = this.checkDestination(action, vector);
    if (dest == null ||
        critter.energy <= 1 ||
        this.grid.get(dest) != null)
        return false
    critter.energy -= 1;
    this.grid.set(vector, null);
    this.grid.set(dest, critter);
    return true;
}

actionTypes.eat = function(critter, vector, action) {
    let dest = this.checkDestination(action, vector);
    let atDest = dest != null && this.grid.get(dest);
    if (!atDest || atDest.energy == null)
        return false;
    critter.energy += atDest.energy;
    this.grid.set(dest, null);
    return true;
}

actionTypes.reproduce = function(critter, vector, action) {
    let baby = elementFromChar(this.legend, critter.originChar);
    let dest = this.checkDestination(action, vector);
    if (dest == null ||
        critter.energy <= 2 * baby.energy ||
        this.grid.get(dest) != null)
        return false;
    critter.energy -= 2 * baby.energy;
    this.grid.set(dest, baby);
    return true;
}

class Plant {
    constructor() {
        this.energy = 3 + Math.random() * 4;
    }

    act(context) {
        if (this.energy > 15) {
            let space = context.find(" ");
            if (space)
                return {type: "reproduce", direction: space};
        }
        if (this.energy < 20)
            return {type: "grow"};
    }
}

class PlantEater {
    constructor() {
        this.energy = 20;
    }

    act(context) {
        let space = context.find(" ");
        if (this.energy > 60 && space)
            return {type: "reproduce", direction: space};
        let plant = context.find("*");
        if (plant)
            return {type: "eat", direction: plant};
        if (space)
            return {type: "move", direction: space};
    }
}

class LikeLifeWorld extends World {
    constructor(map, legend) {
        super(map, legend);
    }

    letAct(critter, vector) {
        let action = critter.act(new View(this, vector));
        let handled = action &&
            action.type in actionTypes &&
            actionTypes[action.type].call(this, critter, vector, action);

        if (!handled) {
            critter.energy -= 0.2;
            if (critter.energy <= 0)
                this.grid.set(vector, null);
        }
    }
}

let valley = new LikeLifeWorld(  
    ["############################",   
     "#####                 ######",   
     "##   ***                **##",   
     "#   *##**         **  O  *##",   
     "#    ***     O    ##**    *#",   
     "#       O         ##***    #",   
     "#                 ##**     #",   
     "#   O       #*             #",   
     "#*          #**       O    #",   
     "#***        ##**    O    **#",   
     "##****     ###***       *###",   
     "############################"],  
     {"#": Wall,   
      "O": PlantEater,   
      "*": Plant}
);
