export default class HealthBar {
    constructor(scene, parent) {
        this.scene = scene;
        this.parent = parent;

        this.bar = scene.add.graphics();
    }

    update() {
        this.bar.clear();

        const width = 40;
        const height = 5;
        const x = this.parent.x - width / 2;
        const y = this.parent.y - 30;

        const percent = Phaser.Math.Clamp(this.parent.hp / this.parent.maxHp, 0, 1);

        this.bar.fillStyle(0x000000);
        this.bar.fillRect(x, y, width, height);

        this.bar.fillStyle(0xff0000);
        this.bar.fillRect(x, y, width * percent, height);
    }

    destroy() {
        this.bar.destroy();
    }
}