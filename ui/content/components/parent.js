class uiComponents {
    constructor(type) {
        this.type = type;
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.name = type.toUpperCase();
        this.label = type.toUpperCase();
    }

    setCoords(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    setName(name) {
        this.name = name;
    }

    setLabel(label) {
        this.label = label;
    }
}

/* {{button-js}} */

/* {{led-js}} */