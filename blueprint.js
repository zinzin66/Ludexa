// debut 1
class BlueprintEditor {
    constructor() {
        this.nodes = [];
        this.connections = []; 
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        this.isPanning = false;
        this.draggedNode = null;
        this.connectingFrom = null; 
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.spawnCount = 0;
        this.tempLineX = 0;
        this.tempLineY = 0;
        this.editingNode = null;
        this.editingFieldName = null;
    }

    initElements() {
        this.modal = document.getElementById('blueprint-modal');
        this.canvas = document.getElementById('blueprint-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.canvas.style.touchAction = 'none';
        }
        this.createAdvancedUI();
    }

    initUI() {
        const container = document.getElementById('blueprint-canvas-container');
        if (!container) return;

        container.style.display = 'flex';
        container.style.flexDirection = 'row';
        container.style.height = '100%';
        container.style.overflow = 'hidden';

        const blueprintHeader = document.querySelector('#blueprint-modal header');
        if (blueprintHeader && !document.getElementById('btn-show-code')) {
            const btnShowCode = document.createElement('button');
            btnShowCode.id = 'btn-show-code';
            btnShowCode.textContent = '📄 Voir Code JSON';
            btnShowCode.style.cssText = 'background: #8e44ad; color: white; border: none; padding: 6px 12px; margin-right: 15px; cursor: pointer; border-radius: 4px; font-weight: bold;';
            btnShowCode.onclick = () => {
                const codeOutput = document.getElementById('pro-code-textarea');
                if (codeOutput) {
                    codeOutput.value = JSON.stringify({ nodes: this.nodes, connections: this.connections }, null, 4);
                    document.getElementById('pro-code-modal').style.display = 'flex';
                }
            };
            blueprintHeader.insertBefore(btnShowCode, blueprintHeader.lastElementChild);
        }

        const sidebar = document.createElement('div');
        sidebar.id = 'blueprint-sidebar';
        sidebar.style.cssText = 'width: 240px; height: 100%; box-sizing: border-box; background: #262634; border-right: 2px solid #141419; overflow-y: auto; padding: 10px; padding-bottom: 60px; z-index: 10; display: flex; flex-direction: column; gap: 15px; flex-shrink: 0; touch-action: pan-y;';

        this.refreshCatalogUI = () => {
            sidebar.innerHTML = '<h2 style="color:white; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 5px;">Catalogue</h2>';
            if (window.BlueprintCatalog && window.BlueprintCatalog.categories) {
                window.BlueprintCatalog.categories.forEach(cat => {
                    const catDiv = document.createElement('div');
                    const catName = cat.name || cat.title || cat.category || "Catégorie";
                    const title = document.createElement('div');
                    title.textContent = '▼ ' + catName;
                    title.style.cssText = 'color: #a0aec0; font-size: 13px; font-weight: bold; margin-bottom: 8px; user-select: none; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;';
                    catDiv.appendChild(title);

                    const nodeContainer = document.createElement('div');
                    nodeContainer.style.display = 'flex';
                    nodeContainer.style.flexDirection = 'column';
                    nodeContainer.style.gap = '6px';

                    cat.nodes.forEach(node => {
                        const btn = document.createElement('button');
                        btn.textContent = "+ " + node.title;
                        btn.style.cssText = `background: ${node.color || '#3b82f6'}; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; text-align: left; font-size: 12px; font-weight: bold; touch-action: manipulation;`;
                        btn.onclick = () => this.addNode(node.title, node.color || '#3b82f6');
                        nodeContainer.appendChild(btn);
                    });
                    catDiv.appendChild(nodeContainer);
                    sidebar.appendChild(catDiv);
                });
            }
        };

        this.refreshCatalogUI();
        container.appendChild(sidebar);

        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.cssText = 'flex: 1; position: relative; overflow: hidden; height: 100%;';
        if (this.canvas) {
            canvasWrapper.appendChild(this.canvas);
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
        }
        container.appendChild(canvasWrapper);

        const rightSidebar = document.createElement('div');
        rightSidebar.id = 'blueprint-right-sidebar';
        rightSidebar.style.cssText = 'width: 200px; height: 100%; box-sizing: border-box; background: #262634; border-left: 2px solid #141419; overflow-y: auto; padding: 10px; padding-bottom: 60px; z-index: 10; display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; touch-action: pan-y;';

        this.refreshSceneObjectsUI = () => {
            rightSidebar.innerHTML = '<h2 style="color:white; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 5px;">Objets Scène</h2>';
            let objects = [];
            
            if (window.engine && window.engine.objects) {
                objects = window.engine.objects;
            }
            
            if (objects.length > 0) {
                objects.forEach(obj => {
                    const btn = document.createElement('button');
                    const objName = obj.name || obj.type || "Objet Inconnu";
                    btn.textContent = "📦 " + objName;
                    btn.style.cssText = `background: #e67e22; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; text-align: left; font-size: 12px; font-weight: bold; touch-action: manipulation;`;
                    btn.onclick = () => this.addNode(objName, '#e67e22');
                    rightSidebar.appendChild(btn);
                });
            } else {
                rightSidebar.innerHTML += '<p style="color: #888; font-size: 12px; text-align: center;">Aucun objet dans la scène.</p>';
            }
        };

        this.refreshSceneObjectsUI();
        container.appendChild(rightSidebar);
    }
// fin 1
// debut 2
    createAdvancedUI() {
        if (!document.getElementById('pro-code-modal')) {
            const codeModal = document.createElement('div');
            codeModal.id = 'pro-code-modal';
            codeModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 25000; align-items: center; justify-content: center;';
            codeModal.innerHTML = `
                <div style="background: #2a2a38; width: 80%; height: 80%; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden;">
                    <div style="background: #141419; padding: 15px; color: white; font-weight: bold; display: flex; justify-content: space-between;">
                        <span>📄 Code Généré (JSON)</span>
                        <div>
                            <button id="pro-btn-copy" style="background:#3b82f6; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; margin-right: 10px; font-weight: bold; transition: background 0.2s;">📋 Copier</button>
                            <button onclick="document.getElementById('pro-code-modal').style.display='none'" style="background:#ef4444; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-weight: bold;">Fermer</button>
                        </div>
                    </div>
                    <textarea id="pro-code-textarea" style="flex: 1; background: #1e1e24; color: #2ed573; padding: 15px; font-family: monospace; border: none; resize: none;" readonly></textarea>
                </div>
            `;
            document.body.appendChild(codeModal);

            document.getElementById('pro-btn-copy').onclick = () => {
                const textarea = document.getElementById('pro-code-textarea');
                navigator.clipboard.writeText(textarea.value).then(() => {
                    const btn = document.getElementById('pro-btn-copy');
                    btn.textContent = '✅ Copié !';
                    btn.style.background = '#2ed573';
                    setTimeout(() => {
                        btn.textContent = '📋 Copier';
                        btn.style.background = '#3b82f6';
                    }, 2000);
                }).catch(err => {
                    console.error("Impossible de copier le texte :", err);
                });
            };
        }

        if (!document.getElementById('pro-expr-modal')) {
            const exprModal = document.createElement('div');
            exprModal.id = 'pro-expr-modal';
            exprModal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 25000; align-items: center; justify-content: center;';
            
            const box = document.createElement('div');
            box.style.cssText = 'background: #2a2a38; width: 90%; height: 85%; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden;';

            box.innerHTML = `<div style="background: #141419; padding: 15px; color: white; font-weight: bold;">✏️ Éditeur d'Expression Avancé</div>`;

            const content = document.createElement('div');
            content.style.cssText = 'display: flex; flex: 1; overflow: hidden; flex-direction: row;';

            const leftPanel = document.createElement('div');
            leftPanel.style.cssText = 'flex: 2; padding: 15px; display: flex; flex-direction: column; gap: 10px;';
            
            const textarea = document.createElement('textarea');
            textarea.id = 'pro-expr-textarea';
            textarea.style.cssText = 'flex: 1; background: #1e1e24; color: #fff; border: 2px solid #444; padding: 15px; font-family: monospace; font-size: 18px; resize: none; border-radius: 6px;';
            leftPanel.appendChild(textarea);

            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
            const operators = ['+', '-', '*', '/', '(', ')', '"', '==', '>', '<', '&&', '||'];
            operators.forEach(op => {
                const btn = document.createElement('button');
                btn.textContent = op;
                btn.style.cssText = 'background: #3b82f6; color: white; border: none; padding: 12px 18px; border-radius: 4px; font-weight: bold; font-size: 16px; cursor: pointer; touch-action: manipulation;';
                btn.onclick = () => textarea.value += op + ' ';
                btnRow.appendChild(btn);
            });
            leftPanel.appendChild(btnRow);
            content.appendChild(leftPanel);

            const rightPanel = document.createElement('div');
            rightPanel.id = 'pro-expr-right-panel';
            rightPanel.style.cssText = 'flex: 1; background: #1e1e24; border-left: 2px solid #141419; overflow-y: auto; touch-action: auto;';
            content.appendChild(rightPanel);

            box.appendChild(content);

            const footer = document.createElement('div');
            footer.style.cssText = 'background: #141419; padding: 15px; display: flex; justify-content: flex-end; gap: 10px;';
            
            const btnCancel = document.createElement('button');
            btnCancel.textContent = 'Annuler';
            btnCancel.style.cssText = 'background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-weight: bold;';
            btnCancel.onclick = () => exprModal.style.display = 'none';

            const btnSave = document.createElement('button');
            btnSave.id = 'pro-expr-save';
            btnSave.textContent = 'Valider l\'Expression';
            btnSave.style.cssText = 'background: #2ed573; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-weight: bold;';

            footer.appendChild(btnCancel);
            footer.appendChild(btnSave);
            box.appendChild(footer);

            exprModal.appendChild(box);
            document.body.appendChild(exprModal);
        }
    }
// fin 2
// debut 3
    openExpressionEditor(node, fieldName) {
        if (fieldName === "▶ Lancer") return;
        
        this.editingNode = node;
        this.editingFieldName = fieldName;
        
        const modal = document.getElementById('pro-expr-modal');
        const textarea = document.getElementById('pro-expr-textarea');
        const rightPanel = document.getElementById('pro-expr-right-panel');
        const field = node.fields.find(f => f.name === fieldName);
        
        if (!modal || !textarea || !rightPanel) return;

        textarea.value = field ? field.value : "";
        rightPanel.innerHTML = ''; 

        const createSection = (title, items) => {
            if (!items || items.length === 0) return;
            const sec = document.createElement('div');
            sec.innerHTML = `<div style="background: #333; padding: 12px; color: white; font-weight: bold; border-bottom: 1px solid #444;">${title}</div>`;
            const list = document.createElement('div');
            list.style.cssText = 'padding: 10px; display: flex; flex-direction: column; gap: 6px;';
            items.forEach(item => {
                const btn = document.createElement('button');
                const itemName = item.name || item.type || "Inconnu";
                btn.textContent = itemName;
                btn.style.cssText = 'background: #4a4a5a; color: white; border: none; padding: 10px; text-align: left; border-radius: 4px; cursor: pointer; font-size: 14px; touch-action: manipulation;';
                btn.onclick = () => {
                    const currentVal = textarea.value.trim();
                    if (currentVal === "0" || currentVal === "") {
                        textarea.value = itemName;
                    } else {
                        textarea.value += ' ' + itemName;
                    }
                };
                list.appendChild(btn);
            });
            sec.appendChild(list);
            rightPanel.appendChild(sec);
        };

        if (window.engine) {
            createSection("🧮 Variables", window.engine.variables || []);
            let objects = window.engine.objects || [];
            createSection("📦 Objets de la Scène", objects);
            
            let scenes = [];
            if (window.engine.sm && window.engine.sm.scenes) {
                scenes = Object.keys(window.engine.sm.scenes).map(sc => ({ name: sc }));
            }
            createSection("🎬 Scènes", scenes);
        }

        modal.style.display = 'flex';
    }

