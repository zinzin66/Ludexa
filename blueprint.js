// debut 1
/**
 * Ludexa - Module Blueprint UNIQUE - BLOC 1 (Interface Visuelle et Calculs)
 */
class BlueprintEditor {
    constructor() {
        this.nodes = [];
        this.connections = []; // Format: { fromNode, fromPin, toNode, toPin }
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        
        this.isPanning = false;
        this.draggedNode = null;
        this.connectingFrom = null; // Format: { node, pinName, isOutput }

        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.spawnCount = 0;
        
        this.tempLineX = 0;
        this.tempLineY = 0;

        this.lastPointerDownPos = { x: 0, y: 0 };
        this.pointerDownTime = 0;

        this.editingNode = null;
        this.editingFieldName = null;
    }

    addNode(title, color) {
        const cX = (this.canvas.width / 2 - this.panX) / this.zoom - 90;
        const cY = (this.canvas.height / 2 - this.panY) / this.zoom - 40;
        this.spawnCount++;
        const offset = (this.spawnCount % 5) * 30;

        // Récupération de la configuration du nœud depuis le catalogue
        let config = null;
        if (window.BlueprintCatalog) {
            for (const cat of window.BlueprintCatalog.categories) {
                const found = cat.nodes.find(n => n.title === title);
                if (found) { config = found; break; }
            }
        }

        const inputs = config?.dataInputs || [];
        const execOutputs = config?.execOutputs || [];
        const dataOutputs = config?.dataOutputs || [];
        const outputs = [...execOutputs, ...dataOutputs];

        // Hauteur dynamique selon le nombre de broches
        const maxPins = Math.max(inputs.length, outputs.length);
        const h = Math.max(80, 40 + (maxPins * 28));

        // Génération des champs modifiables (valeurs par défaut) pour les inputs
        const fields = inputs.map(inp => ({ name: inp, value: "0" }));

        this.nodes.push({
            id: 'node_' + Date.now() + Math.random().toString(16).substr(2, 5),
            title: title,
            x: cX + offset,
            y: cY + offset,
            w: 200, // Un peu plus large pour les textes de broches
            h: h,
            color: color || '#3b82f6',
            inputs: inputs,
            outputs: outputs,
            fields: fields
        });
        this.draw();
    }

    open() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.refreshData();
            setTimeout(() => this.resizeCanvas(), 50);
        }
    }

    close() {
        if (this.modal) this.modal.style.display = 'none';
    }

    openExpressionEditor(node, fieldName) {
        this.editingNode = node;
        this.editingFieldName = fieldName;
        const modal = document.getElementById('bp-expr-modal');
        const textarea = document.getElementById('bp-expr-textarea');
        const field = node.fields.find(f => f.name === fieldName);
        if (modal && textarea && field) {
            textarea.value = field.value;
            modal.style.display = 'flex';
        }
    }

    // Récupère les coordonnées exactes d'une broche à l'écran
    getPinPosition(node, pinName, isOutput) {
        const pinIndex = isOutput ? node.outputs.indexOf(pinName) : node.inputs.indexOf(pinName);
        if (pinIndex === -1) return { x: node.x, y: node.y };
        
        const yOffset = node.y + 45 + (pinIndex * 28);
        const xOffset = isOutput ? node.x + node.w : node.x;
        return { x: xOffset, y: yOffset };
    }
}

