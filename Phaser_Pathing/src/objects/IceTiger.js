import HealthBar from "./HealthBar.js";

export default class IceTiger extends Phaser.GameObjects.Image {
    constructor(scene) {
        super(scene, 0, 0, 'icetiger');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 0.000055;   // fast — between fast enemy and basic

        this.maxHp = 420;
        this.hp = 420;

        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };

        this.healthbar = new HealthBar(scene, this);

        this.reward = 60;
        this.leakDamage = 2;

        // Frost aura — check with isInFrostAura(towerX, towerY) from your tower logic
        this.frostRadius = 120;
        this.frostSlowMult = 0.5;   // towers in range fire at 50% speed
        this.frostDuration = 2000;

        this.setScale(0.10);
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

    // Call from your tower logic to check if a tower is in frost range
    isInFrostAura(towerX, towerY) {
        if (!this.active) return false;
        const dx = towerX - this.x;
        const dy = towerY - this.y;
        return (dx * dx + dy * dy) <= (this.frostRadius * this.frostRadius);
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