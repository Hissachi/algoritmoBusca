function buscaEmLargura(inicio, objetivo) {
    const fila = [[inicio]];
    const visitados = new Set([inicio]);
    
    while (fila.length > 0) {
        const caminho = fila.shift();
        const no = caminho[caminho.length - 1];
        
        if (no === objetivo) {
            return caminho;
        }
        
        for (const vizinho of obterVizinhos(no)) {
            if (!visitados.has(vizinho)) {
                visitados.add(vizinho);
                fila.push([...caminho, vizinho]);
            }
        }
    }
    return null;
}

function buscaEmProfundidade(inicio, objetivo) {
    let melhorCaminho = null;
    const visitados = new Set();

    function dfs(no, caminhoAtual) {
        visitados.add(no);
        caminhoAtual.push(no);

        if (no === objetivo) {
            if (!melhorCaminho || caminhoAtual.length < melhorCaminho.length) {
                melhorCaminho = [...caminhoAtual];
            }
        } else {
            for (const vizinho of obterVizinhos(no)) {
                if (!visitados.has(vizinho)) {
                    dfs(vizinho, caminhoAtual);
                }
            }
        }

        caminhoAtual.pop();
        visitados.delete(no);
    }

    dfs(inicio, []);
    return melhorCaminho;
}

function buscaProfundidadeLimitada(noAtual, objetivo, limite, caminho = [noAtual], visitados = new Set([noAtual])) {
    if (noAtual === objetivo) {
        return caminho;
    }

    if (limite <= 0) {
        return null;
    }

    for (const vizinho of obterVizinhos(noAtual)) {
        if (!visitados.has(vizinho)) {
            visitados.add(vizinho);
            const resultado = buscaProfundidadeLimitada(
                vizinho, objetivo, limite - 1, [...caminho, vizinho], new Set(visitados)
            );
            if (resultado) {
                return resultado;
            }
        }
    }
    return null;
}

function buscaAprofundamentoIterativo(inicio, objetivo, profundidadeMaxima) {
    for (let profundidade = 1; profundidade <= profundidadeMaxima; profundidade++) {
        const resultado = buscaProfundidadeLimitada(inicio, objetivo, profundidade);
        if (resultado) {
            return resultado;
        }
    }
    return null;
}

function buscaBidirecional(inicio, objetivo) {
    const filaInicio = [[inicio]];
    const visitadosInicio = new Set([inicio]);
    const filaObjetivo = [[objetivo]];
    const visitadosObjetivo = new Set([objetivo]);
    
    while (filaInicio.length > 0 && filaObjetivo.length > 0) {
        const caminhoInicio = filaInicio.shift();
        const noInicio = caminhoInicio[caminhoInicio.length - 1];
        
        if (visitadosObjetivo.has(noInicio)) {
            const caminhoObjetivo = encontrarCaminhoParaNo(filaObjetivo, noInicio);
            return [...caminhoInicio, ...caminhoObjetivo.reverse().slice(1)];
        }
        
        for (const vizinho of obterVizinhos(noInicio)) {
            if (!visitadosInicio.has(vizinho)) {
                visitadosInicio.add(vizinho);
                filaInicio.push([...caminhoInicio, vizinho]);
            }
        }

        const caminhoObjetivo = filaObjetivo.shift();
        const noObjetivo = caminhoObjetivo[caminhoObjetivo.length - 1];
        
        if (visitadosInicio.has(noObjetivo)) {
            const caminhoInicio = encontrarCaminhoParaNo(filaInicio, noObjetivo);
            return [...caminhoInicio, ...caminhoObjetivo.reverse().slice(1)];
        }
        
        for (const vizinho of obterVizinhos(noObjetivo)) {
            if (!visitadosObjetivo.has(vizinho)) {
                visitadosObjetivo.add(vizinho);
                filaObjetivo.push([...caminhoObjetivo, vizinho]);
            }
        }
    }
    return null;
}