import Enemy from './Enemy.js';

export default class FastEnemy extends Enemy {
    constructor(scene) {
        super(scene);
        this.setTexture('sprites', 'fastEnemy');
        this.speedMultiplier = 2.0;
        this.hp = 50;
    }

    update(time, delta, path) {
        this.follower.t += 0.0001 * delta * this.speedMultiplier;
        super.update(time, delta, path);
    }
}