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