import HealthBar from "./HealthBar.js";
export default class Enemy extends Phaser.GameObjects.Image {
    constructor(scene) {
        super(scene, 0, 0, 'sprites', 'enemy');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.maxHp = 100;
        this.hp = 100;
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
        
        this.healthbar = new HealthBar(scene, this);
    }

    startOnPath(path) {
        this.follower.t = 0;
        path.getPoint(0, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
        this.body.enable = true;
    }

        update(time, delta, path) {
        this.follower.t += 0.0001 * delta;

        path.getPoint(this.follower.t, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);

        this.healthbar.update();

        if (this.follower.t >= 1) {
            this.healthbar.destroy();
            this.setActive(false);
            this.setVisible(false);
            this.body.enable = false;
        }
    }

    receiveDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.setActive(false);
            this.setVisible(false);
            this.body.enable = false;
            this.healthbar.destroy();
        }
    }
}