export default class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 600;
        this.damage = 0;

        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
    }

    // Called by spawnBullet to configure texture/speed before fire()
    init(textureKey, opts = {}) {
        this.setTexture(textureKey);
        this.speed = opts.speed ?? 600;
        return this;
    }

    fire(x, y, angle, damage) {
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;

        this.setPosition(x, y);
        this.damage = damage;
        this.setRotation(angle);

        this.scene.physics.velocityFromRotation(
            angle,
            this.speed,
            this.body.velocity
        );
    }

    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
        this.body.reset(0, 0);
    }

    update(time, delta) {
        if (
            this.x < 0 || this.x > this.scene.scale.width ||
            this.y < 0 || this.y > this.scene.scale.height
        ) {
            this.deactivate();
        }
    }
}
