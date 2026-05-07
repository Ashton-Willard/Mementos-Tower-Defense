import Enemy from './Enemy.js';

export default class CrimsonRavager extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('crimson_ravager');

        this.baseSpeed = 0.00003 * 2.2;
        this.speed = this.baseSpeed;

        this.maxHp = 1200;
        this.hp = 1200;

        this.reward = 40;
        this.leakDamage = 5;

        this.speedTimer = 0;

        this.healthbar.update();
    }

    update(time, delta, path) {
        this.speedTimer += delta;
        if (this.speedTimer >= 5000) {
            this.baseSpeed *= 1.1;
            this.speed = this.baseSpeed;
            this.speedTimer = 0;
        }

        super.update(time, delta, path);
    }
}
