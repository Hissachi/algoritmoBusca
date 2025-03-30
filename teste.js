const readline = require('readline');

class Grafo {
    constructor() {
        // Grafo pré-definido (mesmo do exemplo anterior)
        this.listaAdjacencia = new Map([
            ['A', ['B', 'C']],
            ['B', ['A', 'D']],
            ['C', ['A', 'E']],
            ['D', ['B', 'E', 'F']],
            ['E', ['C', 'D', 'F']],
            ['F', ['D', 'E']]
        ]);
    }

    obterVizinhos(no) {
        return this.listaAdjacencia.get(no) || [];
    }

    mostrarGrafo() {
        console.log("\nGrafo pré-definido:");
        for (const [no, vizinhos] of this.listaAdjacencia) {
            console.log(`${no} -> ${vizinhos.join(', ')}`);
        }
    }
}

// Implementações dos algoritmos de busca (manter as mesmas do código anterior)
function buscaEmLargura(grafo, inicio, objetivo) {
    const fila = [[inicio]];
    const visitados = new Set();
    visitados.add(inicio);

    while (fila.length > 0) {
        const caminho = fila.shift();
        const no = caminho[caminho.length - 1];

        if (no === objetivo) {
            return caminho;
        }

        for (const vizinho of grafo.obterVizinhos(no)) {
            if (!visitados.has(vizinho)) {
                visitados.add(vizinho);
                const novoCaminho = [...caminho, vizinho];
                fila.push(novoCaminho);
            }
        }
    }

    return null;
}

function buscaEmProfundidade(grafo, inicio, objetivo) {
    const pilha = [[inicio]];
    const visitados = new Set();
    visitados.add(inicio);

    while (pilha.length > 0) {
        const caminho = pilha.pop();
        const no = caminho[caminho.length - 1];

        if (no === objetivo) {
            return caminho;
        }

        for (const vizinho of grafo.obterVizinhos(no)) {
            if (!visitados.has(vizinho)) {
                visitados.add(vizinho);
                const novoCaminho = [...caminho, vizinho];
                pilha.push(novoCaminho);
            }
        }
    }

    return null;
}

function buscaProfundidadeLimitada(grafo, noAtual, objetivo, limite, visitados = new Set(), caminho = []) {
    if (noAtual === objetivo) {
        return [...caminho, noAtual];
    }

    if (limite <= 0) {
        return null;
    }

    visitados.add(noAtual);
    const novoCaminho = [...caminho, noAtual];

    for (const vizinho of grafo.obterVizinhos(noAtual)) {
        if (!visitados.has(vizinho)) {
            const resultado = buscaProfundidadeLimitada(
                grafo, vizinho, objetivo, limite - 1, new Set(visitados), novoCaminho
            );
            if (resultado) {
                return resultado;
            }
        }
    }

    return null;
}

function buscaAprofundamentoIterativo(grafo, inicio, objetivo, profundidadeMaxima) {
    for (let profundidade = 1; profundidade <= profundidadeMaxima; profundidade++) {
        const resultado = buscaProfundidadeLimitada(
            grafo, inicio, objetivo, profundidade, new Set(), []
        );
        if (resultado) {
            return resultado;
        }
    }
    return null;
}

