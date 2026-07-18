// debut 1
export class StorageManager {
    constructor(engine) {
        this.e = engine;
    }

    // 1. Sauvegarde Interne (Android / Redémarrage rapide)
    saveToLocal() {
        if (!this.e.sm) return;
        const name = this.e.projectName || "ludexa_projet_auto";
        const projectData = {
            version: "1.2", 
            timestamp: Date.now(),
            projectName: name,
            scenes: this.e.sm.scenes,
            currentSceneId: this.e.sm.currentSceneId,
            variables: this.e.variables || [],
            assets: this.e.am && typeof this.e.am.getAllAssets === 'function' ? this.e.am.getAllAssets() : [],
            scripts: this.e.scripts || {} 
        };

        try {
            localStorage.setItem('ludexa_autosave', JSON.stringify(projectData));
            console.log("Projet sauvegardé dans le stockage interne !");
            alert("✅ Projet sauvegardé localement ! Il sera restauré au prochain démarrage.");
        } catch (error) {
            console.error("Erreur de sauvegarde locale :", error);
            alert("❌ Erreur de sauvegarde. Le projet est peut-être trop lourd pour la mémoire locale.");
        }
    }

    // 2. Chargement Interne
    loadFromLocal(callback) {
        try {
            const dataStr = localStorage.getItem('ludexa_autosave');
            if (!dataStr) {
                if (callback) callback(false);
                return;
            }
            const projectData = JSON.parse(dataStr);
            this.applyProjectData(projectData);
            console.log("Projet restauré depuis le stockage interne !");
            if (callback) callback(true);
        } catch (error) {
            console.error("Erreur de chargement local :", error);
            if (callback) callback(false);
        }
    }

    // 3. Export Externe (PC)
    exportProject() {
        const name = this.e.projectName || `ludexa_projet_${Date.now()}`;

        if (!this.e.sm) {
            console.error("Erreur d'exportation : Le SceneManager (sm) n'est pas initialisé.");
            alert("Impossible d'exporter : le gestionnaire de scènes est manquant.");
            return;
        }

        const projectData = {
            version: "1.2", 
            timestamp: Date.now(),
            projectName: name,
            scenes: this.e.sm.scenes,
            currentSceneId: this.e.sm.currentSceneId,
            variables: this.e.variables || [],
            assets: this.e.am && typeof this.e.am.getAllAssets === 'function' ? this.e.am.getAllAssets() : [],
            scripts: this.e.scripts || {} 
        };

        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `${name}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            console.log("Projet exporté avec succès !");
        } catch (error) {
            console.error("Erreur technique lors de la génération du JSON :", error);
            alert("Une erreur est survenue lors de l'exportation.");
        }
    }
// fin 1
// debut 2
    // 4. Import Externe (PC - Lit un fichier .json)
    importProject(file, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                this.applyProjectData(projectData);
                console.log("Projet importé avec succès depuis le fichier !");
                if (callback) callback(true);
            } catch (error) {
                console.error("Erreur lors de la lecture du fichier JSON :", error);
                alert("Erreur lors de la lecture du fichier JSON.");
                if (callback) callback(false);
            }
        };
        reader.readAsText(file);
    }

    // 5. Fonction commune pour appliquer les données (Évite de dupliquer le code)
    applyProjectData(projectData) {
        if (projectData && projectData.scenes) {
            // 1. Restauration des Scènes et du Projet
            this.e.sm.scenes = projectData.scenes;
            this.e.sm.currentSceneId = projectData.currentSceneId || Object.keys(projectData.scenes)[0];
            this.e.projectName = projectData.projectName || "ludexa_projet";
            this.e.selectedObjectId = null;
            
            // 2. Restauration des Variables
            this.e.variables = projectData.variables || [];
            this.e.gameVariables = {}; 
            
            // 3. Restauration des Scripts (Multi-Scripts)
            this.e.scripts = projectData.scripts || {};
            
            // Rétrocompatibilité
            if (projectData.blueprint && Object.keys(this.e.scripts).length === 0) {
                this.e.scripts['scene1'] = {
                    nodes: projectData.blueprint.nodes || [],
                    connections: projectData.blueprint.connections || []
                };
            }

            // On pousse le script de la scène courante dans l'éditeur visuel
            if (window.ludexaBlueprint) {
                const currentScript = this.e.scripts[this.e.sm.currentSceneId] || { nodes: [], connections: [] };
                window.ludexaBlueprint.nodes = JSON.parse(JSON.stringify(currentScript.nodes));
                window.ludexaBlueprint.connections = JSON.parse(JSON.stringify(currentScript.connections));
                if (typeof window.ludexaBlueprint.draw === 'function') window.ludexaBlueprint.draw();
            }

            // 4. Restauration des Assets (Fichiers)
            if (this.e.am && projectData.assets) {
                this.e.am.assets = []; 
                projectData.assets.forEach(savedAsset => {
                    if (savedAsset.type === 'image') {
                        savedAsset.img = new Image();
                        savedAsset.img.src = savedAsset.url || savedAsset.src; // Prise en compte de url ou src
                    }
                    this.e.am.assets.push(savedAsset); 
                });
            }
            
            // Forcer le rafraîchissement de l'interface
            if (this.e.updateTreeview) this.e.updateTreeview();
            if (this.e.updateInspector) this.e.updateInspector();
            if (this.e.render) this.e.render();
        } else {
            throw new Error("Format de données invalide");
        }
    }
}
// fin 2