BlueprintEditor.prototype.initUI = function() {
    if (!document.getElementById('bp-isolated-styles')) {
        const style = document.createElement('style');
        style.id = 'bp-isolated-styles';
        style.textContent = `
            .bp-layout { display: flex; width: 100%; height: 100%; position: absolute; top: 0; left: 0; pointer-events: none; font-family: sans-serif; }
            .bp-sidebar-left { width: 240px; background: #141419; border-right: 1px solid #2d2d35; display: flex; flex-direction: column; pointer-events: auto; z-index: 10; overflow-y: auto; }
            .bp-sidebar-right { width: 220px; background: #141419; border-left: 1px solid #2d2d35; display: flex; flex-direction: column; pointer-events: auto; z-index: 10; overflow-y: auto; margin-left: auto; }
            .bp-panel { border-bottom: 1px solid #2d2d35; }
            .bp-panel-header { background: #1a1a22; padding: 14px 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #8a8a9e; cursor: pointer; display: flex; justify-content: space-between; user-select: none; }
            .bp-panel-content { padding: 10px; display: flex; flex-direction: column; gap: 8px; background: #141419; }
            .bp-panel.collapsed .bp-panel-content { display: none !important; }
            .bp-btn-item { background: #262634; border: 1px solid #2a2a38; color: #f5f5fa; padding: 12px 10px; border-radius: 6px; text-align: left; font-size: 13px; cursor: pointer; }
            .bp-btn-item:hover { background: #3b82f6; border-color: #3b82f6; }
            .bp-static-item { padding: 10px; font-size: 13px; background: #1e1e24; border-radius: 6px; border-left: 4px solid #3b82f6; color: #b3b3cb; cursor: pointer; }
            .bp-static-item:hover { background: #2a2a35; }
            .expr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 10px; }
            .expr-btn { background: #2a2a38; color: white; border: 1px solid #3b3b4a; padding: 10px; border-radius: 4px; font-size: 14px; font-weight: bold; cursor: pointer; text-align: center; }
            .expr-btn:hover { background: #3b82f6; }
            .expr-btn.func { background: #4b5563; }
        `;
        document.head.appendChild(style);
    }

    const closeBtn = document.getElementById('btn-close-blueprint');
    if (closeBtn && !document.getElementById('btn-show-code')) {
        const showCodeBtn = document.createElement('button');
        showCodeBtn.id = 'btn-show-code';
        showCodeBtn.textContent = '📄 Votre code';
        showCodeBtn.style.cssText = 'background: #4b5563; color: white; border: none; padding: 6px 16px; border-radius: 4px; font-weight: bold; cursor: pointer; font-family: sans-serif; margin-right: 12px;';
        closeBtn.parentNode.insertBefore(showCodeBtn, closeBtn);
    }

    const bpModal = document.getElementById('blueprint-modal');
    if (bpModal && !document.getElementById('bp-code-modal')) {
        // --- Modale de Code ---
        const codeModal = document.createElement('div');
        codeModal.id = 'bp-code-modal';
        codeModal.style.cssText = 'display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 30000; align-items: center; justify-content: center; font-family: sans-serif;';
        codeModal.innerHTML = `
            <div style="background: #1e1e24; border: 1px solid #2d2d35; padding: 20px; border-radius: 8px; width: 80%; max-width: 600px; display: flex; flex-direction: column; gap: 12px;">
                <h3 style="color: #fff; margin: 0; font-size: 16px;">📄 Logique des nœuds</h3>
                <textarea id="bp-code-output" readonly style="width: 100%; height: 250px; background: #141419; color: #a0aec0; border: 1px solid #2d2d35; border-radius: 4px; padding: 10px; font-family: monospace; font-size: 13px; resize: none;"></textarea>
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="btn-copy-code" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">Copier</button>
                    <button id="btn-close-code" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">Fermer</button>
                </div>
            </div>
        `;
        bpModal.appendChild(codeModal);

        // --- Modale d'Expression ---
        const exprModal = document.createElement('div');
        exprModal.id = 'bp-expr-modal';
        exprModal.style.cssText = 'display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 31000; align-items: center; justify-content: center; font-family: sans-serif;';
        exprModal.innerHTML = `
            <div style="background: #1e1e24; border: 1px solid #2d2d35; padding: 0; border-radius: 8px; width: 90%; max-width: 800px; display: flex; height: 500px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <div style="flex: 1.5; padding: 20px; display: flex; flex-direction: column; border-right: 1px solid #2d2d35;">
                    <h3 style="color: #fff; margin: 0 0 10px 0; font-size: 16px;">Éditer la valeur</h3>
                    <textarea id="bp-expr-textarea" style="width: 100%; height: 120px; background: #141419; color: #fff; border: 1px solid #3b82f6; border-radius: 4px; padding: 10px; font-family: monospace; font-size: 16px; resize: none; margin-bottom: 10px;"></textarea>
                    <div class="expr-grid">
                        <button class="expr-btn">7</button><button class="expr-btn">8</button><button class="expr-btn">9</button><button class="expr-btn func">/</button>
                        <button class="expr-btn">4</button><button class="expr-btn">5</button><button class="expr-btn">6</button><button class="expr-btn func">*</button>
                        <button class="expr-btn">1</button><button class="expr-btn">2</button><button class="expr-btn">3</button><button class="expr-btn func">-</button>
                        <button class="expr-btn">0</button><button class="expr-btn">.</button><button class="expr-btn func">(</button><button class="expr-btn func">)</button>
                        <button class="expr-btn func">></button><button class="expr-btn func"><</button><button class="expr-btn func">==</button><button class="expr-btn func">+</button>
                        <button class="expr-btn func">||</button><button class="expr-btn func">&&</button><button class="expr-btn func">!</button><button class="expr-btn func" id="expr-btn-clear" style="background: #ef4444;">C</button>
                    </div>
                    <div style="margin-top: auto; display: flex; justify-content: flex-end; gap: 10px;">
                        <button id="btn-cancel-expr" style="background: #4b5563; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">Annuler</button>
                        <button id="btn-save-expr" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">Sauvegarder</button>
                    </div>
                </div>
                <div style="flex: 1; background: #141419; display: flex; flex-direction: column; overflow-y: auto;">
                    <div class="bp-panel"><div class="bp-panel-header">👾 Objets</div><div class="bp-panel-content" id="expr-list-objects"></div></div>
                    <div class="bp-panel"><div class="bp-panel-header">📊 Variables</div><div class="bp-panel-content" id="expr-list-vars">
                        <div class="bp-static-item insertable-item">true</div>
                        <div class="bp-static-item insertable-item">false</div>
                    </div></div>
                </div>
            </div>
        `;
        bpModal.appendChild(exprModal);
    }

    const canvasContainer = document.getElementById('blueprint-canvas-container');
    if (canvasContainer && !document.querySelector('.bp-layout')) {
        const layout = document.createElement('div');
        layout.className = 'bp-layout';
        layout.innerHTML = `
            <aside class="bp-sidebar-left" id="bp-catalog-container"></aside>
            <aside class="bp-sidebar-right">
                <div class="bp-panel"><div class="bp-panel-header">👾 Objets Scène <span>▼</span></div><div class="bp-panel-content" id="bp-objects-list"></div></div>
            </aside>
        `;
        canvasContainer.appendChild(layout);
    }
};

