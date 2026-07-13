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
            return val;
        }
    };

    switch (node.title.trim()) {
        case "En collision 💥":
            if (pinName.trim() === "Objet Touché") return context.hitObject || 0;
            return 0;
        case "Cloner un Objet 🐑":
            if (pinName.trim() === "Nouvel Objet") return context.lastClonedObject || 0;
            return 0;
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
            return val; 
        } 
    };

    const target = getInputValue("Cible") || context.target;

    switch (node.title.trim()) {
        case "Suivre Objet (Caméra) 🎥":
            if (target) {
                engine.cameraTarget = target;
                const s = parseFloat(getInputValue("Douceur (0 à 1)"));
                engine.cameraLerp = isNaN(s) ? 1 : Math.max(0.01, Math.min(1, s));
            }
            break;
            
        case "Déplacer Caméra 🎥":
            engine.cameraX = parseFloat(getInputValue("X")) || 0;
            engine.cameraY = parseFloat(getInputValue("Y")) || 0;
            engine.cameraTarget = null;
            break;

        case "Cloner un Objet 🐑":
            if (target) {
                const newObj = JSON.parse(JSON.stringify(target));
                newObj.id = `obj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                const newX = parseFloat(getInputValue("Nouveau X"));
                const newY = parseFloat(getInputValue("Nouveau Y"));
                if (!isNaN(newX)) newObj.x = newX;
                if (!isNaN(newY)) newObj.y = newY;
                engine.objects.push(newObj);
                context.lastClonedObject = newObj;
            }
            break;

        case "Changer Image 🖼️":
            if (target) target.assetId = String(getInputValue("Nom de l'Asset")).trim();
            break;
        case "Jouer Animation 🎬":
            if (target) {
                const imagesStr = String(getInputValue("Images (séparées par ,)"));
                const frames = imagesStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
                if (frames.length > 0) {
                    target.currentAnim = {
                        frames: frames,
                        fps: parseFloat(getInputValue("FPS")) || 12,
                        loop: Boolean(getInputValue("Boucle (Vrai/Faux)")),
                        timer: 0,
                        frameIndex: 0
                    };
                    target.assetId = frames[0];
                }
            }
            break;
        case "Arrêter Animation 🛑":
            if (target) target.currentAnim = null;
            break;

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
// fin 2
// debut 3
        case "Modifier Texte ✍️":
            if (target) target.text = getInputValue("Nouveau Texte");
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

        case "Commencer à Glisser 🖐️":
            if (target) {
                engine.draggedGameObjects = engine.draggedGameObjects || [];
                let pX = engine.playTouchX;
                let pY = engine.playTouchY;
                if (target.isHUD && engine.isPlaying) {
                    pX -= (engine.cameraX || 0);
                    pY -= (engine.cameraY || 0);
                }
                target.dragOffsetX = pX - target.x;
                target.dragOffsetY = pY - target.y;
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
        
        case "Jouer un Son 🎵":
            const soundName = String(getInputValue("Nom du Son")).trim();
            const volInput = getInputValue("Volume (0 à 1)");
            const volume = volInput !== undefined && volInput !== "" ? parseFloat(volInput) : 1;
            const loop = Boolean(getInputValue("Boucle (Vrai/Faux)"));
            engine.playSound(soundName, volume, loop);
            break;
            
        case "Arrêter les Sons 🔇":
            if (engine.activeSounds) {
                engine.activeSounds.forEach(a => { a.pause(); a.currentTime = 0; });
                engine.activeSounds = [];
            }
            break;

        case "Définir Variable ✍️":
            const varNameField = node.fields?.find(f => f.name === "Nom");
            if (varNameField) engine.gameVariables[varNameField.value] = getInputValue("Valeur");
            break;

        case "Sauvegarder Jeu 💾":
            try {
                localStorage.setItem('ludexa_player_save', JSON.stringify(engine.gameVariables));
                console.log("[Ludexa] Partie sauvegardée avec succès !");
            } catch (e) { console.error("Erreur de sauvegarde", e); }
            break;

        case "Charger Jeu 📂":
            try {
                const savedData = localStorage.getItem('ludexa_player_save');
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    Object.assign(engine.gameVariables, parsed);
                    console.log("[Ludexa] Partie chargée avec succès !");
                }
            } catch (e) { console.error("Erreur de chargement", e); }
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

