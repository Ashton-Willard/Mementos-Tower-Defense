export default class CannonTurret extends Phaser.GameObjects.Sprite {
    constructor(scene){
        super(scene, 0, 0, 'towers', 'cannon');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.range = 200;
    }

    place(i, j){
        this.x = j*64 + 32;
        this.y = i*64 + 32;
        this.setActive(true);
        this.setVisible(true);
    }
}