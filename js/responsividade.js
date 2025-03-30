function handleResize() {
    const width = document.getElementById('graph-container').clientWidth;
    svg.attr("width", width);
    drawGraph();
}

// Atualiza ao redimensionar a janela
window.addEventListener('resize', handleResize);

// Chama inicialmente
handleResize();