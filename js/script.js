const width = document.getElementById('graph-container').clientWidth;
const height = 600;

const svg = d3.select("#graph-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

function obterVizinhos(node) {
    return grafo.links
        .filter(link => link.source === node || link.target === node)
        .map(link => link.source === node ? link.target : link.source);
}

function encontrarCaminhoParaNo(fila, no) {
    for (const caminho of fila) {
        if (caminho[caminho.length - 1] === no) {
            return caminho;
        }
    }
    return null;
}

document.getElementById("algorithm").addEventListener("change", function() {
    const limitControl = document.getElementById("limit-control");
    if (this.value === "dls" || this.value === "ids") {
        limitControl.style.display = "flex";
    } else {
        limitControl.style.display = "none";
    }
});

document.getElementById("search-btn").addEventListener("click", function() {
    const inicio = document.getElementById("start-node").value;
    const objetivo = document.getElementById("end-node").value;
    const algoritmo = document.getElementById("algorithm").value;
    const limite = parseInt(document.getElementById("limit").value) || 3;
    
    if (inicio === objetivo) {
        document.getElementById("result").innerHTML = `
            <h3>Nós Iguais</h3>
            <p>O nó de origem e destino são o mesmo (${inicio})</p>
        `;
        return;
    }
    
    const passosAnimacao = gerarPassosAnimacao(inicio, objetivo, algoritmo, limite);
    executarAnimacao(passosAnimacao);
});

drawGraph();