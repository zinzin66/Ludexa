========================================================================
             LUDEXA 2D ENGINE - GUIDE DE L'ARCHITECTURE
========================================================================

Ce fichier sert de carte mémoire pour savoir "Qui fait quoi" et dans quel 
fichier regarder lorsque l'on veut modifier ou réparer une fonctionnalité.

------------------------------------------------------------------------
1. LES FICHIERS CORE (Le Cœur du Système)
------------------------------------------------------------------------

* main.js
  -> LE POINT D'ENTRÉE. C'est le premier script lu par le navigateur.
  -> Son rôle unique est d'attendre que la page HTML/CSS soit chargée,
     puis de démarrer le moteur (LudexaEngine) avec un léger délai 
     pour éviter les bugs d'affichage sur mobile.

* engine.js
  -> LE CHEF D'ORCHESTRE (LudexaEngine). C'est le fichier central.
  -> Il centralise et instancie tous les autres gestionnaires (UI, Input, 
     Scènes, Assets).
  -> Il gère la caméra (Pan, Zoom), la Grille de fond, et la fonction 
     de rendu graphique principale (render()) qui dessine en boucle les 
     formes (Rectangles, Ronds, Boutons, Textes) sur le Canvas.
  -> C'est lui qui convertit les coordonnées de l'écran tactile vers le 
     monde virtuel (screenToWorld).

------------------------------------------------------------------------
2. LES MODULES DE GESTION (Les Spécialistes)
------------------------------------------------------------------------

* input.js
  -> GESTIONNAIRE TACTILE / SOURIS (InputManager).
  -> Il écoute les mouvements du doigt (Pointer Events : pointerdown, 
     pointermove, pointerup).
  -> Il traduit les gestes de l'utilisateur : déplacer la caméra (outil Main),
     sélectionner un objet au toucher, déplacer un objet, ou détecter 
     si le doigt attrape une poignée (un coin blanc) pour redimensionner.

* ui.js
  -> INTERFACE UTILISATEUR (UIManager).
  -> Il fait le pont entre les boutons HTML et le code JavaScript.
  -> Il gère l'ouverture/fermeture des menus latéraux, les boutons de zoom,
     les boutons "+ Rectangle / + Rond".
  -> Il redessine l'Arborescence à gauche et l'Inspecteur (les cases 
     X, Y, Largeur, Hauteur) dès qu'un objet est sélectionné ou bougé.

* scenes.js
  -> GESTIONNAIRE DES SCÈNES (SceneManager).
  -> Il stocke les listes d'objets pour chaque scène (Scène 1, Scène 2...).
  -> C'est lui qui s'assure qu'un objet créé dans la Scène 1 ne s'affiche 
     pas dans la Scène 2.

* assets.js
  -> BANQUE DE FICHIERS (AssetManager).
  -> Il gère la liste des images ou des sons importés dans l'éditeur pour 
     pouvoir les appliquer ensuite comme textures sur les rectangles.

------------------------------------------------------------------------
3. LE VISUEL ET LA STRUCTURE (HTML / CSS)
------------------------------------------------------------------------

* index.html
  -> LA STRUCTURE DE L'INTERFACE.
  -> Contient les menus, les barres d'outils (les boutons du haut), les 
     panneaux de contrôle, et la balise <canvas> (l'ardoise magique).

* style.css
  -> LE LOOK DE L'APPLICATION.
  -> Gère les couleurs sombres de l'interface, la disposition des blocs, 
     et contient la ligne cruciale `touch-action: none` sur le canvas qui 
     autorise le glisser-déposer au doigt en interdisant au smartphone 
     de faire défiler la page web.

========================================================================
                   "OÙ REGARDER QUAND JE VEUX..."
========================================================================
- ...changer la taille des poignées de redimensionnement ? -> engine.js (this.handleSize)
- ...ajouter un nouveau bouton ou un menu ?               -> index.html + style.css
- ...programmer l'action d'un nouveau bouton ?             -> ui.js
- ...modifier la façon dont le doigt déplace une forme ?   -> input.js
- ...changer la couleur par défaut d'un cercle créé ?      -> engine.js (addObject)
