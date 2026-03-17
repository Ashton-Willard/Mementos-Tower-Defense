import HealthBar from "./HealthBar.js";

export default class Enemy extends Phaser.GameObjects.Image {
    constructor(scene) {

        // Use the placeholder texture you loaded in preload()
        super(scene, 0, 0, 'enemy');   // <-- CHANGE IS HERE

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Movement speed
        this.speed = 0.00003;

        this.maxHp = 100;
        this.hp = 100;

        // Path follower
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };

        // Health bar
        this.healthbar = new HealthBar(scene, this);
    }

    startOnPath(path) {
        this.follower.t = 0;
        path.getPoint(0, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
        this.body.enable = true;
    }

    update(time, delta, path) {
        this.follower.t += this.speed * delta;

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