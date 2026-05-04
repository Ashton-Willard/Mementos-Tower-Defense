import Enemy from './Enemy.js';

export default class MirrorWraith extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('mirror_wraith');

        this.speed = 0.00003 * 1.1;
        this.maxHp = 300;
        this.hp = 300;

        this.reward = 9;
        this.leakDamage = 2;

        this.firstHitReduced = false;

        this.healthbar.update();
    }

    receiveDamage(amount) {
        if (!this.firstHitReduced) {
            amount *= 0.5;
            this.firstHitReduced = true;
        }
        super.receiveDamage(amount);
    }
}
