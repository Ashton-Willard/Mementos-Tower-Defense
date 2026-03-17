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
        // Towers atlas
        this.load.atlas('towers', 'src/assets/spritesheet.png', 'src/assets/spritesheet.json');

        // Enemy placeholder
        this.load.image('shadow', 'src/assets/Shadow.png');
    }

    create() {

    // =========================
    // Sidebar
    // =========================

    this.sidebarWidth = 150;

    this.add.rectangle(
        this.scale.width - this.sidebarWidth / 2,
        this.scale.height / 2,
        this.sidebarWidth,
        this.scale.height,
        0x222222,
        0.8
    );

    const cols = 2;
    const spacing = 70;
    const startX = this.scale.width - this.sidebarWidth + 40;
    const startY = 100;

    this.sidebarTowers = [];

    // 🔥 Automatically get all atlas frames
    const frameNames = this.textures.get('towers').getFrameNames();

    frameNames.forEach((type, index) => {

        // OPTIONAL: skip bullet frame so it doesn’t show in sidebar
        if (type === 'bullet') return;

        const col = index % cols;
        const row = Math.floor(index / cols);

        const x = startX + col * spacing;
        const y = startY + row * spacing;

        const towerButton = this.add.sprite(x, y, 'towers', type)
            .setInteractive({ draggable: true });

        towerButton.towerType = type;

        this.sidebarTowers.push(towerButton);
    });

    // =========================
    // Drag Logic
    // =========================

    this.input.on('dragstart', (pointer, gameObject) => {

        // Create preview clone (don’t move original button)
        gameObject.preview = this.add.sprite(
            pointer.x,
            pointer.y,
            'towers',
            gameObject.towerType
        );

        gameObject.preview.setAlpha(0.8);
    });

    this.input.on('drag', (pointer, gameObject) => {
        if (gameObject.preview) {
            gameObject.preview.x = pointer.x;
            gameObject.preview.y = pointer.y;
        }
    });

    this.input.on('dragend', (pointer, gameObject) => {

        if (!gameObject.preview) return;

        const cellSize = 64;

        const gridX = Math.floor(gameObject.preview.x / cellSize) * cellSize + cellSize / 2;
        const gridY = Math.floor(gameObject.preview.y / cellSize) * cellSize + cellSize / 2;

       this.input.on('dragend', (pointer, gameObject) => {

    if (!gameObject.preview) return;

    const cellSize = 64;

    const gridX = Math.floor(gameObject.preview.x / cellSize) * cellSize + cellSize / 2;
    const gridY = Math.floor(gameObject.preview.y / cellSize) * cellSize + cellSize / 2;

    // Prevent placing inside sidebar
    if (gridX < this.scale.width - this.sidebarWidth) {

        // 🔹 Create turret dynamically
        const tower = new Turret(this, gameObject.towerType);

        // Place on grid
        tower.place(gridY / cellSize, gridX / cellSize);

        // Add to turrets group
        this.turrets.add(tower);
    }

    // Remove preview
    gameObject.preview.destroy();
    gameObject.preview = null;
});

        gameObject.preview.destroy();
        gameObject.preview = null;
    });

    // =========================
    // Groups
    // =========================

    this.enemies = this.physics.add.group({ classType: Enemy });
    this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.turrets = this.add.group({ runChildUpdate: true });

    // =========================
    // Map + Grid
    // =========================

    this.map = [
        [0,-1,0,0,0,0,0,0,0,0,0],
        [0,-1,0,0,0,0,0,0,0,0,0],
        [0,-1,-1,-1,-1,-1,-1,-1,0,0,0],
        [0,0,0,0,0,0,0,-1,0,0,0],
        [0,0,0,0,0,0,0,-1,0,0,0],
        [0,0,0,0,0,0,0,-1,0,0,0],
        [0,0,0,0,0,0,0,-1,0,0,0],
        [0,0,0,0,0,0,0,-1,0,0,0]
    ];

    const graphics = this.add.graphics();
    this.drawGrid(graphics);

    // =========================
    // Path
    // =========================

    this.path = this.add.path(96, -32);
    this.path.lineTo(96, 164);
    this.path.lineTo(480, 164);
    this.path.lineTo(480, 544);

    const pathGraphics = this.add.graphics();
    pathGraphics.lineStyle(3, 0xffffff, 1);
    this.path.draw(pathGraphics);

    // =========================
    // Wave Manager
    // =========================

    this.waveManager = new WaveManager(this, this.enemies, this.path);
    this.waveManager.startWave();

    this.physics.add.overlap(this.enemies, this.bullets, this.damageEnemy, null, this);
}
    update(time, delta) {
        this.waveManager.update(time, delta);

        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) enemy.update(time, delta, this.path);
        });
    }

    drawGrid(graphics) {
        const cellSize = 64;
        const width = this.scale.width;
        const height = this.scale.height;

        graphics.lineStyle(1, 0xff0000, 0.8);

        for (let y = 0; y <= height; y += cellSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }

        for (let x = 0; x <= width; x += cellSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }

        graphics.strokePath();
    }

    getEnemyInRange(x, y, range){
        const enemies = this.enemies.getChildren();
        for(let e of enemies){
            if(e.active && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= range){
                return e;
            }
        }
        return null;
    }

    spawnBullet(x, y, angle){
        const bullet = this.bullets.get();
        if(bullet) bullet.fire(x, y, angle);
    }

    damageEnemy(enemy, bullet){
        if(enemy.active && bullet.active){
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.enable = false;
            enemy.receiveDamage(20);
        }
    }
}