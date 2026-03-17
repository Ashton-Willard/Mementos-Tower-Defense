const TOWER_STATS = {
    lightningtower: {
        range: 200,
        fireRate: 1200,
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
        super(scene, 0, 0, 'towers', type);

        scene.add.existing(this);

        this.type = type;

        const stats = TOWER_STATS[type];

        this.range = stats.range;
        this.fireRate = stats.fireRate;
        this.damage = stats.damage;

        this.lastFired = 0;
    }

    place(row, col) {
        const cellSize = 64;
        this.x = col * cellSize + cellSize / 2;
        this.y = row * cellSize + cellSize / 2;
    }

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

                this.scene.spawnBullet(this.x, this.y, angle);

                this.lastFired = time;
            }
        }
    }
}