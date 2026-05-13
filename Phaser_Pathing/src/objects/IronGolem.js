import Enemy from './Enemy.js';

export default class IronGolem extends Enemy {
    constructor(scene) {
        super(scene);
        this.setTexture('irongolem');
        this.setScale(0.08);  // large detailed render on large canvas
        // Resize physics body to match the visible sprite
this.body.setSize(this.width * 0.08, this.height * 0.08);

        this.speed = 0.000012;
        this.maxHp      = 500;
        this.hp         = 500;
        this.reward     = 50;
        this.leakDamage = 5;
    }
}