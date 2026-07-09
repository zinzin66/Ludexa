// Application Ludexa IDE - Correction Opacité & Rendu
class LudexaEngine {
    constructor() {
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // État de la vue
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        this.showGrid = true;
        this.currentTool = 'select';

        // Gestion des scènes
        this.scenes = { 'scene1': [] };
        this.currentSceneId = 'scene1';

        // Scène initiale
        this.scenes['scene1'] = [
            { id: '1', name: 'Rectangle 1', type: 'rect', x: 100, y: 100, w: 120, h: 80, color: '#ff4757', opacity: 1, zIndex: 1, visible: true },
            { id: '2', name: 'Texte DÉMO', type: 'text', x: 300, y: 200, text: 'Ludexa 2D', color: '#ffffff', opacity: 1, zIndex: 2, visible: true, fontSize: 32 }
        ];
        
        this.selectedObjectId = null;

        // Interaction & Drag
        this.isPointerDown = false;
        this.lastPointer = { x: 0, y: 0 };
        this.draggedObject = null;
        this.dragOffset = { x: 0, y: 0 };
        this.activeHandle = null; 
        this.handleSize = 8; 

        this.initUI();
        this.initPointerEvents();
        this.render();
    }

    get objects() {
        return this.scenes[this.currentSceneId] || [];
    }

