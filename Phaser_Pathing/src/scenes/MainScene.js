import Enemy from '../objects/Enemy.js';
import Turret from '../objects/Turret.js';
import CannonTurret from '../objects/CannonTurret.js';
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
        this.load.image('turret', 'src/assets/turret.png');
    }

    create() {

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
        this.startButton.setVisible(true);

        // ============================================================
        // MAP + TILESET
        // ============================================================
        this.map = this.make.tilemap({ key: 'map1' });
        const tileset = this.map.addTilesetImage('Testing_Tileset', 'tiles');

        this.map.createLayer('Tile Layer 1', tileset);
        this.map.createLayer('Pathing', tileset);

        // ============================================================
        // BLOCKED TILES (path + buffer)
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
        // HARDCODED PATH
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
        this.turrets = this.add.group({ classType: Turret });

        this.currentTowerType = 'basic';

        this.input.on('pointerdown', this.placeTurret, this);

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
    // START NEXT ROUND
    // ============================================================
    startNextRound() {
        this.startButton.setVisible(false);   // hide button during wave
        this.waveManager.startWave();         // start wave properly
    }

    // ============================================================
    // UPDATE LOOP
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
    // TURRET PLACEMENT
    // ============================================================
    canPlaceTurret(i, j) {
        return !this.blockedTiles.has(`${j},${i}`);
    }

    placeTurret(pointer) {
        const i = Math.floor(pointer.y / 32);
        const j = Math.floor(pointer.x / 32);

        console.log("Clicked tile:", j, i, "Blocked:", this.blockedTiles.has(`${j},${i}`));

        if (!this.canPlaceTurret(i, j)) return;

        const turret = this.currentTowerType === 'basic'
            ? this.turrets.get(Turret)
            : this.turrets.get(CannonTurret);

        if (turret) {
            turret.setActive(true);
            turret.setVisible(true);
            turret.place(i, j);
        }
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
}