    refreshData() {
        if (this.refreshCatalogUI) this.refreshCatalogUI();
        if (this.refreshSceneObjectsUI) this.refreshSceneObjectsUI();
    }

    distanceToQuadraticBezier(px, py, x1, y1, x2, y1_ctrl, x3, y2_ctrl, x4, y2) {
        let minDist = Infinity;
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const mt = 1 - t;
            const x = mt * mt * mt * x1 + 3 * mt * mt * t * x2 + 3 * mt * t * t * x3 + t * t * t * x4;
            const y = mt * mt * mt * y1 + 3 * mt * mt * t * y1_ctrl + 3 * mt * t * t * y2_ctrl + t * t * t * y2;
            const dist = Math.hypot(px - x, py - y);
            if (dist < minDist) minDist = dist;
        }
        return minDist;
    }

    findNearestConnection(mouseX, mouseY, maxDistance = 20) {
        let nearest = null;
        let minDist = maxDistance;
        this.connections.forEach((c, idx) => {
            const fNode = this.nodes.find(n => n.id === c.fromNode);
            const tNode = this.nodes.find(n => n.id === c.toNode);
            if (!fNode || !tNode) return;
            const p1 = this.getPinPosition(fNode, c.fromPin, true);
            const p2 = this.getPinPosition(tNode, c.toPin, false);
            const dist = this.distanceToQuadraticBezier(mouseX, mouseY, p1.x, p1.y, p1.x + 50, p1.y, p2.x - 50, p2.y, p2.x, p2.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = { connectionIndex: idx, distance: dist };
            }
        });
        return nearest;
    }
