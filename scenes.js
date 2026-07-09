export class SceneManager {
    constructor() {
        this.scenes = {
            scene1: []
        };
        this.currentSceneId = 'scene1';
    }

    get objects() {
        if (!this.scenes[this.currentSceneId]) {
            this.scenes[this.currentSceneId] = [];
        }
        return this.scenes[this.currentSceneId];
    }

    addScene(id) {
        if (!this.scenes[id]) {
            this.scenes[id] = [];
            return true;
        }
        return false;
    }

    removeScene(id) {
        if (Object.keys(this.scenes).length > 1 && this.scenes[id]) {
            delete this.scenes[id];
            this.currentSceneId = Object.keys(this.scenes)[0];
            return true;
        }
        return false;
    }
}

