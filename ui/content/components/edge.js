class gEdge {
    constructor(n1, n2) {
        this.id = idEdgeCounter++;
        this.name = 'n' + this.id;

        if (n1.actDir === "inputs") {
            [n1,n2] = [n2,n1];
        }

        this.start.node = n1;
        this.end.node = n2;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        this.start.angle = Math.atan2(-dy,dx);
        this.end.angle = this.sAngle+Math.PI;

        n1.AddEgde(this);

        gEdges.push(this);
    }

    drawEdge(x, y) {
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

        nodes.insertBefore(g,nodes.children[0]);
    }

    wireCoords(n) {
        const [nx,ny] = n.node.coords();

        return [
            nx + 50*Math.cos(n.angle),
            ny - 50*Math.sin(n.angle),
            nx + 100*Math.cos(n.angle),
            ny - 100*Math.sin(n.angle)
        ]
    }
}