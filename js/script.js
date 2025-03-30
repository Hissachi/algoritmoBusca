// Configurações de visualização
const width = document.getElementById('graph-container').clientWidth;
const height = 600;

const svg = d3.select("#graph-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Variáveis para controle da animação
let animationSteps = [];
let currentStep = 0;
let animationInterval;
let visitedNodes = new Set();
let frontierNodes = new Set();
let exploringLinks = new Set();
let finalPathNodes = new Set();
let finalPathLinks = new Set();

// Funções auxiliares
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

// Implementações específicas para cada algoritmo
function gerarPassosBFS(inicio, objetivo, passos) {
    const fila = [[inicio]];
    const visitados = new Set([inicio]);
    
    while (fila.length > 0) {
        const caminho = fila[0];
        const no = caminho[caminho.length - 1];
        
        // Passo: visitar o nó
        passos.push({ 
            type: "visit", 
            node: no,
            path: [...caminho],
            frontier: [...fila].map(p => p[p.length - 1])
        });
        
        if (no === objetivo) {
            passos.push({ type: "found", path: caminho });
            break;
        }
        
        fila.shift();
        
        for (const vizinho of obterVizinhos(no)) {
            if (!visitados.has(vizinho)) {
                // Passo: explorar aresta
                passos.push({
                    type: "explore-edge",
                    from: no,
                    to: vizinho,
                    frontier: [...fila].map(p => p[p.length - 1])
                });
                
                visitados.add(vizinho);
                const novoCaminho = [...caminho, vizinho];
                fila.push(novoCaminho);
                
                // Passo: adicionar à fronteira
                passos.push({
                    type: "add-frontier",
                    node: vizinho,
                    frontier: [...fila].map(p => p[p.length - 1])
                });
            }
        }
    }
}

function gerarPassosDFS(inicio, objetivo, passos) {
    const visitados = new Set();
    const caminho = [];
    let melhorCaminho = null;

    function dfs(no) {
        visitados.add(no);
        caminho.push(no);

        // Passo: visitar o nó
        passos.push({
            type: "visit",
            node: no,
            path: [...caminho],
            frontier: [...visitados]
        });

        if (no === objetivo) {
            // Atualiza o melhor caminho se encontrar um mais curto
            if (!melhorCaminho || caminho.length < melhorCaminho.length) {
                melhorCaminho = [...caminho];
                
                // Adiciona passo "found" temporário (será atualizado se encontrar um caminho melhor depois)
                const foundStepIndex = passos.findIndex(step => step.type === "found-temp");
                if (foundStepIndex >= 0) {
                    passos[foundStepIndex] = { 
                        type: "found-temp", 
                        path: [...melhorCaminho] 
                    };
                } else {
                    passos.push({ 
                        type: "found-temp", 
                        path: [...melhorCaminho] 
                    });
                }
            }
        } else {
            // Explora vizinhos em ordem (a menos que queira priorizar algum)
            for (const vizinho of obterVizinhos(no)) {
                if (!visitados.has(vizinho)) {
                    // Passo: explorar aresta
                    passos.push({
                        type: "explore-edge",
                        from: no,
                        to: vizinho,
                        frontier: [...visitados]
                    });

                    dfs(vizinho);
                }
            }
        }

        // Backtrack
        caminho.pop();
        visitados.delete(no);
    }

    // Passo inicial
    passos.push({
        type: "initialize",
        node: inicio,
        frontier: [inicio]
    });

    dfs(inicio);

    // Substitui o passo "found-temp" pelo definitivo no final
    const tempIndex = passos.findIndex(step => step.type === "found-temp");
    if (tempIndex >= 0 && melhorCaminho) {
        passos[tempIndex] = { 
            type: "found", 
            path: [...melhorCaminho] 
        };
    } else {
        passos.push({
            type: "not-found",
            message: "Caminho não encontrado"
        });
    }
}

function gerarPassosDLS(inicio, objetivo, limite, passos) {
    const pilha = [[inicio, limite, [inicio]]];
    const visitados = new Set([inicio]);
    
    while (pilha.length > 0) {
        const [no, profundidade, caminho] = pilha.pop();
        
        // Passo: visitar o nó
        passos.push({
            type: "visit",
            node: no,
            path: [...caminho],
            depth: profundidade,
            frontier: pilha.map(([n]) => n)
        });
        
        if (no === objetivo) {
            passos.push({ type: "found", path: caminho });
            break;
        }
        
        if (profundidade <= 0) continue;
        
        const vizinhos = obterVizinhos(no);
        for (const vizinho of vizinhos) {
            if (!visitados.has(vizinho)) {
                // Passo: explorar aresta
                passos.push({
                    type: "explore-edge",
                    from: no,
                    to: vizinho,
                    frontier: pilha.map(([n]) => n)
                });
                
                visitados.add(vizinho);
                pilha.push([vizinho, profundidade - 1, [...caminho, vizinho]]);
                
                // Passo: adicionar à fronteira
                passos.push({
                    type: "add-frontier",
                    node: vizinho,
                    frontier: pilha.map(([n]) => n)
                });
            }
        }
    }
}

function gerarPassosIDS(inicio, objetivo, limite, passos) {
    for (let profundidade = 1; profundidade <= limite; profundidade++) {
        const pilha = [[inicio, profundidade, [inicio]]];
        const visitados = new Set([inicio]);
        
        passos.push({ type: "new-iteration", depth: profundidade });
        
        while (pilha.length > 0) {
            const [no, profundidadeAtual, caminho] = pilha.pop();
            
            // Passo: visitar o nó
            passos.push({
                type: "visit",
                node: no,
                path: [...caminho],
                depth: profundidadeAtual,
                frontier: pilha.map(([n]) => n)
            });
            
            if (no === objetivo) {
                passos.push({ type: "found", path: caminho });
                break;
            }
            
            if (profundidadeAtual <= 0) continue;
            
            const vizinhos = obterVizinhos(no);
            for (const vizinho of vizinhos) {
                if (!visitados.has(vizinho)) {
                    // Passo: explorar aresta
                    passos.push({
                        type: "explore-edge",
                        from: no,
                        to: vizinho,
                        frontier: pilha.map(([n]) => n)
                    });
                    
                    visitados.add(vizinho);
                    pilha.push([vizinho, profundidadeAtual - 1, [...caminho, vizinho]]);
                    
                    // Passo: adicionar à fronteira
                    passos.push({
                        type: "add-frontier",
                        node: vizinho,
                        frontier: pilha.map(([n]) => n)
                    });
                }
            }
        }
        if (passos.some(step => step.type === "found")) break;
    }
}

function gerarPassosBidirecional(inicio, objetivo, passos) {
    const filaInicio = [[inicio]];
    const visitadosInicio = new Set([inicio]);
    const filaObjetivo = [[objetivo]];
    const visitadosObjetivo = new Set([objetivo]);
    
    while (filaInicio.length > 0 && filaObjetivo.length > 0) {
        // Busca a partir do início
        const caminhoInicio = filaInicio[0];
        const noInicio = caminhoInicio[caminhoInicio.length - 1];
        
        // Passo: visitar nó do início
        passos.push({
            type: "visit-start",
            node: noInicio,
            path: [...caminhoInicio],
            frontierStart: [...filaInicio].map(p => p[p.length - 1]),
            frontierEnd: [...filaObjetivo].map(p => p[p.length - 1])
        });
        
        if (visitadosObjetivo.has(noInicio)) {
            const caminhoObjetivo = encontrarCaminhoParaNo(filaObjetivo, noInicio);
            const caminhoCompleto = [...caminhoInicio, ...caminhoObjetivo.reverse().slice(1)];
            passos.push({ type: "found", path: caminhoCompleto });
            break;
        }
        
        filaInicio.shift();
        
        for (const vizinho of obterVizinhos(noInicio)) {
            if (!visitadosInicio.has(vizinho)) {
                // Passo: explorar aresta do início
                passos.push({
                    type: "explore-edge-start",
                    from: noInicio,
                    to: vizinho,
                    frontierStart: [...filaInicio].map(p => p[p.length - 1]),
                    frontierEnd: [...filaObjetivo].map(p => p[p.length - 1])
                });
                
                visitadosInicio.add(vizinho);
                filaInicio.push([...caminhoInicio, vizinho]);
                
                // Passo: adicionar à fronteira do início
                passos.push({
                    type: "add-frontier-start",
                    node: vizinho,
                    frontierStart: [...filaInicio].map(p => p[p.length - 1]),
                    frontierEnd: [...filaObjetivo].map(p => p[p.length - 1])
                });
            }
        }
        
        // Busca a partir do objetivo
        const caminhoObjetivo = filaObjetivo[0];
        const noObjetivo = caminhoObjetivo[caminhoObjetivo.length - 1];
        
        // Passo: visitar nó do objetivo
        passos.push({
            type: "visit-end",
            node: noObjetivo,
            path: [...caminhoObjetivo],
            frontierStart: [...filaInicio].map(p => p[p.length - 1]),
            frontierEnd: [...filaObjetivo].map(p => p[p.length - 1])
        });
        
        if (visitadosInicio.has(noObjetivo)) {
            const caminhoInicio = encontrarCaminhoParaNo(filaInicio, noObjetivo);
            const caminhoCompleto = [...caminhoInicio, ...caminhoObjetivo.reverse().slice(1)];
            passos.push({ type: "found", path: caminhoCompleto });
            break;
        }
        
        filaObjetivo.shift();
        
        for (const vizinho of obterVizinhos(noObjetivo)) {
            if (!visitadosObjetivo.has(vizinho)) {
                // Passo: explorar aresta do objetivo
                passos.push({
                    type: "explore-edge-end",
                    from: noObjetivo,
                    to: vizinho,
                    frontierStart: [...filaInicio].map(p => p[p.length - 1]),
                    frontierEnd: [...filaObjetivo].map(p => p[p.length - 1])
                });
                
                visitadosObjetivo.add(vizinho);
                filaObjetivo.push([...caminhoObjetivo, vizinho]);
                
                // Passo: adicionar à fronteira do objetivo
                passos.push({
                    type: "add-frontier-end",
                    node: vizinho,
                    frontierStart: [...filaInicio].map(p => p[p.length - 1]),
                    frontierEnd: [...filaObjetivo].map(p => p[p.length - 1])
                });
            }
        }
    }
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

// Event Listeners
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

// Inicialização
drawGraph();