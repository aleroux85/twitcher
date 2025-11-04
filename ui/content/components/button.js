class uiButton {
    constructor(name) {
        this.name = name;
    }

    buildUI(commandInterface) {
        const controlButton = document.createElement('div');
        controlButton.className = 'control-btn';
        // controlButton.setAttribute('onclick', `buttonClicked(event,${this.target}, 1)`);
        controlButton.innerHTML = `<div></div><button>${this.name}</button>`;
        commandInterface.appendChild(controlButton);
    }

    marhall() {
        this.speed = 0;
        console.log(`${this.brand} stopped.`);
    }
}