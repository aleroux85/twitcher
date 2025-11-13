class uiLed extends uiComponents {
    constructor(x = 0, y = 0) {
        super("led",x,y);
        this.inputs.push(
            {
                type:"bool",
                connected:null,
                active:true
            }
        );
        this.actDir = "inputs";
        this.actNum = 0;

        this.buildGraphElement();
    }

    buildGraphElement() {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('node');
        g.setAttribute('transform', `translate(${this.x} ${this.y}) rotate(${this.r || 0})`);
        g.innerHTML = `
            <rect x="-34" y="-18" width="68" height="36" rx="4" fill="#BFCDE740" stroke="#BFCDE7" stroke-width="1.5" />
            <text x="0" y="4" font-size="12" text-anchor="middle" fill="#BFCDE7">LED</text>
            <text x="0" y="36" font-size="10" text-anchor="middle" fill="#BFCDE7">${this.id}</text>
            <rect x="-60" y="-40" width="120" height="80" rx="10" fill="none" stroke="#BFCDE7" stroke-width="0.8" style="display:none"/>
        `
        g.addEventListener('pointerdown', (e) => this.nodePointerDown(e));
        nodes.appendChild(g);

        this.gElm = g;
        this.gElmHighlight = g.children[3];
    }

    buildUI(commandInterface) {}

    marhall() {
        this.speed = 0;
        console.log(`${this.brand} stopped.`);
    }
}