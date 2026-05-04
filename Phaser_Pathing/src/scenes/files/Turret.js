// objects/Turret.js

const TOWER_STATS = {
    lightningtower: { bulletType: 'bullet',     range: 1000, fireRate: 200,  damage: 15 },
    firetower:      { bulletType: 'firebullet', range: 250,  fireRate: 400,  damage: 20 },
    icetower:       { bulletType: 'icebullet',  range: 150,  fireRate: 800,  damage: 10 },
    rocktower:      { bulletType: 'bullet',     range: 220,  fireRate: 1500, damage: 40 },
    darktower:      { bulletType: 'bullet',     range: 300,  fireRate: 600,  damage: 25 },
    lighttower:     { bulletType: 'bullet',     range: 400,  fireRate: 350,  damage: 18 },
    psychictower:   { bulletType: 'bullet',     range: 280,  fireRate: 500,  damage: 22 },
    windtower:      { bulletType: 'bullet',     range: 350,  fireRate: 450,  damage: 16 }
};

const UPGRADE_PATHS = {
    lightningtower: {
        damage: { label: '⚡ Chain Strike', costs: [75, 200],
            apply: (t, lvl) => { t.damage += 8 * lvl; t.setTint(lvl === 1 ? 0xffee44 : 0xffaa00); } },
        speed:  { label: '⚡ Overclock',    costs: [100, 250],
            apply: (t, lvl) => { t.fireRate = Math.max(50, t.fireRate - 60 * lvl); t.setTint(lvl === 1 ? 0x88ffff : 0x00ccff); } },
        range:  { label: '📡 Broadcast',   costs: [60, 175],
            apply: (t, lvl) => { t.range += 200 * lvl; } }
    },
    firetower: {
        damage: { label: '🔥 Inferno',    costs: [80, 220],
            apply: (t, lvl) => { t.damage += 12 * lvl; t.setTint(lvl === 1 ? 0xff6600 : 0xff2200); } },
        speed:  { label: '🔥 Rapid Burn', costs: [90, 200],
            apply: (t, lvl) => { t.fireRate = Math.max(100, t.fireRate - 100 * lvl); } },
        range:  { label: '🔥 Spread',     costs: [70, 180],
            apply: (t, lvl) => { t.range += 60 * lvl; } }
    },
    icetower: {
        damage: { label: '❄ Frostbite',    costs: [60, 160],
            apply: (t, lvl) => { t.damage += 6 * lvl; t.setTint(lvl === 1 ? 0xccddff : 0x99ccff); } },
        speed:  { label: '❄ Blizzard',     costs: [80, 200],
            apply: (t, lvl) => { t.fireRate = Math.max(200, t.fireRate - 200 * lvl); } },
        range:  { label: '❄ Arctic Reach', costs: [70, 175],
            apply: (t, lvl) => { t.range += 50 * lvl; } }
    },
    rocktower: {
        damage: { label: '🪨 Boulder',    costs: [100, 300],
            apply: (t, lvl) => { t.damage += 20 * lvl; } },
        speed:  { label: '🪨 Rapid Fire', costs: [120, 280],
            apply: (t, lvl) => { t.fireRate = Math.max(400, t.fireRate - 400 * lvl); } },
        range:  { label: '🪨 Trebuchet',  costs: [80, 200],
            apply: (t, lvl) => { t.range += 80 * lvl; } }
    },
    darktower: {
        damage: { label: '🌑 Shadow Bolt', costs: [85, 230],
            apply: (t, lvl) => { t.damage += 10 * lvl; t.setTint(lvl === 1 ? 0x9944aa : 0x661177); } },
        speed:  { label: '🌑 Dark Pulse',  costs: [95, 240],
            apply: (t, lvl) => { t.fireRate = Math.max(150, t.fireRate - 80 * lvl); } },
        range:  { label: '🌑 Void Reach',  costs: [75, 190],
            apply: (t, lvl) => { t.range += 100 * lvl; } }
    },
    lighttower: {
        damage: { label: '☀ Radiant Beam', costs: [90, 250],
            apply: (t, lvl) => { t.damage += 9 * lvl; t.setTint(lvl === 1 ? 0xffff99 : 0xffff44); } },
        speed:  { label: '☀ Burst',        costs: [100, 260],
            apply: (t, lvl) => { t.fireRate = Math.max(100, t.fireRate - 70 * lvl); } },
        range:  { label: '☀ Brilliance',   costs: [80, 210],
            apply: (t, lvl) => { t.range += 120 * lvl; } }
    },
    psychictower: {
        damage: { label: '🧠 Mind Crush',  costs: [88, 240],
            apply: (t, lvl) => { t.damage += 11 * lvl; t.setTint(lvl === 1 ? 0xff88ff : 0xff44ff); } },
        speed:  { label: '🧠 Psyche Wave', costs: [98, 250],
            apply: (t, lvl) => { t.fireRate = Math.max(120, t.fireRate - 90 * lvl); } },
        range:  { label: '🧠 Mental Link', costs: [82, 215],
            apply: (t, lvl) => { t.range += 110 * lvl; } }
    },
    windtower: {
        damage: { label: '💨 Gust Strike', costs: [82, 220],
            apply: (t, lvl) => { t.damage += 8 * lvl; t.setTint(lvl === 1 ? 0xaaffff : 0x66ffff); } },
        speed:  { label: '💨 Tempest',     costs: [92, 245],
            apply: (t, lvl) => { t.fireRate = Math.max(140, t.fireRate - 75 * lvl); } },
        range:  { label: '💨 Whirlwind',   costs: [78, 205],
            apply: (t, lvl) => { t.range += 130 * lvl; } }
    }
};