BlueprintEditor.prototype.initElements = function() {
    this.modal = document.getElementById('blueprint-modal');
    this.canvas = document.getElementById('blueprint-canvas');
    if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.touchAction = 'none';
    }
};
// fin de 1
 // debut 2
BlueprintEditor.prototype.initEvents = function() {
    if (!this.canvas) return;

    // --- Événements d'UI (Modales) ---
    const showCodeBtn = document.getElementById('btn-show-code');
    const codeModal = document.getElementById('bp-code-modal');
    const codeOutput = document.getElementById('bp-code-output');
    if (showCodeBtn && codeModal) {
        showCodeBtn.onclick = (e) => {
            e.preventDefault();
            codeOutput.value = JSON.stringify({ nodes: this.nodes, connections: this.connections }, null, 4);
            codeModal.style.display = 'flex';
        };
        document.getElementById('btn-close-code').onclick = (e) => { e.preventDefault(); codeModal.style.display = 'none'; };
    }

    const exprModal = document.getElementById('bp-expr-modal');
    const exprTextarea = document.getElementById('bp-expr-textarea');
    if (exprModal && exprTextarea) {
        document.getElementById('btn-cancel-expr').onclick = (e) => { e.preventDefault(); exprModal.style.display = 'none'; };
        document.getElementById('btn-save-expr').onclick = (e) => {
            e.preventDefault();
            if (this.editingNode && this.editingFieldName) {
                const field = this.editingNode.fields.find(f => f.name === this.editingFieldName);
                if (field) field.value = exprTextarea.value;
                this.draw();
            }
            exprModal.style.display = 'none';
        };
        document.querySelectorAll('.expr-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                if (btn.id === 'expr-btn-clear') exprTextarea.value = '';
                else exprTextarea.value += btn.textContent;
            };
        });
        exprModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('insertable-item')) exprTextarea.value += e.target.textContent;
        });
    }

    document.getElementById('btn-close-blueprint')?.addEventListener('click', (e) => { e.preventDefault(); this.close(); });

    // --- Interaction avec le Canvas ---
    this.canvas.addEventListener('pointerdown', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - this.panX) / this.zoom;
        const mouseY = (e.clientY - rect.top - this.panY) / this.zoom;

        this.lastPointerDownPos = { x: mouseX, y: mouseY };
        this.draggedNode = null;
        this.connectingFrom = null;

        // 1. Détection des clics sur les broches pour créer des connexions
        for (const n of this.nodes) {
            // Broches de sortie (Droites)
            for (const outPin of n.outputs) {
                const pos = this.getPinPosition(n, outPin, true);
                if (Math.hypot(mouseX - pos.x, mouseY - pos.y) < 14) {
                    this.connectingFrom = { node: n, pinName: outPin, isOutput: true };
                    this.tempLineX = e.clientX;
                    this.tempLineY = e.clientY;
                    this.canvas.setPointerCapture(e.pointerId);
                    return;
                }
            }
            // Broches d'entrée (Gauches)
            for (const inPin of n.inputs) {
                const pos = this.getPinPosition(n, inPin, false);
                if (Math.hypot(mouseX - pos.x, mouseY - pos.y) < 14) {
                    this.connectingFrom = { node: n, pinName: inPin, isOutput: false };
                    this.tempLineX = e.clientX;
                    this.tempLineY = e.clientY;
                    this.canvas.setPointerCapture(e.pointerId);
                    return;
                }
            }
        }

        // 2. Interaction avec les Nœuds
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const n = this.nodes[i];
            
            // Croix de suppression
            if (mouseX >= n.x + n.w - 28 && mouseX <= n.x + n.w && mouseY >= n.y && mouseY <= n.y + 26) {
                this.connections = this.connections.filter(c => c.fromNode !== n.id && c.toNode !== n.id);
                this.nodes.splice(i, 1);
                this.draw();
                return;
            }

            // Champs de texte internes (pour ouvrir l'éditeur d'expression)
            if (n.inputs && n.inputs.length > 0) {
                for (let f = 0; f < n.inputs.length; f++) {
                    const fieldY = n.y + 35 + (f * 28);
                    if (mouseX >= n.x + 30 && mouseX <= n.x + n.w - 10 && mouseY >= fieldY && mouseY <= fieldY + 22) {
                        this.openExpressionEditor(n, n.inputs[f]);
                        return;
                    }
                }
            }

            // Déplacement
            if (mouseX >= n.x && mouseX <= n.x + n.w && mouseY >= n.y && mouseY <= n.y + n.h) {
                this.draggedNode = n;
                this.dragOffsetX = mouseX - n.x;
                this.dragOffsetY = mouseY - n.y;
                this.nodes.push(this.nodes.splice(i, 1)[0]); // Passe au premier plan
                this.canvas.setPointerCapture(e.pointerId);
                return;
            }
        }
        
        // 3. Pan de la caméra
        this.isPanning = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
        this.canvas.style.cursor = 'grabbing';
        this.canvas.setPointerCapture(e.pointerId);
    });

    this.canvas.addEventListener('pointermove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        if (this.draggedNode) {
            this.draggedNode.x = ((e.clientX - rect.left - this.panX) / this.zoom) - this.dragOffsetX;
            this.draggedNode.y = ((e.clientY - rect.top - this.panY) / this.zoom) - this.dragOffsetY;
            this.draw();
        } else if (this.connectingFrom) {
            this.tempLineX = e.clientX;
            this.tempLineY = e.clientY;
            this.draw();
        } else if (this.isPanning) {
            this.panX = e.clientX - this.startX;
            this.panY = e.clientY - this.startY;
            this.draw();
        }
    });

    this.canvas.addEventListener('pointerup', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - this.panX) / this.zoom;
        const mouseY = (e.clientY - rect.top - this.panY) / this.zoom;

        if (this.connectingFrom) {
            // Relâchement pour créer la connexion
            for (const n of this.nodes) {
                if (n.id === this.connectingFrom.node.id) continue;
                
                // Si on a tiré depuis une Sortie, on cherche une Entrée
                if (this.connectingFrom.isOutput) {
                    for (const targetPin of n.inputs) {
                        const pos = this.getPinPosition(n, targetPin, false);
                        if (Math.hypot(mouseX - pos.x, mouseY - pos.y) < 18) {
                            this.connections.push({
                                fromNode: this.connectingFrom.node.id, fromPin: this.connectingFrom.pinName,
                                toNode: n.id, toPin: targetPin
                            });
                            break;
                        }
                    }
                } 
                // Si on a tiré depuis une Entrée, on cherche une Sortie
                else {
                    for (const targetPin of n.outputs) {
                        const pos = this.getPinPosition(n, targetPin, true);
                        if (Math.hypot(mouseX - pos.x, mouseY - pos.y) < 18) {
                            this.connections.push({
                                fromNode: n.id, fromPin: targetPin,
                                toNode: this.connectingFrom.node.id, toPin: this.connectingFrom.pinName
                            });
                            break;
                        }
                    }
                }
            }
        }
        
        this.isPanning = false;
        this.draggedNode = null;
        this.connectingFrom = null;
        if (this.canvas) this.canvas.style.cursor = 'grab';
        this.draw();
    });

    window.addEventListener('resize', () => this.resizeCanvas());
};
// fin de 2
// debut 3
BlueprintEditor.prototype.refreshData = function() {
    const catalogContainer = document.getElementById('bp-catalog-container');
    if (catalogContainer && window.BlueprintCatalog) {
        let catalogHTML = '';
        window.BlueprintCatalog.categories.forEach(category => {
            catalogHTML += `<div class="bp-panel"><div class="bp-panel-header">${category.title} <span>▼</span></div><div class="bp-panel-content">`;
            category.nodes.forEach(node => {
                catalogHTML += `<button class="bp-btn-item bp-create-node" data-title="${node.title}" data-color="${category.color}">${node.title}</button>`;
            });
            catalogHTML += `</div></div>`;
        });
        catalogContainer.innerHTML = catalogHTML;
        catalogContainer.querySelectorAll('.bp-create-node').forEach(btn => {
            btn.onclick = (e) => { e.preventDefault(); this.addNode(btn.getAttribute('data-title'), btn.getAttribute('data-color')); };
        });
    }

    const objectsList = document.getElementById('bp-objects-list');
    const exprObjectsList = document.getElementById('expr-list-objects');
    if (objectsList) {
        let html = '<button class="bp-btn-item bp-dynamic-obj" data-title="Hero 🕹️">Hero 🕹️</button>';
        objectsList.innerHTML = html;
        if (exprObjectsList) exprObjectsList.innerHTML = '<div class="bp-static-item insertable-item">Hero</div>';
        objectsList.querySelectorAll('.bp-dynamic-obj').forEach(btn => {
            btn.onclick = (e) => { e.preventDefault(); this.addNode(btn.getAttribute('data-title'), '#2ed573'); };
        });
    }
};

