import GameScene from "./scenes/GameScene.js";
import MainScene from "./scenes/MainScene.js";
import TitleScreen from "./scenes/TitleScreen.js";
import UIScene from "./scenes/UIScene.js";

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [
        TitleScreen,
        MainScene,
        GameScene,
        UIScene
    ]
};

new Phaser.Game(config);