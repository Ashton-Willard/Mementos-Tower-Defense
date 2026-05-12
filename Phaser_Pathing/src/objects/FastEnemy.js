import Enemy from './Enemy.js';

export default class FastEnemy extends Enemy {
    constructor(scene) {
        super(scene);
        this.setTexture('shaderunner');
        this.setScale(0.04);  // pixel art on large canvas, needs heavy scaling

        this.speed      = 0.00006;
        this.maxHp      = 60;
        this.hp         = 60;
        this.reward     = 15;
        this.leakDamage = 1;
    }
}