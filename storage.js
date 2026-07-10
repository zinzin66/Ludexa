export class StorageManager {
    constructor(engine) {
        this.e = engine;
    }

    // Convertit les scènes et objets en texte JSON et force le téléchargement
    exportProject() {
        // Sécurité : Si projectName n'existe pas ou est vide, on donne un nom par défaut
        const name = this.e.projectName || `ludexa_projet_${Date.now()}`;

        // Vérification que le gestionnaire de scènes existe avant d'exporter
        if (!this.e.sm) {
            console.error("Erreur d'exportation : Le SceneManager (sm) n'est pas initialisé.");
            alert("Impossible d'exporter : le gestionnaire de scènes est manquant.");
            return;
        }

        const projectData = {
            version: "1.0",
            timestamp: Date.now(),
            projectName: name,
            scenes: this.e.sm.scenes,
            currentSceneId: this.e.sm.currentSceneId
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

    // Lit un fichier JSON et reconstruit l'état du moteur
    importProject(file, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                
                if (projectData && projectData.scenes) {
                    // On réinjecte les données chargées dans le moteur
                    this.e.sm.scenes = projectData.scenes;
                    this.e.sm.currentSceneId = projectData.currentSceneId || Object.keys(projectData.scenes)[0];
                    this.e.projectName = projectData.projectName || "ludexa_projet";
                    this.e.selectedObjectId = null;
                    
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

