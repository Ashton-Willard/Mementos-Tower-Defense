import { auth } from "../systems/firebase.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import { saveManager } from "../systems/SaveManager.js";

export default class AuthScene extends Phaser.Scene {
    constructor() {
        super("AuthScene");
    }

    preload() {
        this.load.image("titleBG", "src/assets/titleBG.png");
    }

    create() {
        console.log("DOM support:", this.sys.game.device.dom);

        const { width, height } = this.scale;

        // Background
        this.add.image(0, 0, "titleBG")
            .setOrigin(0, 0)
            .setDisplaySize(width, height);

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);

        // Title
        this.add.text(width / 2, height * 0.25, "MEMENTO LOGIN", {
            fontSize: "48px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // ================================
        // REAL HTML INPUT FIELDS
        // ================================
        this.emailInput = this.add.dom(width / 2, height * 0.40, "input", {
            type: "email",
            class: "phaser-input",
            placeholder: "Email"
        });

        this.passwordInput = this.add.dom(width / 2, height * 0.48, "input", {
            type: "password",
            class: "phaser-input",
            placeholder: "Password"
        });

        // Info text
        this.infoText = this.add.text(width / 2, height * 0.70, "", {
            fontSize: "20px",
            color: "#ff2a2a"
        }).setOrigin(0.5);

        // ================================
        // REMOVE OLD BUTTONS — now using HTML UI only
        // ================================
        // (Old createButton() calls removed)

        // Auto-login
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                saveManager.setUser(user);
                await saveManager.loadOrCreateUserData();
                this.scene.start("TitleScreen");
            }
        });
    }

    // ================================
    // LOGIN / SIGNUP HANDLER
    // ================================
    async handleLogin(isSignup) {
        const email = this.emailInput.node.value.trim();
        const password = this.passwordInput.node.value.trim();

        if (!email || !password) {
            this.infoText.setText("Enter email and password.");
            return;
        }

        try {
            let userCred;
            if (isSignup) {
                userCred = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCred = await signInWithEmailAndPassword(auth, email, password);
            }

            saveManager.setUser(userCred.user);
            await saveManager.loadOrCreateUserData();
            this.scene.start("TitleScreen");

        } catch (err) {
            console.error(err);
            this.infoText.setText(err.message);
        }
    }
}
