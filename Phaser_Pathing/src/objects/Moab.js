import HealthBar from "./HealthBar.js";

export default class Moab extends Phaser.GameObjects.Image {
    constructor(scene) {
        super(scene, 0, 0, 'moab');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 0.000012;   // ~40% of basic — slow blimp

        this.maxHp = 600;
        this.hp = 600;

        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };

        this.healthbar = new HealthBar(scene, this);

        this.reward = 80;
        this.leakDamage = 3;

        this.setScale(0.25);
    }

    startOnPath(path) {
        this.follower.t = 0;
        path.getPoint(0, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
        this.body.enable = true;
    }

    update(time, delta, path, isPaused) {
        if (isPaused) return;

        this.follower.t += this.speed * delta;

        path.getPoint(this.follower.t, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);

        this.healthbar.update();

        if (this.follower.t >= 1) {
            const dmgText = this.scene.add.text(this.x, this.y, `-${this.leakDamage}`, {
                fontSize: "20px",
                color: "#ff0000"
            });
            this.scene.tweens.add({
                targets: dmgText,
                y: this.y - 30,
                alpha: 0,
                duration: 600,
                onComplete: () => dmgText.destroy()
            });

            if (this.scene.loseLives) {
                this.scene.loseLives(this.leakDamage);
            }

            this.healthbar.destroy();
            this.setActive(false);
            this.setVisible(false);
            this.body.enable = false;
            this.die(false);
        }
    }

    receiveDamage(amount) {
        this.hp -= amount;

        if (this.hp <= 0) {
            this.setActive(false);
            this.setVisible(false);
            this.body.enable = false;
            this.healthbar.destroy();
            this.die(true);
        }
    }

    die(giveGold = true) {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;

        if (this.scene.addGold && giveGold) {
            this.scene.addGold(this.reward);
        }

        this.healthbar.destroy();
        if (this.onDeath) {
            this.onDeath();
        }
    }
}