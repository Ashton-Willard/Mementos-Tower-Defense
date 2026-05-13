export default class IceBullet extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'icebullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed  = 600;
        this.damage = 0;
        this.setScale(0.06);

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

        // Ice shard also points top-right diagonally
        this.setRotation(angle - Math.PI * 0.25);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
    }

    deactivate() {
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
    }

    update() {
        if (
            this.x < 0 || this.x > this.scene.scale.width ||
            this.y < 0 || this.y > this.scene.scale.height
        ) {
            this.deactivate();
        }
    }
}