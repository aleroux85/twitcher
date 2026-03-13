class uiComponents {
    constructor(type,x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.r = 0;
        this.id = idCounter++;
        this.name = 'n' + this.id;
        this.label = type.toUpperCase();
        this.labelId = 0;
        this.inputs = [];
        this.outputs = [];
        this.actDir = null;
        this.actNum = null;
        this.marked = false;

        this.socket = socket;

        elements[this.name] = this;
    }

    setCoords(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    coords() {return [this.x, this.y]}

    setName(name) {
        this.name = name;
        this.id = name;
    }

    setLabel(label) {
        this.label = label;
    }

    highlight(s) {
        switch (s) {
            case 'select':
                this.marked = false;
                this.gElmHighlight.style.display = 'block';
                this.gElmHighlight.setAttribute('stroke','#BFCDE7')
                break;

            case 'mark':
                this.marked = true;
                this.gElmHighlight.style.display = 'block';
                this.gElmHighlight.setAttribute('stroke','#4CAF50')
                break;
        
            default:
                this.marked = false;
                this.gElmHighlight.style.display = 'none';
                break;
        }
    }

    

    addEdge(e) {
        this[this.actDir][this.actNum].connections = e;
    }

    nodePointerDown(e) {
        e.stopPropagation();
        // this.setPointerCapture(e.pointerId);
        // const id = this.dataset.id;
        // const el = elements[id];
        selectById(this.id);
        this.dragging = true;
        // pointerState.node = el;
        this.draggingStart = svgPoint(e);
        this.draggingOrig = { x: this.x, y: this.y };
        this.gElm.addEventListener('pointermove', (e) => this.nodePointerMove(e));
        this.gElm.addEventListener('pointerup', (e) => this.nodePointerUp(e));
    }

    nodePointerMove(e) {
        if (!this.dragging) return;
        const p = svgPoint(e);
        const dx = p.x - this.draggingStart.x, dy = p.y - this.draggingStart.y;
        this.x = this.draggingOrig.x + dx;
        this.y = this.draggingOrig.y + dy;
        // updateNodeTransform();
        this.gElm.setAttribute('transform', `translate(${this.x} ${this.y}) rotate(${this.r || 0})`);
        this.outputs.forEach(output => {
            const d = output.elm.children[0].getAttribute('d');
            const match = d.match(/C\s[-\d.]+,[-\d.]+\s([-\d.]+),([-\d.]+)\s([-\d.]+),([-\d.]+)/);
            if (!match) return;
            const [x, y, xh, yh] = this.wireCoords();
            output.elm.children[0].setAttribute('d', `M ${x},${y} C ${xh},${yh} ${match[1]},${match[2]} ${match[3]},${match[4]}`);
        });
        this.inputs.forEach(input => {
            const d = input.elm.children[0].getAttribute('d');
            const match = d.match(/M\s([-\d.]+),([-\d.]+)\sC\s([-\d.]+),([-\d.]+)/);
            if (!match) return;
            const [x, y, xh, yh] = this.wireCoords();
            input.elm.children[0].setAttribute('d', `M ${match[1]},${match[2]} C ${match[3]},${match[4]} ${xh},${yh} ${x},${y}`);
        });
        // updatePropsPanel();
    }

    nodePointerUp(e) {
        if (this.dragging) {
            try { this.gElm.removeEventListener('pointermove', this.nodePointerMove);
                this.gElm.removeEventListener('pointerup', this.nodePointerUp);
            } catch (e) { }
        }
        this.dragging = false;
    }
}