// Placed tower display size in pixels (fits inside a 64px grid cell)
const PLACED_SIZE = 48;

export default class Turret extends Phaser.GameObjects.Sprite {

    constructor(scene, type) {
        super(scene, 0, 0, 'turret', type);
        scene.add.existing(this);

        this.scene = scene;
        this.type  = type;

        // Scale so the sprite fills PLACED_SIZE px regardless of its raw dimensions
        const frame = scene.textures.get('turret').get(type);
        this.setScale(Math.min(
            PLACED_SIZE / frame.realWidth,
            PLACED_SIZE / frame.realHeight
        ));

        const stats     = TOWER_STATS[type];
        this.range      = stats.range;
        this.fireRate   = stats.fireRate;
        this.damage     = stats.damage;
        this.bulletType = stats.bulletType;
        this.lastFired  = 0;

        this.upgradePaths       = { damage: 0, speed: 0, range: 0 };
        this.upgradeDefinitions = UPGRADE_PATHS[type];

        this.clearTint();
        this.setAlpha(1);

        this.setInteractive();
        this.on('pointerdown', () => scene.events.emit('towerSelected', this));
    }

    place(row, col) {
        const cellSize = 64;
        this.x = col * cellSize + cellSize / 2;
        this.y = row * cellSize + cellSize / 2;
    }

    applyUpgrade(path) {
        const level = this.upgradePaths[path];
        if (level >= 2) return false;

        this.upgradePaths[path]++;
        const newLevel = this.upgradePaths[path];

        const def = this.upgradeDefinitions[path];
        if (def?.apply) def.apply(this, newLevel);

        this.scene.tweens.add({
            targets: this, alpha: 0.2,
            yoyo: true, duration: 80, repeat: 2
        });

        return true;
    }

    update(time) {
        const enemy = this.scene.getEnemyInRange(this.x, this.y, this.range);
        if (!enemy) return;

        if (time > this.lastFired + this.fireRate) {
            if (this.type === 'icetower') {
                this.fireCardinalBullets();
            } else {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
                this.scene.spawnBullet(this, this.x, this.y, angle);
            }
            this.lastFired = time;
        }
    }

    fireCardinalBullets() {
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
            .forEach(dir => {
                this.scene.spawnBullet(this, this.x, this.y, Math.atan2(dir.y, dir.x), {
                    velocityX: dir.x * 500,
                    velocityY: dir.y * 500,
                    bulletType: this.bulletType,
                    damage: this.damage
                });
            });
    }
}
