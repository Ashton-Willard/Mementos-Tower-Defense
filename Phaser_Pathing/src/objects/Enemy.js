import HealthBar from "./HealthBar.js";

export default class Enemy extends Phaser.GameObjects.Image {
    constructor(scene) {

        // Use the placeholder texture you loaded in preload()
        super(scene, 0, 0, 'enemy_shadow');   // <-- CHANGE IS HERE

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

        // Reward for defeating enemy
        this.reward = 10;

        // How much damage enemy does
        this.leakDamage = 1;
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

        // Floating leak popup
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

        // Lose lives
        if (this.scene.loseLives) {
            this.scene.loseLives(this.leakDamage);
        }

        this.healthbar.destroy();
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.die(false);
    }

        // const dmgText = this.scene.add.text(this.x, this.y, `-${this.leakDamage}`,{
        //     fontSize: "16px",
        //     color: "#ff0000",
        // });
        // this.scene.tweens.add({
        //     targets: dmgText,
        //     y: this.y - 30,
        //     alpha: 0,
        //     duration: 600,
        //     onComplete: ()=> dmgText.destroy()
        // });
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

        // Award for defeating enemy
        if(this.scene.addGold && giveGold){
            this.scene.addGold(this.reward);
        }

        
        this.healthbar.destroy();
        if(this.onDeath) {
            this.onDeath();
        }
    }
}