// debut 1
import { SceneManager } from './scenes.js';
import { AssetManager } from './assets.js';
import { UIManager } from './ui.js';
import { InputManager } from './input.js';
import { StorageManager } from './storage.js';

export class LudexaEngine {
    constructor() {
        this.canvas = document.getElementById('editor-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.panX = 0; 
        this.panY = 0; 
        this.zoom = 1;
        this.showGrid = true; 
        this.currentTool = 'select';

        this.sm = new SceneManager();
        this.am = new AssetManager();
        this.storage = new StorageManager(this);
        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        
        this.selectedObjectId = null;
        this.isPointerDown = false;
        this.lastPointer = { x: 0, y: 0 };
        this.draggedObject = null;
        this.dragOffset = { x: 0, y: 0 };
        this.activeHandle = null; 
        this.handleSize = 24; 

        // --- VARIABLES SYSTEME BLUEPRINT ---
        this.isPlaying = false;
        this.lastTime = 0;
        this.bpNodes = [];
        this.bpConnections = [];
        this.gameVariables = {};
        
        this._playInputHandler = this._playInputHandler.bind(this);

        this.resizeCanvas();
        window.addEventListener('resize', () => { this.resizeCanvas(); this.render(); });

        this.ui.init();
        this.render();
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    get objects() { 
        return this.sm.objects; 
    }

    clearProject() {
        this.sm.scenes = { scene1: [] };
        this.sm.currentSceneId = 'scene1';
        this.selectedObjectId = null;
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
    }

    updateTreeview() { this.ui.updateTreeview(); }
    updateInspector() { this.ui.updateInspector(); }
    updateAssetsUI() { this.ui.updateAssetsUI(); }

    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top; 
        return { 
            x: (canvasX - this.panX) / this.zoom, 
            y: (canvasY - this.panY) / this.zoom 
        };
    }

    addObject(type) {
        const count = this.objects.length + 1;
        let objectColor = '#ff4757';
        if (type === 'circle') objectColor = '#54a0ff';
        if (type === 'button') objectColor = '#2ed573';
        if (type === 'text') objectColor = '#ffffff';

        const newObj = {
            id: `obj_${Date.now()}`,
            name: `${type.toUpperCase()}_${count}`,
            type: type,
            x: Math.round(150 - (this.panX / this.zoom)),
            y: Math.round(150 - (this.panY / this.zoom)),
            w: 120,
            h: 80,
            r: 45, 
            color: objectColor,
            opacity: 1,
            zIndex: count, 
            visible: true,
            assetId: '', 
            text: type === 'button' || type === 'text' ? 'Mon Texte' : '',
            angle: 0
        };
        
        this.objects.push(newObj);
        this.selectedObjectId = newObj.id;
        this.updateTreeview();
        this.updateInspector();
        this.render();
        
        return newObj;
    }

    getHitObject(worldX, worldY) {
        const sorted = [...this.objects].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
        return sorted.find(obj => {
            if (!obj.visible) return false;
            if (obj.type === 'rect' || obj.type === 'button') {
                return worldX >= obj.x && worldX <= obj.x + obj.w && worldY >= obj.y && worldY <= obj.y + obj.h;
            } else if (obj.type === 'circle') {
                const dist = Math.hypot(worldX - obj.x, worldY - obj.y);
                return dist <= obj.r;
            } else if (obj.type === 'text') {
                return worldX >= obj.x && worldX <= obj.x + 140 && worldY >= obj.y && worldY <= obj.y + 30;
            }
            return false;
        });
    }

    getHitHandle(obj, worldX, worldY) {
        if (!obj) return null;
        const s = this.handleSize / this.zoom;
        
        if (obj.type === 'rect' || obj.type === 'button' || obj.type === 'text') {
            const width = obj.type === 'text' ? 140 : obj.w;
            const height = obj.type === 'text' ? 32 : obj.h;
            
            const handles = {
                tl: { x: obj.x, y: obj.y },
                tr: { x: obj.x + width, y: obj.y },
                bl: { x: obj.x, y: obj.y + height },
                br: { x: obj.x + width, y: obj.y + height }
            };

            for (const [name, p] of Object.entries(handles)) {
                if (worldX >= p.x - s && worldX <= p.x + s && worldY >= p.y - s && worldY <= p.y + s) {
                    return name;
                }
            }
        } else if (obj.type === 'circle') {
            const p = { x: obj.x + obj.r, y: obj.y };
            if (worldX >= p.x - s && worldX <= p.x + s && worldY >= p.y - s && worldY <= p.y + s) {
                return 'radius';
            }
        }
        return null;
    }

    resizeObject(obj, handle, worldPos) {
        const minSize = 15;
        
        if (handle === 'radius' && obj.type === 'circle') {
            obj.r = Math.max(minSize, Math.round(worldPos.x - obj.x));
            return;
        }

        if (obj.type === 'text') {
            if (handle === 'br' || handle === 'tr') {
                obj.fontSize = Math.max(10, Math.round(worldPos.y - obj.y));
            }
            return;
        }

        if (handle === 'br') {
            obj.w = Math.max(minSize, Math.round(worldPos.x - obj.x));
            obj.h = Math.max(minSize, Math.round(worldPos.y - obj.y));
        } else if (handle === 'bl') {
            const oldRight = obj.x + obj.w;
            obj.x = Math.min(oldRight - minSize, Math.round(worldPos.x));
            obj.w = oldRight - obj.x;
            obj.h = Math.max(minSize, Math.round(worldPos.y - obj.y));
        } else if (handle === 'tr') {
            obj.w = Math.max(minSize, Math.round(worldPos.x - obj.x));
            const oldBottom = obj.y + obj.h;
            obj.y = Math.min(oldBottom - minSize, Math.round(worldPos.y));
            obj.h = oldBottom - obj.y;
        } else if (handle === 'tl') {
            const oldRight = obj.x + obj.w;
            const oldBottom = obj.y + obj.h;
            obj.x = Math.min(oldRight - minSize, Math.round(worldPos.x));
            obj.y = Math.min(oldBottom - minSize, Math.round(worldPos.y));
            obj.w = oldRight - obj.x;
            obj.h = oldBottom - obj.y;
        }
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        // CORRECTION DE LA GRILLE
        if (this.showGrid) {
            this.ctx.strokeStyle = '#2a2a38';
            this.ctx.lineWidth = 0.5;
            const gridSize = 40;
            
            const startX = Math.floor((-this.panX) / this.zoom / gridSize) * gridSize - gridSize;
            const endX = startX + (this.canvas.width / this.zoom) + gridSize * 2;
            const startY = Math.floor((-this.panY) / this.zoom / gridSize) * gridSize - gridSize;
            const endY = startY + (this.canvas.height / this.zoom) + gridSize * 2;

            for (let x = startX; x < endX; x += gridSize) {
                this.ctx.beginPath(); this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY); this.ctx.stroke();
            }
            for (let y = startY; y < endY; y += gridSize) {
                this.ctx.beginPath(); this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y); this.ctx.stroke();
            }
        }

