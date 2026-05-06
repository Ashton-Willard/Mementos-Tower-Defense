import Enemy from '../objects/Enemy.js';
import Turret from '../objects/Turret.js';
import Bullet from '../objects/Bullet.js';
import FireBullet from '../objects/FireBullet.js';
import WaveManager from '../systems/WaveManager.js';
import TowerUpgradeUI from './TowerUpgradeUI.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('bullet',     'src/assets/bullet.png');
        this.load.image('firebullet', 'src/assets/firebullet.png');
        this.load.image('tiles',      'src/assets/tiles.png');
        this.load.tilemapTiledJSON('map1', 'src/assets/maps/map1.tmj');
        this.load.image('enemy',      'src/assets/enemy.png');
        this.load.atlas('turret', 'src/assets/spritesheet2.png', 'src/assets/spritesheet.json');
    }

    create() {
        const CAM_W      = this.cameras.main.width;
        const CAM_H      = this.cameras.main.height;
        const SIDEBAR_W  = 200;
        const GAME_W     = CAM_W - SIDEBAR_W;
        const sidebarX   = GAME_W;
        const TILE_SIZE  = 32;

        // ── TILEMAP BACKGROUND / PATH ─────────────────────────────────
        const map = this.make.tilemap({ key: 'map1' });
        const tileset = map.addTilesetImage('Testing_Tileset', 'tiles');
        const baseLayer = map.createLayer('Tile Layer 1', tileset, 0, 0);
        const pathLayer = map.createLayer('Pathing', tileset, 0, 0);
        pathLayer.setVisible(true);

        const mapWidth   = map.widthInPixels;
        const mapHeight  = map.heightInPixels;
        const mapScale   = Math.min(GAME_W / mapWidth, CAM_H / mapHeight);
        const mapOffsetX = Math.round((GAME_W - mapWidth * mapScale) / 2);
        const mapOffsetY = Math.round((CAM_H - mapHeight * mapScale) / 2);

        baseLayer.setScale(mapScale).setPosition(mapOffsetX, mapOffsetY);
        pathLayer.setScale(mapScale).setPosition(mapOffsetX, mapOffsetY);

        const worldFromTile = (tx, ty) => [
            mapOffsetX + map.tileToWorldX(tx) * mapScale + (TILE_SIZE * mapScale) / 2,
            mapOffsetY + map.tileToWorldY(ty) * mapScale + (TILE_SIZE * mapScale) / 2
        ];

        const PATH_TILE_INDEX = 48;
        const pathTiles = [];
        pathLayer.forEachTile(tile => {
            if (tile.index === PATH_TILE_INDEX) pathTiles.push(tile);
        });

        const tileKey = tile => `${tile.x},${tile.y}`;
        const pathTileByKey = new Map(pathTiles.map(tile => [tileKey(tile), tile]));
        const neighborOffsets = [
            { dx:  0, dy:  1 },
            { dx: -1, dy:  0 },
            { dx:  1, dy:  0 },
            { dx:  0, dy: -1 }
        ];

        const getNeighbors = tile => neighborOffsets
            .map(({ dx, dy }) => pathTileByKey.get(`${tile.x + dx},${tile.y + dy}`))
            .filter(Boolean);

        const rows = new Map();
        pathTiles.forEach(tile => {
            const xs = rows.get(tile.y) || [];
            xs.push(tile.x);
            rows.set(tile.y, xs);
        });

        const sortedRows = [...rows.entries()].sort((a, b) => a[0] - b[0]);
        const [topY, topXs] = sortedRows[0];
        const [bottomY, bottomXs] = sortedRows[sortedRows.length - 1];
        const topCenter = (Math.min(...topXs) + Math.max(...topXs)) / 2;
        const bottomCenter = (Math.min(...bottomXs) + Math.max(...bottomXs)) / 2;

        const pickRowTile = (xs, rowY, targetX) => {
            let best = null;
            let bestDist = Infinity;
            xs.forEach(x => {
                const dist = Math.abs(x - targetX);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = pathTileByKey.get(`${x},${rowY}`);
                }
            });
            return best;
        };

        const startTile = pickRowTile(topXs, topY, topCenter);
        const endTile = pickRowTile(bottomXs, bottomY, bottomCenter);
        let orderedTiles = [];

        if (startTile && endTile) {
            const queue = [startTile];
            const cameFrom = new Map();
            cameFrom.set(tileKey(startTile), null);
            let foundEnd = false;

            while (queue.length && !foundEnd) {
                const current = queue.shift();
                if (current === endTile) {
                    foundEnd = true;
                    break;
                }

                for (const neighbor of getNeighbors(current)) {
                    const key = tileKey(neighbor);
                    if (cameFrom.has(key)) continue;
                    cameFrom.set(key, current);
                    queue.push(neighbor);
                }
            }

            if (foundEnd) {
                let cursor = endTile;
                while (cursor) {
                    orderedTiles.push(cursor);
                    cursor = cameFrom.get(tileKey(cursor));
                }
                orderedTiles.reverse();
            }
        }

        if (orderedTiles.length < 2) {
            console.warn('Path generation falling back to row-center path for broad path region');
            const rows = new Map();
            pathTiles.forEach(tile => {
                const xs = rows.get(tile.y) || [];
                xs.push(tile.x);
                rows.set(tile.y, xs);
            });

            const sortedRows = [...rows.entries()].sort((a, b) => a[0] - b[0]);
            this.pathPoints = sortedRows.map(([y, xs]) => {
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const centerX = (minX + maxX) / 2;
                return worldFromTile(centerX, y);
            }).flat();
        } else {
            this.pathPoints = orderedTiles.map(tile => worldFromTile(tile.x, tile.y)).flat();
        }
        this.pathGraphics = this.add.graphics();

        if (this.pathPoints.length >= 2) {
            const firstPoint = this.pathPoints.slice(0, 2);
            this.path = this.add.path(firstPoint[0], firstPoint[1]);
            for (let i = 2; i < this.pathPoints.length; i += 2) {
                this.path.lineTo(this.pathPoints[i], this.pathPoints[i + 1]);
            }
            this.drawPath();
        } else {
            this.path = this.add.path(0, 0);
            console.warn('Path generation failed: not enough path points');
        }

        const GRID_SIZE = TILE_SIZE * mapScale;
        const GHOST_SIZE = 48 * mapScale;
        this.gridSize = GRID_SIZE;

        // ── HUD ─────────────────────────────────────────────────────


        // ── HUD ──────────────────────────────────────────────────────
        this.money = 500;

        this.moneyText = this.add.text(16, 54, `💰 $${this.money}`, {
            fontSize: '18px', fontFamily: 'monospace',
            color: '#f0c040', stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(9999);

        this.startButton = this.add.text(16, 16, '▶  Start Wave', {
            fontSize: '18px', fontFamily: 'monospace',
            color: '#ffffff', stroke: '#000000', strokeThickness: 5,
            backgroundColor: '#1a1a2e', padding: { x: 12, y: 6 }
        })
        .setInteractive()
        .on('pointerover', function() { this.setStyle({ color: '#4ecca3' }); })
        .on('pointerout',  function() { this.setStyle({ color: '#ffffff' }); })
        .on('pointerdown', () => this.startNextRound())
        .setDepth(9999).setScrollFactor(0);

        // ── GROUPS ───────────────────────────────────────────────────
        this.enemies     = this.physics.add.group({ classType: Enemy });
        this.bullets     = this.physics.add.group({ classType: Bullet,     runChildUpdate: false });
        this.fireBullets = this.physics.add.group({ classType: FireBullet, runChildUpdate: false });
        this.turrets     = this.add.group();

        this.physics.add.overlap(this.enemies, this.bullets,     this.damageEnemy, null, this);
        this.physics.add.overlap(this.enemies, this.fireBullets, this.damageEnemy, null, this);

        // ── SIDEBAR — seamless gradient blend ────────────────────────
        const fadeW = 60;
        const grad  = this.add.graphics().setScrollFactor(0).setDepth(9997);
        for (let i = 0; i < fadeW; i++) {
            grad.fillStyle(0x0d0d1a, i / fadeW);
            grad.fillRect(sidebarX - fadeW + i, 0, 1, CAM_H);
        }
        this.add.rectangle(sidebarX, 0, SIDEBAR_W, CAM_H, 0x0d0d1a)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(9997);
        this.add.rectangle(sidebarX, 0, 2, CAM_H, 0x4ecca3, 0.4)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(9998);

        this.add.text(sidebarX + SIDEBAR_W / 2, 12, 'TOWERS', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#4ecca3', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9999);

        // ── TOWER DATA ───────────────────────────────────────────────
        this.towerData = {
            lightningtower: { cost: 100, bulletType: 'bullet',     label: 'Lightning' },
            icetower:       { cost: 120, bulletType: 'bullet',     label: 'Ice'       },
            firetower:      { cost: 150, bulletType: 'firebullet', label: 'Fire'      },
            rocktower:      { cost: 200, bulletType: 'bullet',     label: 'Rock'      },
            darktower:      { cost: 160, bulletType: 'bullet',     label: 'Dark'      },
            lighttower:     { cost: 170, bulletType: 'bullet',     label: 'Light'     },
            psychictower:   { cost: 175, bulletType: 'bullet',     label: 'Psychic'   },
            windtower:      { cost: 155, bulletType: 'bullet',     label: 'Wind'      }
        };

        // ── SIDEBAR GRID ─────────────────────────────────────────────
        const COLS      = 2;
        const CELL      = Math.floor(SIDEBAR_W / COLS);
        const ICON_SIZE = 44;
        const GRID_TOP  = 36;

        this._sidebarIcons = [];

        Object.keys(this.towerData).forEach((type, index) => {
            const data  = this.towerData[type];
            const col   = index % COLS;
            const row   = Math.floor(index / COLS);
            const cellX = sidebarX + col * CELL;
            const cellY = GRID_TOP  + row * (CELL + 10);
            const iconX = cellX + CELL / 2;
            const iconY = cellY + 6 + ICON_SIZE / 2;

            const cellBg = this.add.rectangle(cellX + 2, cellY + 2, CELL - 4, CELL - 4, 0x1a1a2e)
                .setOrigin(0, 0).setScrollFactor(0).setDepth(9998)
                .setStrokeStyle(1, 0x2a2a4e);

            const frame     = this.textures.get('turret').get(type);
            const iconScale = Math.min(ICON_SIZE / frame.realWidth, ICON_SIZE / frame.realHeight);

            const icon = this.add.image(iconX, iconY, 'turret', type)
                .setScale(iconScale).setScrollFactor(0).setDepth(9999).setInteractive();

            this.add.text(iconX, iconY + ICON_SIZE / 2 + 2, data.label, {
                fontSize: '8px', fontFamily: 'monospace', color: '#8888aa'
            }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9999);

            this.add.text(iconX, iconY + ICON_SIZE / 2 + 12, `$${data.cost}`, {
                fontSize: '10px', fontFamily: 'monospace', color: '#f0c040', fontStyle: 'bold'
            }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9999);

            icon.on('pointerover', () => { icon.setTint(0xaaddff); cellBg.setFillStyle(0x2a2a4e); });
            icon.on('pointerout',  () => { icon.clearTint();        cellBg.setFillStyle(0x1a1a2e); });

            icon.towerType = type;
            this._sidebarIcons.push(icon);
        });

        // ── DRAG SYSTEM ──────────────────────────────────────────────
        this._drag = null;

        this.input.on('pointerdown', (pointer, targets) => {
            const icon = targets.find(t => t.towerType);
            if (!icon) return;

            const type = icon.towerType;
            const data = this.towerData[type];
            if (this.money < data.cost) return;

            const frame      = this.textures.get('turret').get(type);
            const ghostScale = Math.min(GHOST_SIZE / frame.realWidth, GHOST_SIZE / frame.realHeight);

            const sx = Math.round(pointer.x / GRID_SIZE) * GRID_SIZE;
            const sy = Math.round(pointer.y / GRID_SIZE) * GRID_SIZE;

            const ghost = this.add.image(sx, sy, 'turret', type)
                .setScale(ghostScale).setAlpha(0.8).setDepth(10000);

            this._drag = { type, data, ghost };
        });

        this.input.on('pointermove', (pointer) => {
            if (!this._drag) return;
            const { ghost, data } = this._drag;

            if (pointer.x < sidebarX) {
                const sx = Math.round(pointer.x / GRID_SIZE) * GRID_SIZE;
                const sy = Math.round(pointer.y / GRID_SIZE) * GRID_SIZE;
                ghost.setPosition(sx, sy);
                const i  = Math.floor(pointer.y / GRID_SIZE);
                const j  = Math.floor(pointer.x / GRID_SIZE);
                const ok = this.canPlaceTurret(i, j) && this.money >= data.cost;
                ghost.setTint(ok ? 0xffffff : 0xff4444).setAlpha(ok ? 0.85 : 0.5);
            } else {
                ghost.setPosition(pointer.x, pointer.y).setTint(0xff4444).setAlpha(0.5);
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (!this._drag) return;
            const { type, data, ghost } = this._drag;

            if (pointer.x < sidebarX) {
                const i = Math.floor(pointer.y / GRID_SIZE);
                const j = Math.floor(pointer.x / GRID_SIZE);

                if (this.canPlaceTurret(i, j) && this.money >= data.cost) {
                    const turret = new Turret(this, type);
                    turret.addInvestment(data.cost);
                    this.turrets.add(turret);
                    turret.place(i, j);
                    turret.bulletType = data.bulletType;

                    this.money -= data.cost;
                    this.moneyText.setText(`💰 $${this.money}`);

                    this.tweens.add({
                        targets: turret,
                        scaleX: turret.scaleX * 1.35,
                        scaleY: turret.scaleY * 1.35,
                        duration: 80, yoyo: true, ease: 'Quad.easeOut'
                    });
                }
            }

            ghost.destroy();
            this._drag = null;
        });

        // ── UPGRADE UI ───────────────────────────────────────────────
        this.upgradeUI = new TowerUpgradeUI(this);

        // ── WAVE MANAGER ─────────────────────────────────────────────
        this.waveManager = new WaveManager(this, this.enemies, this.path);
    }

    // ── HELPERS ──────────────────────────────────────────────────────

    drawPath() {
        this.pathGraphics.clear();
        if (this.pathPoints.length < 4) return;

        this.pathGraphics.lineStyle(68, 0x000000, 0.45);
        this.path.draw(this.pathGraphics);

        this.pathGraphics.lineStyle(52, 0x7a4f28, 1);
        this.path.draw(this.pathGraphics);

        this.pathGraphics.lineStyle(30, 0x9b6535, 0.8);
        this.path.draw(this.pathGraphics);

        this.pathGraphics.lineStyle(10, 0xc8894a, 0.5);
        this.path.draw(this.pathGraphics);
    }

    isNearPath(x, y) {
        if (!this.path) return false;
        return this.path.getPoints(300).some(p =>
            Phaser.Math.Distance.Between(x, y, p.x, p.y) < 48
        );
    }

    canPlaceTurret(i, j) {
        const grid = this.gridSize || 64;
        const x = j * grid + grid / 2;
        const y = i * grid + grid / 2;
        if (x + grid / 2 > this.cameras.main.width - 200) return false;
        if (this.isNearPath(x, y)) return false;
        return true;
    }

    addGold(amount) {
        this.money += amount;
        if (this.moneyText) {
            this.moneyText.setText(`💰 $${this.money}`);
            this.moneyText.setAlpha(1);
        }
    }

    startNextRound() {
        this.startButton.setVisible(false);
        this.waveManager.startNextWave();
    }

    update(time, delta) {
        if (!this.waveManager) return;
        this.waveManager.update(time, delta);

        this.enemies.getChildren().forEach(e => {
            if (e.active) e.update(time, delta, this.path);
        });
        this.turrets.getChildren().forEach(t => {
            if (t.active) t.update(time, delta);
        });
    }

    getEnemyInRange(x, y, range) {
        return this.enemies.getChildren().find(e =>
            e.active && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= range
        ) || null;
    }

    spawnBullet(turret, x, y, angle, opts = {}) {
        const group  = turret.bulletType === 'firebullet' ? this.fireBullets : this.bullets;
        const bullet = group.get();
        if (!bullet) return;

        bullet.init(turret.bulletType, { speed: 2000 });
        bullet.fire(x, y, angle, opts.damage ?? turret.damage);
    }

    damageEnemy(enemy, bullet) {
        if (!enemy.active || !bullet.active) return;

        enemy.receiveDamage(bullet.damage);

        if (bullet.textureKey === 'firebullet') {
            this.enemies.getChildren().forEach(e => {
                if (!e.active || e === enemy) return;
                if (Phaser.Math.Distance.Between(enemy.x, enemy.y, e.x, e.y) <= 80)
                    e.receiveDamage(Math.floor(bullet.damage * 0.5));
            });
        }

        bullet.deactivate();
    }
}
