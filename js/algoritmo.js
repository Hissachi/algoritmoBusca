// Algoritmo de Busca em Largura
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

// Algoritmo de Busca em Profundidade
function buscaEmProfundidade(inicio, objetivo) {
    const pilha = [[inicio]];
    const visitados = new Set([inicio]);
    
    while (pilha.length > 0) {
        const caminho = pilha.pop();
        const no = caminho[caminho.length - 1];
        
        if (no === objetivo) {
            return caminho;
        }
        
        for (const vizinho of obterVizinhos(no)) {
            if (!visitados.has(vizinho)) {
                visitados.add(vizinho);
                pilha.push([...caminho, vizinho]);
            }
        }
    }
    return null;
}

// Busca em Profundidade Limitada
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

// Busca em Aprofundamento Iterativo
function buscaAprofundamentoIterativo(inicio, objetivo, profundidadeMaxima) {
    for (let profundidade = 1; profundidade <= profundidadeMaxima; profundidade++) {
        const resultado = buscaProfundidadeLimitada(inicio, objetivo, profundidade);
        if (resultado) {
            return resultado;
        }
    }
    return null;
}

// Busca Bidirecional
function buscaBidirecional(inicio, objetivo) {
    const filaInicio = [[inicio]];
    const visitadosInicio = new Set([inicio]);
    const filaObjetivo = [[objetivo]];
    const visitadosObjetivo = new Set([objetivo]);
    
    while (filaInicio.length > 0 && filaObjetivo.length > 0) {
        // Busca a partir do início
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
        
        // Busca a partir do objetivo
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