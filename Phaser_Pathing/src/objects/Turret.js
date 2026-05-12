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
        damage: { label: '⚡ Chain Strike', costs: [75, 200],  apply: (t, lvl) => { t.damage += 8 * lvl; } },
        speed:  { label: '⚡ Overclock',    costs: [100, 250], apply: (t, lvl) => { t.fireRate = Math.max(50, t.fireRate - 60 * lvl); } },
        range:  { label: '📡 Broadcast',   costs: [60, 175],  apply: (t, lvl) => { t.range += 200 * lvl; } }
    },
    firetower: {
        damage: { label: '🔥 Inferno',    costs: [80, 220],  apply: (t, lvl) => { t.damage += 12 * lvl; } },
        speed:  { label: '🔥 Rapid Burn', costs: [90, 200],  apply: (t, lvl) => { t.fireRate = Math.max(100, t.fireRate - 100 * lvl); } },
        range:  { label: '🔥 Spread',     costs: [70, 180],  apply: (t, lvl) => { t.range += 60 * lvl; } }
    },
    icetower: {
        damage: { label: '❄ Frostbite',    costs: [60, 160],  apply: (t, lvl) => { t.damage += 6 * lvl; } },
        speed:  { label: '❄ Blizzard',     costs: [80, 200],  apply: (t, lvl) => { t.fireRate = Math.max(200, t.fireRate - 200 * lvl); } },
        range:  { label: '❄ Arctic Reach', costs: [70, 175],  apply: (t, lvl) => { t.range += 50 * lvl; } }
    },
    rocktower: {
        damage: { label: '🪨 Boulder',    costs: [100, 300], apply: (t, lvl) => { t.damage += 20 * lvl; } },
        speed:  { label: '🪨 Rapid Fire', costs: [120, 280], apply: (t, lvl) => { t.fireRate = Math.max(400, t.fireRate - 400 * lvl); } },
        range:  { label: '🪨 Trebuchet',  costs: [80, 200],  apply: (t, lvl) => { t.range += 80 * lvl; } }
    },
    darktower: {
        damage: { label: '🌑 Shadow Bolt', costs: [85, 230],  apply: (t, lvl) => { t.damage += 10 * lvl; } },
        speed:  { label: '🌑 Dark Pulse',  costs: [95, 240],  apply: (t, lvl) => { t.fireRate = Math.max(150, t.fireRate - 80 * lvl); } },
        range:  { label: '🌑 Void Reach',  costs: [75, 190],  apply: (t, lvl) => { t.range += 100 * lvl; } }
    },
    lighttower: {
        damage: { label: '☀ Radiant Beam', costs: [90, 250],  apply: (t, lvl) => { t.damage += 9 * lvl; } },
        speed:  { label: '☀ Burst',        costs: [100, 260], apply: (t, lvl) => { t.fireRate = Math.max(100, t.fireRate - 70 * lvl); } },
        range:  { label: '☀ Brilliance',   costs: [80, 210],  apply: (t, lvl) => { t.range += 120 * lvl; } }
    },
    psychictower: {
        damage: { label: '🧠 Mind Crush',  costs: [88, 240],  apply: (t, lvl) => { t.damage += 11 * lvl; } },
        speed:  { label: '🧠 Psyche Wave', costs: [98, 250],  apply: (t, lvl) => { t.fireRate = Math.max(120, t.fireRate - 90 * lvl); } },
        range:  { label: '🧠 Mental Link', costs: [82, 215],  apply: (t, lvl) => { t.range += 110 * lvl; } }
    },
    windtower: {
        damage: { label: '💨 Gust Strike', costs: [82, 220],  apply: (t, lvl) => { t.damage += 8 * lvl; } },
        speed:  { label: '💨 Tempest',     costs: [92, 245],  apply: (t, lvl) => { t.fireRate = Math.max(140, t.fireRate - 75 * lvl); } },
        range:  { label: '💨 Whirlwind',   costs: [78, 205],  apply: (t, lvl) => { t.range += 130 * lvl; } }
    }
};

const MASTER_UPGRADES = {
    lightningtower: { cost: 500, label: '⚡ Storm God',    damageMulti: 2.5, rangeBonus: 300, fireRateMulti: 0.4 },
    icetower:       { cost: 450, label: '❄ Absolute Zero', damageMulti: 2.0, rangeBonus: 150, fireRateMulti: 0.5 },
    firetower:      { cost: 550, label: '🔥 Infernal',     damageMulti: 3.0, rangeBonus: 100, fireRateMulti: 0.6 },
    rocktower:      { cost: 600, label: '🪨 Titan',        damageMulti: 3.5, rangeBonus: 200, fireRateMulti: 0.7 },
    darktower:      { cost: 500, label: '🌑 Void Lord',    damageMulti: 2.8, rangeBonus: 250, fireRateMulti: 0.5 },
    lighttower:     { cost: 520, label: '☀ Seraph',        damageMulti: 2.5, rangeBonus: 300, fireRateMulti: 0.45 },
    psychictower:   { cost: 480, label: '🧠 Overmind',     damageMulti: 2.6, rangeBonus: 220, fireRateMulti: 0.5 },
    windtower:      { cost: 460, label: '💨 Tempest God',  damageMulti: 2.2, rangeBonus: 280, fireRateMulti: 0.4 }
};

const PLACED_SIZE = 48;

export default class Turret extends Phaser.GameObjects.Sprite {

    constructor(scene, type) {
        super(scene, 0, 0, 'turret', type);
        scene.add.existing(this);

        this.scene = scene;
        this.type  = type;

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
        this.masterDefinition   = MASTER_UPGRADES[type];

        this.isMastered     = false;
        this.masterUnlocked = false;

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

    isFullyUpgraded() {
        return this.upgradePaths.damage >= 2 &&
               this.upgradePaths.speed  >= 2 &&
               this.upgradePaths.range  >= 2;
    }

    applyUpgrade(path) {
        const level = this.upgradePaths[path];
        if (level >= 2) return false;

        this.upgradePaths[path]++;
        const newLevel = this.upgradePaths[path];

        // Only stat changes — no tint, no alpha, no scale
        const def = this.upgradeDefinitions[path];
        if (def?.apply) def.apply(this, newLevel);

        if (this.isFullyUpgraded()) {
            this.masterUnlocked = true;
        }

        return true;
    }

    applyMasterUpgrade() {
        if (this.isMastered || !this.masterUnlocked) return false;

        this.isMastered = true;

        const m = this.masterDefinition;
        this.damage    = Math.round(this.damage   * m.damageMulti);
        this.range    += m.rangeBonus;
        this.fireRate  = Math.round(this.fireRate * m.fireRateMulti);

        // Swap to upgraded sprite
        const upFrame = `${this.type}_up`;
        if (this.scene.textures.exists('turretup')) {
            this.setTexture('turretup', upFrame);

            const frame      = this.scene.textures.get('turretup').get(upFrame);
            const masterSize = PLACED_SIZE * 1.4;
            this.setScale(Math.min(masterSize / frame.realWidth, masterSize / frame.realHeight));
        }

        this.clearTint();
        this.setAlpha(1);

        // Master transform animation
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.6,
            scaleY: this.scaleY * 1.6,
            duration: 200,
            yoyo: true,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: this,
                    alpha: 0,
                    duration: 60,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => this.setAlpha(1)
                });
            }
        });

        return true;
    }

    update(time) {
    const enemy = this.scene.getEnemyInRange(this.x, this.y, this.range);
    if (!enemy) return;

    if (time > this.lastFired + this.fireRate) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
        this.scene.spawnBullet(this, this.x, this.y, angle);
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