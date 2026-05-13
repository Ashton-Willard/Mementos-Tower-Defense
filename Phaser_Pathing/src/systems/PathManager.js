export default class PathManager {
    constructor(scene, mapScale) {
        this.scene = scene;
        this.mapScale = mapScale;
        this.showBlocked = false;
        this.showPath = false;
        this.radiusByMap = {
            map1: 48,
            map2: 38
        };

        // ============================================================
        // MAP 1: original hardcoded path (unscaled)
        // ============================================================
        this.pathDefinitions = {
            map1: [
                [112, 624],
                [112, 112],
                [176, 80],
                [816, 80],
                [848, 144],
                [848, 368],
                [560, 368],
                [464, 240],
                [336, 240],
                [272, 304],
                [272, 496],
                [336, 528],
                [944, 528]
            ],

            // ============================================================
            // MAP 2: handcrafted path following the stone walkway
            // ============================================================
            map2: [
                // Start (left side)
                [0, 320],
                [64, 320],
                [128, 320],
                [192, 320],
                [256, 320],
                [286, 320],

                // Up
                [286, 240],
                [286, 176],
                [286, 156],

                // Right across top-left section
                [320, 156],
                [384, 156],
                [416, 156],
                [480, 156],

                // Down long middle section
                [480, 240],
                [480, 304],
                [480, 368],
                [480, 432],
                [480, 472],
                [480, 484],

                // Left
                [320, 484],
                [256, 484],

                // Down
                [256, 496],
                [256, 536],
                [256, 586],


                // Right along bottom
                [320, 586],
                [384, 586],
                [448, 586],
                [512, 586],
                [576, 586],
                [640, 586],
                [704, 586],
                [772, 586],


                // Up right side
                [772, 432],
                [772, 390],

                // Left middle-right section
                [640, 390],
                [576, 390],

                // Up
                [576, 304],
                [576, 250],

                // Right
                [576, 250],
                [640, 250],
                [704, 250],
                [764, 250],
                [804, 250],

                // Up to exit
                [804, 176],
                [804, 112],
                [804, 48],
                [804, 38],
                [804, 28],
                [740, 28],
                [696, 28],
                [606, 28],
                [570, 28],
                [570, 0]
            ]
        };

        // Select correct path
        this.points = this.pathDefinitions[scene.selectedMap] || [];

        // Build Phaser path
        this.path = this.buildPhaserPath();

        // Blocked tiles
        this.blockedTiles = this.samplePathTiles();

        // Debug layers
        this.blockedDebug = scene.add.graphics().setDepth(9998);
        this.pathDebug = scene.add.graphics().setDepth(9998);

        this.showBlocked = true;
               this.showPath = true;

        this.drawBlockedTiles();
        this.drawPath();
    }

    // ============================================================
    // Build Phaser path from this.points (unscaled)
    // ============================================================
    buildPhaserPath() {
        const path = this.scene.add.path();
        const P = (x, y) => ({ x: x * this.mapScale, y: y * this.mapScale });

        this.points.forEach(([x, y], i) => {
            const p = P(x, y);
            if (i === 0) path.moveTo(p.x, p.y);
            else path.lineTo(p.x, p.y);
        });

        return path;
    }

    // ============================================================
    // Blocked tiles sampling
    // ============================================================
    samplePathTiles() {
        const blocked = new Set();
        const tileSize = 64 * this.mapScale;

        const totalLength = this.path.getLength();
        const step = 8;

        // Per‑map radius
        const baseRadius = this.radiusByMap[this.scene.selectedMap] || 48;
        const RADIUS = baseRadius * this.mapScale;

        for (let d = 0; d <= totalLength; d += step) {
            const p = this.path.getPoint(d / totalLength);

            const minTileX = Math.floor((p.x - RADIUS) / tileSize);
            const maxTileX = Math.floor((p.x + RADIUS) / tileSize);
            const minTileY = Math.floor((p.y - RADIUS) / tileSize);
            const maxTileY = Math.floor((p.y + RADIUS) / tileSize);

            for (let tx = minTileX; tx <= maxTileX; tx++) {
                for (let ty = minTileY; ty <= maxTileY; ty++) {
                    const centerX = tx * tileSize + tileSize / 2;
                    const centerY = ty * tileSize + tileSize / 2;

                    const dist = Phaser.Math.Distance.Between(p.x, p.y, centerX, centerY);

                    if (dist <= RADIUS) {
                        blocked.add(`${tx},${ty}`);
                    }
                }
            }
        }

        return blocked;
    }


    drawBlockedTiles() {
        this.blockedDebug.clear();
        if (!this.showBlocked) return;

        const tileSize = 64 * this.mapScale;

        this.blockedDebug.fillStyle(0xff0000, 0.25);

        this.blockedTiles.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            this.blockedDebug.fillRect(
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize
            );
        });
    }

    drawPath() {
        this.pathDebug.clear();
        if (!this.showPath) return;

        this.pathDebug.lineStyle(4, 0xff0000, 1);
        this.path.draw(this.pathDebug);
    }

    toggleBlocked() {
        this.showBlocked = !this.showBlocked;
        this.drawBlockedTiles();
    }

    togglePath() {
        this.showPath = !this.showPath;
        this.drawPath();
    }

    canPlace(worldX, worldY) {
        const tileSize = 64 * this.mapScale;
        const tileX = Math.floor(worldX / tileSize);
        const tileY = Math.floor(worldY / tileSize);
        return !this.blockedTiles.has(`${tileX},${tileY}`);
    }
}
