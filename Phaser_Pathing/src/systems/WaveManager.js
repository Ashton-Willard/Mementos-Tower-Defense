import FastEnemy from '../objects/FastEnemy.js';
import Enemy from '../objects/Enemy.js';

export default class WaveManager {
    constructor(scene, enemies, path) {
        this.scene = scene;
        this.enemies = enemies;
        this.path = path;
        
        this.currentWave = 0;
        this.timeUntilNextSpawn = 0;
        this.enemiesLeftInWave = 0;

        this.waves = [
            { type: 'basic', count: 10, rate: 500 },
            { type: 'fast', count: 15, rate: 300 }
        ];
    }

    startWave() {
        const wave = this.waves[this.currentWave];
        this.enemiesLeftInWave = wave.count;
        this.timeUntilNextSpawn = 0;
    }

    update(time, delta) {
        if (this.enemiesLeftInWave <= 0) return;

        this.timeUntilNextSpawn -= delta;
        if (this.timeUntilNextSpawn <= 0) {
            this.spawnEnemy();
            const wave = this.waves[this.currentWave];
            this.timeUntilNextSpawn = wave.rate;
        }
    }

    spawnEnemy() {
        const wave = this.waves[this.currentWave];
        let enemy;

        if (wave.type === 'fast') {
            enemy = new FastEnemy(this.scene);
        } else {
            enemy = new Enemy(this.scene);
        }

        this.enemies.add(enemy);

        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.startOnPath(this.path);

        this.enemiesLeftInWave--;

        if(this.enemiesLeftInWave <= 0) {
            // Move to next wave after a short delay
            this.scene.startButton.setVisible(true);
    }
}
}