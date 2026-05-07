import Enemy from './Enemy.js';

export default class StormCaller extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('storm_herald');

        this.speed = 0.00003 * 1.0;
        this.maxHp = 350;
        this.hp = 350;

        this.reward = 12;
        this.leakDamage = 3;

        this.healthbar.update();
    }
}
