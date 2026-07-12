// nodes-config.js - Le catalogue de tes nœuds (Aucun risque de casser le moteur ici !)
window.BlueprintCatalog = {
    categories: [
        {
            id: "events",
            title: "⚡ Événements",
            color: "#e67e22",
            nodes: [
                { title: "Au démarrage", isStart: true },
                { title: "À chaque frame", isStart: true },
                { title: "En collision 💥", isStart: true }
            ]
        },
        {
            id: "functions",
            title: "🔮 Fonctions",
            color: "#9c27b0",
            nodes: [
                { title: "Définir Fonction () ⚙️", isStart: true },
                { title: "Appeler Fonction 🚀", isStart: false }
            ]
        },
        {
            id: "logic",
            title: "📦 Logique & Conditions",
            color: "#4f46e5",
            nodes: [
                { title: "Condition Si (3 Sorties) 🔀", isStart: false, type: "if" },
                { title: "Attendre X sec ⏱️", isStart: false }
            ]
        },
        {
            id: "scenes",
            title: "🎬 Scènes & HUD",
            color: "#009688",
            nodes: [
                { title: "Changer de scène 🔄", isStart: false },
                { title: "Superposer Scène (HUD) 🥞", isStart: false },
                { title: "Fermer le HUD ✖️", isStart: false }
            ]
        }
    ]
};
