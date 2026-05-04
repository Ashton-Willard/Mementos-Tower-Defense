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
        this.load.image('faceMap',    'src/assets/face_map.png');
        this.load.image('enemy',      'src/assets/enemy.png');
        this.load.atlas('turret', 'src/assets/spritesheet2.png', 'src/assets/spritesheet.json');
    }

    create() {
        const CAM_W     = this.cameras.main.width;
        const CAM_H     = this.cameras.main.height;
        const CELL      = 90;
        const COLS      = 2;
        const SIDEBAR_W = CELL * COLS;  // 180
        const GAME_W    = CAM_W - SIDEBAR_W;
        const sidebarX  = GAME_W;
        const GRID_SIZE = 64;
        const GHOST_SIZE = 52;

        // ── BACKGROUND ───────────────────────────────────────────────
        this.add.rectangle(0, 0, GAME_W, CAM_H, 0x111111).setOrigin(0, 0);

        const bg    = this.add.image(0, 0, 'faceMap').setOrigin(0, 0);
        const scale = Math.min(GAME_W / bg.width, CAM_H / bg.height);
        bg.setScale(scale).setPosition(
            (GAME_W - bg.displayWidth)  / 2,
            (CAM_H  - bg.displayHeight) / 2
        );

        // ── HUD ──────────────────────────────────────────────────────
        this.money = 500;

        this.moneyText = this.add.text(20, 60, `Money: $${this.money}`, {
            fontSize: '20px', color: '#00ff00'
        }).setScrollFactor(0).setDepth(9999);

        this.startButton = this.add.text(20, 20, 'Start Wave', {
            fontSize: '24px', color: '#ffffff',
            backgroundColor: '#000000', padding: { x: 10, y: 5 }
        })
        .setInteractive()
        .on('pointerdown', () => this.startNextRound())
        .setDepth(9999).setScrollFactor(0);

        // ── GROUPS ───────────────────────────────────────────────────
        this.enemies     = this.physics.add.group({ classType: Enemy });
        this.bullets     = this.physics.add.group({ classType: Bullet,     runChildUpdate: false });
        this.fireBullets = this.physics.add.group({ classType: FireBullet, runChildUpdate: false });
        this.turrets     = this.add.group();

        this.physics.add.overlap(this.enemies, this.bullets,     this.damageEnemy, null, this);
        this.physics.add.overlap(this.enemies, this.fireBullets, this.damageEnemy, null, this);

        // ── HARDCODED PATH ───────────────────────────────────────────
        this.pathPoints = [
            796, 525,
            784, 900,
            353, 893,
            365,  38,
            564,  36,
            485, 730,
            681, 757,
            684, 158,
            969, 173,
           1044, 173,
           1032, 761,
           1033, 784,
           1206, 772,
           1164,  44,
           1298,  82,
           1285, 890,
            931, 885,
            903, 903,
            871, 508,
           1602, 593
        ];

        this.pathGraphics = this.add.graphics();
        this.path = this.add.path();
        this.path.splineTo(this.pathPoints);
        this.drawPath();

        // ── SIDEBAR ──────────────────────────────────────────────────
        this.add.rectangle(sidebarX, 0, SIDEBAR_W, CAM_H, 0x1e1e2e)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(9998);

        this.add.text(sidebarX + SIDEBAR_W / 2, 10, 'TOWERS', {
            fontSize: '13px', fontFamily: 'monospace',
            color: '#4ecca3', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9999);

        this.add.rectangle(sidebarX + 8, 30, SIDEBAR_W - 16, 1, 0x4ecca3, 0.5)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(9999);

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

        // ── 2×4 SIDEBAR GRID ─────────────────────────────────────────
        const GRID_TOP  = 38;
        const ICON_SIZE = 52;

        this._sidebarIcons = [];

        Object.keys(this.towerData).forEach((type, index) => {
            const data  = this.towerData[type];
            const col   = index % COLS;
            const row   = Math.floor(index / COLS);
            const cellX = sidebarX + col * CELL;
            const cellY = GRID_TOP  + row * CELL;
            const iconX = cellX + CELL / 2;
            const iconY = cellY + 8 + ICON_SIZE / 2;

            this.add.rectangle(cellX + 1, cellY + 1, CELL - 2, CELL - 2, 0x2a2a3e)
                .setOrigin(0, 0).setScrollFactor(0).setDepth(9998)
                .setStrokeStyle(1, 0x3a3a5e);

            const frame     = this.textures.get('turret').get(type);
            const iconScale = Math.min(ICON_SIZE / frame.realWidth, ICON_SIZE / frame.realHeight);

            const icon = this.add.image(iconX, iconY, 'turret', type)
                .setScale(iconScale)
                .setScrollFactor(0)
                .setDepth(9999)
                .setInteractive();

            this.add.text(iconX, cellY + 8 + ICON_SIZE + 2, data.label, {
                fontSize: '9px', fontFamily: 'monospace', color: '#aaaaaa'
            }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9999);

            this.add.text(iconX, cellY + 8 + ICON_SIZE + 14, `$${data.cost}`, {
                fontSize: '11px', fontFamily: 'monospace', color: '#f0c040', fontStyle: 'bold'
            }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9999);

            icon.on('pointerover', () => icon.setTint(0xaaddff));
            icon.on('pointerout',  () => icon.clearTint());

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
                .setScale(ghostScale)
                .setAlpha(0.8)
                .setDepth(10000);

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
                    this.turrets.add(turret);
                    turret.place(i, j);
                    turret.bulletType = data.bulletType;

                    this.money -= data.cost;
                    this.moneyText.setText(`Money: $${this.money}`);

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

        this.pathGraphics.lineStyle(60, 0x8b5a2b, 1);
        this.path.draw(this.pathGraphics);
        this.pathGraphics.lineStyle(70, 0x000000, 0.2);
        this.path.draw(this.pathGraphics);
    }

    isNearPath(x, y) {
        if (!this.path) return false;
        return this.path.getPoints(100).some(p =>
            Phaser.Math.Distance.Between(x, y, p.x, p.y) < 60
        );
    }

    canPlaceTurret(i, j) {
        const x = j * 64 + 32;
        const y = i * 64 + 32;
        if (x + 32 > this.cameras.main.width - 180) return false;
        if (this.isNearPath(x, y)) return false;
        return true;
    }

    startNextRound() {
        this.startButton.setVisible(false);
        this.waveManager.startWave();
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
