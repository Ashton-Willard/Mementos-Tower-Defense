import Enemy from './Enemy.js';

export default class HollowSeer extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('hollow_seer');

        this.speed = 0.00003 * 1.0;
        this.maxHp = 1500;
        this.hp = 1500;

        this.reward = 45;
        this.leakDamage = 5;

        this.healthbar.update();
    }
}
