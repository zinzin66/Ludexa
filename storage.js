// debut 1
export class StorageManager {
    constructor(engine) {
        this.e = engine;
    }

    exportProject() {
        const name = this.e.projectName || `ludexa_projet_${Date.now()}`;

        if (!this.e.sm) {
            console.error("Erreur d'exportation : Le SceneManager (sm) n'est pas initialisé.");
            alert("Impossible d'exporter : le gestionnaire de scènes est manquant.");
            return;
        }

        // CORRECTION : Suppression de la synchronisation agressive ici

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
            console.log("Projet (Scènes, Assets, Variables, Scripts) exporté avec succès !");
        } catch (error) {
            console.error("Erreur technique lors de la génération du JSON :", error);
            alert("Une erreur est survenue lors de l'exportation.");
        }
    }
// fin 1

// debut 2
    importProject(file, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                
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
                    
                    // Rétrocompatibilité : si l'ancien fichier utilisait "blueprint", on l'assigne à la scene1
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
                                savedAsset.img.src = savedAsset.url; 
                            }
                            this.e.am.assets.push(savedAsset); 
                        });
                    }
                    
                    console.log("Projet importé avec succès !");
                    if (callback) callback(true);
                } else {
                    alert("Format de fichier Ludexa invalide (absence de scènes).");
                    if (callback) callback(false);
                }
            } catch (error) {
                console.error("Erreur lors de la lecture du fichier JSON :", error);
                alert("Erreur lors de la lecture du fichier JSON.");
                if (callback) callback(false);
            }
        };
        reader.readAsText(file);
    }
}
// fin 2

