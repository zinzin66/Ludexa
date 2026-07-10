import { SceneManager } from './scenes.js';
import { AssetManager } from './assets.js';
import { UIManager } from './ui.js';
import { InputManager } from './input.js';

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
        this.ui = new UIManager(this);
        this.input = new InputManager(this);
        
        this.selectedObjectId = null;
        this.isPointerDown = false;
        this.lastPointer = { x: 0, y: 0 };
        this.draggedObject = null;
        this.dragOffset = { x: 0, y: 0 };
        this.activeHandle = null; 
        this.handleSize = 24; // Augmenté à 24 pour que ce soit encore plus facile à viser avec le doigt !

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

    updateTreeview() { this.ui.updateTreeview(); }
    updateInspector() { this.ui.updateInspector(); }
    updateAssetsUI() { this.ui.updateAssetsUI(); }

    // CORRECTION ICI : "top" devient bien "rect.top" pour que le clic au doigt tombe pile au bon endroit
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
            text: type === 'button' || type === 'text' ? 'Mon Texte' : ''
        };
        
        this.objects.push(newObj);
        this.selectedObjectId = newObj.id;
        this.updateTreeview();
        this.updateInspector();
        this.render();
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
        if (!obj || (obj.type !== 'rect' && obj.type !== 'button')) return null;
        const s = this.handleSize / this.zoom;
        
        const handles = {
            tl: { x: obj.x, y: obj.y },
            tr: { x: obj.x + obj.w, y: obj.y },
            bl: { x: obj.x, y: obj.y + obj.h },
            br: { x: obj.x + obj.w, y: obj.y + obj.h }
        };

        for (const [name, p] of Object.entries(handles)) {
            if (worldX >= p.x - s && worldX <= p.x + s && worldY >= p.y - s && worldY <= p.y + s) {
                return name;
            }
        }
        return null;
    }

    resizeObject(obj, handle, worldPos) {
        const minSize = 15;
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

            if (obj.type === 'rect') {
                const asset = this.am.getAsset(obj.assetId);
                if (asset && asset.img && asset.img.complete) {
                    this.ctx.drawImage(asset.img, obj.x, obj.y, obj.w, obj.h);
                } else {
                    this.ctx.fillStyle = obj.color;
                    this.ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
                }
            } else if (obj.type === 'circle') {
                this.ctx.fillStyle = obj.color;
                this.ctx.beginPath();
                this.ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (obj.type === 'button') {
                this.ctx.fillStyle = obj.color;
                this.ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
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

            if (obj.id === this.selectedObjectId) {
                this.ctx.strokeStyle = '#6366f1';
                this.ctx.lineWidth = 2 / this.zoom;
                
                if (obj.type === 'rect' || obj.type === 'button') {
                    this.ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
                    this.ctx.fillStyle = '#ffffff';
                    const s = this.handleSize / this.zoom;
                    const hPoints = [
                        {x: obj.x, y: obj.y}, {x: obj.x + obj.w, y: obj.y},
                        {x: obj.x, y: obj.y + obj.h}, {x: obj.x + obj.w, y: obj.y + obj.h}
                    ];
                    hPoints.forEach(p => this.ctx.fillRect(p.x - s/2, p.y - s/2, s, s));
                } else if (obj.type === 'circle') {
                    this.ctx.beginPath();
                    this.ctx.arc(obj.x, obj.y, obj.r + 2, 0, Math.PI * 2);
                    this.ctx.stroke();
                } else if (obj.type === 'text') {
                    this.ctx.strokeRect(obj.x - 4, obj.y - 4, 140, 32);
                }
            }
            this.ctx.restore();
        });

        this.ctx.restore();
    }
}