// fin 3
// debut 4
    addNode(title, color) {
        let rectWidth = 800;
        let rectHeight = 600;
        if (this.canvas && this.canvas.parentElement) {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            rectWidth = rect.width;
            rectHeight = rect.height;
        }

        const cX = (rectWidth / 2 - this.panX) / this.zoom - 90;
        const cY = (rectHeight / 2 - this.panY) / this.zoom - 40;
        
        this.spawnCount++;
        const offset = (this.spawnCount % 5) * 30;

        let config = null;
        if (window.BlueprintCatalog) {
            for (const cat of window.BlueprintCatalog.categories) {
                const found = cat.nodes.find(n => n.title === title);
                if (found) { config = found; break; }
            }
        }

        let inputs = config?.dataInputs || [];
        let execOutputs = config?.execOutputs || [];
        let dataOutputs = config?.dataOutputs || [];

        if (!config) {
            dataOutputs = ["Objet"];
        } else if (!config.isStart) {
            inputs = ["▶ Lancer", ...inputs];
        }

        const outputs = [...execOutputs, ...dataOutputs];
        const maxPins = Math.max(inputs.length, outputs.length);
        const h = Math.max(80, 40 + (maxPins * 28));
        
        const fields = inputs.filter(inp => inp !== "▶ Lancer").map(inp => ({ name: inp, value: "" }));

        this.nodes.push({
            id: 'node_' + Date.now() + Math.random().toString(16).substr(2, 5),
            title: title,
            x: cX + offset,
            y: cY + offset,
            w: 220, 
            h: h,
            color: color || '#3b82f6',
            inputs: inputs,
            outputs: outputs,
            fields: fields
        });
        this.draw();
    }

    getPinPosition(node, pinName, isOutput) {
        const pinIndex = isOutput ? node.outputs.indexOf(pinName) : node.inputs.indexOf(pinName);
        if (pinIndex === -1) return { x: node.x, y: node.y };
        const yOffset = node.y + 45 + (pinIndex * 28);
        const xOffset = isOutput ? node.x + node.w : node.x;
        return { x: xOffset, y: yOffset };
    }

    // MULTI-SCRIPTS : Chargement dynamique du script de la scène en cours
    open() {
        if (this.modal) {
            if (window.engine && window.engine.scripts && window.engine.sm) {
                const currentScene = window.engine.sm.currentSceneId;
                if (!window.engine.scripts[currentScene]) {
                    window.engine.scripts[currentScene] = { nodes: [], connections: [] };
                }
                this.nodes = JSON.parse(JSON.stringify(window.engine.scripts[currentScene].nodes));
                this.connections = JSON.parse(JSON.stringify(window.engine.scripts[currentScene].connections));
            }
            this.modal.style.display = 'flex';
            this.refreshData();
            setTimeout(() => this.resizeCanvas(), 50);
        }
    }

    // MULTI-SCRIPTS : Sauvegarde automatique dans le dictionnaire du moteur à la fermeture
    close() {
        if (this.modal) {
            if (window.engine && window.engine.scripts && window.engine.sm) {
                const currentScene = window.engine.sm.currentSceneId;
                window.engine.scripts[currentScene] = {
                    nodes: JSON.parse(JSON.stringify(this.nodes)),
                    connections: JSON.parse(JSON.stringify(this.connections))
                };
            }
            this.modal.style.display = 'none';
        }
    }

    initEvents() {
        if (!this.canvas) return;

        const saveExprBtn = document.getElementById('pro-expr-save');
        if (saveExprBtn) {
            saveExprBtn.onclick = (e) => {
                e.preventDefault();
                const textarea = document.getElementById('pro-expr-textarea');
                if (this.editingNode && this.editingFieldName && textarea) {
                    const field = this.editingNode.fields.find(f => f.name === this.editingFieldName);
                    if (field) field.value = textarea.value.trim();
                    this.draw();
                }
                document.getElementById('pro-expr-modal').style.display = 'none';
            };
        }

        document.getElementById('btn-close-blueprint')?.addEventListener('click', (e) => { e.preventDefault(); this.close(); });

        this.canvas.addEventListener('pointerdown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - this.panX) / this.zoom;
            const mouseY = (e.clientY - rect.top - this.panY) / this.zoom;

            this.lastPointerDownPos = { x: mouseX, y: mouseY };
            this.draggedNode = null;
            this.connectingFrom = null;

            const nearestConn = this.findNearestConnection(mouseX, mouseY, 15);
            if (nearestConn) {
                this.connections.splice(nearestConn.connectionIndex, 1);
                this.draw();
                return;
            }

            for (const n of this.nodes) {
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

            for (let i = this.nodes.length - 1; i >= 0; i--) {
                const n = this.nodes[i];
                if (mouseX >= n.x + n.w - 28 && mouseX <= n.x + n.w && mouseY >= n.y && mouseY <= n.y + 26) {
                    this.connections = this.connections.filter(c => c.fromNode !== n.id && c.toNode !== n.id);
                    this.nodes.splice(i, 1);
                    this.draw();
                    return;
                }
                if (n.inputs && n.inputs.length > 0) {
                    for (let f = 0; f < n.inputs.length; f++) {
                        const fieldY = n.y + 45 + (f * 28);
                        if (mouseX >= n.x + 15 && mouseX <= n.x + 15 + n.w / 2 - 10 && mouseY >= fieldY - 11 && mouseY <= fieldY + 11) {
                            this.openExpressionEditor(n, n.inputs[f]);
                            return;
                        }
                    }
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
// fin 4
// debut 5
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
                for (const n of this.nodes) {
                    if (n.id === this.connectingFrom.node.id) continue;
                    
                    if (this.connectingFrom.isOutput) {
                        for (const targetPin of n.inputs) {
                            const pos = this.getPinPosition(n, targetPin, false);
                            if (Math.hypot(mouseX - pos.x, mouseY - pos.y) < 18) {
                                this.connections.push({ fromNode: this.connectingFrom.node.id, fromPin: this.connectingFrom.pinName, toNode: n.id, toPin: targetPin });
                                break;
                            }
                        }
                    } else {
                        for (const targetPin of n.outputs) {
                            const pos = this.getPinPosition(n, targetPin, true);
                            if (Math.hypot(mouseX - pos.x, mouseY - pos.y) < 18) {
                                this.connections.push({ fromNode: n.id, fromPin: targetPin, toNode: this.connectingFrom.node.id, toPin: this.connectingFrom.pinName });
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
        for (let x = startX; x < endX; x += gridSize) { this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY); }
        for (let y = startY; y < endY; y += gridSize) { this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y); }
        this.ctx.stroke();

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

            n.inputs.forEach((inp, idx) => {
                const y = n.y + 45 + (idx * 28);
                
                this.ctx.fillStyle = '#a0aec0';
                this.ctx.beginPath(); this.ctx.arc(n.x, y, 6, 0, Math.PI * 2); this.ctx.fill();
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#141419';
                this.ctx.fillRect(n.x + 15, y - 11, n.w / 2 - 10, 22);
                
                const field = n.fields?.find(f => f.name === inp);
                const valText = field ? field.value : "";
                
                this.ctx.fillStyle = '#a0aec0';
                this.ctx.font = '11px sans-serif';
                this.ctx.fillText(`${inp}: ${valText.substring(0, 5)}`, n.x + 20, y + 4);
            });

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
    }

    resizeCanvas() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.draw();
    }
}

window.ludexaBlueprint = new BlueprintEditor();
window.ludexaBlueprint.initElements();
window.ludexaBlueprint.initUI();
window.ludexaBlueprint.initEvents();

document.getElementById('btn-open-blueprint')?.addEventListener('click', () => {
    window.ludexaBlueprint.open();
});
// fin 5

