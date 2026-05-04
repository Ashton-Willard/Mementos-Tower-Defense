import Enemy from './Enemy.js';

export default class IronGolem extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('irongolem');

        this.speed = 0.00003 * 0.6;
        this.maxHp = 600;
        this.hp = 600;

        this.reward = 12;
        this.leakDamage = 3;

        this.healthbar.update();
    }
}
