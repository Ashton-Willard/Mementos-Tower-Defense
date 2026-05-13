import FastEnemy   from '../objects/FastEnemy.js';
import Enemy       from '../objects/Enemy.js';
import IronGolem   from '../objects/IronGolem.js';
import Moab        from '../objects/Moab.js';
import MirrorWraith from '../objects/MirrorWraith.js';
import IceTiger    from '../objects/IceTiger.js';

export default class WaveManager {
    constructor(scene, enemies, path, difficulty = 'NORMAL') {
        this.scene = scene;
        this.enemies = enemies;
        this.path = path;
        this.difficulty = difficulty;

        this.waves = this.getWavesForDifficulty(difficulty);

        this.currentWaveIndex = -1;
        this.waveTime = 0;
        this.waveFinished = true;
        this.enemiesAlive = 0;
        this.activeEvents = [];
    }

    // ============================================================
    // NEW WAVE LOGIC WITH INTRO WAVES + LATE-MID APPEARANCE
    // ============================================================
    getWavesForDifficulty(diff) {

        // ========================== EASY ============================
        if (diff === "EASY") {
            const waves = [];

            for (let i = 1; i <= 50; i++) {

                const basicCount = 8 + i * 2;
                const fastCount  = Math.floor(i / 3);
                const golemCount = i % 15 === 0 ? 1 : 0;

                // --- REAL APPEARANCE START ---
                const wraithCount    = i >= 20 ? Math.floor((i - 20) / 8) : 0;
                const iceTigerCount  = i >= 28 ? Math.floor((i - 28) / 10) : 0;
                const moabCount      = i >= 35 && (i % 15 === 0) ? 1 : 0;

                // --- INTRO WAVES ---
                if (i === 15) {
                    waves.push({
                        pattern: [
                            { delay: 0, type: "fast", count: 10, rate: 350 },
                            { delay: 2000, type: "wraith", count: 3, rate: 700 }
                        ]
                    });
                    continue;
                }

                if (i === 22) {
                    waves.push({
                        pattern: [
                            { delay: 0, type: "fast", count: 12, rate: 350 },
                            { delay: 2000, type: "icetiger", count: 2, rate: 900 }
                        ]
                    });
                    continue;
                }

                if (i === 30) {
                    waves.push({
                        pattern: [
                            { delay: 0, type: "fast", count: 15, rate: 300 },
                            { delay: 2500, type: "moab", count: 1, rate: 1200 }
                        ]
                    });
                    continue;
                }

                // --- NORMAL WAVES ---
                waves.push({
                    pattern: [
                        { delay: 0, type: "basic", count: basicCount, rate: 450 },
                        ...(fastCount > 0 ? [{ delay: 1500, type: "fast", count: fastCount, rate: 400 }] : []),
                        ...(golemCount > 0 ? [{ delay: 4000, type: "golem", count: golemCount, rate: 900 }] : []),
                        ...(wraithCount > 0 ? [{ delay: 3000, type: "wraith", count: wraithCount, rate: 650 }] : []),
                        ...(iceTigerCount > 0 ? [{ delay: 3500, type: "icetiger", count: iceTigerCount, rate: 750 }] : []),
                        ...(moabCount > 0 ? [{ delay: 6000, type: "moab", count: moabCount, rate: 1300 }] : []),
                    ]
                });
            }

            return waves;
        }
        // ========================= NORMAL ===========================
        if (diff === "NORMAL") {
            const waves = [];

            for (let i = 1; i <= 50; i++) {

                const basicCount = 12 + i * 3;
                const fastCount  = 4 + Math.floor(i * 0.8);
                const golemCount = i % 7 === 0 ? Math.floor(i / 10) + 1 : 0;

                // --- REAL APPEARANCE START ---
                const wraithCount    = i >= 18 ? Math.floor((i - 18) / 5) + 1 : 0;
                const iceTigerCount  = i >= 28 ? Math.floor((i - 28) / 6) + 1 : 0;
                const moabCount      = i >= 35 && (i % 10 === 0) ? Math.floor(i / 10) : 0;

                // --- INTRO WAVES ---
                if (i === 15) {
                    waves.push({
                        pattern: [
                            { delay: 0, type: "fast", count: 15, rate: 250 },
                            { delay: 2000, type: "wraith", count: 3, rate: 500 }
                        ]
                    });
                    continue;
                }

                if (i === 22) {
                    waves.push({
                        pattern: [
                            { delay: 0, type: "fast", count: 18, rate: 250 },
                            { delay: 2000, type: "icetiger", count: 3, rate: 600 }
                        ]
                    });
                    continue;
                }

                if (i === 30) {
                    waves.push({
                        pattern: [
                            { delay: 0, type: "fast", count: 20, rate: 220 },
                            { delay: 2500, type: "moab", count: 1, rate: 1000 }
                        ]
                    });
                    continue;
                }

                // --- NORMAL WAVES ---
                waves.push({
                    pattern: [
                        { delay: 0, type: "basic", count: basicCount, rate: 350 },
                        { delay: 1500, type: "fast", count: fastCount, rate: 250 },
                        ...(golemCount > 0 ? [{ delay: 4000, type: "golem", count: golemCount, rate: 800 }] : []),
                        ...(wraithCount > 0 ? [{ delay: 2500, type: "wraith", count: wraithCount, rate: 500 }] : []),
                        ...(iceTigerCount > 0 ? [{ delay: 3500, type: "icetiger", count: iceTigerCount, rate: 600 }] : []),
                        ...(moabCount > 0 ? [{ delay: 6000, type: "moab", count: moabCount, rate: 1000 }] : []),
                    ]
                });
            }

            return waves;
        }

        // =========================== HARD ===========================

        const waves = [];

        for (let i = 1; i <= 50; i++) {

            // Showcase wave
            if( i == 1){
                waves.push({
                    pattern: [
                        { delay: 0, type: "fast", count: 12, rate:200 },
                        { delay: 1500, type: "wraith", count: 3, rate: 500},
                        { delay: 2500, type: "icetiger", count: 2, rate: 700},
                        { delay: 3500, type: "moab", count: 1, rate: 900}
                    ]
                });
            }

            const basicCount = 20 + i * 4;
            const fastCount  = 10 + Math.floor(i * 1.2);
            const golemCount = Math.floor(i / 5);

            // --- REAL APPEARANCE START ---
            const wraithCount    = i >= 10 ? Math.floor((i - 10) / 3) + 2 : 0;
            const iceTigerCount  = i >= 18 ? Math.floor((i - 18) / 4) + 2 : 0;
            const moabCount      = i >= 25 && (i % 5 === 0) ? Math.floor(i / 5) : 0;

            // --- INTRO WAVES ---
            if (i === 10) {
                waves.push({
                    pattern: [
                        { delay: 0, type: "fast", count: 20, rate: 180 },
                        { delay: 2000, type: "wraith", count: 4, rate: 400 }
                    ]
                });
                continue;
            }

            if (i === 15) {
                waves.push({
                    pattern: [
                        { delay: 0, type: "fast", count: 25, rate: 180 },
                        { delay: 2000, type: "icetiger", count: 3, rate: 450 }
                    ]
                });
                continue;
            }

            if (i === 20) {
                waves.push({
                    pattern: [
                        { delay: 0, type: "fast", count: 30, rate: 160 },
                        { delay: 2500, type: "moab", count: 1, rate: 800 }
                    ]
                });
                continue;
            }

            // --- NORMAL WAVES ---
            waves.push({
                pattern: [
                    { delay: 0, type: "fast", count: fastCount, rate: 180 },
                    { delay: 1200, type: "basic", count: basicCount, rate: 220 },
                    ...(wraithCount > 0 ? [{ delay: 2000, type: "wraith", count: wraithCount, rate: 300 }] : []),
                    ...(iceTigerCount > 0 ? [{ delay: 3000, type: "icetiger", count: iceTigerCount, rate: 420 }] : []),
                    { delay: 3500, type: "golem", count: golemCount, rate: 650 },
                    ...(moabCount > 0 ? [{ delay: 5500, type: "moab", count: moabCount, rate: 800 }] : []),
                ]
            });
        }

        return waves;
    }

