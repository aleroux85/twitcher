const testing = true;

const container = document.getElementById('container');
const bcSelect = document.getElementById('bcselect');
function toNetwork() {
    container.className = "network";
    bcSelect.className = "network";
};
function toCommand() {
    container.className = "command";
    bcSelect.className = "command";
}
function toGraph() {
    container.className = "graph";
    bcSelect.className = "graph";
}
function toSettings() {
    container.className = "settings";
    bcSelect.className = "settings";
}

toCommand()

/* {{network-js}} */

/* {{command-js}} */

/* {{components-js}} */

/* {{graph-js}} */