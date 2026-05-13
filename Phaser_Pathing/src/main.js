import GameScene from "./scenes/GameScene.js";
import MainScene from "./scenes/MainScene.js";
import TitleScreen from "./scenes/TitleScreen.js";
import UIScene from "./scenes/UIScene.js";
import AuthScene from "./scenes/AuthScene.js";

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,

    dom: {
        createContainer: true
    },

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },

    scene: [
        AuthScene,
        TitleScreen,
        GameScene,
        MainScene,
        UIScene
    ]
};

new Phaser.Game(config);
