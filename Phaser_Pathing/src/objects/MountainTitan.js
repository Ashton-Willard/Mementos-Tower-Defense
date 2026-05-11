import Enemy from './Enemy.js';

export default class MountainTitan extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('mountain_titan');

        this.speed = 0.00003 * 0.5;
        this.maxHp = 2000;
        this.hp = 2000;

        this.reward = 40;
        this.leakDamage = 5;

        this.healthbar.update();
    }
}
