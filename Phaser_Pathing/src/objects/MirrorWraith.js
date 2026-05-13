import HealthBar from "./HealthBar.js";

export default class MirrorWraith extends Phaser.GameObjects.Image {
    constructor(scene) {
        super(scene, 0, 0, 'mirrorwraith');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 0.000065;   // faster than basic (0.00003)

        this.maxHp = 280;
        this.hp = 280;

        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };

        this.healthbar = new HealthBar(scene, this);

        this.reward = 45;
        this.leakDamage = 2;

        // Phase mechanic — toggles every 3 seconds
        this._phaseTimer = 0;
        this._phased = false;

        this.setScale(0.08);
        this.setAlpha(0.95);
    }

    startOnPath(path) {
        this.follower.t = 0;
        path.getPoint(0, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
        this.body.enable = true;
    }

    update(time, delta, path, isPaused) {
        if (isPaused) return;

        // Phase pulse — goes semi-transparent and takes half damage
        this._phaseTimer += delta;
        if (this._phaseTimer >= 3000) {
            this._phaseTimer = 0;
            this._phased = !this._phased;
            this.setAlpha(this._phased ? 0.35 : 0.95);
        }

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
        // Take half damage while phased
        const effective = this._phased ? Math.floor(amount * 0.5) : amount;
        this.hp -= effective;

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