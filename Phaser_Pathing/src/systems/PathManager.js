export default class PathManager {
    constructor(scene, mapScale) {
        this.scene = scene;
        this.mapScale = mapScale;

        // Bloons-style path points (unscaled)
        this.points = [
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
        ];

        // Build Phaser path
        this.path = this.buildPhaserPath();

        // Build no-build zone from centerline
        this.blockedTiles = this.samplePathTiles();

        // Debug layers
        this.blockedDebug = scene.add.graphics().setDepth(9998);
        this.pathDebug = scene.add.graphics().setDepth(9998);

        this.showBlocked = true;
        this.showPath = true;

        this.drawBlockedTiles();
        this.drawPath();
    }

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
    // SAMPLE THE ENTIRE PATH WITH A RADIUS
    // ============================================================
    samplePathTiles() {
        const blocked = new Set();
        const tileSize = 64 * this.mapScale;

        const totalLength = this.path.getLength();
        const step = 8; // sample every 8 pixels

        const RADIUS = 48 * this.mapScale; // <-- adjust this (48px is Bloons-like)

        for (let d = 0; d <= totalLength; d += step) {
            const p = this.path.getPoint(d / totalLength);

            // Convert radius area into tile coordinates
            const minTileX = Math.floor((p.x - RADIUS) / tileSize);
            const maxTileX = Math.floor((p.x + RADIUS) / tileSize);
            const minTileY = Math.floor((p.y - RADIUS) / tileSize);
            const maxTileY = Math.floor((p.y + RADIUS) / tileSize);

            for (let tx = minTileX; tx <= maxTileX; tx++) {
                for (let ty = minTileY; ty <= maxTileY; ty++) {

                    // Check actual distance to center of tile
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

    // ============================================================
    // TURRET PLACEMENT CHECK
    // ============================================================
    canPlace(worldX, worldY) {
        const tileSize = 64 * this.mapScale;
        const tileX = Math.floor(worldX / tileSize);
        const tileY = Math.floor(worldY / tileSize);
        return !this.blockedTiles.has(`${tileX},${tileY}`);
    }
}
