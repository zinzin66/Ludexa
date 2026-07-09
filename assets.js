export class AssetManager {
    constructor() {
        this.assets = {};
    }

    addAsset(name, type, src) {
        const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const asset = { id, name, type, src };
        
        if (type === 'image') {
            asset.img = new Image();
            asset.img.src = src;
        }
        this.assets[id] = asset;
        return asset;
    }

    getAsset(id) {
        return this.assets[id] || null;
    }

    getAllAssets() {
        return Object.values(this.assets);
    }

    removeAsset(id) {
        if (this.assets[id]) {
            delete this.assets[id];
            return true;
        }
        return false;
    }
}

