// debut 1
window.BlueprintCatalog = {
    categories: [
        {
            id: "events",
            title: "⚡ Événements",
            color: "#e67e22",
            nodes: [
                { title: "Au démarrage", isStart: true, execOutputs: ["Suite"] },
                { title: "À chaque frame", isStart: true, execOutputs: ["Suite"], dataOutputs: ["DeltaTime"] },
                { title: "En collision 💥", isStart: true, execOutputs: ["Suite"], dataOutputs: ["Objet Touché"] },
                { title: "Appui écran 👆", isStart: true, execOutputs: ["Suite"], dataOutputs: ["Position X", "Position Y"] }
            ]
        },
        {
            id: "actions",
            title: "🚀 Actions & Mouvements",
            color: "#e84393",
            nodes: [
                { 
                    title: "Définir Position 📍", 
                    isStart: false, 
                    dataInputs: ["X", "Y"], // Entrées pour les valeurs
                    execOutputs: ["Suite"]  // Sortie pour continuer le code
                },
                { 
                    title: "Déplacer ➡️", 
                    isStart: false, 
                    dataInputs: ["Vitesse X", "Vitesse Y"],
                    execOutputs: ["Suite"] 
                },
                { 
                    title: "Tourner 🔄", 
                    isStart: false, 
                    dataInputs: ["Angle"],
                    execOutputs: ["Suite"] 
                },
                { 
                    title: "Détruire l'objet 🗑️", 
                    isStart: false, 
                    dataInputs: ["Cible"],
                    execOutputs: ["Suite"] 
                }
            ]
        },
        {
            id: "logic",
            title: "📦 Logique & Maths",
            color: "#4f46e5",
            nodes: [
                { 
                    title: "Condition Si (If) 🔀", 
                    isStart: false, 
                    dataInputs: ["Condition (Vrai/Faux)"], 
                    execOutputs: ["Si Vrai", "Si Faux", "Continuer"] // Les 3 sorties demandées
                },
                { 
                    title: "Comparer ⚖️", 
                    isStart: false, 
                    dataInputs: ["A", "B"], 
                    dataOutputs: ["A > B", "A == B", "A < B"] // Ne génère pas d'exécution, juste des données
                },
                { 
                    title: "Opération 🧮", 
                    isStart: false, 
                    dataInputs: ["A", "B"], 
                    dataOutputs: ["Résultat"] 
                }
            ]
        },
        {
            id: "variables",
            title: "💾 Variables",
            color: "#f1c40f",
            nodes: [
                { 
                    title: "Définir Variable ✍️", 
                    isStart: false, 
                    dataInputs: ["Nom", "Valeur"],
                    execOutputs: ["Suite"]
                },
                { 
                    title: "Lire Variable 📖", 
                    isStart: false, 
                    dataInputs: ["Nom"],
                    dataOutputs: ["Valeur"]
                }
            ]
        },
        {
            id: "system",
            title: "🎬 Système",
            color: "#009688",
            nodes: [
                { 
                    title: "Afficher Message 💬", 
                    isStart: false, 
                    dataInputs: ["Texte"],
                    execOutputs: ["Suite"]
                }
            ]
        }
    ]
};
// fin de 1

