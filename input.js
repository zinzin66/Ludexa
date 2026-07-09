export class InputManager {
    constructor(engine) {
        this.e = engine;
        this.initEvents();
    }

    initEvents() {
        const canvas = this.e.canvas;

        canvas.addEventListener('pointerdown', (e) => {
            try { canvas.setPointerCapture(e.pointerId); } catch(_) {}
            this.e.isPointerDown = true;
            this.e.lastPointer = { x: e.clientX, y: e.clientY };
            
            const worldPos = this.e.screenToWorld(e.clientX, e.clientY);

            if (this.e.currentTool === 'select') {
                const selectedObj = this.e.objects.find(o => o.id === this.e.selectedObjectId);
                if (selectedObj) {
                    const handle = this.e.getHitHandle(selectedObj, worldPos.x, worldPos.y);
                    if (handle) {
                        this.e.activeHandle = handle;
                        this.e.draggedObject = selectedObj;
                        this.e.render();
                        return;
                    }
                }
                
                const hitObj = this.e.getHitObject(worldPos.x, worldPos.y);
                if (hitObj) {
                    this.e.selectedObjectId = hitObj.id;
                    this.e.draggedObject = hitObj;
                    this.e.activeHandle = null;
                    this.e.dragOffset = { x: worldPos.x - hitObj.x, y: worldPos.y - hitObj.y };
                } else {
                    this.e.selectedObjectId = null;
                    this.e.draggedObject = null;
                    this.e.activeHandle = null;
                }
                this.e.updateTreeview();
                this.e.updateInspector();
            }
            this.e.render();
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!this.e.isPointerDown) return;

            if (this.e.currentTool === 'hand') {
                const dx = e.clientX - this.e.lastPointer.x;
                const dy = e.clientY - this.e.lastPointer.y;
                this.e.panX += dx;
                this.e.panY += dy;
            } else if (this.e.currentTool === 'select' && this.e.draggedObject) {
                const worldPos = this.e.screenToWorld(e.clientX, e.clientY);
                if (this.e.activeHandle) {
                    this.e.resizeObject(this.e.draggedObject, this.e.activeHandle, worldPos);
                } else {
                    this.e.draggedObject.x = Math.round(worldPos.x - this.e.dragOffset.x);
                    this.e.draggedObject.y = Math.round(worldPos.y - this.e.dragOffset.y);
                }
                this.e.updateInspector();
            }
            this.e.lastPointer = { x: e.clientX, y: e.clientY };
            this.e.render();
        });

        const handleUp = (e) => {
            this.e.isPointerDown = false;
            this.e.draggedObject = null;
            this.e.activeHandle = null;
            try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        };

        canvas.addEventListener('pointerup', handleUp);
        canvas.addEventListener('pointercancel', handleUp);
    }
}

