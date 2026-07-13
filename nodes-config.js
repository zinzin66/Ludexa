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
                { title: "Clic sur un Objet 🖱️", isStart: true, dataInputs: ["Cible"], execOutputs: ["Suite"] },
                { title: "En collision 💥", isStart: true, dataInputs: ["Cible"], execOutputs: ["Suite"], dataOutputs: ["Objet Touché"] },
                { title: "Appui écran 👆", isStart: true, execOutputs: ["Suite"], dataOutputs: ["Position X", "Position Y"] },
                { title: "Relâchement écran 🖱️", isStart: true, execOutputs: ["Suite"] }
            ]
        },
        {
            id: "actions",
            title: "🚀 Actions & Mouvements",
            color: "#e84393",
            nodes: [
                { title: "Définir Position 📍", isStart: false, dataInputs: ["Cible", "X", "Y"], execOutputs: ["Suite"] },
                { title: "Déplacer ➡️", isStart: false, dataInputs: ["Cible", "Vitesse X", "Vitesse Y"], execOutputs: ["Suite"] },
                { title: "Tourner 🔄", isStart: false, dataInputs: ["Cible", "Angle"], execOutputs: ["Suite"] },
                { title: "Changer Taille 📏", isStart: false, dataInputs: ["Cible", "Échelle X", "Échelle Y"], execOutputs: ["Suite"] },
                { title: "Afficher / Cacher 👁️", isStart: false, dataInputs: ["Cible", "Visible (Vrai/Faux)"], execOutputs: ["Suite"] },
                { title: "Définir Z-Index ↕️", isStart: false, dataInputs: ["Cible", "Valeur"], execOutputs: ["Suite"] },
                { title: "Commencer à Glisser 🖐️", isStart: false, dataInputs: ["Cible"], execOutputs: ["Suite"] },
                { title: "Arrêter de Glisser 🛑", isStart: false, execOutputs: ["Suite"] },
                { title: "Détruire l'objet 🗑️", isStart: false, dataInputs: ["Cible"], execOutputs: ["Suite"] },
                { title: "Cloner un Objet 🐑", isStart: false, dataInputs: ["Cible", "Nouveau X", "Nouveau Y"], execOutputs: ["Suite"], dataOutputs: ["Nouvel Objet"] },
                { title: "Suivre Objet (Caméra) 🎥", isStart: false, dataInputs: ["Cible", "Douceur (0 à 1)"], execOutputs: ["Suite"] },
                { title: "Déplacer Caméra 🎥", isStart: false, dataInputs: ["X", "Y"], execOutputs: ["Suite"] }
            ]
        },
// fin 1
// debut 2
        {
            id: "animations",
            title: "🎞️ Animations & Images",
            color: "#ff7675",
            nodes: [
                { title: "Changer Image 🖼️", isStart: false, dataInputs: ["Cible", "Nom de l'Asset"], execOutputs: ["Suite"] },
                { title: "Jouer Animation 🎬", isStart: false, dataInputs: ["Cible", "Images (séparées par ,)", "FPS", "Boucle (Vrai/Faux)"], execOutputs: ["Suite"] },
                { title: "Arrêter Animation 🛑", isStart: false, dataInputs: ["Cible"], execOutputs: ["Suite"] }
            ]
        },
        {
            id: "text",
            title: "📝 Texte & Apparence",
            color: "#9b59b6",
            nodes: [
                { title: "Modifier Texte ✍️", isStart: false, dataInputs: ["Cible", "Nouveau Texte"], execOutputs: ["Suite"] },
                { title: "Taille du Texte 📏", isStart: false, dataInputs: ["Cible", "Taille (px)"], execOutputs: ["Suite"] },
                { title: "Couleur (Hex) 🎨", isStart: false, dataInputs: ["Cible", "Couleur"], execOutputs: ["Suite"] },
                { title: "Transparence 👻", isStart: false, dataInputs: ["Cible", "Opacité (0 à 1)"], execOutputs: ["Suite"] }
            ]
        },
        {
            id: "filters",
            title: "🎨 Filtres Visuels",
            color: "#00cec9",
            nodes: [
                { title: "Filtre: Sépia 🎞️", isStart: false, dataInputs: ["Cible"], execOutputs: ["Suite"] },
                { title: "Filtre: Niveaux de gris 🌑", isStart: false, dataInputs: ["Cible"], execOutputs: ["Suite"] },
                { title: "Filtre: Inverser 🌈", isStart: false, dataInputs: ["Cible"], execOutputs: ["Suite"] },
                { title: "Retirer Filtres 🚫", isStart: false, dataInputs: ["Cible"], execOutputs: ["Suite"] }
            ]
        },
        {
            id: "logic",
            title: "📦 Logique & Maths",
            color: "#4f46e5",
            nodes: [
                { title: "Condition Si (If) 🔀", isStart: false, dataInputs: ["Condition (Vrai/Faux)"], execOutputs: ["Si Vrai", "Si Faux", "Continuer"] },
                { title: "Boucle (Répéter) 🔄", isStart: false, dataInputs: ["Nombre de fois"], execOutputs: ["Boucle", "Terminé"] },
                { title: "Flip-Flop 🔀", isStart: false, execOutputs: ["Sortie A", "Sortie B"] },
                { title: "Comparer ⚖️", isStart: false, dataInputs: ["A", "B"], dataOutputs: ["A > B", "A == B", "A < B"] },
                { title: "Opération 🧮", isStart: false, dataInputs: ["A", "B"], dataOutputs: ["Résultat"] },
                { title: "Nombre Aléatoire 🎲", isStart: false, dataInputs: ["Min", "Max"], dataOutputs: ["Résultat"] },
                { title: "Attendre (Délai) ⏱️", isStart: false, dataInputs: ["Secondes"], execOutputs: ["Suite"] }
            ]
        },
// fin 2
// debut 3
        {
            id: "variables",
            title: "💾 Variables",
            color: "#f1c40f",
            nodes: [
                { title: "Définir Variable ✍️", isStart: false, dataInputs: ["Nom", "Valeur"], execOutputs: ["Suite"] },
                { title: "Lire Variable 📖", isStart: false, dataInputs: ["Nom"], dataOutputs: ["Valeur"] },
                { title: "Sauvegarder Jeu 💾", isStart: false, execOutputs: ["Suite"] },
                { title: "Charger Jeu 📂", isStart: false, execOutputs: ["Suite"] }
            ]
        },
        {
            id: "system",
            title: "🎬 Scènes & Système",
            color: "#009688",
            nodes: [
                { title: "Afficher Message 💬", isStart: false, dataInputs: ["Texte"], execOutputs: ["Suite"] },
                { title: "Changer de Scène 🎬", isStart: false, dataInputs: ["Nom de la scène"], execOutputs: ["Suite"] },
                { title: "Superposer Scène (HUD) 🖼️", isStart: false, dataInputs: ["Nom de la scène"], execOutputs: ["Suite"] },
                { title: "Fermer le HUD 🚫", isStart: false, execOutputs: ["Suite"] },
                { title: "Jouer un Son 🎵", isStart: false, dataInputs: ["Nom du Son", "Volume (0 à 1)", "Boucle (Vrai/Faux)"], execOutputs: ["Suite"] },
                { title: "Arrêter les Sons 🔇", isStart: false, execOutputs: ["Suite"] }
            ]
        }
    ]
};
// fin 3

