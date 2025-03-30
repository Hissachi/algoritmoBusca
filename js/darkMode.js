// Dark Mode
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('change', function() {
    document.body.classList.toggle('dark-mode', this.checked);
    drawGraph();
});

// Verifica preferência do sistema
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    themeToggle.checked = true;
    document.body.classList.add('dark-mode');
}

// Monitora mudanças no sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    themeToggle.checked = e.matches;
    document.body.classList.toggle('dark-mode', e.matches);
});