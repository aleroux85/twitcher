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