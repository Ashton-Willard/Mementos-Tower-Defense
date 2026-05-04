import Enemy from './Enemy.js';

export default class HuskBrute extends Enemy {
    constructor(scene) {
        super(scene);

        this.setTexture('husk_brute');

        this.speed = 0.00003 * 0.9;
        this.maxHp = 400;
        this.hp = 400;

        this.reward = 10;
        this.leakDamage = 2;

        this.regenRate = 0.01; // 1% per update-ish (tune later)

        this.healthbar.update();
    }

    update(time, delta, path) {
        super.update(time, delta, path);

        // Simple regen: tiny heal over time
        if (this.hp > 0 && this.hp < this.maxHp) {
            this.hp += this.maxHp * this.regenRate * (delta / 1000);
            if (this.hp > this.maxHp) this.hp = this.maxHp;
        }
    }
}
