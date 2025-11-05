class uiLed extends uiComponents {
    constructor() {
        super("led");
    }

    buildUI(commandInterface) {}

    marhall() {
        this.speed = 0;
        console.log(`${this.brand} stopped.`);
    }
}