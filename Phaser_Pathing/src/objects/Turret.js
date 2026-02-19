export default class Turret extends Phaser.GameObjects.Image {
    constructor(scene) {
        super(scene, 0, 0, 'sprites', 'turret');
        scene.add.existing(this);

        this.level = 1;
        this.stats = {
            1: { damage: 20, range: 100, fireRate: 1000 },
            2: { damage: 35, range: 120, fireRate: 900 },
            3: { damage: 50, range: 140, fireRate: 750 }
        };

        const s = this.stats[this.level];
        this.range = s.range;
        this.fireRate = s.fireRate;
        this.damage = s.damage;
        this.nextShot = 0;
    }

    place(i, j) {
        this.x = j * 64 + 32;
        this.y = i * 64 + 32;
    }

    update(time, delta) {
        if (time > this.nextShot) {
            this.fire();
            this.nextShot = time + this.fireRate;
        }
    }

    fire() {
        const enemy = this.scene.getEnemyInRange(this.x, this.y, this.range);
        if (!enemy) return;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
        this.scene.spawnBullet(this.x, this.y, angle);

        this.rotation = angle + Math.PI / 2;
    }

    upgrade() {
        if (this.level < 3) {
            this.level++;
            const s = this.stats[this.level];
            this.range = s.range;
            this.fireRate = s.fireRate;
            this.damage = s.damage;
        }
    }
}