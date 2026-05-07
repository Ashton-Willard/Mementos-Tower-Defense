import Enemy from './Enemy.js';

export default class Razorwing extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('razorwing');

        this.speed = 0.00003 * 2.5;
        this.maxHp = 150;
        this.hp = 150;

        this.reward = 8;
        this.leakDamage = 2;

        this.healthbar.update();
    }
}
