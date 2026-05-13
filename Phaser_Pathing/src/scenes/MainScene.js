import Enemy from '../objects/Enemy.js';
import FastEnemy from '../objects/FastEnemy.js';
import Turret from '../objects/Turret.js';
import Bullet from '../objects/Bullet.js';
import FireBullet from '../objects/FireBullet.js';
import IceBullet from '../objects/IceBullet.js';
import WaveManager from '../systems/WaveManager.js';
import PathManager from '../systems/PathManager.js';
import TowerUpgradeUI from './TowerUpgradeUI.js';
import WindBullet from '../objects/WindBullet.js';
import MindBlast from '../objects/MindBlast.js';
import DarkBullet from '../objects/DarkBullet.js';
import LightBullet from '../objects/LightBullet.js';
import RockBullet from '../objects/RockBullet.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('bullet',     'src/assets/bullet.png');
        this.load.image('firebullet', 'src/assets/firebullet.png');
        this.load.image('icebullet',  'src/assets/icebullet.png');
         this.load.image('rockbullet',     'src/assets/rockbullet.png');
        this.load.image('lightbullet', 'src/assets/lightbullet.png');
        this.load.image('darkbullet',  'src/assets/darkbullet.png');
         this.load.image('mindblast',     'src/assets/mindblast.png');
        this.load.image('windbullet', 'src/assets/windbullet.png');
        this.load.image('tiles',      'src/assets/tiles.png');
        this.load.image('enemy',      'src/assets/enemy.png');

        this.load.tilemapTiledJSON('map1', 'src/assets/maps/map1.tmj');
        this.load.tilemapTiledJSON('map2', 'src/assets/maps/Map2.tmj');
        this.load.image('BloonsCutMap1.png', 'src/assets/maps/BloonsCutMap1.png');

        this.load.image('enemy_shadow', 'src/assets/enemies/enemy_shadow.png');
        this.load.image('shaderunner',  'src/assets/enemies/shaderunner.png');
        this.load.image('irongolem',    'src/assets/enemies/irongolem.png');
        this.load.image('moab',         'src/assets/enemies/moab.png');
        this.load.image('mirrorwraith', 'src/assets/enemies/mirrorwraith.png');
        this.load.image('icetiger',     'src/assets/enemies/icetiger.png');

        this.load.atlas('turret',   'src/assets/spritesheet2.png',  'src/assets/spritesheet.json');
        this.load.atlas('turretup', 'src/assets/spritesheetup.png', 'src/assets/spritesheetup.json');
    }

    create(data) {
        // ── SCENE DATA ────────────────────────────────────────────────
        this.difficulty  = data?.difficulty || 'NORMAL';
        this.selectedMap = data?.map        || 'map1';
        console.log('Difficulty:', this.difficulty, '| Map:', this.selectedMap);

        // ── DEBUG KEYS ────────────────────────────────────────────────
        this.keyF2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
        this.keyF3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);

        const screenW   = this.scale.width;
        const screenH   = this.scale.height;
        const SIDEBAR_W = Math.round(screenW * 0.20);
        const GAME_W    = screenW - SIDEBAR_W;
        const sidebarX  = GAME_W;

        // ── TILEMAP ───────────────────────────────────────────────────
        this.map = this.make.tilemap({ key: this.selectedMap });
        const tileset  = this.map.addTilesetImage('Testing_Tileset', 'tiles');

        const scaleX   = GAME_W  / this.map.widthInPixels;
        const scaleY   = screenH / this.map.heightInPixels;
        const mapScale = Math.max(scaleX, scaleY);

        if (this.selectedMap === 'map2') {
            const img = this.add.image(0, 0, 'BloonsCutMap1.png')
                .setOrigin(0).setDepth(-10).setScale(mapScale);
            img.x += -17.3333333333334 * mapScale;
            img.y +=   1.33333333333337 * mapScale;
        }

        const baseLayer = this.map.createLayer('Tile Layer 1', tileset);
        baseLayer.setScale(mapScale);
        baseLayer.setVisible(this.selectedMap !== 'map2');

        if (this.selectedMap === 'map1' && this.map.getLayerIndex('Pathing') !== -1) {
            const pathLayer = this.map.createLayer('Pathing', tileset);
            pathLayer.setScale(mapScale);
            pathLayer.setVisible(true);
        }

        this.cameras.main.setBounds(0, 0, GAME_W, screenH);
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setZoom(1);

        // ── PATH MANAGER ──────────────────────────────────────────────
        this.pathManager = new PathManager(this, mapScale);
        this.path        = this.pathManager.path;
        this.gridSize    = 64 * mapScale;

        // ── MONEY + LIVES ─────────────────────────────────────────────
        this.money = 500;
        this.lives = 100;

        this.moneyText = this.add.text(16, 54, `💰 $${this.money}`, {
            fontSize: '18px', fontFamily: 'monospace',
            color: '#f0c040', stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(9999);

        this.livesText = this.add.text(16, 82, `❤ ${this.lives}`, {
            fontSize: '18px', fontFamily: 'monospace',
            color: '#ff6666', stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(9999);

        // ── WAVE COUNTER ──────────────────────────────────────────────
        this.totalWaves = 50;
        this.waveText = this.add.text(16, 16, `Wave 0 / ${this.totalWaves}`, {
            fontSize: '18px', fontFamily: 'monospace',
            color: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(9999);

        // ── START WAVE BUTTON ─────────────────────────────────────────
        this.roundButton = this.add.text(16, 16, '▶  Start Wave', {
            fontSize: '18px', fontFamily: 'monospace',
            color: '#ffffff', stroke: '#000000', strokeThickness: 5,
            backgroundColor: '#1a1a2e', padding: { x: 12, y: 6 }
        })
        .setInteractive()
        .on('pointerover', function () { this.setStyle({ color: '#4ecca3' }); })
        .on('pointerout',  function () { this.setStyle({ color: '#ffffff' }); })
        .on('pointerdown', () => {
            this.roundButton.setVisible(false);
            this.waveManager.startNextWave();
        })
        .setDepth(9999).setScrollFactor(0);

            // ── GROUPS ────────────────────────────────────────────────────
        this.enemies     = this.physics.add.group({ classType: Enemy });
        this.turrets     = this.physics.add.group({ classType: Turret, runChildUpdate: false });

        this.bullets     = this.physics.add.group({ classType: Bullet, runChildUpdate: false });
        this.fireBullets = this.physics.add.group({ classType: FireBullet, runChildUpdate: false });
        this.iceBullets  = this.physics.add.group({ classType: IceBullet, runChildUpdate: false });
        this.windBullets = this.physics.add.group({ classType: WindBullet, runChildUpdate: false });
        this.mindBlasts  = this.physics.add.group({ classType: MindBlast, runChildUpdate: false });
        this.darkBullets = this.physics.add.group({ classType: DarkBullet, runChildUpdate: false });
        this.lightBullets = this.physics.add.group({ classType: LightBullet, runChildUpdate: false });
        this.rockBullets  = this.physics.add.group({ classType: RockBullet, runChildUpdate: false });

        this.physics.add.overlap(this.enemies, this.bullets, this.damageEnemy, null, this);
        this.physics.add.overlap(this.enemies, this.fireBullets, this.damageEnemy, null, this);
        this.physics.add.overlap(this.enemies, this.iceBullets, this.damageEnemy, null, this);

        this.physics.add.overlap(this.enemies, this.windBullets, this.damageEnemy, null, this);
        this.physics.add.overlap(this.enemies, this.mindBlasts, this.damageEnemy, null, this);
        this.physics.add.overlap(this.enemies, this.darkBullets, this.damageEnemy, null, this);
        this.physics.add.overlap(this.enemies, this.lightBullets, this.damageEnemy, null, this);
        this.physics.add.overlap(this.enemies, this.rockBullets, this.damageEnemy, null, this);
    

        // ── SIDEBAR ───────────────────────────────────────────────────
        const fadeW = 60;
        const grad  = this.add.graphics().setScrollFactor(0).setDepth(9997);
        for (let i = 0; i < fadeW; i++) {
            grad.fillStyle(0x0d0d1a, i / fadeW);
            grad.fillRect(sidebarX - fadeW + i, 0, 1, screenH);
        }
        this.add.rectangle(sidebarX, 0, SIDEBAR_W, screenH, 0x0d0d1a)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(9997);
        this.add.rectangle(sidebarX, 0, 2, screenH, 0x4ecca3, 0.4)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(9998);

        this.add.text(sidebarX + SIDEBAR_W / 2, 12, 'TOWERS', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#4ecca3', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9999);

        // ── TOWER DATA ────────────────────────────────────────────────
        this.towerData = {
            lightningtower: { cost: 100, bulletType: 'bullet',     label: 'Lightning' },
            icetower:       { cost: 120, bulletType: 'icebullet',     label: 'Ice'       },
            firetower:      { cost: 150, bulletType: 'firebullet', label: 'Fire'      },
            rocktower:      { cost: 200, bulletType: 'rockbullet',     label: 'Rock'      },
            darktower:      { cost: 160, bulletType: 'darkbullet',     label: 'Dark'      },
            lighttower:     { cost: 170, bulletType: 'lightbullet',     label: 'Light'     },
            psychictower:   { cost: 175, bulletType: 'mindblast',     label: 'Psychic'   },
            windtower:      { cost: 155, bulletType: 'windbullet',     label: 'Wind'      }
        };

        // ── 2×4 SIDEBAR GRID ──────────────────────────────────────────
        const COLS      = 2;
        const CELL      = Math.floor(SIDEBAR_W / COLS);
        const ICON_SIZE = 44;
        const GRID_TOP  = 36;

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
        });

        // ── DRAG SYSTEM ───────────────────────────────────────────────
        this._drag = null;
        const GRID_SIZE  = this.gridSize;
        const GHOST_SIZE = GRID_SIZE * 0.8;

        this.input.on('pointerdown', (pointer, targets) => {
            // ── KEY FIX: ignore clicks on already-placed turrets ──────
            // Without this, clicking a turret both opens the upgrade UI
            // AND starts a drag, which deducts gold unexpectedly.
            if (targets.some(t => t instanceof Turret)) return;

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

                const ok = this.pathManager.canPlace(sx, sy) && this.money >= data.cost;
                ghost.setTint(ok ? 0xffffff : 0xff4444).setAlpha(ok ? 0.85 : 0.5);
            } else {
                ghost.setPosition(pointer.x, pointer.y).setTint(0xff4444).setAlpha(0.5);
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (!this._drag) return;
            const { type, data, ghost } = this._drag;

            if (pointer.x < sidebarX) {
                const sx = Math.round(pointer.x / GRID_SIZE) * GRID_SIZE;
                const sy = Math.round(pointer.y / GRID_SIZE) * GRID_SIZE;

                if (this.pathManager.canPlace(sx, sy) && this.money >= data.cost) {
                    const turret = new Turret(this, type);
                    this.turrets.add(turret);
                    turret.bulletType = data.bulletType;
                    turret.towerType  = type;
                    turret.baseCost   = data.cost;
                    turret.setPosition(sx, sy);

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

        // ── UPGRADE UI ────────────────────────────────────────────────
        this.upgradeUI = new TowerUpgradeUI(this);

        // ── WAVE MANAGER ──────────────────────────────────────────────
        this.waveManager = new WaveManager(this, this.enemies, this.path, this.difficulty);

        // ── PAUSE MENU ────────────────────────────────────────────────
        this.isPaused = false;

        this.pauseContainer = this.add.container(screenW / 2, screenH / 2).setDepth(10000);

        const panel     = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.85).setStrokeStyle(2, 0x4ecca3);
        const resumeBtn = this.add.text(0, -40, 'Resume', {
            fontSize: '28px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setInteractive()
          .on('pointerover', function () { this.setStyle({ color: '#4ecca3' }); })
          .on('pointerout',  function () { this.setStyle({ color: '#ffffff' }); })
          .on('pointerdown', () => this.resumeGame());

        const exitBtn = this.add.text(0, 40, 'Exit to Menu', {
            fontSize: '28px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setInteractive()
          .on('pointerover', function () { this.setStyle({ color: '#ff6666' }); })
          .on('pointerout',  function () { this.setStyle({ color: '#ffffff' }); })
          .on('pointerdown', () => {
              this.scene.stop('MainScene');
              this.scene.start('MenuScene');
          });

        this.pauseContainer.add([panel, resumeBtn, exitBtn]);
        this.pauseContainer.setVisible(false);

        this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escapeKey.on('down', () => {
            this.isPaused ? this.resumeGame() : this.pauseGame();
        });
    }

    // ── UPDATE ────────────────────────────────────────────────────────
update(time, delta) {

    if (!this.enemies || !this.waveManager) return;

    this.waveManager.update(time, delta);

    this.enemies?.getChildren?.()?.forEach(e => {
        if (e?.active) e.update(time, delta, this.path, this.isPaused);
    });

    this.bullets?.getChildren?.()?.forEach(b => {
        if (b?.active) b.update(time, delta);
    });

    this.fireBullets?.getChildren?.()?.forEach(b => {
        if (b?.active) b.update(time, delta);
    });

    this.iceBullets?.getChildren?.()?.forEach(b => {
        if (b?.active) b.update(time, delta);
    });

    this.windBullets?.getChildren?.()?.forEach(b => {
        if (b?.active) b.update(time, delta);
    });

    this.mindBlasts?.getChildren?.()?.forEach(b => {
        if (b?.active) b.update(time, delta);
    });

    this.darkBullets?.getChildren?.()?.forEach(b => {
        if (b?.active) b.update(time, delta);
    });

    this.lightBullets?.getChildren?.()?.forEach(b => {
        if (b?.active) b.update(time, delta);
    });

    this.rockBullets?.getChildren?.()?.forEach(b => {
        if (b?.active) b.update(time, delta);
    });

    this.turrets?.getChildren?.()?.forEach(t => {
        if (t?.active) t.update(time, delta);
    });

    if (Phaser.Input.Keyboard.JustDown(this.keyF2)) this.pathManager.toggleBlocked();
    if (Phaser.Input.Keyboard.JustDown(this.keyF3)) this.pathManager.togglePath();
}

    // ── HELPERS ───────────────────────────────────────────────────────

    getEnemyInRange(x, y, range) {
        return this.enemies.getChildren().find(e =>
            e.active && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= range
        ) || null;
    }

 spawnBullet(turret, x, y, angle, opts = {}) {

    const damage = opts.damage ?? turret.damage;

    const groups = {
        bullet: this.bullets,
        firebullet: this.fireBullets,
        icebullet: this.iceBullets,
        windbullet: this.windBullets,
        mindblast: this.mindBlasts,
        darkbullet: this.darkBullets,
        lightbullet: this.lightBullets,
        rockbullet: this.rockBullets
    };

    const group = groups[turret.bulletType];
    if (!group) return;

    const bullet = group.get();
    if (!bullet) return;

    bullet.fire?.(x, y, angle, damage);
}

    damageEnemy(enemy, bullet) {
        if (!enemy.active || !bullet.active) return;

        enemy.receiveDamage(bullet.damage);

        if (bullet.texture?.key === 'firebullet') {
            this.enemies.getChildren().forEach(e => {
                if (!e.active || e === enemy) return;
                if (Phaser.Math.Distance.Between(enemy.x, enemy.y, e.x, e.y) <= 80)
                    e.receiveDamage(Math.floor(bullet.damage * 0.5));
            });
            bullet.deactivate?.();
        } else {
            bullet.disableBody(true, true);
        }
    }

    // Called by TowerUpgradeUI sell button
    sellTower(turret) {
        const sellPrice = Math.floor((turret.baseCost ?? 0) / 2);

        // Floating gold popup
        const popup = this.add.text(turret.x, turret.y - 10, `+$${sellPrice}`, {
            fontSize: '20px', fontFamily: 'monospace',
            color: '#f0c040', stroke: '#000000', strokeThickness: 4
        }).setDepth(99999);

        this.tweens.add({
            targets: popup,
            y: turret.y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Quad.easeOut',
            onComplete: () => popup.destroy()
        });

        this.addGold(sellPrice);

        // Close upgrade UI first so it drops its reference before destroy
        this.upgradeUI?.hide?.();

        // Fully destroy the tower
        this.turrets.remove(turret, true, true);
        turret.destroy();
    }

    // Called by WaveManager.startNextWave — updates the wave counter text
    onWaveStart(waveIndex) {
        this.waveText?.setText(`Wave ${waveIndex} / ${this.totalWaves}`);
    }

    addGold(amount) {
        this.money += amount;
        this.moneyText?.setText(`💰 $${this.money}`);
    }

    loseLives(amount) {
        this.lives = Math.max(0, this.lives - amount);
        this.livesText?.setText(`❤ ${this.lives}`);
        if (this.lives === 0) this.gameOver();
    }

    gameOver() {
        this.scene.pause();
        this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'GAME OVER',
            {
                fontSize: '64px', fontFamily: 'monospace',
                color: '#ff0000', stroke: '#000000', strokeThickness: 8,
                backgroundColor: '#000000', padding: { x: 24, y: 12 }
            }
        ).setOrigin(0.5).setDepth(99999).setScrollFactor(0);
    }

    startNextRound() {
        this.roundButton.setVisible(false);
        this.waveManager.startNextWave();
    }

    pauseGame() {
        this.isPaused = true;
        this.physics.world.pause();
        this.waveManager?.pauseWaves?.();
        this.time.paused = true;
        this.pauseContainer.setVisible(true);
    }

    resumeGame() {
        this.isPaused = false;
        this.physics.world.resume();
        this.waveManager?.resumeWaves?.();
        this.time.paused = false;
        this.pauseContainer.setVisible(false);
    }
}