        const sorted = [...this.objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        sorted.forEach(obj => {
            if (!obj.visible) return;
            this.ctx.save();
            this.ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1;

            if (obj.angle) {
                const centerX = obj.type === 'circle' ? obj.x : obj.x + obj.w / 2;
                const centerY = obj.type === 'circle' ? obj.y : obj.y + obj.h / 2;
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(obj.angle * Math.PI / 180);
                this.ctx.translate(-centerX, -centerY);
            }

            if (obj.type === 'rect') {
                const asset = this.am.getAsset(obj.assetId);
                if (asset && asset.img && asset.img.complete) {
                    this.ctx.drawImage(asset.img, obj.x, obj.y, obj.w, obj.h);
                } else {
                    this.ctx.fillStyle = obj.color;
                    this.ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                }
            } else if (obj.type === 'circle') {
                const asset = this.am.getAsset(obj.assetId);
                if (asset && asset.img && asset.img.complete) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
                    this.ctx.clip(); 
                    const diameter = obj.r * 2;
                    this.ctx.drawImage(asset.img, obj.x - obj.r, obj.y - obj.r, diameter, diameter);
                    this.ctx.restore();
                } else {
                    this.ctx.fillStyle = obj.color;
                    this.ctx.beginPath();
                    this.ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (obj.type === 'button') {
                const asset = this.am.getAsset(obj.assetId);
                if (asset && asset.img && asset.img.complete) {
                    this.ctx.drawImage(asset.img, obj.x, obj.y, obj.w, obj.h);
                } else {
                    this.ctx.fillStyle = obj.color;
                    this.ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                }
                
                this.ctx.fillStyle = obj.textColor || '#ffffff';
                this.ctx.font = `${obj.fontSize || 16}px sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(obj.text || '', obj.x + obj.w / 2, obj.y + obj.h / 2);
            } else if (obj.type === 'text') {
                this.ctx.fillStyle = obj.color || '#ffffff';
                this.ctx.font = `${obj.fontSize || 20}px sans-serif`;
                this.ctx.textBaseline = 'top'; 
                this.ctx.fillText(obj.text || 'Mon Texte', obj.x, obj.y);
            }

            // CORRECTION DES POIGNÉES : Assurez-vous que isPlaying n'interfère pas si le mode édition est actif
            if (obj.id === this.selectedObjectId && !this.isPlaying) {
                this.ctx.strokeStyle = '#6366f1';
                this.ctx.lineWidth = 2 / this.zoom;
                this.ctx.fillStyle = '#ffffff';
                const s = this.handleSize / this.zoom;
                
                if (obj.type === 'rect' || obj.type === 'button') {
                    this.ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
                    const hPoints = [
                        {x: obj.x, y: obj.y}, {x: obj.x + obj.w, y: obj.y},
                        {x: obj.x, y: obj.y + obj.h}, {x: obj.x + obj.w, y: obj.y + obj.h}
                    ];
                    hPoints.forEach(p => this.ctx.fillRect(p.x - s/2, p.y - s/2, s, s));
                } else if (obj.type === 'circle') {
                    this.ctx.beginPath();
                    this.ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.fillRect(obj.x + obj.r - s/2, obj.y - s/2, s, s);
                } else if (obj.type === 'text') {
                    this.ctx.strokeRect(obj.x - 4, obj.y - 4, 140, 32);
                    const hPoints = [
                        {x: obj.x - 4, y: obj.y - 4}, {x: obj.x + 136, y: obj.y - 4},
                        {x: obj.x - 4, y: obj.y + 28}, {x: obj.x + 136, y: obj.y + 28}
                    ];
                    hPoints.forEach(p => this.ctx.fillRect(p.x - s/2, p.y - s/2, s, s));
                }
            }
            this.ctx.restore();
        });

        this.ctx.restore();
    }

    // ==========================================
    // LOGIQUE BLUEPRINT
    // ==========================================

    loadBlueprint(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.bpNodes = data.nodes || [];
            this.bpConnections = data.connections || [];
            console.log("Blueprint prêt avec", this.bpNodes.length, "nœuds.");
        } catch (error) {
            console.error("Erreur de chargement du Blueprint :", error);
        }
    }

    _playInputHandler(e) {
        if (!this.isPlaying) return;
        this.triggerEvent("Appui écran 👆", { x: e.clientX, y: e.clientY });
    }

    startPlayMode() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.selectedObjectId = null; 
        this.gameVariables = {}; 
        this.lastTime = performance.now();
        
        this.canvas.addEventListener('pointerdown', this._playInputHandler);
        this.triggerEvent("Au démarrage");
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    stopPlayMode() {
        this.isPlaying = false;
        this.canvas.removeEventListener('pointerdown', this._playInputHandler);
        this.render(); // Force un rendu pour réafficher les éléments d'édition
    }

    gameLoop(timestamp) {
        if (!this.isPlaying) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.triggerEvent("À chaque frame", { deltaTime });
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    triggerEvent(eventTitle, eventData = {}) {
        const eventNodes = this.bpNodes.filter(node => node.title === eventTitle);
        for (const node of eventNodes) {
            this.executeNextNodes(node, null, { ...eventData, target: null });
        }
    }

    executeNextNodes(currentNode, outPinName, context) {
        // Dans la nouvelle architecture, on vérifie quelle broche a déclenché la suite
        const outConnections = this.bpConnections.filter(c => 
            c.fromNode === currentNode.id && (!outPinName || c.fromPin === outPinName)
        );
        
        for (const conn of outConnections) {
            const nextNode = this.bpNodes.find(n => n.id === conn.toNode);
            if (nextNode) {
                const nextContext = { ...context };
                this.evaluateNode(nextNode, nextContext);
                // Par défaut, on continue sur la broche "Suite" ou "Continuer"
                this.executeNextNodes(nextNode, "Suite", nextContext);
                this.executeNextNodes(nextNode, "Continuer", nextContext);
            }
        }
    }

    evaluateNode(node, context) {
        const targetObj = this.objects.find(o => node.title.includes(o.name) || node.title === o.name);
        if (targetObj) context.target = targetObj;

        // Fonction pour récupérer la valeur d'une entrée (soit depuis un champ interne, soit depuis une connexion entrante)
        const getInputValue = (pinName) => {
            // 1. On vérifie s'il y a un nœud connecté à cette broche d'entrée
            const inConn = this.bpConnections.find(c => c.toNode === node.id && c.toPin === pinName);
            if (inConn) {
                // Dans un système complet, on irait évaluer le nœud parent ici pour récupérer sa donnée de sortie.
                // Pour le moment, on retourne 0 si c'est connecté mais non géré.
                return 0; 
            }
            
            // 2. Sinon, on lit la valeur statique (éditée via l'UI)
            if (!node.fields) return 0;
            const field = node.fields.find(f => f.name === pinName);
            if (!field) return 0;
            
            let val = field.value;
            for (const [vName, vVal] of Object.entries(this.gameVariables)) {
                val = val.replace(new RegExp(`\\b${vName}\\b`, 'g'), vVal);
            }
            try {
                return Function(`"use strict"; return (${val})`)();
            } catch (e) {
                return parseFloat(val) || val;
            }
        };

        switch (node.title) {
            case "Déplacer ➡️":
                if (context.target) {
                    const dx = getInputValue("Vitesse X");
                    const dy = getInputValue("Vitesse Y");
                    const dt = context.deltaTime || 0.016;
                    context.target.x += dx * dt;
                    context.target.y += dy * dt;
                }
                break;
                
            case "Définir Position 📍":
                if (context.target) {
                    context.target.x = getInputValue("X");
                    context.target.y = getInputValue("Y");
                }
                break;
                
            case "Tourner 🔄":
                if (context.target) {
                    context.target.angle = (context.target.angle || 0) + (getInputValue("Angle") * (context.deltaTime || 0.016));
                }
                break;
                
            case "Condition Si (If) 🔀":
                const cond = getInputValue("Condition (Vrai/Faux)");
                if (cond) {
                    this.executeNextNodes(node, "Si Vrai", context);
                } else {
                    this.executeNextNodes(node, "Si Faux", context);
                }
                break;
        }
    }
}
// fin de 1

