<<<<<<< Updated upstream
export default class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y, texture = 'bullet', config) {
        super(scene, x, y, texture);

        this.scene = scene;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // ✅ Safe config handling
        this.config = config || {};

        this.textureKey = texture;

        this.speed = this.config.speed || 2000;
        this.damage = 0;

        this.setScale(this.config.scale || 0.08);

        // Physics setup
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        this.body.moves = true;

        // Hitbox
        if (this.config.bodySize) {
            this.body.setSize(this.config.bodySize.width, this.config.bodySize.height);
        } else {
            this.body.setCircle(this.width / 2);
        }

        // Trail effect (safe config)
        this.trail = scene.add.particles(0, 0, texture, {
            lifespan: this.config.trailLifespan || 1000,
            speed: { min: 0, max: 10 },
            scale: { start: this.config.trailScaleStart || 0.1, end: 0 },
            alpha: { start: this.config.trailAlphaStart || 0.15, end: 0 },
            frequency: this.config.trailFrequency || 80,
            blendMode: this.config.blendMode || 'NORMAL',
            follow: this
        });

        this.trail.stop();

        // Start disabled (pooling)
        this.setActive(false);
        this.setVisible(false);
        this.body.enable = false;
    }

    // Reset when reused from pool
    init(texture, config = {}) {
        this.setTexture(texture);
        this.textureKey = texture;

        // ✅ Always overwrite safely
        this.config = config || {};

        this.speed = this.config.speed || 2000;

        this.setScale(this.config.scale || 0.08);

        // Hitbox update
        if (this.config.bodySize) {
            this.body.setSize(
                this.config.bodySize.width,
                this.config.bodySize.height
            );
        } else {
            this.body.setCircle(this.width / 2);
        }

        // Trail update (safe)
        if (this.trail) {
            this.trail.setTexture(texture);

            this.trail.setConfig({
                lifespan: this.config.trailLifespan || 1000,
                speed: { min: 0, max: 10 },
                scale: { start: this.config.trailScaleStart || 0.1, end: 0 },
                alpha: { start: this.config.trailAlphaStart || 0.15, end: 0 },
                frequency: this.config.trailFrequency || 80,
                blendMode: this.config.blendMode || 'NORMAL',
                follow: this
            });
        }
    }

    fire(x, y, angle, damage) {
        this.setActive(true);
        this.setVisible(true);
        this.body.enable = true;

        this.setPosition(x, y);
        this.setRotation(angle);

        this.damage = damage;

        // Velocity
        this.scene.physics.velocityFromRotation(
            angle,
            this.speed,
            this.body.velocity
        );

        if (this.trail) {
            this.trail.start();
        }
    }

    deactivate() {
        if (this.trail) {
            this.trail.stop();
        }

        this.body.stop();

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
=======
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
>>>>>>> Stashed changes
