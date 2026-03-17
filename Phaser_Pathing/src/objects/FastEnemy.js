import Enemy from './Enemy.js';

export default class FastEnemy extends Enemy {
    constructor(scene) {
        super(scene);
        this.setTexture('enemy');
        this.speedMultiplier = 2.0;
        this.hp = 50;
    }
}