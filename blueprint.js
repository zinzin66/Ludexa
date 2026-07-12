/**
 * Ludexa - Module Blueprint Isolé - VERSION FINALE
 * Nœuds agrandis, Système de Liaisons tactiles, Accordéons dynamiques, et SUPPRESSION DE CONNEXIONS
 * - Croix de suppression sur les blocs
 * - Masquage et blocage de l'entrée gauche pour les Événements
 * - Détection de clic/tapotement sur les connexions
 * - Suppression immédiate des connexions
 */

class BlueprintEditor {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        
        this.isPanning = false;
        this.draggedNode = null;
        this.connectingFromNode = null;

        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.spawnCount = 0;
        
        this.tempLineX = 0;
        this.tempLineY = 0;

        this.lastPointerDownPos = { x: 0, y: 0 };
        this.pointerDownTime = 0;

        this.initUI();
        this.initElements();
        this.initEvents();
        this.resizeCanvas();
    }

    distanceToQuadraticBezier(px, py, x1, y1, x2, y1_ctrl, x3, y2_ctrl, x4, y2) {
        let minDist = Infinity;
        const steps = 20;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const mt = 1 - t;

            const x = mt * mt * mt * x1 +
                      3 * mt * mt * t * x2 +
                      3 * mt * t * t * x3 +
                      t * t * t * x4;

            const y = mt * mt * mt * y1 +
                      3 * mt * mt * t * y1_ctrl +
                      3 * mt * t * t * y2_ctrl +
                      t * t * t * y2;

            const dx = px - x;
            const dy = py - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) minDist = dist;
        }

        return minDist;
    }

    findNearestConnection(mouseX, mouseY, maxDistance = 20) {
        let nearest = null;
        let minDist = maxDistance;

        this.connections.forEach((c, idx) => {
            const fromNode = this.nodes.find(n => n.id === c.from);
            const toNode = this.nodes.find(n => n.id === c.to);

            if (!fromNode || !toNode) return;

            const x1 = fromNode.x + fromNode.w;
            const y1 = fromNode.y + fromNode.h / 2 + 8;
            const x4 = toNode.x;
            const y4 = toNode.y + toNode.h / 2 + 8;

            const x2 = x1 + 50;
            const y2 = y1;
            const x3 = x4 - 50;
            const y3 = y4;

            const dist = this.distanceToQuadraticBezier(mouseX, mouseY, x1, y1, x2, y2, x3, y3, x4, y4);

            if (dist < minDist) {
                minDist = dist;
                nearest = { connectionIndex: idx, distance: dist };
            }
        });

        return nearest;
    }

    initUI() {
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
                .bp-static-item { padding: 10px; font-size: 13px; background: #1e1e24; border-radius: 6px; border-left: 4px solid #3b82f6; color: #b3b3cb; }
            `;
            document.head.appendChild(style);
        }

        const modal = document.getElementById('blueprint-modal');
        const canvasContainer = modal.querySelector('div[style*="flex: 1"]');

        if (canvasContainer && !document.querySelector('.bp-layout')) {
            const layout = document.createElement('div');
            layout.className = 'bp-layout';

            layout.innerHTML = `
                <aside class="bp-sidebar-left">
                    <div class="bp-panel">
                        <div class="bp-panel-header">⚡ Événements <span>▼</span></div>
                        <div class="bp-panel-content">
                            <button class="bp-btn-item bp-create-node" data-title="Au démarrage" data-color="#e67e22">Au démarrage</button>
                            <button class="bp-btn-item bp-create-node" data-title="À chaque frame" data-color="#e67e22">À chaque frame</button>
                        </div>
                    </div>
                    <div class="bp-panel">
                        <div class="bp-panel-header">📦 Logique <span>▼</span></div>
                        <div class="bp-panel-content">
                            <button class="bp-btn-item bp-create-node" data-title="Condition Si" data-color="#4f46e5">Condition Si</button>
                            <button class="bp-btn-item bp-create-node" data-title="Attendre X sec" data-color="#4f46e5">Attendre X sec</button>
                        </div>
                    </div>
                    <div class="bp-panel">
                        <div class="bp-panel-header">👾 Objets Scène <span>▼</span></div>
                        <div class="bp-panel-content" id="bp-objects-list"></div>
                    </div>
                </aside>

                <aside class="bp-sidebar-right">
                    <div class="bp-panel">
                        <div class="bp-panel-header">🎬 Scènes <span>▼</span></div>
                        <div class="bp-panel-content" id="bp-scenes-list"></div>
                    </div>
                    <div class="bp-panel">
                        <div class="bp-panel-header">📊 Variables <span>▼</span></div>
                        <div class="bp-panel-content">
                            <div class="bp-static-item">🔑 score (Nombre)</div>
                            <div class="bp-static-item">🔑 estFini (Booléen)</div>
                        </div>
                    </div>
                </aside>
            `;
            canvasContainer.appendChild(layout);
        }
    }

    initElements() {
        this.modal = document.getElementById('blueprint-modal');
        this.canvas = document.getElementById('blueprint-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.canvas.style.touchAction = 'none';
        }
    }

    initEvents() {
        if (!this.canvas) return;

        const closeBtn = document.getElementById('btn-close-blueprint');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                this.close();
            };
        }

        document.querySelectorAll('.bp-panel-header').forEach(header => {
            header.onclick = (e) => {
                e.preventDefault();
                const panel = header.parentElement;
                panel.classList.toggle('collapsed');
                const icon = header.querySelector('span');
                if (icon) icon.textContent = panel.classList.contains('collapsed') ? '►' : '▼';
            };
        });

        document.querySelectorAll('.bp-create-node').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.addNode(btn.getAttribute('data-title'), btn.getAttribute('data-color'));
            };
        });

        this.canvas.addEventListener('pointerdown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - this.panX) / this.zoom;
            const mouseY = (e.clientY - rect.top - this.panY) / this.zoom;

            this.lastPointerDownPos = { x: mouseX, y: mouseY };
            this.pointerDownTime = Date.now();

            this.draggedNode = null;
            this.connectingFromNode = null;

            const nearestConn = this.findNearestConnection(mouseX, mouseY, 20);
            if (nearestConn && !this.draggedNode && !this.connectingFromNode) {
                this._connectionToDelete = nearestConn.connectionIndex;
                this.canvas.setPointerCapture(e.pointerId);
                return;
            }

            for (let i = this.nodes.length - 1; i >= 0; i--) {
                const n = this.nodes[i];
                
                if (mouseX >= n.x + n.w - 28 && mouseX <= n.x + n.w && mouseY >= n.y && mouseY <= n.y + 26) {
                    this.connections = this.connections.filter(c => c.from !== n.id && c.to !== n.id);
                    this.nodes.splice(i, 1);
                    this.draw();
                    return;
                }

                const outX = n.x + n.w;
                const outY = n.y + n.h / 2 + 8;
                if (Math.hypot(mouseX - outX, mouseY - outY) < 16) {
                    this.connectingFromNode = n;
                    this.tempLineX = e.clientX;
                    this.tempLineY = e.clientY;
                    this.canvas.setPointerCapture(e.pointerId);
                    return;
                }

                if (mouseX >= n.x && mouseX <= n.x + n.w && mouseY >= n.y && mouseY <= n.y + n.h) {
                    this.draggedNode = n;
                    this.dragOffsetX = mouseX - n.x;
                    this.dragOffsetY = mouseY - n.y;
                    
                    this.nodes.push(this.nodes.splice(i, 1)[0]);
                    this.canvas.setPointerCapture(e.pointerId);
                    return;
                }
            }

            this.isPanning = true;
            this.startX = e.clientX - this.panX;
            this.startY = e.clientY - this.panY;
            this.canvas.style.cursor = 'grabbing';
            this.canvas.setPointerCapture(e.pointerId);
        });

        this.canvas.addEventListener('pointermove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            
            if (this.draggedNode) {
                const mouseX = (e.clientX - rect.left - this.panX) / this.zoom;
                const mouseY = (e.clientY - rect.top - this.panY) / this.zoom;
                this.draggedNode.x = mouseX - this.dragOffsetX;
                this.draggedNode.y = mouseY - this.dragOffsetY;
                this.draw();
            } else if (this.connectingFromNode) {
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

            if (this._connectionToDelete !== undefined) {
                const movedDistance = Math.hypot(
                    mouseX - this.lastPointerDownPos.x,
                    mouseY - this.lastPointerDownPos.y
                );
                
                if (movedDistance < 10) {
                    this.connections.splice(this._connectionToDelete, 1);
                    this.draw();
                }
                
                this._connectionToDelete = undefined;
            }

            if (this.connectingFromNode) {
                let connected = false;
                for (let n of this.nodes) {
                    if (n !== this.connectingFromNode) {
                        
                        if (n.title === "Au démarrage" || n.title === "À chaque frame") {
                            continue;
                        }

                        const inX = n.x;
                        const inY = n.y + n.h / 2 + 8;
                        if (Math.hypot(mouseX - inX, mouseY - inY) < 18) {
                            const exist = this.connections.some(c => c.from === this.connectingFromNode.id && c.to === n.id);
                            if (!exist) {
                                this.connections.push({
                                    from: this.connectingFromNode.id,
                                    to: n.id
                                });
                            }
                            connected = true;
                            break;
                        }
                    }
                }
            }

            this.isPanning = false;
            this.draggedNode = null;
            this.connectingFromNode = null;
            if (this.canvas) {
                this.canvas.style.cursor = 'grab';
                try { this.canvas.releasePointerCapture(e.pointerId); } catch(err) {}
            }
            this.draw();
        });

        this.canvas.addEventListener('pointercancel', () => {
            this.isPanning = false;
            this.draggedNode = null;
            this.connectingFromNode = null;
            this._connectionToDelete = undefined;
            this.draw();
        });

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    refreshData() {
        const selectScene = document.getElementById('select-scene');
        const scenesList = document.getElementById('bp-scenes-list');
        if (scenesList && selectScene) {
            let html = '';
            Array.from(selectScene.options).forEach(opt => {
                html += `<div class="bp-static-item">🎬 ${opt.text}</div>`;
            });
            scenesList.innerHTML = html || '<div style="color:#575767;font-size:12px;">Aucune scène</div>';
        }

        const treeview = document.getElementById('treeview');
        const objectsList = document.getElementById('bp-objects-list');
        if (objectsList) {
            let html = '';
            if (treeview && treeview.children.length > 0) {
                Array.from(treeview.querySelectorAll('li')).forEach(li => {
                    const txt = li.textContent.trim();
                    html += `<button class="bp-btn-item bp-dynamic-obj" data-title="${txt}">${txt}</button>`;
                });
            } else {
                html += `<button class="bp-btn-item bp-dynamic-obj" data-title="Joueur (Hero)">Hero 🕹️</button>`;
                html += `<button class="bp-btn-item bp-dynamic-obj" data-title="Ennemi (Goblin)">Goblin 👾</button>`;
            }
            objectsList.innerHTML = html;

            objectsList.querySelectorAll('.bp-dynamic-obj').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.addNode(btn.getAttribute('data-title'), '#2ed573');
                };
            });
        }
    }

    addNode(title, color) {
        const cX = (this.canvas.width / 2 - this.panX) / this.zoom - 90;
        const cY = (this.canvas.height / 2 - this.panY) / this.zoom - 40;

        this.spawnCount++;
        const offset = (this.spawnCount % 5) * 30;

        this.nodes.push({
            id: Date.now() + Math.random().toString(16),
            title: title,
            x: cX + offset,
            y: cY + offset,
            w: 180,
            h: 80,
            color: color || '#3b82f6'
        });
        this.draw();
    }

    draw() {
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
        for (let x = startX; x < endX; x += gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }
        for (let y = startY; y < endY; y += gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();

        this.ctx.lineWidth = 3;
        this.connections.forEach(c => {
            const fromNode = this.nodes.find(n => n.id === c.from);
            const toNode = this.nodes.find(n => n.id === c.to);
            
            if (fromNode && toNode) {
                const x1 = fromNode.x + fromNode.w;
                const y1 = fromNode.y + fromNode.h / 2 + 8;
                const x2 = toNode.x;
                const y2 = toNode.y + toNode.h / 2 + 8;

                this.ctx.strokeStyle = '#a0aec0';
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.bezierCurveTo(x1 + 50, y1, x2 - 50, y2, x2, y2);
                this.ctx.stroke();
            }
        });

        if (this.connectingFromNode) {
            const rect = this.canvas.getBoundingClientRect();
            const x1 = this.connectingFromNode.x + this.connectingFromNode.w;
            const y1 = this.connectingFromNode.y + this.connectingFromNode.h / 2 + 8;
            const x2 = (this.tempLineX - rect.left - this.panX) / this.zoom;
            const y2 = (this.tempLineY - rect.top - this.panY) / this.zoom;

            this.ctx.strokeStyle = '#e2e8f0';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.bezierCurveTo(x1 + 40, y1, x2 - 40, y2, x2, y2);
            this.ctx.stroke();
        }

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
            this.ctx.font = 'bold 13px sans-serif';
            this.ctx.fillText('✕', n.x + n.w - 18, n.y + 17);

            const dotRadius = 6;
            this.ctx.fillStyle = '#a0aec0';
            
            this.ctx.beginPath();
            
            const isEventBlock = (n.title === "Au démarrage" || n.title === "À chaque frame");
            if (!isEventBlock) {
                this.ctx.arc(n.x, n.y + n.h / 2 + 8, dotRadius, 0, Math.PI * 2);
            }
            
            this.ctx.arc(n.x + n.w, n.y + n.h / 2 + 8, dotRadius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.restore();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
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
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
}

window.ludexaBlueprint = new BlueprintEditor();

document.getElementById('btn-open-blueprint').addEventListener('click', () => {
    window.ludexaBlueprint.open();
});
