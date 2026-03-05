import Enemy from '../objects/Enemy.js';
import FastEnemy from '../objects/FastEnemy.js';
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

        // --- Load map + tileset ---
        this.map = this.make.tilemap({ key: 'map1' });
        const tileset = this.map.addTilesetImage('Testing_Tileset', 'tiles');

        this.map.createLayer('Tile Layer 1', tileset);
        this.map.createLayer('Pathing', tileset);

        // ============================================================
        // BLOONS‑STYLE BLOCKED TILES (path + buffer)
        // ============================================================

        // Your path tiles (tile coordinates)
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

        // Create a Set of blocked tiles
        this.blockedTiles = new Set();

        // Add a 1‑tile buffer around each path tile
        // (Bloons TD style: prevents placing too close to the track)
        for (const [x, y] of pathTiles) {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const bx = x + dx;
                    const by = y + dy;
                    this.blockedTiles.add(`${bx},${by}`);
                }
            }
        }

        // ============================================================
        // HARDCODED PATH (matches your brown tiles exactly)
        // ============================================================

        this.path = this.add.path();

        this.path.moveTo(112, 624);   // (3,19)
        this.path.lineTo(112, 112);   // (3,3)
        this.path.lineTo(176, 80);    // (5,2)
        this.path.lineTo(816, 80);    // (25,2)
        this.path.lineTo(848, 144);   // (26,4)
        this.path.lineTo(848, 368);   // (26,11)
        this.path.lineTo(560, 368);   // (17,11)
        this.path.lineTo(464, 240);   // (14,7)
        this.path.lineTo(336, 240);   // (10,7)
        this.path.lineTo(272, 304);   // (8,9)
        this.path.lineTo(272, 496);   // (8,15)
        this.path.lineTo(336, 528);   // (10,16)
        this.path.lineTo(944, 528);   // (29,16)

        // Draw red debug line so you can see the path
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

        this.waveManager = new WaveManager(this, this.enemies, this.path);
        this.waveManager.startWave();

        this.physics.add.overlap(this.enemies, this.bullets, this.damageEnemy, null, this);
    }

    update(time, delta) {
        if (!this.waveManager) return;

        this.waveManager.update(time, delta);

        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) enemy.update(time, delta, this.path);
        });
    }

    // ============================================================
    // BLOONS‑STYLE TURRET PLACEMENT
    // ============================================================

    canPlaceTurret(i, j) {

        // If tile is in blockedTiles (path + buffer), do NOT allow placement
        if (this.blockedTiles.has(`${j},${i}`)) return false;

        // Everything else is buildable (Bloons style)
        return true;
    }

    placeTurret(pointer) {
        const i = Math.floor(pointer.y / 32);
        const j = Math.floor(pointer.x / 32);

        // TEMP sanity check so you can see what tile you clicked
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

    getEnemyInRange(x, y, range) {
        return this.enemies.getChildren().find(e =>
            e.active && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= range
        ) || null;
    }

    spawnBullet(x, y, angle) {
        const bullet = this.bullets.get();
        if (bullet) bullet.fire(x, y, angle);
    }

    damageEnemy(enemy, bullet) {
        if (enemy.active && bullet.active) {
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.enable = false;
            enemy.receiveDamage(20);
        }
    }
}