import Bullet from './Bullet.js';

export default class FireBullet extends Bullet {
    constructor(scene, x, y, texture = 'firebullet', config = {}) {
        super(scene, x, y, texture, config);

        // ✅ Store config locally for consistency
        this.config = config || {};

        // Fire-specific properties
        this.burnDamage = this.config.burnDamage || 5;
        this.burnDuration = this.config.burnDuration || 3000;
    }

    init(texture, config = {}) {
        super.init(texture, config);

        this.config = config || {};

        this.burnDamage = this.config.burnDamage || 5;
        this.burnDuration = this.config.burnDuration || 3000;
    }

    deactivate() {
        super.deactivate();

        // Optional: reset fire-specific state if you add DOT effects later
    }
}