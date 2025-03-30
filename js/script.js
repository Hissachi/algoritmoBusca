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