BlueprintEditor.prototype.draw = function() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.fillStyle = '#1e1e24';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    this.ctx.strokeStyle = '#2d2d35';
    this.ctx.lineWidth = 1;
    const gridSize = 40;
    const startX = Math.floor((-this.panX / this.zoom) / gridSize) * gridSize - gridSize;
    const endX = startX + (w / this.zoom) + gridSize * 2;
    const startY = Math.floor((-this.panY / this.zoom) / gridSize) * gridSize - gridSize;
    const endY = startY + (h / this.zoom) + gridSize * 2;
    this.ctx.beginPath();
    for (let x = startX; x < endX; x += gridSize) { this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY); }
    for (let y = startY; y < endY; y += gridSize) { this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y); }
    this.ctx.stroke();

    // DESSIN DES CONNEXIONS
    this.ctx.strokeStyle = '#a0aec0';
    this.ctx.lineWidth = 3;
    this.connections.forEach(c => {
        const fNode = this.nodes.find(n => n.id === c.fromNode);
        const tNode = this.nodes.find(n => n.id === c.toNode);
        if (fNode && tNode) {
            const p1 = this.getPinPosition(fNode, c.fromPin, true);
            const p2 = this.getPinPosition(tNode, c.toPin, false);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.bezierCurveTo(p1.x + 50, p1.y, p2.x - 50, p2.y, p2.x, p2.y);
            this.ctx.stroke();
        }
    });

    if (this.connectingFrom) {
        const rect = this.canvas.getBoundingClientRect();
        const p1 = this.getPinPosition(this.connectingFrom.node, this.connectingFrom.pinName, this.connectingFrom.isOutput);
        const mouseX = (this.tempLineX - rect.left - this.panX) / this.zoom;
        const mouseY = (this.tempLineY - rect.top - this.panY) / this.zoom;
        
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.beginPath();
        if (this.connectingFrom.isOutput) {
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.bezierCurveTo(p1.x + 40, p1.y, mouseX - 40, mouseY, mouseX, mouseY);
        } else {
            this.ctx.moveTo(mouseX, mouseY);
            this.ctx.bezierCurveTo(mouseX + 40, mouseY, p1.x - 40, p1.y, p1.x, p1.y);
        }
        this.ctx.stroke();
    }

    // DESSIN DES NOEUDS ET BROCHES
    this.nodes.forEach(n => {
        this.ctx.fillStyle = '#262634';
        this.ctx.fillRect(n.x, n.y, n.w, n.h);
        this.ctx.strokeStyle = n.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeRect(n.x, n.y, n.w, n.h);
        
        this.ctx.fillStyle = n.color;
        this.ctx.fillRect(n.x, n.y, n.w, 26);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 13px sans-serif';
        this.ctx.fillText(n.title, n.x + 10, n.y + 18);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('✕', n.x + n.w - 18, n.y + 17);

        // Broches d'Entrée (Gauche)
        n.inputs.forEach((inp, idx) => {
            const y = n.y + 45 + (idx * 28);
            
            // Le rond de la broche
            this.ctx.fillStyle = '#a0aec0';
            this.ctx.beginPath(); this.ctx.arc(n.x, y, 6, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.stroke();
            
            // Le champ de texte / nom
            this.ctx.fillStyle = '#141419';
            this.ctx.fillRect(n.x + 15, y - 11, n.w / 2 - 10, 22);
            
            const field = n.fields?.find(f => f.name === inp);
            const valText = field ? field.value : "";
            
            this.ctx.fillStyle = '#a0aec0';
            this.ctx.font = '11px sans-serif';
            this.ctx.fillText(`${inp}: ${valText.substring(0, 5)}`, n.x + 20, y + 4);
        });

        // Broches de Sortie (Droite)
        n.outputs.forEach((outp, idx) => {
            const y = n.y + 45 + (idx * 28);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath(); this.ctx.arc(n.x + n.w, y, 6, 0, Math.PI * 2); this.ctx.fill();
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(outp, n.x + n.w - 15, y + 4);
            this.ctx.textAlign = 'left';
        });
    });
    this.ctx.restore();
};

BlueprintEditor.prototype.resizeCanvas = function() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
};

window.ludexaBlueprint = new BlueprintEditor();
window.ludexaBlueprint.initUI();
window.ludexaBlueprint.initElements();
window.ludexaBlueprint.initEvents();

document.getElementById('btn-open-blueprint')?.addEventListener('click', () => {
    window.ludexaBlueprint.open();
});
// fin de 3

