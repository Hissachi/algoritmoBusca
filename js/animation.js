// Desenha o grafo com hierarquia de cores
function drawGraph() {
    svg.selectAll("*").remove();
    
    // Desenha as arestas com prioridade para o caminho final
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
    
    // Desenha os nós com hierarquia de cores clara
    svg.selectAll(".node")
        .data(grafo.nodes)
        .enter().append("circle")
        .attr("class", "node") // Classe base para todos os nós
        .attr("r", 18)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => {
            // Hierarquia de cores:
            // 1. Nó final (vermelho) - máxima prioridade
            if (d.id === document.getElementById("end-node").value) return "var(--end-node)";
            // 2. Nó inicial (verde) - segunda prioridade
            if (d.id === document.getElementById("start-node").value) return "var(--start-node)";
            // 3. Caminho final (laranja)
            if (finalPathNodes.has(d.id)) return "var(--path-node)";
            // 4. Nós visitados (roxo)
            if (visitedNodes.has(d.id)) return "var(--visited-node)";
            // 5. Fronteira (amarelo)
            if (frontierNodes.has(d.id)) return "var(--frontier-node)";
            // 6. Nó normal (azul)
            return "var(--node-fill)";
        })
        .attr("stroke", d => {
            // Aplica a mesma lógica para a borda
            if (d.id === document.getElementById("end-node").value) return "var(--end-node)";
            if (d.id === document.getElementById("start-node").value) return "var(--start-node)";
            if (finalPathNodes.has(d.id)) return "var(--path-node)";
            return "var(--node-stroke)";
        });
    
    // Rótulos dos nós
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

// Geração de passos de animação - Versão unificada para todos os algoritmos
function gerarPassosAnimacao(inicio, objetivo, algoritmo, limite = 3) {
    const passos = [];
    visitedNodes = new Set();
    frontierNodes = new Set();
    exploringLinks = new Set();
    finalPathNodes = new Set();
    finalPathLinks = new Set();

    // Passo inicial: mostrar apenas o nó inicial na fronteira
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

// Executa a animação passo a passo
function executarAnimacao(passos) {
    clearInterval(animationInterval);
    currentStep = 0;
    animationSteps = passos;
    
    const speed = parseInt(document.getElementById("speed").value);
    
    // Executa o primeiro passo com um pequeno atraso adicional
    if (animationSteps.length > 0) {
        setTimeout(() => {
            executarPasso(animationSteps[0]);
            currentStep++;
            
            // Continua com os demais passos
            animationInterval = setInterval(() => {
                if (currentStep >= animationSteps.length) {
                    clearInterval(animationInterval);
                    return;
                }
                
                executarPasso(animationSteps[currentStep]);
                currentStep++;
            }, speed);
        }, 500); // 500ms de atraso inicial
    }
}

// Executa um passo individual da animação
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