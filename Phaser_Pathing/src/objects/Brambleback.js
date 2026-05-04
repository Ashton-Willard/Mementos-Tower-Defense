import Enemy from './Enemy.js';

export default class Brambleback extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('brambleback');

        this.speed = 0.00003 * 0.7;
        this.maxHp = 250;
        this.hp = 250;

        this.reward = 8;
        this.leakDamage = 2;

        this.healthbar.update();
    }
}