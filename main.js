// debut 2
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
            
            // --- TEST DU SYSTEME BLUEPRINT ---
            
            // 1. On crée un objet de test sur la scène
            const testObject = window.engine.addObject('rect');
            testObject.x = 50; // On le place à gauche
            
            // 2. On crée un JSON Blueprint ciblant spécifiquement cet objet
            const mockBlueprintJSON = JSON.stringify({
                nodes: [
                    { id: 1, type: "OnStart", next: [2] },
                    { id: 2, type: "LogMessage", message: "Moteur Logique activé !" },
                    { id: 3, type: "OnUpdate", next: [4] },
                    { 
                        id: 4, 
                        type: "MoveObject", 
                        targetId: testObject.id, // On cible l'ID généré dynamiquement
                        speed: { x: 100, y: 0 } // Se déplace de 100 pixels vers la droite par seconde
                    }
                ]
            });

            // 3. On charge les données et on lance la simulation
            window.engine.loadBlueprint(mockBlueprintJSON);
            window.engine.startPlayMode();
        }
    }, 150);
});
// fin de 2

