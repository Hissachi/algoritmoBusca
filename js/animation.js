let animationSteps = [];
let currentStep = 0;
let animationInterval;
let visitedNodes = new Set();
let frontierNodes = new Set();
let exploringLinks = new Set();
let finalPathNodes = new Set();
let finalPathLinks = new Set();

function drawGraph() {
    svg.selectAll("*").remove();
    
    svg.selectAll(".link")
        .data(grafo.links)
        .enter().append("line")
        .attr("class", d => {
            const linkId = `${d.source}-${d.target}`;
            if (finalPathLinks.has(linkId)) return "link path-link";
            if (exploringLinks.has(linkId)) return "link exploring-link";
            return "link";
        })
        .attr("x1", d => grafo.nodes.find(n => n.id === d.source).x)
        .attr("y1", d => grafo.nodes.find(n => n.id === d.source).y)
        .attr("x2", d => grafo.nodes.find(n => n.id === d.target).x)
        .attr("y2", d => grafo.nodes.find(n => n.id === d.target).y);
    
    svg.selectAll(".node")
        .data(grafo.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 18)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => {
            if (d.id === document.getElementById("end-node").value) return "var(--end-node)";
            if (d.id === document.getElementById("start-node").value) return "var(--start-node)";
            if (finalPathNodes.has(d.id)) return "var(--path-node)";
            if (visitedNodes.has(d.id)) return "var(--visited-node)";
            if (frontierNodes.has(d.id)) return "var(--frontier-node)";
            return "var(--node-fill)";
        })
        .attr("stroke", d => {
            if (d.id === document.getElementById("end-node").value) return "var(--end-node)";
            if (d.id === document.getElementById("start-node").value) return "var(--start-node)";
            if (finalPathNodes.has(d.id)) return "var(--path-node)";
            return "var(--node-stroke)";
        });
    
    svg.selectAll(".node-text")
        .data(grafo.nodes)
        .enter().append("text")
        .attr("class", "node-text")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .text(d => d.id);
}

function gerarPassosAnimacao(inicio, objetivo, algoritmo, limite = 3) {
    const passos = [];
    visitedNodes = new Set();
    frontierNodes = new Set();
    exploringLinks = new Set();
    finalPathNodes = new Set();
    finalPathLinks = new Set();

    passos.push({
        type: "initialize",
        node: inicio,
        frontier: [inicio]
    });

    if (algoritmo === "bfs") {
        gerarPassosBFS(inicio, objetivo, passos);
    } 
    else if (algoritmo === "dfs") {
        gerarPassosDFS(inicio, objetivo, passos);
    }
    else if (algoritmo === "dls") {
        gerarPassosDLS(inicio, objetivo, limite, passos);
    }
    else if (algoritmo === "ids") {
        gerarPassosIDS(inicio, objetivo, limite, passos);
    }
    else if (algoritmo === "bidirectional") {
        gerarPassosBidirecional(inicio, objetivo, passos);
    }
    
    return passos;
}

function executarAnimacao(passos) {
    clearInterval(animationInterval);
    currentStep = 0;
    animationSteps = passos;
    
    const speed = parseInt(document.getElementById("speed").value);
    
    if (animationSteps.length > 0) {
        setTimeout(() => {
            executarPasso(animationSteps[0]);
            currentStep++;
            
            animationInterval = setInterval(() => {
                if (currentStep >= animationSteps.length) {
                    clearInterval(animationInterval);
                    return;
                }
                
                executarPasso(animationSteps[currentStep]);
                currentStep++;
            }, speed);
        }, 500);
    }
}

function executarPasso(passo) {
    const resultDiv = document.getElementById("result");
    
    switch(passo.type) {
        case "initialize":
            visitedNodes = new Set();
            frontierNodes = new Set(passo.frontier || []);
            exploringLinks = new Set();
            resultDiv.innerHTML = `
                <h3>Inicializando busca</h3>
                <p>Preparando para começar a busca a partir do nó ${passo.node}</p>
            `;
            break;
            
        case "visit":
        case "visit-start":
        case "visit-end":
            visitedNodes.add(passo.node);
            frontierNodes = new Set([...(passo.frontier || []), ...(passo.frontierStart || []), ...(passo.frontierEnd || [])]);
            exploringLinks = new Set();
            resultDiv.innerHTML = `
                <h3>Visitando nó</h3>
                <p>Explorando o nó ${passo.node} e seus vizinhos</p>
            `;
            break;
            
        case "explore-edge":
        case "explore-edge-start":
        case "explore-edge-end":
            exploringLinks = new Set([`${passo.from}-${passo.to}`]);
            frontierNodes = new Set([...(passo.frontier || []), ...(passo.frontierStart || []), ...(passo.frontierEnd || [])]);
            resultDiv.innerHTML = `
                <h3>Explorando aresta</h3>
                <p>Analisando caminho de ${passo.from} para ${passo.to}</p>
            `;
            break;
            
        case "add-frontier":
        case "add-frontier-start":
        case "add-frontier-end":
            frontierNodes = new Set([...(passo.frontier || []), ...(passo.frontierStart || []), ...(passo.frontierEnd || [])]);
            exploringLinks = new Set();
            resultDiv.innerHTML = `
                <h3>Expandindo fronteira</h3>
                <p>Adicionando nó ${passo.node} à fronteira de busca</p>
            `;
            break;
            
        case "new-iteration":
            visitedNodes = new Set([document.getElementById("start-node").value]);
            frontierNodes = new Set([document.getElementById("start-node").value]);
            exploringLinks = new Set();
            resultDiv.innerHTML = `
                <h3>Nova Iteração</h3>
                <p>Iniciando busca com profundidade limite: ${passo.depth}</p>
            `;
            break;
            
        case "found":
            clearInterval(animationInterval);
            finalPathNodes = new Set(passo.path);
            finalPathLinks = new Set();
            for (let i = 0; i < passo.path.length - 1; i++) {
                finalPathLinks.add(`${passo.path[i]}-${passo.path[i+1]}`);
            }
            visitedNodes = new Set(passo.path);
            frontierNodes = new Set();
            exploringLinks = new Set();
            drawGraph();
            resultDiv.innerHTML = `
                <h3>Caminho Encontrado!</h3>
                <p><strong>Caminho:</strong> ${passo.path.join(" → ")}</p>
                <p><strong>Comprimento:</strong> ${passo.path.length - 1}</p>
            `;
            return;
                
        case "not-found":
            clearInterval(animationInterval);
            resultDiv.innerHTML = `
                <h3>Caminho Não Encontrado</h3>
                <p>${passo.message}</p>
            `;
            return;
    }
        
    drawGraph();
}