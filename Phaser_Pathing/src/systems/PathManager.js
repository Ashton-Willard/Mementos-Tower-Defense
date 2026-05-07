export default class PathManager {
    constructor(scene, mapScale) {
        this.scene = scene;
        this.mapScale = mapScale;

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
            ]
        };

        if (scene.selectedMap === 'map2') {
            // Build from TMJ tile data (tile index 34 in "Tile Layer 1")
            this.points = this.buildMap2PathFromTiles(scene.map);
        } else {
            this.points = this.pathDefinitions[scene.selectedMap] || [];
        }

        this.path = this.buildPhaserPath();
        this.blockedTiles = this.samplePathTiles();

        this.blockedDebug = scene.add.graphics().setDepth(9998);
        this.pathDebug = scene.add.graphics().setDepth(9998);

        this.showBlocked = true;
        this.showPath = true;

        this.drawBlockedTiles();
        this.drawPath();
    }

    // ============================================================
    // MAP 2: derive path from tile index 34 in "Tile Layer 1"
    // ============================================================
    buildMap2PathFromTiles(map) {
        const layer = map.getLayer('Tile Layer 1').tilemapLayer;
        const tileSize = map.tileWidth; // 32
        const pathTiles = [];

        // Collect all path tiles (index 34)
        layer.forEachTile(tile => {
            if (tile.index === 34) {
                pathTiles.push({ x: tile.x, y: tile.y });
            }
        });

        if (pathTiles.length === 0) {
            console.warn('No path tiles (34) found for map2.');
            return [];
        }

        // Build a quick lookup by (x,y)
        const tileSet = new Set(pathTiles.map(t => `${t.x},${t.y}`));

        // Helper to get neighbors (4‑directional)
        const getNeighbors = (t) => {
            const dirs = [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 }
            ];
            const res = [];
            for (const d of dirs) {
                const nx = t.x + d.dx;
                const ny = t.y + d.dy;
                if (tileSet.has(`${nx},${ny}`)) {
                    res.push({ x: nx, y: ny });
                }
            }
            return res;
        };

        // Find start tile: one with only 1 neighbor (path endpoint)
        let start = null;
        for (const t of pathTiles) {
            const neighbors = getNeighbors(t);
            if (neighbors.length === 1) {
                start = t;
                break;
            }
        }
        if (!start) {
            // fallback: just pick the leftmost/topmost
            start = pathTiles.reduce((a, b) =>
                (b.x < a.x || (b.x === a.x && b.y < a.y)) ? b : a
            );
        }

        // Walk the path from start to end
        const ordered = [];
        const visited = new Set();
        let current = start;
        let prevKey = null;

        while (current) {
            const key = `${current.x},${current.y}`;
            ordered.push(current);
            visited.add(key);

            const neighbors = getNeighbors(current)
                .filter(n => !visited.has(`${n.x},${n.y}`));

            if (neighbors.length === 0) {
                break; // reached end
            }

            // Prefer continuing straight if possible, otherwise just take first
            let next = neighbors[0];
            if (neighbors.length > 1 && prevKey) {
                const [px, py] = prevKey.split(',').map(Number);
                const vx = current.x - px;
                const vy = current.y - py;
                const straight = neighbors.find(n => (n.x - current.x === vx && n.y - current.y === vy));
                if (straight) next = straight;
            }

            prevKey = key;
            current = next;
        }

        // Convert tile coords -> unscaled pixel coords (center of tile)
        const points = ordered.map(t => {
            const worldX = t.x * tileSize + tileSize / 2;
            const worldY = t.y * tileSize + tileSize / 2;
            return [worldX, worldY];
        });

        return points;
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
        const RADIUS = 48 * this.mapScale;

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
