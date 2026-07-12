import { LudexaEngine } from './engine.js';

// Injection chirurgicale basse : Chargement propre et synchrone avant l'UI
const blueprintScript = document.createElement('script');
blueprintScript.src = './blueprint.js';
document.head.appendChild(blueprintScript);

window.addEventListener('DOMContentLoaded', () => {
    // On attend un tout petit peu que le DOM et le script Blueprint se posent tranquillement
    setTimeout(() => {
        window.engine = new LudexaEngine();
        if (window.engine && typeof window.engine.resizeCanvas === 'function') {
            window.engine.resizeCanvas();
            window.engine.render();
        }
    }, 150);
});

