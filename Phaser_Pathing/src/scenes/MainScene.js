import Enemy from '../objects/Enemy.js';
import FastEnemy from '../objects/FastEnemy.js';
import Turret from '../objects/Turret.js';
import Bullet from '../objects/Bullet.js';
import WaveManager from '../systems/WaveManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('bullet', 'src/assets/bullet.png');
        this.load.tilemapTiledJSON('map1', 'src/assets/maps/map1.tmj');
        this.load.image('tiles', 'src/assets/tiles.png');
        this.load.image('enemy_shadow', 'src/assets/enemies/enemy_shadow.png');

        this.load.spritesheet('turret', 'src/assets/spritesheet.png', {
            frameWidth: 66,
            frameHeight: 50 
        });
    }

    create() {

        // ============================================================
        // RESPONSIVE SCALING
        // ============================================================
        const screenW = this.scale.width;
        const screenH = this.scale.height;

        this.sidebarWidth = screenW * 0.20;   // 20% sidebar
        this.playWidth = screenW - this.sidebarWidth;

        // ============================================================
        // MONEY + LIVES SYSTEM
        // ============================================================
        this.money = 500;
        this.lives = 100;

        this.moneyText = this.add.text(20, 60, `Money: $${this.money}`, {
            fontSize: "20px",
            color: "#00ff00"
        }).setScrollFactor(0).setDepth(9999);

        this.livesText = this.add.text(20, 110, `Lives: ${this.lives}`, {
            fontSize: "24px",
            color: "#ffff00",
            backgroundColor: "#000000",
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(9999);

        // ============================================================
        // START WAVE BUTTON
        // ============================================================
        this.roundButton = this.add.text(20, 20, "Start Wave", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 10, y: 5 }
        })
        .setInteractive()
        .on('pointerdown', () => {
            this.roundButton.setVisible(false);
            this.waveManager.startNextWave();
        });

        this.roundButton.setDepth(9999).setScrollFactor(0);

        // ============================================================
        // MAP
        // ============================================================
        this.map = this.make.tilemap({ key: 'map1' });
        const tileset = this.map.addTilesetImage('Testing_Tileset', 'tiles');

        this.map.createLayer('Tile Layer 1', tileset);
        this.map.createLayer('Pathing', tileset);

        // ============================================================
        // SCALE MAP TO FIT PLAY AREA (ONLY SCALE TILEMAP LAYERS)
        // ============================================================
        const scaleX = this.playWidth / this.map.widthInPixels;
        const scaleY = screenH / this.map.heightInPixels;
        const mapScale = Math.max(scaleX, scaleY);

        this.map.layers.forEach(layer => {
            layer.tilemapLayer.setScale(mapScale);
        });

        // Fix camera after scaling
        this.cameras.main.setBounds(0, 0, this.playWidth, screenH);
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setZoom(1);

        // ============================================================
        // BLOCKED TILES
        // ============================================================
        const pathTiles = [
            [3,19],
            [3,3],
            [5,2],
            [25,2],
            [26,4],
            [26,11],
            [17,11],
            [14,7],
            [10,7],
            [8,9],
            [8,15],
            [10,16],
            [29,16]
        ];

        this.blockedTiles = new Set();

        for (const [x, y] of pathTiles) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    this.blockedTiles.add(`${x + dx},${y + dy}`);
                }
            }
        }
        const blockedDebug = this.add.graphics();
        blockedDebug.fillStyle(0xff0000, 0.25); // red tint, 25% opacity

        this.blockedTiles.forEach(key => {
            const [x, y] = key.split(',').map(Number);

            blockedDebug.fillRect(
                x * 64 * mapScale,
                y * 64 * mapScale,
                64 * mapScale,
                64 * mapScale
            );
        });


        // ============================================================
        // PATH (DO NOT SCALE PATH)
        // ============================================================
        this.path = this.add.path();
        const P = (x, y) => ({ x: x * mapScale, y: y * mapScale});

        this.path.moveTo(P(112, 624).x, P(112, 624).y);
        this.path.lineTo(P(112, 112).x, P(112, 112).y);
        this.path.lineTo(P(176, 80).x, P(176, 80).y);
        this.path.lineTo(P(816, 80).x, P(816, 80).y);
        this.path.lineTo(P(848, 144).x, P(848, 144).y);
        this.path.lineTo(P(848, 368).x, P(848, 368).y);
        this.path.lineTo(P(560, 368).x, P(560, 368).y);
        this.path.lineTo(P(464, 240).x, P(464, 240).y);
        this.path.lineTo(P(336, 240).x, P(336, 240).y);
        this.path.lineTo(P(272, 304).x, P(272, 304).y);
        this.path.lineTo(P(272, 496).x, P(272, 496).y);
        this.path.lineTo(P(336, 528).x, P(336, 528).y);
        this.path.lineTo(P(944, 528).x, P(944, 528).y);

        const debug = this.add.graphics();
        debug.lineStyle(4, 0xff0000, 1);
        this.path.draw(debug);

        // ============================================================
        // GROUPS
        // ============================================================
        this.enemies = this.physics.add.group({ classType: Enemy });
        this.bullets = this.physics.add.group({ classType: Bullet });
        this.turrets = this.add.group();

        // ============================================================
        // SIDEBAR
        // ============================================================
        const sidebarX = this.playWidth;

        this.add.rectangle(
            sidebarX,
            0,
            this.sidebarWidth,
            screenH,
            0x222222
        )
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(9998);

        // ============================================================
        // TOWER DATA
        // ============================================================
        this.towerData = {
            lightningtower: { cost: 100, frame: 0 },
            icetower:       { cost: 120, frame: 1 },
            firetower:      { cost: 150, frame: 2 },
            rocktower:      { cost: 200, frame: 3 }
        };

        // ============================================================
        // SIDEBAR ICONS
        // ============================================================
        let yOffset = 120;

        Object.keys(this.towerData).forEach(type => {
            const data = this.towerData[type];

            const icon = this.add.image(
                sidebarX + 80,
                yOffset,
                'turret',
                data.frame
            )
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(9999)
            .setScale(0.7);

            this.add.text(sidebarX + 40, yOffset + 50, `$${data.cost}`, {
                fontSize: "16px",
                color: "#ffffff"
            }).setScrollFactor(0).setDepth(9999);

            icon.towerType = type;
            this.input.setDraggable(icon);

            yOffset += 140;
        });

        // ============================================================
        // DRAG STATE
        // ============================================================
        this.draggingTower = null;
        this.draggingType = null;

        // ============================================================
        // DRAG EVENTS
        // ============================================================
        this.input.on('dragstart', (pointer, gameObject) => {
            if (!gameObject.towerType) return;

            const type = gameObject.towerType;
            const data = this.towerData[type];

            if (this.money < data.cost) return;

            this.draggingType = type;

            this.draggingTower = this.add.image(
                pointer.x,
                pointer.y,
                'turret',
                data.frame
            )
            .setAlpha(0.5)
            .setDepth(9999);
        });

        this.input.on('drag', (pointer) => {
            if (!this.draggingTower) return;

            const snappedX = Math.floor(pointer.x / 64) * 64 + 32;
            const snappedY = Math.floor(pointer.y / 64) * 64 + 32;

            this.draggingTower.setPosition(snappedX, snappedY);

            const i = Math.floor(pointer.y / 64);
            const j = Math.floor(pointer.x / 64);

            if (this.canPlaceTurret(i, j)) {
                this.draggingTower.setTint(0xffffff);
            } else {
                this.draggingTower.setTint(0xff0000);
            }
        });

        this.input.on('dragend', (pointer) => {
            if (!this.draggingTower) return;

            const i = Math.floor(pointer.y / 64);
            const j = Math.floor(pointer.x / 64);

            const data = this.towerData[this.draggingType];

            if (this.canPlaceTurret(i, j) && this.money >= data.cost) {

                const turret = new Turret(this, this.draggingType);

                this.add.existing(turret);
                this.turrets.add(turret);

                turret.setTexture('turret', data.frame);
                turret.setAlpha(1);
                turret.clearTint();
                turret.setScale(1);

                turret.place(i, j);

                this.money -= data.cost;
                this.moneyText.setText(`Money: $${this.money}`);
            }

            this.draggingTower.destroy();
            this.draggingTower = null;
            this.draggingType = null;
        });

        // ============================================================
        // WAVE MANAGER
        // ============================================================
        this.waveManager = new WaveManager(this, this.enemies, this.path);

        // ============================================================
        // COLLISIONS
        // ============================================================
        this.physics.add.overlap(this.enemies, this.bullets, this.damageEnemy, null, this);
    }

    // ============================================================
    // UPDATE LOOP
    // ============================================================
    update(time, delta) {
        if (this.waveManager) {
            this.waveManager.update(time, delta);
        }

        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) enemy.update(time, delta, this.path);
        });

        this.bullets.getChildren().forEach(bullet => {
            if (bullet.active) bullet.update(time, delta);
        });

        this.turrets.getChildren().forEach(turret => {
            if (turret.active) turret.update(time, delta);
        });
    }

    // ============================================================
    // TURRET PLACEMENT
    // ============================================================
    canPlaceTurret(i, j) {
        const worldX = j * 64;
        if (worldX > this.playWidth) return false;
        return !this.blockedTiles.has(`${j},${i}`);
    }

    // ============================================================
    // BULLET + DAMAGE
    // ============================================================
    getEnemyInRange(x, y, range) {
        return this.enemies.getChildren().find(e =>
            e.active && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= range
        ) || null;
    }

    spawnBullet(x, y, angle, damage) {
        const bullet = this.bullets.get();
        if (bullet) bullet.fire(x, y, angle, damage);
    }

    damageEnemy(enemy, bullet) {
        if (enemy.active && bullet.active) {
            enemy.receiveDamage(bullet.damage);
            bullet.disableBody(true, true);
        }
    }

    // ============================================================
    // LIVES + GOLD
    // ============================================================
    addGold(amount) {
        this.money += amount;
        this.moneyText.setText(`Money: $${this.money}`);
    }

    loseLives(amount) {
        this.lives -= amount;
        if (this.lives < 0) this.lives = 0;

        this.livesText.setText(`Lives: ${this.lives}`);

        if (this.lives === 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.scene.pause();
        this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            "You Have Died!",
            {
                fontSize: "64px",
                color: "#ff0000",
                backgroundColor: "#000000",
                padding: { x: 20, y: 10 }
            }
        )
        .setOrigin(0.5)
        .setDepth(9999)
        .setScrollFactor(0);
    }
}
