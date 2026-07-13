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

        this.isPlaying = false;
        this.lastTime = 0;
        
        this.scripts = { 'scene1': { nodes: [], connections: [] } };
        this.executingSceneId = null;
        this.gameVariables = {};
        this.activeCollisions = new Set();
        this.activeSounds = [];
        
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraTarget = null;
        this.cameraLerp = 1;
        
        this.playTouchX = 0;
        this.playTouchY = 0;
        this.draggedGameObjects = [];
        
        this._playInputHandlerDown = this._playInputHandlerDown.bind(this);
        this._playInputHandlerUp = this._playInputHandlerUp.bind(this);
        this._playInputHandlerMove = this._playInputHandlerMove.bind(this);

        this.resizeCanvas();
        window.addEventListener('resize', () => { this.resizeCanvas(); this.render(); });

        this.ui.init();
        this.render();
    }
// fin 1
// debut 2
    get bpNodes() { 
        const sId = this.executingSceneId || this.sm.currentSceneId;
        return this.scripts[sId] ? this.scripts[sId].nodes : []; 
    }
    
    get bpConnections() { 
        const sId = this.executingSceneId || this.sm.currentSceneId;
        return this.scripts[sId] ? this.scripts[sId].connections : []; 
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    get objects() { return this.sm.objects; }

    clearProject() {
        this.sm.scenes = { scene1: [] };
        this.sm.currentSceneId = 'scene1';
        this.scripts = { 'scene1': { nodes: [], connections: [] } };
        this.selectedObjectId = null;
        this.executingSceneId = null;
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        this.activeCollisions = new Set();
        if (this.activeSounds) {
            this.activeSounds.forEach(a => { a.pause(); a.currentTime = 0; });
        }
        this.activeSounds = [];
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraTarget = null;
    }

    updateTreeview() { this.ui.updateTreeview(); }
    updateInspector() { this.ui.updateInspector(); }
    updateAssetsUI() { this.ui.updateAssetsUI(); }

    screenToWorld(screenX, screenY) {
        const rect = this.canvas.getBoundingClientRect();
        if (this.isPlaying) {
            return { 
                x: (screenX - rect.left) + (this.cameraX || 0), 
                y: (screenY - rect.top) + (this.cameraY || 0) 
            };
        }
        return { 
            x: ((screenX - rect.left) - this.panX) / this.zoom, 
            y: ((screenY - rect.top) - this.panY) / this.zoom 
        };
    }

    addObject(type) {
        const count = this.objects.length + 1;
        let objectColor = type === 'circle' ? '#54a0ff' : (type === 'button' ? '#2ed573' : (type === 'text' ? '#ffffff' : '#ff4757'));

        const newObj = {
            id: `obj_${Date.now()}`,
            name: `${type.toUpperCase()}_${count}`,
            type: type,
            x: Math.round(150 - (this.panX / this.zoom)),
            y: Math.round(150 - (this.panY / this.zoom)),
            w: 120, h: 80, r: 45, 
            color: objectColor,
            opacity: 1,
            zIndex: count, 
            visible: true,
            assetId: '', 
            text: type === 'button' || type === 'text' ? 'Mon Texte' : '',
            fontSize: 20,
            angle: 0,
            filter: 'none'
        };
        
        this.objects.push(newObj);
        this.selectedObjectId = newObj.id;
        this.updateTreeview();
        this.updateInspector();
        this.render();
        return newObj;
    }
// fin 2
// debut 3
    getHitObject(worldX, worldY) {
        const sorted = [...this.objects].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
        return sorted.find(obj => {
            if (!obj.visible) return false;
            
            let checkX = worldX;
            let checkY = worldY;
            
            // Les HUD ignorent la caméra, il faut donc compenser leurs coordonnées
            if (this.isPlaying && obj.isHUD) {
                checkX -= (this.cameraX || 0);
                checkY -= (this.cameraY || 0);
            }

            if (obj.type === 'rect' || obj.type === 'button') {
                return checkX >= obj.x && checkX <= obj.x + obj.w && checkY >= obj.y && checkY <= obj.y + obj.h;
            } else if (obj.type === 'circle') {
                return Math.hypot(checkX - obj.x, checkY - obj.y) <= obj.r;
            } else if (obj.type === 'text') {
                return checkX >= obj.x && checkX <= obj.x + 140 && checkY >= obj.y && checkY <= obj.y + 30;
            }
            return false;
        });
    }

    checkCollision(a, b) {
        const getBox = (obj) => {
            if (obj.type === 'circle') return null;
            const w = obj.type === 'text' ? 140 : (obj.w || 0);
            const h = obj.type === 'text' ? 30 : (obj.h || 0);
            return { x: obj.x, y: obj.y, w: w, h: h };
        };

        const isCircleA = a.type === 'circle';
        const isCircleB = b.type === 'circle';

        if (!isCircleA && !isCircleB) {
            const boxA = getBox(a);
            const boxB = getBox(b);
            return boxA.x < boxB.x + boxB.w && boxA.x + boxA.w > boxB.x &&
                   boxA.y < boxB.y + boxB.h && boxA.y + boxA.h > boxB.y;
        } else if (isCircleA && isCircleB) {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return (dx * dx + dy * dy) < ((a.r + b.r) * (a.r + b.r));
        } else {
            const circle = isCircleA ? a : b;
            const rect = isCircleA ? getBox(b) : getBox(a);
            const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
            const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
            const dx = circle.x - closestX;
            const dy = circle.y - closestY;
            return (dx * dx + dy * dy) < (circle.r * circle.r);
        }
    }

    getHitHandle(obj, worldX, worldY) {
        if (!obj) return null;
        const s = this.handleSize / this.zoom;
        if (obj.type === 'rect' || obj.type === 'button' || obj.type === 'text') {
            const width = obj.type === 'text' ? 140 : obj.h ? obj.w : 140;
            const height = obj.type === 'text' ? 32 : obj.h ? obj.h : 32;
            const handles = { tl: { x: obj.x, y: obj.y }, tr: { x: obj.x + width, y: obj.y }, bl: { x: obj.x, y: obj.y + height }, br: { x: obj.x + width, y: obj.y + height } };
            for (const [name, p] of Object.entries(handles)) {
                if (worldX >= p.x - s && worldX <= p.x + s && worldY >= p.y - s && worldY <= p.y + s) return name;
            }
        } else if (obj.type === 'circle') {
            if (worldX >= obj.x + obj.r - s && worldX <= obj.x + obj.r + s && worldY >= obj.y - s && worldY <= obj.y + s) return 'radius';
        }
        return null;
    }

    resizeObject(obj, handle, worldPos) {
        const minSize = 15;
        if (handle === 'radius' && obj.type === 'circle') { obj.r = Math.max(minSize, Math.round(worldPos.x - obj.x)); return; }
        if (obj.type === 'text') { if (handle === 'br' || handle === 'tr') obj.fontSize = Math.max(10, Math.round(worldPos.y - obj.y)); return; }
        if (handle === 'br') { obj.w = Math.max(minSize, Math.round(worldPos.x - obj.x)); obj.h = Math.max(minSize, Math.round(worldPos.y - obj.y)); } 
        else if (handle === 'bl') { const oldRight = obj.x + obj.w; obj.x = Math.min(oldRight - minSize, Math.round(worldPos.x)); obj.w = oldRight - obj.x; obj.h = Math.max(minSize, Math.round(worldPos.y - obj.y)); } 
        else if (handle === 'tr') { obj.w = Math.max(minSize, Math.round(worldPos.x - obj.x)); const oldBottom = obj.y + obj.h; obj.y = Math.min(oldBottom - minSize, Math.round(worldPos.y)); obj.h = oldBottom - obj.y; } 
        else if (handle === 'tl') { const oldRight = obj.x + obj.w; const oldBottom = obj.y + obj.h; obj.x = Math.min(oldRight - minSize, Math.round(worldPos.x)); obj.y = Math.min(oldBottom - minSize, Math.round(worldPos.y)); obj.w = oldRight - obj.x; obj.h = oldBottom - obj.y; }
    }
// fin 3
// debut 4
    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        if (!this.isPlaying) {
            this.ctx.translate(this.panX, this.panY);
            this.ctx.scale(this.zoom, this.zoom);
        }

        if (this.showGrid && !this.isPlaying) {
            this.ctx.strokeStyle = '#2a2a38';
            this.ctx.lineWidth = 0.5;
            const gridSize = 40;
            const startX = Math.floor((-this.panX) / this.zoom / gridSize) * gridSize - gridSize;
            const endX = startX + (this.canvas.width / this.zoom) + gridSize * 2;
            const startY = Math.floor((-this.panY) / this.zoom / gridSize) * gridSize - gridSize;
            const endY = startY + (this.canvas.height / this.zoom) + gridSize * 2;
            for (let x = startX; x < endX; x += gridSize) { this.ctx.beginPath(); this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY); this.ctx.stroke(); }
            for (let y = startY; y < endY; y += gridSize) { this.ctx.beginPath(); this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y); this.ctx.stroke(); }
        }

        const sorted = [...this.objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        sorted.forEach(obj => {
            if (!obj.visible) return;
            this.ctx.save();
            
            // La caméra affecte tout SAUF le HUD pendant le jeu
            if (this.isPlaying && !obj.isHUD) {
                this.ctx.translate(-(this.cameraX || 0), -(this.cameraY || 0));
            }

            this.ctx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1;
            this.ctx.filter = obj.filter || 'none';

            if (obj.angle) {
                const centerX = obj.type === 'circle' ? obj.x : obj.x + obj.w / 2;
                const centerY = obj.type === 'circle' ? obj.y : obj.y + obj.h / 2;
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(obj.angle * Math.PI / 180);
                this.ctx.translate(-centerX, -centerY);
            }

            if (obj.type === 'rect') {
                const asset = this.am.getAsset(obj.assetId);
                if (asset && asset.img && asset.img.complete) { this.ctx.drawImage(asset.img, obj.x, obj.y, obj.w, obj.h); } 
                else { this.ctx.fillStyle = obj.color; this.ctx.fillRect(obj.x, obj.y, obj.w, obj.h); }
            } else if (obj.type === 'circle') {
                const asset = this.am.getAsset(obj.assetId);
                if (asset && asset.img && asset.img.complete) {
                    this.ctx.save(); this.ctx.beginPath(); this.ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2); this.ctx.clip(); 
                    this.ctx.drawImage(asset.img, obj.x - obj.r, obj.y - obj.r, obj.r * 2, obj.r * 2); this.ctx.restore();
                } else {
                    this.ctx.fillStyle = obj.color; this.ctx.beginPath(); this.ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2); this.ctx.fill();
                }
            } else if (obj.type === 'button') {
                const asset = this.am.getAsset(obj.assetId);
                if (asset && asset.img && asset.img.complete) { this.ctx.drawImage(asset.img, obj.x, obj.y, obj.w, obj.h); } 
                else { this.ctx.fillStyle = obj.color; this.ctx.fillRect(obj.x, obj.y, obj.w, obj.h); }
                this.ctx.fillStyle = obj.textColor || '#ffffff';
                this.ctx.font = `${obj.fontSize || 16}px sans-serif`;
                this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
                this.ctx.fillText(obj.text || '', obj.x + obj.w / 2, obj.y + obj.h / 2);
            } else if (obj.type === 'text') {
                this.ctx.fillStyle = obj.color || '#ffffff';
                this.ctx.font = `${obj.fontSize || 20}px sans-serif`;
                this.ctx.textBaseline = 'top'; 
                this.ctx.fillText(obj.text || 'Mon Texte', obj.x, obj.y);
            }

            this.ctx.filter = 'none';

            if (obj.id === this.selectedObjectId) {
                this.ctx.strokeStyle = '#6366f1'; this.ctx.lineWidth = 2 / this.zoom; this.ctx.fillStyle = '#ffffff';
                const s = this.handleSize / this.zoom;
                if (obj.type === 'rect' || obj.type === 'button') {
                    this.ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
                    [{x: obj.x, y: obj.y}, {x: obj.x + obj.w, y: obj.y}, {x: obj.x, y: obj.y + obj.h}, {x: obj.x + obj.w, y: obj.y + obj.h}].forEach(p => this.ctx.fillRect(p.x - s/2, p.y - s/2, s, s));
                } else if (obj.type === 'circle') {
                    this.ctx.beginPath(); this.ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2); this.ctx.stroke(); this.ctx.fillRect(obj.x + obj.r - s/2, obj.y - s/2, s, s);
                } else if (obj.type === 'text') {
                    this.ctx.strokeRect(obj.x - 4, obj.y - 4, 140, 32);
                    [{x: obj.x - 4, y: obj.y - 4}, {x: obj.x + 136, y: obj.y - 4}, {x: obj.x - 4, y: obj.y + 28}, {x: obj.x + 136, y: obj.y + 28}].forEach(p => this.ctx.fillRect(p.x - s/2, p.y - s/2, s, s));
                }
            }
            this.ctx.restore();
        });
        this.ctx.restore();
    }
