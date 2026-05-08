<<<<<<< Updated upstream
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
=======
export default class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        // Create a physics-enabled image using the 'bullet' texture
        super(scene, x, y, 'bullet');

        // Add to scene display list + physics world
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Base bullet properties
        this.speed = 300;   // how fast the bullet travels
        this.damage = 0;    // damage assigned by turret on fire()

        // Start disabled so the object pool doesn't show bullets early
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
    }

    fire(x, y, angle, damage) {
        // Reactivate bullet from pool
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;

        // Position bullet at turret muzzle
        this.setPosition(x, y);

        // Store damage for collision callback
        this.damage = damage;

        // Rotate sprite to face travel direction
        this.setRotation(angle);

        // Apply velocity based on angle + speed
        this.scene.physics.velocityFromRotation(
            angle,
            this.speed,
            this.body.velocity
        );
    }

    update(time, delta) {
        // Auto-despawn bullets that leave the screen bounds
        if (
            this.x < 0 || this.x > this.scene.scale.width ||
            this.y < 0 || this.y > this.scene.scale.height
        ) {
            this.disableBody(true, true); // return to pool
        }
>>>>>>> Stashed changes
    }
}