// debut 1
import { LudexaEngine } from './engine.js';

function demarrerSysteme() {
    try {
        window.engine = new LudexaEngine();
        
        // Initialisation du nom du projet en mémoire
        if (!window.engine.projectName) {
            window.engine.projectName = "Mon Projet";
        }
        
        if (window.engine && typeof window.engine.resizeCanvas === 'function') {
            window.engine.resizeCanvas();
            window.engine.render();
            
            createMobileConsole(); 
            createPlayButton();    
        }

        const btnNewProject = document.getElementById('btn-new-project');
        const startScreen = document.getElementById('start-screen');
        
        if (btnNewProject && startScreen) {
            btnNewProject.onclick = (e) => {
                e.preventDefault();
                startScreen.style.display = 'none'; 
                if (window.engine) window.engine.resizeCanvas();
                console.log("🚀 Nouveau projet créé ! Interface débloquée.");
            };
        }

        // --- CORRECTION : Sauvegarde et affichage du nom du projet ---
        const btnProjectSettings = document.getElementById('btn-project-settings');
        if (btnProjectSettings) {
            // Affiche le nom actuel au démarrage
            btnProjectSettings.textContent = "⚙️ " + window.engine.projectName;
            
            btnProjectSettings.onclick = (e) => {
                e.preventDefault();
                // Utilise le nom sauvegardé comme valeur par défaut
                const newName = prompt("Nouveau nom du projet :", window.engine.projectName);
                if(newName && newName.trim() !== "") {
                    window.engine.projectName = newName.trim();
                    btnProjectSettings.textContent = "⚙️ " + window.engine.projectName;
                    console.log("Nom du projet mis à jour : " + window.engine.projectName);
                }
            };
        }

    } catch (error) {
        console.error("❌ Erreur critique :", error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrerSysteme);
} else {
    demarrerSysteme();
}
// fin 1
// debut 2
function createPlayButton() {
    const btn = document.createElement('button');
    btn.id = 'btn-play-mode';
    btn.innerHTML = '▶️ PLAY';
    
    btn.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        color: white;
        background-color: #2ed573;
        border: 2px solid #27ae60;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        font-family: sans-serif;
        transition: all 0.2s ease;
    `;

    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
        if (window.engine.isPlaying) {
            window.engine.stopPlayMode();
            btn.innerHTML = '▶️ PLAY';
            btn.style.backgroundColor = '#2ed573';
            btn.style.borderColor = '#27ae60';
        } else {
            window.engine.startPlayMode();
            btn.innerHTML = '⏹️ STOP';
            btn.style.backgroundColor = '#ff4757';
            btn.style.borderColor = '#ff6b81';
        }
    });
}

function createMobileConsole() {
    const consoleContainer = document.createElement('div');
    consoleContainer.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 150px;
        background: rgba(0, 0, 0, 0.85);
        color: #00ff00;
        font-family: monospace;
        font-size: 13px;
        overflow-y: auto;
        z-index: 9999;
        padding: 10px;
        box-sizing: border-box;
        border-top: 2px solid #3b82f6;
        pointer-events: none;
    `;
    document.body.appendChild(consoleContainer);

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    function addLog(msg, color) {
        const line = document.createElement('div');
        line.style.color = color;
        line.style.marginBottom = '6px';
        line.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        line.style.paddingBottom = '4px';
        
        let cleanMsg = typeof msg === 'string' ? msg.replace(/%c/g, '') : msg;
        line.textContent = cleanMsg;
        consoleContainer.appendChild(line);
        consoleContainer.scrollTop = consoleContainer.scrollHeight; 
    }

    console.log = function(...args) {
        originalLog.apply(console, args);
        addLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), '#a0aec0');
    };

    console.warn = function(...args) {
        originalWarn.apply(console, args);
        addLog('⚠️ ' + args.join(' '), '#f1c40f');
    };

    console.error = function(...args) {
        originalError.apply(console, args);
        addLog('❌ ' + args.join(' '), '#ff4757');
    };
    
    console.log("📱 Console mobile de débogage activée.");
}
// fin 2

