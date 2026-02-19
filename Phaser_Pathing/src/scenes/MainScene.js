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
        this.load.atlas('sprites', 'src/assets/spritesheet.png', 'src/assets/spritesheet.json');
        this.load.image('bullet', 'src/assets/bullet.png');
    }

    create() {

        // MAP MUST BE DEFINED
        this.map = [
            [ 0,-1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0,-1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0,-1,-1,-1,-1,-1,-1,-1, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0,-1, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0,-1, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0,-1, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0,-1, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0,-1, 0, 0, 0]
        ];

        // Draw grid
        const graphics = this.add.graphics();
        this.drawGrid(graphics);

        // Create path
        this.path = this.add.path(96, -32);
        this.path.lineTo(96, 164);
        this.path.lineTo(480, 164);
        this.path.lineTo(480, 544);

        const pathGraphics = this.add.graphics();
        pathGraphics.lineStyle(3, 0xffffff, 1);
        this.path.draw(pathGraphics);

        // Enemy group
        this.enemies = this.physics.add.group({
            classType: Enemy,
        });

        // Bullet group
        this.bullets = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });

        // Turret group
        this.turrets = this.add.group({
            classType: Turret,
            runChildUpdate: true
        });

        // Default tower type
        this.currentTowerType = 'basic';

        // Input
        this.input.on('pointerdown', this.placeTurret, this);

        // Wave manager
        this.waveManager = new WaveManager(this, this.enemies, this.path);
        this.waveManager.startWave();

        // Bullet collision
        this.physics.add.overlap(this.enemies, this.bullets, this.damageEnemy, null, this);
    }

    update(time, delta) {
        this.waveManager.update(time, delta);

        // manually updates enemies with path
        this.enemies.getChildren().forEach(enemy => {
            if(enemy.active){
                enemy.update(time, delta, this.path);
            }
        });
    }

    drawGrid(graphics) {
        graphics.lineStyle(1, 0x0000ff, 0.8);

        for (let i = 0; i < 8; i++) {
            graphics.moveTo(0, i * 64);
            graphics.lineTo(640, i * 64);
        }

        for (let j = 0; j < 10; j++) {
            graphics.moveTo(j * 64, 0);
            graphics.lineTo(j * 64, 512);
        }

        graphics.strokePath();
    }

    placeTurret(pointer) {
        const i = Math.floor(pointer.y / 64);
        const j = Math.floor(pointer.x / 64);

        if(!this.canPlaceTurret(i, j)) return;
        let turret;

        if(this.currentTowerType === 'basic'){
            turret = this.turrets.get(Turret);
        } else if (this.currentTowerType === 'cannon'){
            turret = this.turrets.get(CannonTurret);
        }

        if (turret) {
            turret.setActive(true);
            turret.setVisible(true);
            turret.place(i, j);
        }
    }

    canPlaceTurret(i, j) {
        return this.map[i][j] === 0;
    }

    getEnemyInRange(x, y, range) {
        const enemies = this.enemies.getChildren();
        for (let e of enemies) {
            if (e.active && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= range) {
                return e;
            }
        }
        return null;
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