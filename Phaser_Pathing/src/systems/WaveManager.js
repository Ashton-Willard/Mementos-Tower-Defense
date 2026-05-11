import FastEnemy from '../objects/FastEnemy.js';
import Enemy from '../objects/Enemy.js';

export default class WaveManager {
    constructor(scene, enemies, path, difficulty = 'NORMAL') {
        this.scene = scene;
        this.enemies = enemies;
        this.path = path;
        this.difficulty = difficulty;

        // Load waves based on difficulty
        this.waves = this.getWavesForDifficulty(difficulty);

        this.currentWaveIndex = -1;
        this.waveTime = 0;
        this.waveFinished = false;
        this.enemiesAlive = 0;
        this.activeEvents = [];
    }

    // -------------------------------------------------------
    // DIFFICULTY WAVE SETS
    // -------------------------------------------------------
    getWavesForDifficulty(diff) {

        // EASY — ONLY FAST ENEMIES
        if (diff === "EASY") {
            return [
                { pattern: [ { delay: 0, type: 'fast', count: 10, rate: 400 } ] },
                { pattern: [ { delay: 0, type: 'fast', count: 15, rate: 350 } ] },
                { pattern: [ { delay: 0, type: 'fast', count: 20, rate: 300 } ] }
            ];
        }

        // NORMAL — YOUR ORIGINAL WAVES
        if (diff === "NORMAL") {
            return [
                {
                    pattern: [
                        { delay: 100, type: 'basic', count: 15, rate: 400 }
                    ]
                },
                {
                    pattern: [
                        { delay: 0,    type: 'basic', count: 20, rate: 350 },
                        { delay: 4000, type: 'fast',  count: 10, rate: 300 }
                    ]
                },
                {
                    pattern: [
                        { delay: 0,    type: 'basic', count: 30, rate: 300 },
                        { delay: 2000, type: 'fast',  count: 15, rate: 200 }
                    ]
                },
                {
                    pattern: [
                        { delay: 0,    type: 'basic', count: 10, rate: 0 },
                        { delay: 2000, type: 'fast',  count: 20, rate: 250 }
                    ]
                }
            ];
        }

        // HARD — MIXED FROM WAVE 1
        return [
            {
                pattern: [
                    { delay: 0, type: 'basic', count: 10, rate: 350 },
                    { delay: 1500, type: 'fast', count: 10, rate: 250 }
                ]
            },
            {
                pattern: [
                    { delay: 0, type: 'basic', count: 20, rate: 300 },
                    { delay: 2000, type: 'fast', count: 15, rate: 200 }
                ]
            },
            {
                pattern: [
                    { delay: 0, type: 'basic', count: 25, rate: 250 },
                    { delay: 1500, type: 'fast', count: 20, rate: 180 }
                ]
            }
        ];
    }

    // -------------------------------------------------------
    // START NEXT WAVE
    // -------------------------------------------------------
    startNextWave() {
        this.currentWaveIndex++;

        if (this.currentWaveIndex >= this.waves.length) {
            console.log('All waves complete');
            return;
        }

        const wave = this.waves[this.currentWaveIndex];

        this.waveTime = 0;
        this.enemiesAlive = 0;
        this.activeEvents = [];
        this.waveFinished = false;

        wave.pattern.forEach(event => {
            this.activeEvents.push({
                delay: event.delay,
                type: event.type,
                remaining: event.count,
                rate: event.rate,
                nextSpawnIn: event.rate,
                started: false,
                finished: false
            });
        });

        if (this.scene.roundButton) {
            this.scene.roundButton.setVisible(false);
        }
        if (this.scene.startButton) {
            this.scene.startButton.setVisible(false);
        }

        console.log(`Starting wave ${this.currentWaveIndex + 1}`);
    }

    // -------------------------------------------------------
    // UPDATE LOOP
    // -------------------------------------------------------
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

        if (allEventsFinished && this.enemiesAlive === 0) {
            this.onWaveComplete();
        }
    }

    // -------------------------------------------------------
    // SPAWN ENEMY
    // -------------------------------------------------------
    spawnEnemy(type) {
        let enemy;

        switch (type) {
            case 'fast': enemy = new FastEnemy(this.scene); break;
            case 'basic':
            default:     enemy = new Enemy(this.scene); break;
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

    // -------------------------------------------------------
    // WAVE COMPLETE
    // -------------------------------------------------------
    onWaveComplete() {
        if (this.waveFinished) return;
        this.waveFinished = true;

        console.log(`Wave ${this.currentWaveIndex + 1} complete`);

        const bonus = 50 + (this.currentWaveIndex * 10);
        this.scene.addGold(bonus);

        if (this.currentWaveIndex < this.waves.length - 1) {
            this.scene.roundButton.setVisible(true);
        }
    }
}
