function handleResize() {
    const width = document.getElementById('graph-container').clientWidth;
    svg.attr("width", width);
    drawGraph();
}

window.addEventListener('resize', handleResize);

handleResize();