export default class Bullet extends Phaser.GameObjects.Image {
    constructor(scene) {
        super(scene, 0, 0, 'bullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 600;
        this.lifespan = 0;
        this.dx = 0;
        this.dy = 0;
    }

    fire(x, y, angle) {
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;

        this.setPosition(x, y);

        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);

        this.lifespan = 300;
    }

    update(time, delta) {
        if (!this.active) return;

        this.lifespan -= delta;
        this.x += this.dx * this.speed * (delta / 1000);
        this.y += this.dy * this.speed * (delta / 1000);

        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
            this.body.enable = false;
        }
    }
}