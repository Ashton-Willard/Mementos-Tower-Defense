export default class UIScene extends Phaser.Scene {
    constructor(){
        super('UIScene');
    }

    create() {
        this.add.text(10,10 , 'Memento Tower Defense', {fontSize: '20px', fill: '#fff'});

        this.add.text(500, 10, '[Basic]', { fontSize: '16px', fill: '#0f0'})
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.get('MainScene').currentTowerType = 'basic';
            });

        this.add.text(500, 30, '[Cannon]', {fontSize: '16px', fill: '#0f0'})
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.get('MainScene').currentTowerType = 'cannon';
            });
    }
}