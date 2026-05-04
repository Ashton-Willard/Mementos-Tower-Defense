import MainScene from "./scenes/MainScene.js";
import UIScene from "./scenes/UIScene.js";

const config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 1800,
    height: 1000,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [MainScene, UIScene]
};

new Phaser.Game(config);