    // ============================================================
    // WAVE CONTROL LOGIC (unchanged)
    // ============================================================
    startNextWave() {
        if (!this.waveFinished && this.currentWaveIndex >= 0) return;

        this.currentWaveIndex++;

        if (this.currentWaveIndex >= this.waves.length) {
            console.log("All waves complete");
            return;
        }

        const wave = this.waves[this.currentWaveIndex];

        this.waveTime = 0;
        this.enemiesAlive = 0;
        this.activeEvents = [];
        this.waveFinished = false;

        wave.pattern.forEach(event => {
            this.activeEvents.push({
                delay:       event.delay,
                type:        event.type,
                remaining:   event.count,
                rate:        event.rate,
                nextSpawnIn: event.rate,
                started:     false,
                finished:    false
            });
        });

        if (this.scene.roundButton) {
            this.scene.roundButton.setVisible(false);
            this.scene.roundButton.setActive(false);
        }

        if (this.scene.startButton) {
            this.scene.startButton.setVisible(false);
            this.scene.startButton.setActive(false);
        }

        console.log(`Starting wave ${this.currentWaveIndex + 1}`);

        if (this.scene.onWaveStart) {
            this.scene.onWaveStart(this.currentWaveIndex + 1);
        }
    }

    update(time, delta) {
        if (this.currentWaveIndex < 0) return;

        const wave = this.waves[this.currentWaveIndex];
        if (!wave) return;

        this.waveTime += delta;

        let allEventsFinished = true;

        for (let evt of this.activeEvents) {
            if (evt.finished) continue;

            allEventsFinished = false;

            if (!evt.started) {
                if (this.waveTime >= evt.delay) {
                    evt.started = true;

                    if (evt.rate === 0) {
                        while (evt.remaining > 0) {
                            this.spawnEnemy(evt.type);
                            evt.remaining--;
                        }
                        evt.finished = true;
                    } else {
                        evt.nextSpawnIn = 0;
                    }
                } else {
                    continue;
                }
            }

            if (evt.started && !evt.finished && evt.rate > 0) {
                evt.nextSpawnIn -= delta;

                while (evt.nextSpawnIn <= 0 && evt.remaining > 0) {
                    this.spawnEnemy(evt.type);
                    evt.remaining--;
                    evt.nextSpawnIn += evt.rate;
                }

                if (evt.remaining <= 0) {
                    evt.finished = true;
                }
            }
        }

        if (!this.waveFinished && allEventsFinished && this.enemiesAlive === 0) {
            this.onWaveComplete();
        }
    }

