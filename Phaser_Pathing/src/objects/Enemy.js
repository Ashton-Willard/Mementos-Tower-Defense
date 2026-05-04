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
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.body.setSize(this.width * 0.8, this.height * 0.8);
        this.body.setOffset(this.width * 0.1, this.height * 0.1);
    }

    startOnPath(path){
        this.follower.t = 0;
        this.hp = this.maxHp; // ✅ reset HP if reused

        path.getPoint(0, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);

        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;
    }

    update(time, delta, path) {
        if (!this.active) return; // ✅ IMPORTANT

        this.follower.t += this.speed * delta;

        path.getPoint(this.follower.t, this.follower.vec);
        this.setPosition(this.follower.vec.x, this.follower.vec.y);

        if (this.healthbar) {
            this.healthbar.update();
        }

        if(this.follower.t >= 1){
            this.die();
        }
    }

    receiveDamage(amount){
        this.hp -= amount;

        if (this.hp <= 0) {
            this.die(); // ✅ use shared cleanup
        }
    }

    die() {
        // 🧹 Destroy health bar
        if (this.healthbar) {
            this.healthbar.destroy();
            this.healthbar = null;
        }

        // 💀 Disable enemy
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
    }
}