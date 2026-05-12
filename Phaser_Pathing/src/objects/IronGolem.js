import Enemy from './Enemy.js';

export default class IronGolem extends Enemy {
    constructor(scene) {
        super(scene);
        this.setTexture('irongolem');
        this.setScale(0.10);  // large detailed render on large canvas

        this.speed = 0.000012;
        this.maxHp      = 500;
        this.hp         = 500;
        this.reward     = 50;
        this.leakDamage = 5;
    }
}