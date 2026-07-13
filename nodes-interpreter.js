// debut 1
function evaluateDataNode(engine, nodeId, pinName, context) {
    const node = engine.bpNodes.find(n => n.id === nodeId);
    if (!node) return 0;
    
    const sceneObj = engine.objects.find(o => node.title.trim() === o.name.trim());
    if (sceneObj) return sceneObj;
    
    const getLocalField = (name) => {
        const inConn = engine.bpConnections.find(c => c.toNode === node.id && c.toPin.trim() === name.trim());
        if (inConn) return evaluateDataNode(engine, inConn.fromNode, inConn.fromPin, context);
        
        const field = node.fields?.find(f => f.name.trim() === name.trim());
        if (!field) return 0;

        let val = field.value;

        try {
            let evalString = val;
            for (const [vName, vVal] of Object.entries(engine.gameVariables)) {
                const replacement = typeof vVal === 'string' ? `"${vVal}"` : vVal;
                evalString = evalString.replace(new RegExp(`\\b${vName}\\b`, 'g'), replacement);
            }
            return Function(`"use strict"; return (${evalString})`)();
        } 
        catch (e) {
            // CORRECTION : Tolère le texte brut s'il ne peut pas être évalué mathématiquement
            return val;
        }
    };

    switch (node.title.trim()) {
        case "Nombre Aléatoire 🎲": return Math.random() * (getLocalField("Max") - getLocalField("Min")) + getLocalField("Min");
        case "Opération 🧮": return getLocalField("A") + getLocalField("B");
        case "Comparer ⚖️":
            const a = getLocalField("A"), b = getLocalField("B");
            if (pinName.trim() === "A > B") return a > b;
            if (pinName.trim() === "A < B") return a < b;
            if (pinName.trim() === "A == B") return a === b;
            return false;
        case "Lire Variable 📖": return engine.gameVariables[node.fields?.find(f => f.name === "Nom")?.value] || 0;
        
        case "Position Doigt 👆":
            if (pinName.trim() === "X") return engine.playTouchX || 0;
            if (pinName.trim() === "Y") return engine.playTouchY || 0;
            return 0;
            
        default: return 0;
    }
}
// fin 1
// debut 2
function evaluateNode(engine, node, context) {
    const getInputValue = (pinName) => {
        const inConn = engine.bpConnections.find(c => c.toNode === node.id && c.toPin.trim() === pinName.trim());
        if (inConn) return evaluateDataNode(engine, inConn.fromNode, inConn.fromPin, context);
        
        if (!node.fields) return 0;
        const field = node.fields.find(f => f.name.trim() === pinName.trim());
        if (!field) return 0;
        
        let val = field.value;
        
        try {
            let evalString = val;
            for (const [vName, vVal] of Object.entries(engine.gameVariables)) {
                const replacement = typeof vVal === 'string' ? `"${vVal}"` : vVal;
                evalString = evalString.replace(new RegExp(`\\b${vName}\\b`, 'g'), replacement);
            }
            return Function(`"use strict"; return (${evalString})`)();
        } 
        catch (e) {
            // CORRECTION : Idem pour les paramètres d'action
            return val; 
        } 
    };

    const target = getInputValue("Cible") || context.target;

    switch (node.title.trim()) {
        case "Déplacer ➡️":
            if (target) {
                const dt = context.deltaTime || 0.016;
                target.x += getInputValue("Vitesse X") * dt;
                target.y += getInputValue("Vitesse Y") * dt;
            }
            break;
        case "Définir Position 📍":
            if (target) {
                target.x = parseFloat(getInputValue("X"));
                target.y = parseFloat(getInputValue("Y"));
            }
            break;
        case "Tourner 🔄":
            if (target) target.angle = (target.angle || 0) + (parseFloat(getInputValue("Angle")) * (context.deltaTime || 0.016));
            break;
        case "Changer Taille 📏":
            if (target) {
                if (target.type === 'circle') target.r *= parseFloat(getInputValue("Échelle X"));
                else { target.w *= parseFloat(getInputValue("Échelle X")); target.h *= parseFloat(getInputValue("Échelle Y")); }
            }
            break;
        case "Détruire l'objet 🗑️":
            if (target) {
                const index = engine.objects.findIndex(o => o.id === target.id);
                if (index !== -1) engine.objects.splice(index, 1);
            }
            break;

        case "Modifier Texte ✍️":
            if (target) {
                target.text = getInputValue("Nouveau Texte");
            }
            break;
        case "Taille du Texte 📏":
            if (target) target.fontSize = parseFloat(getInputValue("Taille (px)"));
            break;
        case "Couleur (Hex) 🎨":
            if (target) target.color = getInputValue("Couleur");
            break;
        case "Transparence 👻":
            if (target) target.opacity = Math.max(0, Math.min(1, parseFloat(getInputValue("Opacité (0 à 1)"))));
            break;

        case "Filtre: Sépia 🎞️": if (target) target.filter = 'sepia(100%)'; break;
        case "Filtre: Niveaux de gris 🌑": if (target) target.filter = 'grayscale(100%)'; break;
        case "Filtre: Inverser 🌈": if (target) target.filter = 'invert(100%)'; break;
        case "Retirer Filtres 🚫": if (target) target.filter = 'none'; break;
// fin 2
// debut 3
        case "Commencer à Glisser 🖐️":
            if (target) {
                engine.draggedGameObjects = engine.draggedGameObjects || [];
                target.dragOffsetX = engine.playTouchX - target.x;
                target.dragOffsetY = engine.playTouchY - target.y;
                if (!engine.draggedGameObjects.includes(target)) {
                    engine.draggedGameObjects.push(target);
                }
            }
            break;
            
        case "Arrêter de Glisser 🛑":
            if (target) {
                if (engine.draggedGameObjects) {
                    engine.draggedGameObjects = engine.draggedGameObjects.filter(o => o.id !== target.id);
                }
            } else {
                engine.draggedGameObjects = [];
            }
            break;

        case "Afficher / Cacher 👁️":
            if (target) target.visible = Boolean(getInputValue("Visible (Vrai/Faux)"));
            break;
            
        case "Définir Z-Index ↕️":
            if (target) target.zIndex = parseInt(getInputValue("Valeur")) || 0;
            break;
            
        case "Changer de Scène 🎬":
            const sceneName = getInputValue("Nom de la scène");
            if (engine.sm.scenes[sceneName]) {
                engine.sm.currentSceneId = sceneName;
                engine.initialState = JSON.parse(JSON.stringify(engine.sm.objects));
                engine.triggerEvent("Au démarrage"); 
            }
            return false;
            
        case "Superposer Scène (HUD) 🖼️":
            const hudName = getInputValue("Nom de la scène");
            if (engine.sm.scenes[hudName]) {
                const isAlreadyHUD = engine.objects.some(o => o.isHUD && o.hudSource === hudName);
                if (!isAlreadyHUD) {
                    const hudObjects = JSON.parse(JSON.stringify(engine.sm.scenes[hudName]));
                    hudObjects.forEach(obj => {
                        obj.zIndex = (obj.zIndex || 0) + 10000; 
                        obj.isHUD = true; 
                        obj.hudSource = hudName; 
                        engine.sm.objects.push(obj); 
                    });
                }
            }
            break;

        case "Fermer le HUD 🚫":
            for (let i = engine.objects.length - 1; i >= 0; i--) {
                if (engine.objects[i].isHUD) engine.objects.splice(i, 1);
            }
            break;

        case "Afficher Message 💬": console.log("[Blueprint Message] :", getInputValue("Texte")); break;
        case "Jouer un Son 🎵": console.log("[Blueprint Audio] Lecture du son :", getInputValue("Nom du Son")); break;
        case "Définir Variable ✍️":
            const varNameField = node.fields?.find(f => f.name === "Nom");
            if (varNameField) engine.gameVariables[varNameField.value] = getInputValue("Valeur");
            break;

        case "Condition Si (If) 🔀":
            if (getInputValue("Condition (Vrai/Faux)")) engine.executeNextNodes(node, "Si Vrai", context);
            else engine.executeNextNodes(node, "Si Faux", context);
            return false; 
            
        case "Attendre (Délai) ⏱️":
            const delayMs = parseFloat(getInputValue("Secondes")) * 1000;
            setTimeout(() => { if (engine.isPlaying) engine.executeNextNodes(node, "Suite", context); }, delayMs);
            return false; 
            
        case "Boucle (Répéter) 🔄":
            const count = parseInt(getInputValue("Nombre de fois")) || 1;
            for (let i = 0; i < count; i++) {
                engine.executeNextNodes(node, "Boucle", context);
            }
            engine.executeNextNodes(node, "Terminé", context);
            return false; 
            
        case "Flip-Flop 🔀":
            engine.flipFlopStates = engine.flipFlopStates || {};
            const isB = engine.flipFlopStates[node.id];
            engine.flipFlopStates[node.id] = !isB;
            
            if (isB) engine.executeNextNodes(node, "Sortie B", context);
            else engine.executeNextNodes(node, "Sortie A", context);
            return false;
    }
    return true; 
}

window.NodesInterpreter = { evaluateDataNode, evaluateNode };
// fin 3
 
