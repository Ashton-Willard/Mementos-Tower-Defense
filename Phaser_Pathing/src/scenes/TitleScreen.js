export default class TitleScreen extends Phaser.Scene {
    constructor() {
        super("TitleScreen");
    }

    // titleBG already loaded by AuthScene — no preload needed
    // but we guard in case TitleScreen is ever launched standalone
    preload() {
        if (!this.textures.exists("titleBG")) {
            this.load.image("titleBG", "src/assets/titleBG.png");
        }
    }

    create() {
        console.log("✅ TitleScreen create() fired");

        const { width, height } = this.scale;

        this.add.image(0, 0, "titleBG")
            .setOrigin(0, 0)
            .setDisplaySize(width, height);

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45);

        this.add.text(width / 2, height * 0.32, "MEMENTO\nTOWER DEFENSE", {
            fontFamily: "Arial",
            fontSize: "90px",
            fontStyle: "bold",
            color: "#ff2a2a",
            align: "center",
            stroke: "#000000",
            strokeThickness: 10,
            shadow: { offsetX: 4, offsetY: 4, color: "#000000", blur: 12, fill: true }
        }).setOrigin(0.5);

        const createButton = (label, y, callback) => {
            const text = this.add.text(width / 2, y, label, {
                fontFamily: "Arial",
                fontSize: "40px",
                color: "#ffffff"
            }).setOrigin(0.5);

            const underline = this.add.rectangle(
                width / 2, y + 35, text.width * 0.6, 3, 0xff2a2a
            ).setOrigin(0.5);
            underline.scaleX = 0;

            text.setInteractive({ useHandCursor: true });

            text.on("pointerover", () => {
                this.tweens.add({ targets: underline, scaleX: 1, duration: 150, ease: "Quad.easeOut" });
                this.tweens.add({ targets: text, scale: 1.06, duration: 120, ease: "Quad.easeOut" });
            });
            text.on("pointerout", () => {
                this.tweens.add({ targets: underline, scaleX: 0, duration: 150, ease: "Quad.easeIn" });
                this.tweens.add({ targets: text, scale: 1, duration: 120, ease: "Quad.easeOut" });
            });
            text.on("pointerdown", callback);
        };

        createButton("START GAME", height * 0.72, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
                this.scene.start("GameScene");
            });
        });

        createButton("EXIT", height * 0.82, () => {
            window.close();
        });

        this.cameras.main.fadeIn(900, 0, 0, 0);
    }
}