import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


class SaveManager {
    constructor() {
        this.user = null;
        this.data = null;
    }

    setUser(user) {
        this.user = user;
    }

    get uid() {
        return this.user ? this.user.uid : null;
    }

    async loadOrCreateUserData() {
        if (!this.uid) throw new Error("No user set in SaveManager");

        const ref = doc(db, "users", this.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            this.data = snap.data();
        } else {
            this.data = {
                money: 500,
                highestWave: 0,
                upgrades: {},
                unlockedTowers: ["lightningtower"],
                settings: {
                    masterVolume: 0.8,
                    musicVolume: 0.6,
                    sfxVolume: 0.7,
                    mouseSensitivity: 0.5,
                    graphicsHigh: true,
                    fullscreen: false
                }
            };
            await setDoc(ref, this.data);
        }

        return this.data;
    }

    async save(dataPatch) {
        if (!this.uid) throw new Error("No user set in SaveManager");

        const ref = doc(db, "users", this.uid);

        this.data = {
            ...this.data,
            ...dataPatch
        };

        await updateDoc(ref, dataPatch);
    }

    getData() {
        return this.data;
    }
}

export const saveManager = new SaveManager();
