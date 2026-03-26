import Enemy from '../objects/Enemy.js';
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
        this.load.image('enemy', 'src/assets/enemy.png');

        // ✅ Spritesheet: 80x80
        this.load.spritesheet('turret', 'src/assets/spritesheet.png', {
            frameWidth: 66,
            frameHeight: 50
        });
    }

    create() {

        // ============================================================
        // MONEY SYSTEM
        // ============================================================
        this.money = 500;

        this.moneyText = this.add.text(20, 60, `Money: $${this.money}`, {
            fontSize: "20px",
            color: "#00ff00"
        }).setScrollFactor(0).setDepth(9999);

        // ============================================================
        // START WAVE BUTTON
        // ============================================================
        this.startButton = this.add.text(20, 20, "Start Wave", {
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: { x: 10, y: 5 }
        })
        .setInteractive()
        .on('pointerdown', () => {
            this.startNextRound();
        });

        this.startButton.setDepth(9999);
        this.startButton.setScrollFactor(0);

        // ============================================================
        // MAP
        // ============================================================
        this.map = this.make.tilemap({ key: 'map1' });
        const tileset = this.map.addTilesetImage('Testing_Tileset', 'tiles');

        this.map.createLayer('Tile Layer 1', tileset);
        this.map.createLayer('Pathing', tileset);

        // ============================================================
        // BLOCKED TILES
        // ============================================================
        const pathTiles = [
            [3,19],[3,3],[5,2],[25,2],[26,4],[26,11],
            [17,11],[14,7],[10,7],[8,9],[8,15],[10,16],[29,16]
        ];

        this.blockedTiles = new Set();

        for (const [x, y] of pathTiles) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    this.blockedTiles.add(`${x + dx},${y + dy}`);
                }
            }
        }

        // ============================================================
        // PATH
        // ============================================================
        this.path = this.add.path();
        this.path.moveTo(112, 624);
        this.path.lineTo(112, 112);
        this.path.lineTo(176, 80);
        this.path.lineTo(816, 80);
        this.path.lineTo(848, 144);
        this.path.lineTo(848, 368);
        this.path.lineTo(560, 368);
        this.path.lineTo(464, 240);
        this.path.lineTo(336, 240);
        this.path.lineTo(272, 304);
        this.path.lineTo(272, 496);
        this.path.lineTo(336, 528);
        this.path.lineTo(944, 528);

        const debug = this.add.graphics();
        debug.lineStyle(4, 0xff0000, 1);
        this.path.draw(debug);

        // ============================================================
        // GROUPS
        // ============================================================
        this.enemies = this.physics.add.group({ classType: Enemy });
        this.bullets = this.physics.add.group({ classType: Bullet });
        this.turrets = this.add.group(); // <- allow any Turret type

        // ============================================================
        // SIDEBAR
        // ============================================================
        const sidebarX = this.cameras.main.width - 160;

        this.add.rectangle(
            sidebarX,
            0,
            160,
            this.cameras.main.height,
            0x222222
        ).setOrigin(0, 0)
         .setScrollFactor(0)
         .setDepth(9998);

        // ============================================================
        // TOWER DATA
        // ============================================================
        this.towerData = {
            lightningtower: { cost: 100, frame: 0 },
            icetower: { cost: 120, frame: 1 },
            firetower: { cost: 150, frame: 2 },
            rocktower: { cost: 200, frame: 3 }
        };

        // ============================================================
        // CREATE ICONS
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

                // ✅ CREATE NEW TURRET INSTANCE
                const turret = new Turret(this, this.draggingType);

                this.add.existing(turret);
                this.turrets.add(turret);

                turret.setTexture('turret', data.frame);
                turret.setAlpha(1);
                turret.clearTint();
                turret.setScale(1);

                turret.place(i, j);

                // 💰 DEDUCT MONEY
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

        this.physics.add.overlap(this.enemies, this.bullets, this.damageEnemy, null, this);
    }

    // ============================================================
    startNextRound() {
        this.startButton.setVisible(false);
        this.waveManager.startWave();
    }

    // ============================================================
    update(time, delta) {
        if (!this.waveManager) return;

        this.waveManager.update(time, delta);

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
    canPlaceTurret(i, j) {
        const worldX = j * 64;
        if (worldX > this.cameras.main.width - 160) return false;
        return !this.blockedTiles.has(`${j},${i}`);
    }

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
}