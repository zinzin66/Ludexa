========================================================================
             LUDEXA 2D ENGINE - GUIDE DE L'ARCHITECTURE
========================================================================

- assets.js
Sert de bibliothèque de gestion. Il charge, stocke et récupère tes images et fichiers audio pour les rendre utilisables par le moteur.  
- blueprint.js
C'est le cœur de l'interface visuelle des scripts. Il permet de créer les nœuds, de tracer les connexions entre eux et de gérer l'édition graphique des logiques de tes scènes.  
- engine.js
C'est le cerveau et le moteur de rendu. Il gère la boucle principale du jeu (gameLoop), le dessin sur le canvas, les collisions, la caméra et l'état global du jeu en mode "Play".  
- index.html
La structure de base de l'éditeur. C'est le squelette qui définit l'emplacement des panneaux, du canvas et qui importe tous tes scripts JavaScript pour lancer l'application.  
- input.js
Gère les interactions tactiles et souris. Il transforme les clics et mouvements de l'utilisateur en coordonnées utilisables pour manipuler les objets ou la caméra.  
liste des fichiers.txt
C'est ton fichier de documentation personnelle. Il sert de sommaire pour garder une trace de l'organisation de ton projet.
- main.js
Le point d'entrée du moteur. Il initialise les différents modules (SceneManager, AssetManager, etc.) et lance l'affichage de l'éditeur au démarrage.  
- nodes-config.js
Le catalogue des briques logiques. Il définit la liste de tous les nœuds disponibles (Événements, Actions, Maths, Audio, etc.) et leur apparence dans l'éditeur de scripts.  
- nodes-interpreter.js
Le traducteur de logique. Il prend les connexions que tu as dessinées dans le Blueprint et les transforme en instructions réelles pour que le moteur les exécute.  
- README_fr.txt
ici
- scenes.js
Gère la structure de tes niveaux. Il s'occupe de sauvegarder et de charger les listes d'objets présents dans chaque scène que tu crées.  
- storage.js
Le gestionnaire de fichiers. Il permet de transformer ton projet en fichier JSON pour l'exporter (sauvegarde) ou l'importer dans l'éditeur.  
- style.css
La feuille de style graphique. Elle définit l'aspect visuel de l'éditeur : les couleurs sombres, la disposition des panneaux, l'apparence des boutons et la mise en page générale.  
- ui.js
Le gestionnaire de l'interface utilisateur. Il fait le pont entre tes clics sur les boutons (ajout d'objets, changement de scène, paramètres) et les actions concrètes dans le moteur.  