    initUI() {
        // Toggle Sidebar
        document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('hidden');
        });

        // Sélecteur de scènes
        const selectScene = document.getElementById('select-scene');
        selectScene?.addEventListener('change', (e) => {
            this.currentSceneId = e.target.value;
            this.selectedObjectId = null;
            this.updateTreeview();
            this.updateInspector();
            this.render();
        });

        document.getElementById('btn-add-scene')?.addEventListener('click', () => {
            const count = Object.keys(this.scenes).length + 1;
            const newId = `scene${count}`;
            this.scenes[newId] = [];
            const option = document.createElement('option');
            option.value = newId;
            option.textContent = `Scène ${count}`;
            selectScene.appendChild(option);
            selectScene.value = newId;
            this.currentSceneId = newId;
            this.selectedObjectId = null;
            this.updateTreeview();
            this.updateInspector();
            this.render();
        });

        document.getElementById('btn-remove-scene')?.addEventListener('click', () => {
            if (Object.keys(this.scenes).length <= 1) return;
            delete this.scenes[this.currentSceneId];
            selectScene.querySelector(`option[value="${this.currentSceneId}"]`).remove();
            this.currentSceneId = Object.keys(this.scenes)[0];
            selectScene.value = this.currentSceneId;
            this.selectedObjectId = null;
            this.updateTreeview();
            this.updateInspector();
            this.render();
        });

        // Outils Vue
        const btnHand = document.getElementById('btn-tool-hand');
        btnHand?.addEventListener('click', () => {
            this.currentTool = this.currentTool === 'hand' ? 'select' : 'hand';
            btnHand.classList.toggle('active', this.currentTool === 'hand');
        });

        document.getElementById('btn-toggle-grid')?.addEventListener('click', (e) => {
            this.showGrid = !this.showGrid;
            e.target.classList.toggle('active', this.showGrid);
            this.render();
        });

        // Zoom
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => { this.zoom *= 1.2; this.render(); });
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => { this.zoom /= 1.2; this.render(); });
        document.getElementById('btn-zoom-reset')?.addEventListener('click', () => { this.zoom = 1; this.panX = 0; this.panY = 0; this.render(); });

        // Ajouter Objets
        document.getElementById('btn-add-rect')?.addEventListener('click', () => this.addObject('rect'));
        document.getElementById('btn-add-text')?.addEventListener('click', () => this.addObject('text'));

        this.updateTreeview();
    }

    initPointerEvents() {
        this.canvas.addEventListener('pointerdown', (e) => {
            this.canvas.setPointerCapture(e.pointerId);
            this.isPointerDown = true;
            this.lastPointer = { x: e.clientX, y: e.clientY };

            const worldPos = this.screenToWorld(e.clientX, e.clientY);

            if (this.currentTool === 'select') {
                const selectedObj = this.objects.find(o => o.id === this.selectedObjectId);
                
                if (selectedObj) {
                    const handle = this.getHitHandle(selectedObj, worldPos.x, worldPos.y);
                    if (handle) {
                        this.activeHandle = handle;
                        this.draggedObject = selectedObj;
                        this.render();
                        return;
                    }
                }

                const hitObj = this.getHitObject(worldPos.x, worldPos.y);
                if (hitObj) {
                    this.selectedObjectId = hitObj.id;
                    this.draggedObject = hitObj;
                    this.activeHandle = null;
                    this.dragOffset = { x: worldPos.x - hitObj.x, y: worldPos.y - hitObj.y };
                } else {
                    this.selectedObjectId = null;
                    this.draggedObject = null;
                    this.activeHandle = null;
                }

                this.updateTreeview();
                this.updateInspector();
            }
            this.render();
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (!this.isPointerDown) return;

            const dx = e.clientX - this.lastPointer.x;
            const dy = e.clientY - this.lastPointer.y;

            if (this.currentTool === 'hand') {
                this.panX += dx;
                this.panY += dy;
            } else if (this.currentTool === 'select' && this.draggedObject) {
                const worldPos = this.screenToWorld(e.clientX, e.clientY);

                if (this.activeHandle) {
                    this.resizeObject(this.draggedObject, this.activeHandle, worldPos);
                } else {
                    this.draggedObject.x = Math.round(worldPos.x - this.dragOffset.x);
                    this.draggedObject.y = Math.round(worldPos.y - this.dragOffset.y);
                }
                this.updateInspector();
            }

            this.lastPointer = { x: e.clientX, y: e.clientY };
            this.render();
        });

        const handlePointerUp = (e) => {
            this.isPointerDown = false;
            this.draggedObject = null;
            this.activeHandle = null;
            try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        };

        this.canvas.addEventListener('pointerup', handlePointerUp);
        this.canvas.addEventListener('pointercancel', handlePointerUp);
    }

    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (screenX - rect.left) * (this.canvas.width / rect.width);
        const canvasY = (screenY - rect.top) * (this.canvas.height / rect.height);
        
        return {
            x: (canvasX - this.panX) / this.zoom,
            y: (canvasY - this.panY) / this.zoom
        };
    }

    getObjectBounds(obj) {
        if (obj.type === 'rect') {
            return { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
        } else if (obj.type === 'text') {
            const fontSize = obj.fontSize || 20;
            this.ctx.font = `${fontSize}px sans-serif`;
            const width = this.ctx.measureText(obj.text).width || 80;
            return { x: obj.x, y: obj.y - fontSize, w: width, h: fontSize };
        }
        return { x: obj.x, y: obj.y, w: 0, h: 0 };
    }

    getHitHandle(obj, x, y) {
        const bounds = this.getObjectBounds(obj);
        const hs = (this.handleSize * 1.5) / this.zoom;
        const handles = {
            tl: { x: bounds.x, y: bounds.y },
            tr: { x: bounds.x + bounds.w, y: bounds.y },
            bl: { x: bounds.x, y: bounds.y + bounds.h },
            br: { x: bounds.x + bounds.w, y: bounds.y + bounds.h }
        };

        for (const [key, pos] of Object.entries(handles)) {
            if (Math.abs(x - pos.x) <= hs && Math.abs(y - pos.y) <= hs) {
                return key;
            }
        }
        return null;
    }

    resizeObject(obj, handle, worldPos) {
        if (obj.type === 'rect') {
            const minSize = 10;
            if (handle === 'br') {
                obj.w = Math.max(minSize, Math.round(worldPos.x - obj.x));
                obj.h = Math.max(minSize, Math.round(worldPos.y - obj.y));
            } else if (handle === 'bl') {
                const newW = Math.max(minSize, Math.round(obj.x + obj.w - worldPos.x));
                obj.x = obj.x + obj.w - newW;
                obj.w = newW;
                obj.h = Math.max(minSize, Math.round(worldPos.y - obj.y));
            } else if (handle === 'tr') {
                obj.w = Math.max(minSize, Math.round(worldPos.x - obj.x));
                const newH = Math.max(minSize, Math.round(obj.y + obj.h - worldPos.y));
                obj.y = obj.y + obj.h - newH;
                obj.h = newH;
            } else if (handle === 'tl') {
                const newW = Math.max(minSize, Math.round(obj.x + obj.w - worldPos.x));
                obj.x = obj.x + obj.w - newW;
                obj.w = newW;
                const newH = Math.max(minSize, Math.round(obj.y + obj.h - worldPos.y));
                obj.y = obj.y + obj.h - newH;
                obj.h = newH;
            }
        } else if (obj.type === 'text') {
            const distY = Math.abs(worldPos.y - obj.y);
            obj.fontSize = Math.max(10, Math.min(120, Math.round(distY)));
        }
    }

    getHitObject(x, y) {
        const sorted = [...this.objects].sort((a, b) => b.zIndex - a.zIndex);
        return sorted.find(obj => {
            if (!obj.visible) return false;
            const b = this.getObjectBounds(obj);
            return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
        });
    }

    addObject(type) {
        const id = Date.now().toString();
        const newObj = type === 'rect' ? {
            id, name: `Rect ${this.objects.length + 1}`, type: 'rect',
            x: 50, y: 50, w: 100, h: 100, color: '#3b82f6', opacity: 1, zIndex: this.objects.length + 1, visible: true
        } : {
            id, name: `Texte ${this.objects.length + 1}`, type: 'text',
            x: 50, y: 100, text: 'Nouveau texte', color: '#ffffff', opacity: 1, zIndex: this.objects.length + 1, visible: true, fontSize: 24
        };

        this.objects.push(newObj);
        this.selectedObjectId = id;
        this.updateTreeview();
        this.updateInspector();
        this.render();
    }

    updateTreeview() {
        const tree = document.getElementById('treeview');
        if (!tree) return;
        tree.innerHTML = '';
        this.objects.forEach(obj => {
            const li = document.createElement('li');
            li.textContent = `${obj.visible ? '👁️' : '🚫'} ${obj.type === 'rect' ? '⬛' : '📝'} ${obj.name}`;
            if (obj.id === this.selectedObjectId) li.classList.add('selected');
            li.addEventListener('click', () => {
                this.selectedObjectId = obj.id;
                this.updateTreeview();
                this.updateInspector();
                this.render();
            });
            tree.appendChild(li);
        });
    }

    updateInspector() {
        const inspector = document.getElementById('inspector');
        if (!inspector) return;
        const obj = this.objects.find(o => o.id === this.selectedObjectId);

        if (!obj) {
            inspector.innerHTML = '<p class="placeholder-text">Sélect. un objet</p>';
            return;
        }

        let html = `
            <div class="field-group"><label>Nom</label><input type="text" id="prop-name" value="${obj.name}"></div>
            <div class="field-group"><label>X</label><input type="number" id="prop-x" value="${obj.x}"></div>
            <div class="field-group"><label>Y</label><input type="number" id="prop-y" value="${obj.y}"></div>
        `;

        if (obj.type === 'rect') {
            html += `
                <div class="field-group"><label>Largeur (W)</label><input type="number" id="prop-w" value="${obj.w}"></div>
                <div class="field-group"><label>Hauteur (H)</label><input type="number" id="prop-h" value="${obj.h}"></div>
            `;
        } else if (obj.type === 'text') {
            html += `
                <div class="field-group"><label>Texte</label><input type="text" id="prop-text" value="${obj.text}"></div>
                <div class="field-group"><label>Taille Font</label><input type="number" id="prop-fontsize" value="${obj.fontSize || 20}"></div>
            `;
        }

        html += `
            <div class="field-group"><label>Couleur</label><input type="color" id="prop-color" value="${obj.color}"></div>
            <div class="field-group"><label>Opacité (0-1)</label><input type="number" step="0.1" min="0" max="1" id="prop-opacity" value="${obj.opacity !== undefined ? obj.opacity : 1}"></div>
            <div class="field-group"><label>Z-Index</label><input type="number" id="prop-z" value="${obj.zIndex}"></div>
            <div class="field-group"><label>Visibilité</label><input type="checkbox" id="prop-visible" ${obj.visible ? 'checked' : ''}></div>
        `;

        inspector.innerHTML = html;

        const bindInput = (id, prop, isNum = true, isCheckbox = false) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                if (isCheckbox) {
                    obj[prop] = e.target.checked;
                } else if (prop === 'opacity') {
                    // Force la valeur de l'opacité entre 0 et 1
                    let val = parseFloat(e.target.value);
                    if (isNaN(val)) val = 1;
                    obj[prop] = Math.max(0, Math.min(1, val));
                } else {
                    obj[prop] = isNum ? parseFloat(e.target.value) || 0 : e.target.value;
                }
                if (prop === 'name' || prop === 'visible') this.updateTreeview();
                this.render();
            });
        };

        bindInput('prop-name', 'name', false);
        bindInput('prop-x', 'x');
        bindInput('prop-y', 'y');
        bindInput('prop-w', 'w');
        bindInput('prop-h', 'h');
        bindInput('prop-text', 'text', false);
        bindInput('prop-fontsize', 'fontSize');
        bindInput('prop-color', 'color', false);
        bindInput('prop-opacity', 'opacity');
        bindInput('prop-z', 'zIndex');
        bindInput('prop-visible', 'visible', false, true);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        if (this.showGrid) {
            this.drawGrid();
        }

        const sorted = [...this.objects].sort((a, b) => a.zIndex - b.zIndex);

        sorted.forEach(obj => {
            if (!obj.visible) return;

            const bounds = this.getObjectBounds(obj);

            // 1. Dessin de la forme avec son opacité spécifique
            this.ctx.save();
            const opacityVal = (obj.opacity !== undefined) ? Number(obj.opacity) : 1;
            this.ctx.globalAlpha = Math.max(0, Math.min(1, opacityVal));

            if (obj.type === 'rect') {
                this.ctx.fillStyle = obj.color;
                this.ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
            } else if (obj.type === 'text') {
                this.ctx.fillStyle = obj.color;
                this.ctx.font = `${obj.fontSize || 20}px sans-serif`;
                this.ctx.fillText(obj.text, obj.x, obj.y);
            }
            this.ctx.restore(); // Rétablit l'opacité à 1.0 pour les poignées

            // 2. Dessin du contour et des poignées (toujours à 100% opaques)
            if (obj.id === this.selectedObjectId) {
                this.ctx.save();
                this.ctx.globalAlpha = 1.0;
                this.ctx.strokeStyle = '#6366f1';
                this.ctx.lineWidth = 2 / this.zoom;
                this.ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.w + 4, bounds.h + 4);
                this.drawHandles(bounds);
                this.ctx.restore();
            }
        });

        this.ctx.restore();
    }

    drawHandles(bounds) {
        const size = this.handleSize / this.zoom;
        const half = size / 2;
        const handles = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.w, y: bounds.y },
            { x: bounds.x, y: bounds.y + bounds.h },
            { x: bounds.x + bounds.w, y: bounds.y + bounds.h }
        ];

        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#6366f1';
        this.ctx.lineWidth = 1 / this.zoom;

        handles.forEach(h => {
            this.ctx.fillRect(h.x - half, h.y - half, size, size);
            this.ctx.strokeRect(h.x - half, h.y - half, size, size);
        });
    }

    drawGrid() {
        const gridSize = 32;
        this.ctx.strokeStyle = '#2d2d38';
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new LudexaEngine();
});

