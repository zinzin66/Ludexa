import { SceneManager } from './scenes.js';
import { AssetManager } from './assets.js';
import { StorageManager } from './storage.js'; // Indispensable pour la communication interne

export class UIManager {
    constructor(engine) {
        this.e = engine;
    }

    init() {
        const startScreen = document.getElementById('start-screen');
        const selectScene = document.getElementById('select-scene');

        // GESTION DE LA PAGE DE DÉMARRAGE
        document.getElementById('btn-new-project')?.addEventListener('click', () => {
            this.e.clearProject();
            this.e.projectName = "ludexa_projet"; // Réinitialise le nom par défaut
            this.rebuildSceneSelector();
            if (startScreen) startScreen.style.display = 'none';
            this.updateTreeview();
            this.updateInspector();
            this.e.render();
        });

        // IMPORTATION DIRECTE DEPUIS L'ÉLÉMENT HTML
        document.getElementById('input-import-project')?.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            this.e.storage.importProject(file, (success) => {
                if (success) {
                    this.rebuildSceneSelector();
                    if (startScreen) startScreen.style.display = 'none';
                    this.updateTreeview();
                    this.updateInspector();
                    this.e.render();
                }
                event.target.value = ''; // Reset l'input
            });
        });

        // EXPORTATION DU PROJET
        document.getElementById('btn-export-project')?.addEventListener('click', () => {
            this.e.storage.exportProject();
        });

        document.getElementById('btn-close-project')?.addEventListener('click', () => {
            if (confirm("Quitter le projet en cours ? Pensez à l'exporter pour ne pas perdre vos changements.")) {
                if (startScreen) startScreen.style.display = 'flex';
            }
        });

        // RESTE DES ÉLÉMENTS DE L'ÉDITEUR
        document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('hidden');
        });

        document.querySelectorAll('.panel-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('collapsed');
                this.e.render();
            });
        });

        if (selectScene) {
            selectScene.addEventListener('change', (e) => {
                this.e.sm.currentSceneId = e.target.value;
                this.e.selectedObjectId = null;
                this.updateTreeview();
                this.updateInspector();
                this.e.render();
            });
        }

        document.getElementById('btn-add-scene')?.addEventListener('click', () => {
            const count = Object.keys(this.e.sm.scenes).length + 1;
            const newId = `scene${count}`;
            this.e.sm.addScene(newId);
            
            if (selectScene) {
                const option = document.createElement('option');
                option.value = newId; 
                option.textContent = `Scène ${count}`;
                selectScene.appendChild(option); 
                selectScene.value = newId;
            }
            this.e.sm.currentSceneId = newId; 
            this.e.selectedObjectId = null;
            this.updateTreeview(); 
            this.updateInspector(); 
            this.e.render();
        });

        document.getElementById('btn-remove-scene')?.addEventListener('click', () => {
            if (!selectScene) return;
            const currentOption = selectScene.querySelector(`option[value="${this.e.sm.currentSceneId}"]`);
            if (!currentOption) return;
            if (Object.keys(this.e.sm.scenes).length <= 1) {
                alert("Impossible de supprimer la dernière scène restante.");
                return;
            }
            if (!confirm(`Supprimer la "${currentOption.textContent}" ?`)) return;

            if (this.e.sm.removeScene(this.e.sm.currentSceneId)) {
                currentOption.remove(); 
                selectScene.value = this.e.sm.currentSceneId;
                this.e.selectedObjectId = null; 
                this.updateTreeview(); 
                this.updateInspector(); 
                this.e.render();
            }
        });

        document.getElementById('btn-rename-scene')?.addEventListener('click', () => {
            if (!selectScene) return;
            const currentOption = selectScene.querySelector(`option[value="${this.e.sm.currentSceneId}"]`);
            if (!currentOption) return;
            
            const newName = prompt("Entrez le nouveau nom de la scène :", currentOption.textContent);
            if (newName && newName.trim() !== "") {
                currentOption.textContent = newName.trim();
            }
        });

        const btnHand = document.getElementById('btn-tool-hand');
        btnHand?.addEventListener('click', () => {
            this.e.currentTool = this.e.currentTool === 'hand' ? 'select' : 'hand';
            btnHand.classList.toggle('active', this.e.currentTool === 'hand');
        });

        document.getElementById('btn-toggle-grid')?.addEventListener('click', (e) => {
            this.e.showGrid = !this.e.showGrid; 
            e.target.classList.toggle('active', this.e.showGrid); 
            this.e.render();
        });

        document.getElementById('btn-zoom-in')?.addEventListener('click', () => { this.e.zoom *= 1.2; this.e.render(); });
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => { this.e.zoom /= 1.2; this.e.render(); });
        document.getElementById('btn-zoom-reset')?.addEventListener('click', () => { this.e.zoom = 1; this.e.panX = 0; this.e.panY = 0; this.e.render(); });

        document.getElementById('btn-add-rect')?.addEventListener('click', () => this.e.addObject('rect'));
        document.getElementById('btn-add-circle')?.addEventListener('click', () => this.e.addObject('circle'));
        document.getElementById('btn-add-button')?.addEventListener('click', () => this.e.addObject('button'));
        document.getElementById('btn-add-text')?.addEventListener('click', () => this.e.addObject('text'));

        document.getElementById('btn-import-asset')?.addEventListener('click', () => {
            const fileInput = document.createElement('input'); 
            fileInput.type = 'file'; 
            fileInput.accept = 'image/*,audio/*';
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0]; 
                if (!file) return;
                const type = file.type.startsWith('audio/') ? 'audio' : 'image';
                this.e.am.addAsset(file.name, type, URL.createObjectURL(file));
                this.updateAssetsUI();
            });
            fileInput.click();
        });

        // CONFIGURATION PARAMÈTRES DU PROJET
        this.e.projectName = "ludexa_projet";
        const settingsModal = document.getElementById('project-settings-modal');
        const inputProjectName = document.getElementById('input-project-name');

        document.getElementById('btn-project-settings')?.addEventListener('click', () => {
            if (inputProjectName) inputProjectName.value = this.e.projectName || "ludexa_projet";
            if (settingsModal) settingsModal.style.display = 'flex';
        });

        document.getElementById('btn-close-settings')?.addEventListener('click', () => {
            if (settingsModal) settingsModal.style.display = 'none';
        });

        inputProjectName?.addEventListener('input', (e) => {
            this.e.projectName = e.target.value.trim() || "ludexa_projet";
        });

        this.updateAssetsUI();
        this.updateTreeview();

        // --- CORRECTION APPEL DYNAMIQUE BLUEPRINT ---
        document.getElementById('btn-open-blueprint')?.addEventListener('click', () => {
            if (window.ludexaBlueprint && typeof window.ludexaBlueprint.open === 'function') {
                window.ludexaBlueprint.open();
            } else {
                // Si l'initialisation a pris du retard, on force une tentative de secours
                const modal = document.getElementById('blueprint-modal');
                if (modal) {
                    modal.style.display = 'flex';
                    console.log("Ouverture forcée via fallback DOM.");
                } else {
                    console.error("Impossible de trouver la fenêtre modale Blueprint.");
                }
            }
        });
    }

    rebuildSceneSelector() {
        const selectScene = document.getElementById('select-scene');
        if (!selectScene) return;
        selectScene.innerHTML = '';
        Object.keys(this.e.sm.scenes).forEach((sceneId, index) => {
            const option = document.createElement('option');
            option.value = sceneId;
            option.textContent = `Scène ${index + 1}`;
            selectScene.appendChild(option);
        });
        selectScene.value = this.e.sm?.currentSceneId || Object.keys(this.e.sm.scenes)[0];
    }

    updateTreeview() {
        const tree = document.getElementById('treeview'); 
        if (!tree) return;
        tree.innerHTML = '';
        this.e.objects.forEach(obj => {
            const li = document.createElement('li');
            let icon = '📝';
            if (obj.type === 'rect') icon = obj.assetId ? '🖼️' : '⬛';
            if (obj.type === 'circle') icon = obj.assetId ? '🖼️⚪' : '⚪';
            if (obj.type === 'button') icon = obj.assetId ? '🖼️🔘' : '🔘';
            li.textContent = `${obj.visible ? '👁️' : '🚫'} ${icon} ${obj.name}`;
            if (obj.id === this.e.selectedObjectId) li.classList.add('selected');
            li.addEventListener('click', () => {
                this.e.selectedObjectId = obj.id; 
                this.updateTreeview(); 
                this.updateInspector(); 
                this.e.render();
            });
            tree.appendChild(li);
        });
    }

    updateAssetsUI() {
        const container = document.getElementById('assets-list-container'); 
        if (!container) return;
        container.innerHTML = '';
        this.e.am.getAllAssets().forEach(asset => {
            const item = document.createElement('div');
            item.style = 'padding:6px; margin-bottom:4px; background-color:var(--bg-panel); border-radius:4px; font-size:12px; display:flex; justify-content:space-between; align-items:center;';
            item.innerHTML = `<span>${asset.type==='audio'?'🎵':'🖼️'} ${asset.name}</span>`;
            
            const delBtn = document.createElement('span'); 
            delBtn.textContent = '❌'; 
            delBtn.style.cursor = 'pointer';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Supprimer l'asset "${asset.name}" ?`)) {
                    this.e.objects.forEach(o => { if(o.assetId === asset.id) o.assetId = ''; });
                    this.e.am.removeAsset(asset.id); 
                    this.updateAssetsUI(); 
                    this.updateInspector(); 
                    this.e.render();
                }
            });
            item.appendChild(delBtn); 
            container.appendChild(item);
        });
    }

    updateInspector() {
        const inspector = document.getElementById('inspector'); 
        if (!inspector) return;
        const obj = this.e.objects.find(o => o.id === this.e.selectedObjectId);
        if (!obj) { 
            inspector.innerHTML = '<p class="placeholder-text">Sélect. un objet</p>'; 
            return; 
        }

        let html = `<div class="field-group"><label>Nom</label><input type="text" id="prop-name" value="${obj.name}"></div>
                    <div class="field-group"><label>X</label><input type="number" id="prop-x" value="${obj.x}"></div>
                    <div class="field-group"><label>Y</label><input type="number" id="prop-y" value="${obj.y}"></div>`;

        if (obj.type === 'rect') {
            html += `<div class="field-group"><label>Largeur (W)</label><input type="number" id="prop-w" value="${obj.w}"></div>
                     <div class="field-group"><label>Hauteur (H)</label><input type="number" id="prop-h" value="${obj.h}"></div>
                     <div class="field-group"><label>Texture Image</label><select id="prop-asset"><option value="">-- Aucune --</option>`;
            this.e.am.getAllAssets().forEach(asset => { 
                if (asset.type === 'image') html += `<option value="${asset.id}" ${obj.assetId===asset.id?'selected':''}>${asset.name}</option>`; 
            });
            html += `</select></div>`;
        } else if (obj.type === 'circle') {
            html += `<div class="field-group"><label>Rayon (R)</label><input type="number" id="prop-r" value="${obj.r}"></div>
                     <div class="field-group"><label>Texture Image</label><select id="prop-asset"><option value="">-- Aucune --</option>`;
            this.e.am.getAllAssets().forEach(asset => { 
                if (asset.type === 'image') html += `<option value="${asset.id}" ${obj.assetId===asset.id?'selected':''}>${asset.name}</option>`; 
            });
            html += `</select></div>`;
        } else if (obj.type === 'button') {
            html += `<div class="field-group"><label>Largeur (W)</label><input type="number" id="prop-w" value="${obj.w}"></div>
                     <div class="field-group"><label>Hauteur (H)</label><input type="number" id="prop-h" value="${obj.h}"></div>
                     <div class="field-group"><label>Texte</label><input type="text" id="prop-text" value="${obj.text}"></div>
                     <div class="field-group"><label>Taille Font</label><input type="number" id="prop-fontsize" value="${obj.fontSize || 16}"></div>
                     <div class="field-group"><label>Couleur Txt</label><input type="color" id="prop-textcolor" value="${obj.textColor || '#ffffff'}"></div>
                     <div class="field-group"><label>Texture Image</label><select id="prop-asset"><option value="">-- Aucune --</option>`;
            this.e.am.getAllAssets().forEach(asset => { 
                if (asset.type === 'image') html += `<option value="${asset.id}" ${obj.assetId===asset.id?'selected':''}>${asset.name}</option>`; 
            });
            html += `</select></div>`;
        } else if (obj.type === 'text') {
            html += `<div class="field-group"><label>Texte</label><input type="text" id="prop-text" value="${obj.text}"></div><div class="field-group"><label>Taille Font</label><input type="number" id="prop-fontsize" value="${obj.fontSize || 20}"></div>`;
        }

        html += `<div class="field-group"><label>Couleur Fond</label><input type="color" id="prop-color" value="${obj.color}"></div>
                 <div class="field-group"><label>Opacité</label><input type="number" step="0.1" min="0" max="1" id="prop-opacity" value="${obj.opacity!==undefined?obj.opacity:1}"></div>
                 <div class="field-group"><label>Z-Index</label><input type="number" id="prop-z" value="${obj.zIndex}"></div>
                 <div class="field-group"><label>Visibilité</label><input type="checkbox" id="prop-visible" ${obj.visible?'checked':''}></div>`;
        inspector.innerHTML = html;

        const bind = (id, prop, isNum=true, isCheck=false) => {
            document.getElementById(id)?.addEventListener('input', (e) => {
                obj[prop] = isCheck ? e.target.checked : (prop==='opacity'?parseFloat(e.target.value)||1 : (isNum?parseFloat(e.target.value)||0:e.target.value));
                if (prop==='name' || prop==='visible') this.updateTreeview();
                this.e.render();
            });
        };
        bind('prop-name','name',false); bind('prop-x','x'); bind('prop-y','y'); bind('prop-w','w'); bind('prop-h','h'); bind('prop-r','r');
        bind('prop-text','text',false); bind('prop-fontsize','fontSize'); bind('prop-textcolor','textColor',false); bind('prop-color','color',false);
        bind('prop-opacity','opacity'); bind('prop-z','zIndex'); bind('prop-visible','visible',false,true);

        document.getElementById('prop-asset')?.addEventListener('change', (e) => {
            obj.assetId = e.target.value; 
            this.updateTreeview(); 
            this.e.render();
        });
    }
}

