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

class uiButton extends uiComponents {
    constructor() {
        super("button");
        this.connect = {
            inputs:[],
            outputs:[
                {
                    type:"bool",
                    connected:null
                }
            ],
            actDir:"outputs",
            actNum:0
        };
    }

    buildUI(commandInterface) {
        const controlButton = document.createElement('div');
        controlButton.className = 'control-btn';
        // controlButton.setAttribute('onclick', `buttonClicked(event,${this.target}, 1)`);
        controlButton.innerHTML = `<div></div><button>${this.label}</button>`;
        commandInterface.appendChild(controlButton);
    }

    marhall() {
        this.speed = 0;
        console.log(`${this.brand} stopped.`);
    }
}

class uiLed extends uiComponents {
    constructor() {
        super("led");
        this.connect = {
            inputs:[
                {
                    type:"bool",
                    connected:null,
                    active:true
                }
            ],
            outputs:[],
            actDir:"inputs",
            actNum:0
        };
    }

    buildUI(commandInterface) {}

    marhall() {
        this.speed = 0;
        console.log(`${this.brand} stopped.`);
    }
}
