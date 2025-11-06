const svg = document.getElementById('svg');
const panzoom = document.getElementById('panzoom');
const nodes = document.getElementById('nodes');
const overlay = document.getElementById('overlay');

let viewBox = { x: -400, y: -300, w: 1600, h: 900 };
function setView() { svg.setAttribute('viewBox', [viewBox.x, viewBox.y, viewBox.w, viewBox.h].join(' ')); }
setView();

let elements = {}; // {id,type,x,y,r,label,value}
let idCounter = 1;
let selected = null;
let wireMode = false;

function saveGraph() {
    commandInterface = document.getElementById('command');

    Object.entries(elements).forEach(([key,elm]) => {
        elm.buildUI(commandInterface);
    })
}

function toggleConnectMode() {
    wireButton = document.getElementById('wire');
    
    if (wireMode) {
        wireMode = false;
        wireButton.classList.remove('active')
    } else {
        wireButton.classList.add('active')
        wireMode = true;
    }

    highlightSelection();
}

function createNode(id,obj) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('node');
    g.setAttribute('transform', `translate(${obj.x} ${obj.y}) rotate(${obj.r || 0})`);
    g.dataset.id = id;
    g.dataset.type = obj.type;
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#sym-' + obj.type);
    g.appendChild(use);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', 0);
    label.setAttribute('y', 36);
    label.setAttribute('font-size', 10);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#9fbcd9');
    label.textContent = obj.name || '';
    g.appendChild(label);

    // selection bubble
    const sel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    sel.setAttribute('x', -60);
    sel.setAttribute('y', -40);
    sel.setAttribute('width', 120);
    sel.setAttribute('height', 80);
    sel.setAttribute('rx', 10);
    sel.setAttribute('fill', 'none');
    sel.setAttribute('stroke', '#7cc4ff');
    sel.setAttribute('stroke-width', 0.8);
    sel.style.display = 'none';
    g.appendChild(sel);

    // pointer interactions
    g.addEventListener('pointerdown', nodePointerDown);
    nodes.appendChild(g);
    return g;
}

function addElement(elm, x = 0, y = 0) {
    const id = 'n' + (idCounter++);
    elm.setCoords(x,y);
    elm.setName(id);

    elements[id] = elm;
    const node = createNode(id, elm);
    return elm;
}

// render nodes from elements
function render() {
    nodes.innerHTML = '';

    Object.entries(elements).forEach(([key,elm]) => {
        const n = createNode(key,elm);
        const txt = n.querySelector('text');
        txt.textContent = elm.label || '';
    })
}

// selection management
function selectById(id) {
    if (id === null) {
        selected = null;
    } else {
        selected = elements[id];
        selected.id = id;
    }
    // updatePropsPanel();
    highlightSelection();
}

function highlightSelection() {
    let connect = false;
    let connDir = 'inputs';
    let connType = 'bool';

    if (selected && wireMode) {
        let elc = elements[selected.id].connect;

        if (!elc[elc.actDir][elc.actNum].connected) {
            connect = true;
            connType = elc[elc.actDir][elc.actNum].type;

            if (elc.actDir === "inputs") connDir = 'outputs';
        }
    }

    nodes.querySelectorAll('.node').forEach(n => {
        const sel = n.querySelector('rect');
        if (!sel) return;

        if (!selected) {
            sel.style.display = 'none';
            return;
        }

        if (n.dataset.id === selected.id) {
            sel.style.display = 'block';
            sel.setAttribute('stroke','#BFCDE7')
        } else {
            if (connect) {
                sel.style.display = 'block';
                sel.setAttribute('stroke','#4CAF50')
            } else {
                sel.style.display = 'none';
            }
        }
    });
}

function updateNodeTransform() {
    if (!selected) return;
    const g = nodes.querySelector(`[data-id='${selected.id}']`);
    if (g) g.setAttribute('transform', `translate(${selected.x} ${selected.y}) rotate(${selected.r || 0})`);
}

// pointer drag for nodes
let pointerState = {
    dragging: false,
    start: { x: 0, y: 0 },
    node: null,
    orig: { x: 0, y: 0 }
};

function svgPoint(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM().inverse();
    const p = pt.matrixTransform(ctm);
    return p;
}

function nodePointerDown(e) {
    e.stopPropagation();
    this.setPointerCapture(e.pointerId);
    const id = this.dataset.id;
    const el = elements[id];
    selectById(id);
    pointerState.dragging = true;
    pointerState.node = el;
    pointerState.start = svgPoint(e);
    pointerState.orig = { x: el.x, y: el.y };
    this.addEventListener('pointermove', nodePointerMove);
    this.addEventListener('pointerup', nodePointerUp);
}

function nodePointerMove(e) {
    if (!pointerState.dragging) return;
    const p = svgPoint(e);
    const dx = p.x - pointerState.start.x, dy = p.y - pointerState.start.y;
    pointerState.node.x = pointerState.orig.x + dx;
    pointerState.node.y = pointerState.orig.y + dy;
    updateNodeTransform();
    // updatePropsPanel();
}

function nodePointerUp(e) {
    if (pointerState.node) {
        const n = nodes.querySelector(`[data-id='${pointerState.node.id}']`);
        try { n.removeEventListener('pointermove', nodePointerMove);
            n.removeEventListener('pointerup', nodePointerUp);
        } catch (e) { }
    }
    pointerState.dragging = false;
    pointerState.node = null;
}

// clicking blank deselects
svg.addEventListener('pointerdown', function (e) {
    if (e.target === svg || e.target === document.getElementById('grid')) {
        selectById(null);
    }

    // pan start when space pressed or middle button
    if (e.button === 1 || e.code === 'Space' || e.shiftKey || e.altKey) {
        startPan(e);
    }
});

// Pan & zoom
let panning = false;
let panStart = { x: 0, y: 0 };
let viewStart = { x: 0, y: 0 };

function startPan(e) {
    panning = true;
    panStart = svgPoint(e);
    viewStart = { x: viewBox.x, y: viewBox.y };
    document.addEventListener('pointermove', panMove);
    document.addEventListener('pointerup', endPan);
}

function panMove(e) { if (!panning) return;
    const p = svgPoint(e);
    const dx = p.x - panStart.x, dy = p.y - panStart.y;
    viewBox.x = viewStart.x - dx;
    viewBox.y = viewStart.y - dy;
    setView();
    // drawGrid();

}
function endPan(e) { panning = false;
    document.removeEventListener('pointermove', panMove);
    document.removeEventListener('pointerup', endPan);

}

// wheel zoom around mouse
svg.addEventListener('wheel', function (e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.12 : 0.88;
    const mouse = svgPoint(e);
    const newW = viewBox.w * delta;
    const newH = viewBox.h * delta;

    // keep mouse stable
    const mxRatio = (mouse.x - viewBox.x) / viewBox.w;
    const myRatio = (mouse.y - viewBox.y) / viewBox.h;
    viewBox.x = mouse.x - mxRatio * newW;
    viewBox.y = mouse.y - myRatio * newH;
    viewBox.w = newW;
    viewBox.h = newH;
    setView();
});

addElement(new uiButton(), -200, -40);
addElement(new uiLed(), -100, -40);

saveGraph();

toGraph();