import Enemy from './Enemy.js';

export default class FireSpirt extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('firespirt');

        this.speed = 0.00003 * 1.2;
        this.maxHp = 120;
        this.hp = 120;

        this.reward = 6;
        this.leakDamage = 1;

        this.healthbar.update();
    }
}