    spawnEnemy(type) {
        let enemy;

        switch (type) {
            case 'fast':
                enemy = new FastEnemy(this.scene);
                break;
            case 'golem':
                enemy = new IronGolem(this.scene);
                break;
            case 'wraith':
                enemy = new MirrorWraith(this.scene);
                break;
            case 'icetiger':
                enemy = new IceTiger(this.scene);
                break;
            case 'moab':
                enemy = new Moab(this.scene);
                break;
            case 'basic':
            default:
                enemy = new Enemy(this.scene);
                break;
        }

        this.enemies.add(enemy);

        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.startOnPath(this.path);

        this.enemiesAlive++;

        enemy.onDeath = () => {
            this.enemiesAlive--;
        };
    }

    setRoundButtonVisible(state) {
        if (!this.scene.roundButton) return;

        this.scene.roundButton.setVisible(state);

        if (state) {
            this.scene.roundButton.setActive(true);
            this.scene.roundButton.setInteractive();
        } else {
            this.scene.roundButton.setActive(false);
        }
    }

    onWaveComplete() {
        if (this.waveFinished) return;

        this.waveFinished = true;

        console.log(`Wave ${this.currentWaveIndex + 1} complete`);

        const bonus = 50 + (this.currentWaveIndex * 10);
        this.scene.addGold(bonus);

        if (this.currentWaveIndex < this.waves.length - 1) {
            if (this.scene.roundButton) {
                this.scene.roundButton.setVisible(true);
                this.scene.roundButton.setActive(true);
                this.scene.roundButton.setInteractive();
            }
        }
    }
}
