import Enemy from './Enemy.js';

export default class Gruntling extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('gruntling');
        this.speed = 0.00003 * 1.0;
        this.maxHp = 100;
        this.hp = 100;

        this.reward = 10;
        this.leakDamage = 1;
        this.healthbar.update();
    }
}