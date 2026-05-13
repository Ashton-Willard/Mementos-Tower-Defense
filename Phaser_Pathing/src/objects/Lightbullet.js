export default class LightBullet extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'lightbullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed  = 600;
        this.damage = 0;
        this.setScale(0.06);  // 1024px canvas, want ~60px bullet

        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
    }

    fire(x, y, angle, damage) {
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;

        this.setPosition(x, y);
        this.damage = damage;

        // Sprite points top-right, offset by -45deg to align with travel angle
        this.setRotation(angle - Math.PI * 0.25);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
    }

    update() {
        if (
            this.x < 0 || this.x > this.scene.scale.width ||
            this.y < 0 || this.y > this.scene.scale.height
        ) {
            this.disableBody(true, true);
        }
    }
}