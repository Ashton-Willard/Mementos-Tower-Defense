import Enemy from './Enemy.js';

export default class Burrow extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('burrow');

        this.baseSpeed = 0.00003 * 1.0;
        this.speed = this.baseSpeed;

        this.maxHp = 280;
        this.hp = 280;

        this.reward = 9;
        this.leakDamage = 2;

        this.burstTimer = 0;

        this.healthbar.update();
    }

    update(time, delta, path) {
        this.burstTimer += delta;
        if (this.burstTimer >= 3000) {
            this.speed = this.baseSpeed * 3.0;
            this.scene.time.delayedCall(500, () => {
                this.speed = this.baseSpeed;
            });
            this.burstTimer = 0;
        }

        super.update(time, delta, path);
    }
}
