import Enemy from '../objects/Enemy.js';
import FastEnemy from '../objects/FastEnemy.js';
import Turret from '../objects/Turret.js';
import Bullet from '../objects/Bullet.js';
import WaveManager from '../systems/WaveManager.js';
import PathManager from '../systems/PathManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.image('bullet', 'src/assets/bullet.png');

        this.load.tilemapTiledJSON('map1', 'src/assets/maps/map1.tmj');
        this.load.tilemapTiledJSON('map2', 'src/assets/maps/Map2.tmj');

        this.load.image('BloonsCutMap1.png', 'src/assets/maps/BloonsCutMap1.png');
        this.load.image('tiles', 'src/assets/tiles.png');

        this.load.image('enemy_shadow', 'src/assets/enemies/enemy_shadow.png');

        this.load.spritesheet('turret', 'src/assets/spritesheet.png', {
            frameWidth: 66,
            frameHeight: 50 
        });
    }

    create(data) {
        this.difficulty = data?.difficulty || 'NORMAL';
        this.selectedMap = data?.map || 'map1';

        console.log("Difficulty:", this.difficulty);
        console.log("Selected Map:", this.selectedMap);

        this.keyF2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
        this.keyF3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);

        const screenW = this.scale.width;
        const screenH = this.scale.height;

        this.sidebarWidth = screenW * 0.20;
        this.playWidth = screenW - this.sidebarWidth;

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
        })
        .setDepth(9999)
        .setScrollFactor(0);

        // MAP
        this.map = this.make.tilemap({ key: this.selectedMap });
        const tileset = this.map.addTilesetImage('Testing_Tileset', 'tiles');

        const scaleX = this.playWidth / this.map.widthInPixels;
        const scaleY = screenH / this.map.heightInPixels;
        const mapScale = Math.max(scaleX, scaleY);

        // BACKGROUND IMAGE FOR MAP2 (from imagelayer or direct)
        if (this.selectedMap === 'map2') {
            // If using imagelayer in TMJ, you can instead iterate map.layers.
            const img = this.add.image(0, 0, 'BloonsCutMap1.png')
                .setOrigin(0)
                .setDepth(-10)
                .setScale(mapScale);

            // If you want to match TMJ offsets exactly, tweak here:
            img.x += -17.3333333333334 * mapScale;
            img.y += 1.33333333333337 * mapScale;
        }

        // TILE LAYERS
        const baseLayer = this.map.createLayer('Tile Layer 1', tileset);
        baseLayer.setScale(mapScale);

        // Hide Tile Layer 1 ONLY for map2
        if (this.selectedMap === 'map2') {
            baseLayer.setVisible(false);
        } else {
            baseLayer.setVisible(true);
        }


        // MAP1: keep Pathing layer VISIBLE (as you wanted)
        if (this.selectedMap === 'map1') {
            if (this.map.getLayerIndex('Pathing') !== -1) {
                const pathLayer = this.map.createLayer('Pathing', tileset);
                pathLayer.setScale(mapScale);
                pathLayer.setVisible(true); // explicitly visible
            }
        }

        this.cameras.main.setBounds(0, 0, this.playWidth, screenH);
        this.cameras.main.setScroll(0, 0);
        this.cameras.main.setZoom(1);

        // PATH MANAGER (uses hardcoded paths per map)
        this.pathManager = new PathManager(this, mapScale);
        this.path = this.pathManager.path;

        // GROUPS
        this.enemies = this.physics.add.group({ classType: Enemy });
        this.bullets = this.physics.add.group({ classType: Bullet });
        this.turrets = this.add.group();

        // SIDEBAR
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
        .setDepth(9999);

        this.towerData = {
            lightningtower: { cost: 100, frame: 0 },
            icetower:       { cost: 120, frame: 1 },
            firetower:      { cost: 150, frame: 2 },
            rocktower:      { cost: 200, frame: 3 }
        };

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

        this.draggingTower = null;
        this.draggingType = null;

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

            if (this.pathManager.canPlace(snappedX, snappedY)) {
                this.draggingTower.setTint(0xffffff);
            } else {
                this.draggingTower.setTint(0xff0000);
            }
        });

        this.input.on('dragend', (pointer) => {
            if (!this.draggingTower) return;

            const snappedX = Math.floor(pointer.x / 64) * 64 + 32;
            const snappedY = Math.floor(pointer.y / 64) * 64 + 32;

            const data = this.towerData[this.draggingType];

            if (this.pathManager.canPlace(snappedX, snappedY) && this.money >= data.cost) {
                const turret = new Turret(this, this.draggingType);

                this.add.existing(turret);
                this.turrets.add(turret);

                turret.setTexture('turret', data.frame);
                turret.setAlpha(1);
                turret.clearTint();
                turret.setScale(1);

                const i = Math.floor(snappedY / 64);
                const j = Math.floor(snappedX / 64);
                turret.place(i, j);

                this.money -= data.cost;
                this.moneyText.setText(`Money: $${this.money}`);
            }

            this.draggingTower.destroy();
            this.draggingTower = null;
            this.draggingType = null;
        });

        this.waveManager = new WaveManager(this, this.enemies, this.path, this.difficulty);

        this.physics.add.overlap(this.enemies, this.bullets, this.damageEnemy, null, this);

        // --- PAUSE MENU UI ---
        this.pauseContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
        this.pauseContainer.setDepth(9999);

        // Background
        const panel = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.75).setStrokeStyle(3, 0xffffff);

        // Resume button
        const resumeBtn = this.add.text(0, -40, "Resume", {
            fontSize: "28px",
            color: "#ffffff"
        }).setOrigin(0.5).setInteractive();

        // Exit button
        const exitBtn = this.add.text(0, 40, "Exit to Menu", {
            fontSize: "28px",
            color: "#ffffff"
        }).setOrigin(0.5).setInteractive();

        this.pauseContainer.add([panel, resumeBtn, exitBtn]);
        this.pauseContainer.setVisible(false);

        // Resume click
        resumeBtn.on("pointerdown", () => {
            this.resumeGame();
        });

        // Exit click
        exitBtn.on("pointerdown", () => {
            this.scene.stop("MainScene");
            this.scene.start("MenuScene"); // change to your menu scene key
        });

        this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.escapeKey.on("down", () => {
            if (this.isPaused) {
                this.resumeGame();
            } else {
                this.pauseGame();
            }
        });
    }

    update(time, delta) {
        if (this.waveManager) this.waveManager.update(time, delta);

        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) enemy.update(time, delta, this.path, this.isPaused);
        });

        this.bullets.getChildren().forEach(bullet => {
            if (bullet.active) bullet.update(time, delta);
        });

        this.turrets.getChildren().forEach(turret => {
            if (turret.active) turret.update(time, delta);
        });

        if (Phaser.Input.Keyboard.JustDown(this.keyF2)) {
            this.pathManager.toggleBlocked();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyF3)) {
            this.pathManager.togglePath();
        }
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


    pauseGame() {
    this.isPaused = true;

    // Pause gameplay systems ONLY
    this.physics.world.pause();
    if (this.waveManager) this.waveManager.pauseWaves?.();
    this.time.paused = true;

    // Show pause menu
    this.pauseContainer.setVisible(true);
    }

    resumeGame() {
        this.isPaused = false;

        // Resume gameplay systems
        this.physics.world.resume();
        if (this.waveManager) this.waveManager.resumeWaves?.();
        this.time.paused = false;

        // Hide pause menu
        this.pauseContainer.setVisible(false);
    }


}
