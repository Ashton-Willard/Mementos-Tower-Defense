// WaveManager.js
import FastEnemy from '../objects/FastEnemy.js';
import Enemy from '../objects/Enemy.js';

export default class WaveManager {
    constructor(scene, enemies, path) {
        this.scene = scene;
        this.enemies = enemies;
        this.path = path;

        this.currentWaveIndex = -1;   // start before first wave
        this.waveTime = 0;            // ms since current wave started
        this.waveFinished = false;       // whether we've finished spawning all enemies for this wave

        this.enemiesAlive = 0;        // how many are currently alive on screen

        // Active "streams" for the current wave
        // Each entry is derived from a pattern event
        this.activeEvents = [];

        // --- BLOONS-STYLE WAVES: TIMELINE PATTERNS ---
        // delay: ms from wave start
        // type: enemy type key
        // count: how many to spawn
        // rate: ms between spawns (0 = instant burst)
        this.waves = [
            // Wave 1: simple stream of basics
            {
                pattern: [
                    { delay: 100, type: 'basic', count: 15, rate: 400 }
                ]
            },

            // Wave 2: basics then fast
            {
                pattern: [
                    { delay: 0,    type: 'basic', count: 20, rate: 350 },
                    { delay: 4000, type: 'fast',  count: 10, rate: 300 }
                ]
            },

            // Wave 3: overlapping streams (Bloons-style)
            {
                pattern: [
                    // Long basic stream
                    { delay: 0,    type: 'basic', count: 30, rate: 300 },
                    // Fast enemies start after 2 seconds, overlapping
                    { delay: 2000, type: 'fast',  count: 15, rate: 200 }
                ]
            },

            // Wave 4: burst + stream
            {
                pattern: [
                    // Burst of basics at start
                    { delay: 0,    type: 'basic', count: 10, rate: 0 },
                    // Then a stream of fast enemies
                    { delay: 2000, type: 'fast',  count: 20, rate: 250 }
                ]
            },

            // Add more waves here...
        ];
    }

    // --- PUBLIC API ---

    startNextWave() {
        this.currentWaveIndex++;

        if (this.currentWaveIndex >= this.waves.length) {
            console.log('All waves complete');
            return;
        }

        const wave = this.waves[this.currentWaveIndex];

        // Reset wave state
        this.waveTime = 0;
        this.enemiesAlive = 0;
        this.activeEvents = [];
        this.waveFinished = false;

        // Pre-create event state from pattern
        // We don't start them yet; we activate them when waveTime >= delay
        wave.pattern.forEach(event => {
            this.activeEvents.push({
                delay: event.delay,
                type: event.type,
                remaining: event.count,
                rate: event.rate,
                nextSpawnIn: event.rate, // will be used once event is active
                started: false,          // becomes true once delay has passed
                finished: false          // becomes true when remaining == 0
            });
        });

        // Hide the button while the wave is running
        if (this.scene.roundButton) {
            this.scene.roundButton.setVisible(false);
        }

        console.log(`Starting wave ${this.currentWaveIndex + 1}`);
    }

    update(time, delta) {
        // No active wave
        if (this.currentWaveIndex < 0) return;

        const wave = this.waves[this.currentWaveIndex];
        if (!wave) return;

        // Advance wave time
        this.waveTime += delta;

        // Process each event in the pattern
        let allEventsFinished = true;

        for (let evt of this.activeEvents) {
            // If this event is already finished, skip
            if (evt.finished) {
                continue;
            }

            // At least one event is still running
            allEventsFinished = false;

            // Wait until its delay has passed
            if (!evt.started) {
                if (this.waveTime >= evt.delay) {
                    evt.started = true;

                    // For instant bursts (rate = 0), spawn all at once
                    if (evt.rate === 0) {
                        while (evt.remaining > 0) {
                            this.spawnEnemy(evt.type);
                            evt.remaining--;
                        }
                        evt.finished = true;
                    } else {
                        // For streams, initialize timer
                        evt.nextSpawnIn = 0;
                    }
                } else {
                    // Not started yet, skip
                    continue;
                }
            }

            // If started and not finished, handle streaming spawns
            if (evt.started && !evt.finished && evt.rate > 0) {
                evt.nextSpawnIn -= delta;

                while (evt.nextSpawnIn <= 0 && evt.remaining > 0) {
                    this.spawnEnemy(evt.type);
                    evt.remaining--;

                    // Prepare next spawn
                    evt.nextSpawnIn += evt.rate;
                }

                // If we've spawned all enemies for this event, mark finished
                if (evt.remaining <= 0) {
                    evt.finished = true;
                }
            }
        }

        // Check for wave complete:
        //  - all events finished (all enemies spawned)
        //  - no enemies alive on screen
        if (allEventsFinished && this.enemiesAlive === 0) {
            this.onWaveComplete();
        }
    }

    // --- ENEMY SPAWNING ---

    spawnEnemy(type) {
        let enemy;

        // Map type -> class
        switch (type) {
            case 'fast':
                enemy = new FastEnemy(this.scene);
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

        // Track alive enemies
        this.enemiesAlive++;

        // Hook death callback
        enemy.onDeath = () => {
            this.enemiesAlive--;
        };
    }

    // --- WAVE COMPLETE ---

    onWaveComplete() {
        if (this.waveFinished) return;   
        this.waveFinished = true;

        console.log(`Wave ${this.currentWaveIndex + 1} complete`);

        // Round bonus
        const bonus = 50 + (this.currentWaveIndex * 10);
        this.scene.addGold(bonus);

        if (this.currentWaveIndex < this.waves.length - 1) {
            this.scene.roundButton.setVisible(true);
        } else {
            console.log('Last wave finished');
            
        }
    }
}