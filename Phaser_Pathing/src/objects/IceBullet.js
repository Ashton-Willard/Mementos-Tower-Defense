export default class IceBullet extends Bullet {
    constructor(scene, x, y, texture = 'icebullet', config) {
        super(scene, x, y, texture, config);

        this.isIceBullet = true;

        // How many enemies it can hit before disappearing
        this.pierceCount = config?.pierceCount || 3;
    }

    hitEnemy(enemy) {
        if (!this.active) return;

        enemy.receiveDamage(this.damage);

        this.pierceCount--;

        if (this.pierceCount <= 0) {
            this.deactivate();
        }
    }
}