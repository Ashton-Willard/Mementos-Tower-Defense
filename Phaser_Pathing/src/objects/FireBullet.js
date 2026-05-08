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
    }
}