// fin 4
// debut 5
    loadBlueprint(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!this.scripts[this.sm.currentSceneId]) this.scripts[this.sm.currentSceneId] = { nodes: [], connections: [] };
            this.scripts[this.sm.currentSceneId].nodes = data.nodes || [];
            this.scripts[this.sm.currentSceneId].connections = data.connections || [];
            console.log("Blueprint chargé pour la scène :", this.sm.currentSceneId);
        } catch (error) {
            console.error("Erreur de chargement du Blueprint :", error);
        }
    }

    _triggerCollisionNode(targetObj, hitObj) {
        const activeScenes = [this.sm.currentSceneId];
        this.objects.forEach(o => { 
            if (o.isHUD && o.hudSource && !activeScenes.includes(o.hudSource)) activeScenes.push(o.hudSource); 
        });

        const prevSceneId = this.executingSceneId;
        activeScenes.forEach(sceneId => {
            this.executingSceneId = sceneId;
            const activeScript = this.scripts[sceneId] || { nodes: [], connections: [] };
            const colNodes = activeScript.nodes.filter(node => node.title.trim() === "En collision 💥");
            for (const node of colNodes) {
                const inConn = activeScript.connections.find(c => c.toNode === node.id && c.toPin.trim() === "Cible");
                if (inConn) {
                    const expectedObj = this.evaluateDataNode(inConn.fromNode, inConn.fromPin, {});
                    if (expectedObj && expectedObj.id === targetObj.id) {
                        this.executeNextNodes(node, "Suite", { target: targetObj, hitObject: hitObj }, sceneId);
                    }
                }
            }
        });
        this.executingSceneId = prevSceneId;
    }

    playSound(soundName, volume = 1, loop = false) {
        if (!this.isPlaying) return;
        const asset = this.am.getAsset(soundName);
        if (asset && (asset.data || asset.url || asset.base64)) {
            const src = asset.data || asset.url || asset.base64;
            const audio = new Audio(src);
            audio.volume = Math.max(0, Math.min(1, volume));
            audio.loop = loop;
            audio.play().catch(e => console.warn("Erreur lecture son :", e));
            
            this.activeSounds = this.activeSounds || [];
            this.activeSounds.push(audio);
            audio.addEventListener('ended', () => {
                this.activeSounds = this.activeSounds.filter(a => a !== audio);
            });
        }
    }

    _playInputHandlerDown(e) { 
        if (!this.isPlaying) return;
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        this.playTouchX = worldPos.x;
        this.playTouchY = worldPos.y;
        
        this.triggerEvent("Appui écran 👆", { x: e.clientX, y: e.clientY }); 

        const clickedObj = this.getHitObject(worldPos.x, worldPos.y);
        
        if (clickedObj) {
            const activeScenes = [this.sm.currentSceneId];
            this.objects.forEach(o => { 
                if (o.isHUD && o.hudSource && !activeScenes.includes(o.hudSource)) activeScenes.push(o.hudSource); 
            });

            const prevSceneId = this.executingSceneId;

            activeScenes.forEach(sceneId => {
                this.executingSceneId = sceneId;
                const activeScript = this.scripts[sceneId] || { nodes: [], connections: [] };
                const clickNodes = activeScript.nodes.filter(node => node.title.trim() === "Clic sur un Objet 🖱️");
                for (const node of clickNodes) {
                    const inConn = activeScript.connections.find(c => c.toNode === node.id && c.toPin.trim() === "Cible");
                    if (inConn) {
                        const expectedObj = this.evaluateDataNode(inConn.fromNode, inConn.fromPin, {});
                        if (expectedObj && expectedObj.id === clickedObj.id) {
                            this.executeNextNodes(node, "Suite", { target: clickedObj }, sceneId);
                        }
                    }
                }
            });
            this.executingSceneId = prevSceneId;
        }
    }
    
    _playInputHandlerMove(e) {
        if (!this.isPlaying) return;
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        this.playTouchX = worldPos.x;
        this.playTouchY = worldPos.y;
    }

    _playInputHandlerUp(e) { 
        if (this.isPlaying) this.triggerEvent("Relâchement écran 🖱️", { x: e.clientX, y: e.clientY }); 
    }
