class uiComponents {
    constructor(type,x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.r = 0;
        this.id = 'n' + (idCounter++);
        this.name = this.id;
        this.label = type.toUpperCase();
        this.inputs = [];
        this.outputs = [];
        this.actDir = null;
        this.actNum = null;
        this.marked = false;

        elements[this.id] = this;
    }

    setCoords(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

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

    setWireAngle(r) {
        this[this.actDir][this.actNum].r = r;
        this[this.actDir][this.actNum].x = 50*Math.cos(r);
        this[this.actDir][this.actNum].y = 50*Math.sin(r);
    }

    wireCoords(r = 0) {
        const a = this[this.actDir][this.actNum];
        return [this.x + a.x, this.y - a.y];
    }

    setWire(conn,elm) {
        this[this.actDir][this.actNum].connected = conn;
        this[this.actDir][this.actNum].elm = elm;
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
        this.inputs.forEach(input => {
            const d = input.elm.children[0].getAttribute('d');
            const match = d.match(/M\s*([-\d.]+)[ ,]+([-\d.]+)/);
            if (!match) return;
            const a = match[1];
            const b = match[2];
            const [x, y] = this.wireCoords();
            input.elm.children[0].setAttribute('d', `M ${a} ${b} L ${x} ${y}`);
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

/* {{button-js}} */

/* {{led-js}} */