function buscaBidirecional(grafo, inicio, objetivo) {
    const filaInicio = [[inicio]];
    const visitadosInicio = new Map();
    visitadosInicio.set(inicio, 0);
    
    const filaObjetivo = [[objetivo]];
    const visitadosObjetivo = new Map();
    visitadosObjetivo.set(objetivo, 0);
    
    while (filaInicio.length > 0 && filaObjetivo.length > 0) {
        const caminhoInicio = filaInicio.shift();
        const noInicio = caminhoInicio[caminhoInicio.length - 1];
        
        if (visitadosObjetivo.has(noInicio)) {
            const caminhoObjetivo = encontrarCaminhoParaNo(filaObjetivo, visitadosObjetivo, noInicio);
            return combinarCaminhos(caminhoInicio, caminhoObjetivo);
        }
        
        for (const vizinho of grafo.obterVizinhos(noInicio)) {
            if (!visitadosInicio.has(vizinho)) {
                visitadosInicio.set(vizinho, visitadosInicio.get(noInicio) + 1);
                filaInicio.push([...caminhoInicio, vizinho]);
            }
        }
        
        const caminhoObjetivo = filaObjetivo.shift();
        const noObjetivo = caminhoObjetivo[caminhoObjetivo.length - 1];
        
        if (visitadosInicio.has(noObjetivo)) {
            const caminhoInicio = encontrarCaminhoParaNo(filaInicio, visitadosInicio, noObjetivo);
            return combinarCaminhos(caminhoInicio, caminhoObjetivo);
        }
        
        for (const vizinho of grafo.obterVizinhos(noObjetivo)) {
            if (!visitadosObjetivo.has(vizinho)) {
                visitadosObjetivo.set(vizinho, visitadosObjetivo.get(noObjetivo) + 1);
                filaObjetivo.push([...caminhoObjetivo, vizinho]);
            }
        }
    }
    
    return null;
}

function encontrarCaminhoParaNo(fila, visitados, no) {
    for (const caminho of fila) {
        if (caminho[caminho.length - 1] === no) {
            return caminho;
        }
    }
    return null;
}

function combinarCaminhos(caminhoInicio, caminhoObjetivo) {
    const caminhoObjetivoInvertido = [...caminhoObjetivo].reverse().slice(1);
    return [...caminhoInicio, ...caminhoObjetivoInvertido];
}

// Função principal
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const grafo = new Grafo();
    let opcao = '';

    // Função para perguntar ao usuário
    const perguntar = (pergunta) => new Promise(resolve => rl.question(pergunta, resolve));

    console.log("Sistema de Buscas em Grafos com Grafo Pré-Definido");
    grafo.mostrarGrafo();

    while (opcao !== '0') {
        console.log(`
=== MENU ===
1. Executar buscas
0. Sair
`);
        opcao = await perguntar("Escolha uma opção: ");

        switch (opcao) {
            case '1':
                const origem = await perguntar("\nDigite o nó de origem (X): ");
                const destino = await perguntar("Digite o nó de destino (Y): ");
                const limite = await perguntar("Digite o limite de profundidade (Z): ");

                if (!grafo.listaAdjacencia.has(origem) || !grafo.listaAdjacencia.has(destino)) {
                    console.log("Erro: Nó de origem ou destino não existe no grafo!");
                    break;
                }

                console.log("\n=== RESULTADOS DAS BUSCAS ===");
                
                // Busca em Largura
                let resultado = buscaEmLargura(grafo, origem, destino);
                console.log("\nBusca em Largura:");
                console.log(resultado ? `Caminho: ${resultado.join(" → ")}` : "Caminho não encontrado");

                // Busca em Profundidade
                resultado = buscaEmProfundidade(grafo, origem, destino);
                console.log("\nBusca em Profundidade:");
                console.log(resultado ? `Caminho: ${resultado.join(" → ")}` : "Caminho não encontrado");

                // Busca em Profundidade Limitada
                resultado = buscaProfundidadeLimitada(grafo, origem, destino, parseInt(limite));
                console.log(`\nBusca em Profundidade Limitada (limite=${limite}):`);
                console.log(resultado ? `Caminho: ${resultado.join(" → ")}` : "Caminho não encontrado");

                // Busca em Aprofundamento Iterativo
                resultado = buscaAprofundamentoIterativo(grafo, origem, destino, parseInt(limite));
                console.log(`\nBusca em Aprofundamento Iterativo (profMax=${limite}):`);
                console.log(resultado ? `Caminho: ${resultado.join(" → ")}` : "Caminho não encontrado");

                // Busca Bidirecional
                resultado = buscaBidirecional(grafo, origem, destino);
                console.log("\nBusca Bidirecional:");
                console.log(resultado ? `Caminho: ${resultado.join(" → ")}` : "Caminho não encontrado");
                break;

            case '0':
                console.log("Saindo do programa...");
                break;

            default:
                console.log("Opção inválida!");
        }
    }

    rl.close();
}

// Iniciar o programa
main();