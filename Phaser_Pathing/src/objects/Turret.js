// Turret.js

const TOWER_STATS = {
    lightningtower: {
        range: 1000,
        fireRate: 1,
        damage: 25
    },
    icetower: {
        range: 150,
        fireRate: 800,
        damage: 10
    },
    firetower: {
        range: 170,
        fireRate: 700,
        damage: 12
    },
    rocktower: {
        range: 220,
        fireRate: 1500,
        damage: 40
    }
};

export default class Turret extends Phaser.GameObjects.Sprite {

    constructor(scene, type) {
        // ✅ Use correct texture key and type
        super(scene, 0, 0, 'turret', 0);

        scene.add.existing(this);

        this.type = type;

        const stats = TOWER_STATS[type];

        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.damage = stats.damage;

        this.lastFired = 0;

        // Ensure fully visible in case of reused object
        this.setAlpha(1);
        this.clearTint();
        this.setScale(1);
    }

    // ==========================================================
    // PLACE TURRET ON GRID
    // ==========================================================
    place(row, col) {
        const cellSize = 64; // matches MainScene grid
        this.x = col * cellSize + cellSize / 2;
        this.y = row * cellSize + cellSize / 2;
    }

    // ==========================================================
    // UPDATE LOOP
    // ==========================================================
    update(time) {
        if (time > this.lastFired + this.fireRate) {

            const enemy = this.scene.getEnemyInRange(this.x, this.y, this.range);

            if (enemy) {
                const angle = Phaser.Math.Angle.Between(
                    this.x,
                    this.y,
                    enemy.x,
                    enemy.y
                );

                // spawn bullet with damage
                this.scene.spawnBullet(this.x, this.y, angle, this.damage);

                this.lastFired = time;
            }
        }
    }
}