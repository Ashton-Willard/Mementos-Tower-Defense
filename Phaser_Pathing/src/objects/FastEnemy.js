import Enemy from './Enemy.js';

export default class FastEnemy extends Enemy {
    constructor(scene) {
        super(scene);

        // Textures;
        this.setTexture('enemy');

        // Sets speed higher;
        this.speed = 0.00003 * 2;

        // Override base HP for fast enemy
        this.hp = 50;
        this.maxHp = 50;

        // Reward for defeating enemy
        this.goldReward = 5;

        // Update healthbar to reflect new maxHp
        this.healthbar.update();
    }
}