import { LudexaEngine } from './engine.js';

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.engine = new LudexaEngine();
        if (window.engine && typeof window.engine.resizeCanvas === 'function') {
            window.engine.resizeCanvas();
            window.engine.render();
        }
    }, 150);
});

