class gEdge {
    constructor(n1, n2) {
        this.id = idEdgeCounter++;
        this.name = 'n' + this.id;
        this.start = {};
        this.end = {};

        if (n1.actDir === "inputs") {
            [n1,n2] = [n2,n1];
        }

        this.start.node = n1;
        this.start.mvfunc = () => this.moveStart();
        this.start.handleDisplay = (display) => display?this.elm.children[1].classList.remove('hide'):this.elm.children[1].classList.add('hide');
        this.end.node = n2;
        this.end.mvfunc = () => this.moveEnd();
        this.end.handleDisplay = (display) => display?this.elm.children[2].classList.remove('hide'):this.elm.children[2].classList.add('hide');

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        this.start.angle = Math.atan2(-dy,dx);
        this.end.angle = this.start.angle+Math.PI;

        this.elm = this.drawEdge();

        n1.addEdge(this);
        n2.addEdge(this);

        gEdges.push(this);
    }

    drawEdge() {
        const nodes = document.getElementById('nodes');

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('edge');
        g.dataset.id = 'e'+this.id;
        g.dataset.type = 'wire';

        const [x1, y1, xh1, yh1] = this.wireCoords(this.start);
        const [x2, y2, xh2, yh2] = this.wireCoords(this.end);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1},${y1} C ${xh1},${yh1} ${xh2},${yh2} ${x2},${y2}`);
        path.setAttribute('stroke', '#BFCDE7');
        path.setAttribute('stroke-width', 1.8);
        path.setAttribute('fill', 'none');
        g.appendChild(path);

        const sHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        sHandle.setAttribute('cx', `${xh1}`);
        sHandle.setAttribute('cy', `${yh1}`);
        sHandle.setAttribute('r', `8`);
        sHandle.setAttribute('stroke', '#BFCDE7');
        sHandle.setAttribute('stroke-width', 0.8);
        sHandle.setAttribute('fill', '#BFCDE711');
        sHandle.classList.add('hide');
        sHandle.addEventListener('pointerdown', (e) => this.handlePointerDown(e,this.start));
        g.appendChild(sHandle);
        
        const eHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eHandle.setAttribute('cx', `${xh2}`);
        eHandle.setAttribute('cy', `${yh2}`);
        eHandle.setAttribute('r', `8`);
        eHandle.setAttribute('stroke', '#BFCDE7');
        eHandle.setAttribute('stroke-width', 0.8);
        eHandle.setAttribute('fill', '#BFCDE711');
        eHandle.classList.add('hide');
        eHandle.addEventListener('pointerdown', (e) => this.handlePointerDown(e,this.end));
        g.appendChild(eHandle);

        nodes.insertBefore(g,nodes.children[0]);
        return g;
    }

    handleDisplay(end, display) {

    }

    moveStart() {
        const d = this.elm.children[0].getAttribute('d');
        const match = d.match(/C\s[-\d.]+,[-\d.]+\s([-\d.]+),([-\d.]+)\s([-\d.]+),([-\d.]+)/);
        if (!match) return;
        const [x, y, xh, yh] = this.wireCoords(this.start);
        this.elm.children[0].setAttribute('d', `M ${x},${y} C ${xh},${yh} ${match[1]},${match[2]} ${match[3]},${match[4]}`);
        this.elm.children[1].setAttribute('cx', `${xh}`);
        this.elm.children[1].setAttribute('cy', `${yh}`);
    }
    
    moveEnd() {
        const d = this.elm.children[0].getAttribute('d');
        const match = d.match(/M\s([-\d.]+),([-\d.]+)\sC\s([-\d.]+),([-\d.]+)/);
        if (!match) return;
        const [x, y, xh, yh] = this.wireCoords(this.end);
        this.elm.children[0].setAttribute('d', `M ${match[1]},${match[2]} C ${match[3]},${match[4]} ${xh},${yh} ${x},${y}`);
        this.elm.children[2].setAttribute('cx', `${xh}`);
        this.elm.children[2].setAttribute('cy', `${yh}`);
    }

    wireCoords(n) {
        const [nx,ny] = n.node.coords();

        return [
            Math.round(10*(nx + 50*Math.cos(n.angle)))/10,
            Math.round(10*(ny - 50*Math.sin(n.angle)))/10,
            Math.round(10*(nx + 100*Math.cos(n.angle)))/10,
            Math.round(10*(ny - 100*Math.sin(n.angle)))/10
        ]
    }

    handlePointerDown(e,n) {
        e.stopPropagation();

        this.dragging = true;
        const c = n.node.coords();
        const p = svgPoint(e);
        const [dx,dy] = [p.x-c[0], p.y-c[1]];
        this.draggingStart = Math.atan2(-dy,dx);
        this.draggingOrig = n.angle;

        this._onPointerMove = (e) => this.handlePointerMove(e, n);
        this._onPointerUp = (e) => this.handlePointerUp(e, n);

        const svgElm = document.getElementById('svg');
        svgElm.addEventListener('pointermove', this._onPointerMove);
        svgElm.addEventListener('pointerup', this._onPointerUp);
    }

    handlePointerMove(e,n) {
        if (!this.dragging) return;
        const c = n.node.coords();
        const p = svgPoint(e);
        const [dx,dy] = [p.x-c[0], p.y-c[1]];
        n.angle = Math.atan2(-dy,dx);
        n.mvfunc();
    }

    handlePointerUp(e, n) {
        const svgElm = document.getElementById('svg');

        if (this.dragging) {
            svgElm.removeEventListener('pointermove', this._onPointerMove);
            svgElm.removeEventListener('pointerup', this._onPointerUp);
            delete this._onPointerMove;
            delete this._onPointerUp;
        }
        this.dragging = false;
    }
}