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
            // L'appel à createPlayButton() a été définitivement supprimé ici
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

// La fonction createPlayButton() a été entièrement supprimée pour nettoyer l'écran

function createMobileConsole() {
    const consoleContainer = document.createElement('div');
    // On cache la console au démarrage
    consoleContainer.style.cssText = `
        display: none; 
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
        z-index: 9998;
        padding: 10px;
        box-sizing: border-box;
        border-top: 2px solid #3b82f6;
        pointer-events: auto; /* Réactivé pour pouvoir scroller avec le doigt */
    `;
    document.body.appendChild(consoleContainer);

    // Création du bouton pour afficher/masquer la console
    const btnToggle = document.createElement('button');
    btnToggle.innerHTML = '💻 Console';
    btnToggle.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 9999;
        padding: 10px 15px;
        background: #2ed573;
        color: white;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(btnToggle);

    // Logique de l'interrupteur
    btnToggle.addEventListener('click', () => {
        if (consoleContainer.style.display === 'none') {
            consoleContainer.style.display = 'block';
            consoleContainer.scrollTop = consoleContainer.scrollHeight; // Descend tout en bas à l'ouverture
        } else {
            consoleContainer.style.display = 'none';
        }
    });

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

// debut 3
// ==========================================
// SYSTÈME DE TRADUCTION (i18n)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Dictionnaire des langues
    const i18n = {
        fr: {
            start_subtitle: "Éditeur de jeux et prototypes 2D",
            start_new_project: "Nouveau Projet",
            start_btn_create: "Créer un Projet",
            start_existing_project: "Projet Existant",
            start_btn_import: "Ouvrir / Importer (.json)"
        },
        en: {
            start_subtitle: "2D Game and Prototype Editor",
            start_new_project: "New Project",
            start_btn_create: "Create Project",
            start_existing_project: "Existing Project",
            start_btn_import: "Open / Import (.json)"
        },
        es: {
            start_subtitle: "Editor de juegos y prototipos 2D",
            start_new_project: "Nuevo Proyecto",
            start_btn_create: "Crear Proyecto",
            start_existing_project: "Proyecto Existente",
            start_btn_import: "Abrir / Importar (.json)"
        },
        pt: {
            start_subtitle: "Editor de jogos e protótipos 2D",
            start_new_project: "Novo Projeto",
            start_btn_create: "Criar Projeto",
            start_existing_project: "Projeto Existente",
            start_btn_import: "Abrir / Importar (.json)"
        },
        ru: {
            start_subtitle: "Редактор 2D игр и прототипов",
            start_new_project: "Новый проект",
            start_btn_create: "Создать проект",
            start_existing_project: "Существующий проект",
            start_btn_import: "Открыть / Импортировать (.json)"
        }
    };

    const langSelector = document.getElementById('lang-selector');
    
    // 2. Fonction principale pour appliquer la langue
    function applyLanguage(lang) {
        if (!i18n[lang]) return;
        
        // Sauvegarde locale du choix
        localStorage.setItem('ludexa_lang', lang);
        if (langSelector) langSelector.value = lang;
        
        // Mise à jour de tous les éléments taggés avec data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18n[lang][key]) {
                el.textContent = i18n[lang][key];
            }
        });
        
        // Mise à jour de l'attribut HTML global
        document.documentElement.lang = lang;
    }

    // 3. Écouteur sur le menu déroulant
    if (langSelector) {
        langSelector.addEventListener('change', (e) => {
            applyLanguage(e.target.value);
        });
    }

    // 4. Initialisation au démarrage
    const savedLang = localStorage.getItem('ludexa_lang') || 'fr';
    applyLanguage(savedLang);
});
// fin 3