// fin 5
// debut 6
    startPlayMode() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.selectedObjectId = null; 
        this.draggedGameObjects = []; 
        this.executingSceneId = this.sm.currentSceneId;
        this.activeCollisions = new Set();
        this.activeSounds = [];
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraTarget = null;
        
        this.gameVariables = {}; 
        if (this.variables && Array.isArray(this.variables)) {
            this.variables.forEach(v => {
                let parsedVal = parseFloat(v.value);
                this.gameVariables[v.name] = isNaN(parsedVal) ? v.value : parsedVal;
            });
        }
        
        this.lastTime = performance.now();
        this.initialScenesBackup = JSON.parse(JSON.stringify(this.sm.scenes));
        this.initialSceneId = this.sm.currentSceneId;
        
        this.canvas.addEventListener('pointerdown', this._playInputHandlerDown);
        this.canvas.addEventListener('pointermove', this._playInputHandlerMove);
        this.canvas.addEventListener('pointerup', this._playInputHandlerUp);
        
        this.triggerEvent("Au démarrage");
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    stopPlayMode() {
        this.isPlaying = false;
        this.draggedGameObjects = [];
        this.activeCollisions = new Set();
        this.executingSceneId = null;
        this.canvas.removeEventListener('pointerdown', this._playInputHandlerDown);
        this.canvas.removeEventListener('pointermove', this._playInputHandlerMove);
        this.canvas.removeEventListener('pointerup', this._playInputHandlerUp);
        
        if (this.activeSounds) {
            this.activeSounds.forEach(a => { a.pause(); a.currentTime = 0; });
            this.activeSounds = [];
        }
        
        this.cameraX = 0;
        this.cameraY = 0;
        this.cameraTarget = null;

        if (this.initialScenesBackup) {
            for (let sceneId in this.initialScenesBackup) {
                if (this.sm.scenes[sceneId]) {
                    this.sm.scenes[sceneId].length = 0; 
                    this.initialScenesBackup[sceneId].forEach(obj => {
                        this.sm.scenes[sceneId].push(JSON.parse(JSON.stringify(obj))); 
                    });
                }
            }
            this.sm.currentSceneId = this.initialSceneId || 'scene1';
            
            const selectScene = document.getElementById('select-scene');
            if (selectScene) selectScene.value = this.sm.currentSceneId;
        }
        
        this.updateTreeview();
        this.render();
    }

    gameLoop(timestamp) {
        if (!this.isPlaying) return;
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // --- CAMERA ---
        if (this.cameraTarget) {
            let tx = this.cameraTarget.x;
            let ty = this.cameraTarget.y;
            if (this.cameraTarget.type === 'rect' || this.cameraTarget.type === 'button') {
                tx += (this.cameraTarget.w || 0) / 2;
                ty += (this.cameraTarget.h || 0) / 2;
            }
            const targetCamX = tx - (this.canvas.width / 2);
            const targetCamY = ty - (this.canvas.height / 2);
            
            this.cameraX += (targetCamX - (this.cameraX || 0)) * (this.cameraLerp || 1);
            this.cameraY += (targetCamY - (this.cameraY || 0)) * (this.cameraLerp || 1);
        }

        if (this.draggedGameObjects && this.draggedGameObjects.length > 0) {
            this.draggedGameObjects.forEach(obj => {
                let pX = this.playTouchX;
                let pY = this.playTouchY;
                if (obj.isHUD) {
                    pX -= (this.cameraX || 0);
                    pY -= (this.cameraY || 0);
                }
                obj.x = pX - (obj.dragOffsetX || 0);
                obj.y = pY - (obj.dragOffsetY || 0);
            });
        }

        this.objects.forEach(obj => {
            if (obj.currentAnim) {
                obj.currentAnim.timer += deltaTime;
                const frameDuration = 1 / (obj.currentAnim.fps || 12);
                
                if (obj.currentAnim.timer >= frameDuration) {
                    obj.currentAnim.timer = 0;
                    obj.currentAnim.frameIndex++;
                    
                    if (obj.currentAnim.frameIndex >= obj.currentAnim.frames.length) {
                        if (obj.currentAnim.loop) {
                            obj.currentAnim.frameIndex = 0;
                            obj.assetId = obj.currentAnim.frames[obj.currentAnim.frameIndex];
                        } else {
                            obj.currentAnim = null; 
                        }
                    } else {
                        obj.assetId = obj.currentAnim.frames[obj.currentAnim.frameIndex];
                    }
                }
            }
        });

        this.activeCollisions = this.activeCollisions || new Set();
        const currentCollisions = new Set();

        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const a = this.objects[i];
                const b = this.objects[j];
                if (!a.visible || !b.visible) continue;

                if (this.checkCollision(a, b)) {
                    const pairId = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
                    currentCollisions.add(pairId);

                    if (!this.activeCollisions.has(pairId)) {
                        this.activeCollisions.add(pairId);
                        this._triggerCollisionNode(a, b);
                        this._triggerCollisionNode(b, a);
                    }
                }
            }
        }
        this.activeCollisions = currentCollisions;

        this.triggerEvent("À chaque frame", { deltaTime });
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    triggerEvent(eventTitle, eventData = {}) {
        const activeScenes = [this.sm.currentSceneId];
        this.objects.forEach(o => { 
            if (o.isHUD && o.hudSource && !activeScenes.includes(o.hudSource)) activeScenes.push(o.hudSource); 
        });
        
        const prevSceneId = this.executingSceneId;
        
        activeScenes.forEach(sceneId => {
            this.executingSceneId = sceneId;
            const activeScript = this.scripts[sceneId] || { nodes: [], connections: [] };
            const eventNodes = activeScript.nodes.filter(node => node.title.trim() === eventTitle.trim());
            for (const node of eventNodes) {
                this.executeNextNodes(node, null, { ...eventData, target: null }, sceneId);
            }
        });
        
        this.executingSceneId = prevSceneId;
    }

    executeNextNodes(currentNode, outPinName, context, sceneId = null) {
        const currentExecScene = sceneId || this.executingSceneId || this.sm.currentSceneId;
        const prevSceneId = this.executingSceneId;
        this.executingSceneId = currentExecScene;

        const activeScript = this.scripts[currentExecScene] || { nodes: [], connections: [] };
        const outConnections = activeScript.connections.filter(c => 
            c.fromNode === currentNode.id && (!outPinName || c.fromPin.trim() === outPinName.trim())
        );
        
        for (const conn of outConnections) {
            const nextNode = activeScript.nodes.find(n => n.id === conn.toNode);
            if (nextNode) {
                const nextContext = { ...context };
                const autoContinue = this.evaluateNode(nextNode, nextContext);
                if (autoContinue !== false) {
                    this.executeNextNodes(nextNode, "Suite", nextContext, currentExecScene);
                    this.executeNextNodes(nextNode, "Continuer", nextContext, currentExecScene);
                }
            }
        }
        
        this.executingSceneId = prevSceneId;
    }

    evaluateDataNode(nodeId, pinName, context) {
        return window.NodesInterpreter.evaluateDataNode(this, nodeId, pinName, context);
    }

    evaluateNode(node, context) {
        const getHUDs = () => Array.from(new Set(this.objects.filter(o => o.isHUD).map(o => o.hudSource)));
        const beforeHUDs = getHUDs();

        const result = window.NodesInterpreter.evaluateNode(this, node, context);

        const afterHUDs = getHUDs();
        if (afterHUDs.length > beforeHUDs.length) {
            afterHUDs.forEach(hudId => {
                if (!beforeHUDs.includes(hudId)) {
                    const prevSceneId = this.executingSceneId;
                    this.executingSceneId = hudId;
                    const activeScript = this.scripts[hudId] || { nodes: [], connections: [] };
                    const eventNodes = activeScript.nodes.filter(n => n.title.trim() === "Au démarrage");
                    for (const n of eventNodes) {
                        this.executeNextNodes(n, null, { target: null }, hudId);
                    }
                    this.executingSceneId = prevSceneId;
                }
            });
        }

        return result;
    }
}
// fin 6

