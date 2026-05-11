import HealthBar from "./HealthBar.js";

export default class Enemy extends Phaser.GameObjects.Image {
    constructor(scene) {
        super(scene, 0, 0, 'enemy');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 0.00003;

        this.maxHp = 100;
        this.hp = 100;

        this.isBurning = false;
this.burnTimer = 0;
this.burnDamage = 0;
this.burnTickInterval = 500; // damage every 0.5s
this.lastBurnTick = 0;
this.burnDuration = 0;
this.burnStartTime = 0;

        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };

        this.healthbar = new HealthBar(scene, this);

        this.reward = 10;
        this.leakDamage = 1;

        this._dead = false;
    }

    startOnPath(path) {
        this._dead = false;
        this.follower.t = 0;
        this.hp = this.maxHp; // ✅ reset HP if reused

        path.getPoint(0, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);

        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
    }

    update(time, delta, path, isPaused) {
        if (isPaused) return;

        this.follower.t += this.speed * delta;

        path.getPoint(this.follower.t, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);

        if (this.healthbar) {
            this.healthbar.update();
        }

        if (this.follower.t >= 1) {
            // Floating leak popup
            const dmgText = this.scene.add.text(this.x, this.y, `-${this.leakDamage}`, {
                fontSize: '20px', color: '#ff0000'
            });
            this.scene.tweens.add({
                targets: dmgText,
                y: this.y - 30, alpha: 0, duration: 600,
                onComplete: () => dmgText.destroy()
            });

            if (this.scene.loseLives) {
                this.scene.loseLives(this.leakDamage);
            }

            this.die(false);
        }
    }

    receiveDamage(amount) {
        if (this._dead) return;
        this.hp -= amount;
        if (this.hp <= 0) this.die(true);
    }

    die(giveGold = true) {
        if (this._dead) return;
        this._dead = true;

        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;

        if (this.healthbar) {
            this.healthbar.destroy();
            this.healthbar = null;
        }

        if (giveGold && this.scene.addGold) {
            this.scene.addGold(this.reward);
        }

        if (this.onDeath) {
            this.onDeath();
        }

        // 💀 Disable enemy
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
    }
}