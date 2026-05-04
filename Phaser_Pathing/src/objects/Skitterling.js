import Enemy from './Enemy.js';

export default class Skitterling extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('skitterling');

        this.speed = 0.00003 * 2.0;
        this.maxHp = 50;
        this.hp = 50;

        this.reward = 5;
        this.leakDamage = 1;

        this.healthbar.update();
    }
}
