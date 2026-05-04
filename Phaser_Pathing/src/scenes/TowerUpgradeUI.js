// ui/TowerUpgradeUI.js
export default class TowerUpgradeUI {
    constructor(scene) {
        this.scene = scene;
        this.tower = null;
        this.visible = false;

        this._buildPanel();
        this.hide();

        scene.events.on('towerSelected', (tower) => this.show(tower));

        // Close when clicking empty space (no game object hit)
        scene.input.on('pointerdown', (ptr, targets) => {
            if (this.visible && targets.length === 0) this.hide();
        });
    }

    _buildPanel() {
        const scene = this.scene;
        const W = 300, H = 420;

        this.bg = scene.add.rectangle(0, 0, W, H, 0x1a1a2e, 0.97)
            .setStrokeStyle(2, 0x4ecca3)
            .setOrigin(0);

        this.titleText = scene.add.text(W / 2, 16, 'TOWER', {
            fontSize: '18px', fontFamily: 'monospace',
            color: '#4ecca3', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.statsText = scene.add.text(15, 45, '', {
            fontSize: '13px', fontFamily: 'monospace',
            color: '#aaaaaa', lineSpacing: 5
        });

        this.buttons = {};

        const paths = [
            { key: 'damage', color: 0xff6622, y: 140, desc: 'Increases tower\ndamage output' },
            { key: 'speed',  color: 0x4488ff, y: 220, desc: 'Increases fire rate\n(faster attacks)' },
            { key: 'range',  color: 0x44cc66, y: 300, desc: 'Increases attack\nrange' },
        ];

        paths.forEach(({ key, color, y, desc }) => {
            const btn = scene.add.rectangle(W / 2, y, 260, 60, color, 0.2)
                .setStrokeStyle(1, color)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this._upgrade(key));

            const description = scene.add.text(W + 20, y, desc, {
                fontSize: '11px', fontFamily: 'monospace', color: '#ffdd66'
            }).setOrigin(0, 0.5).setVisible(false);

            btn.on('pointerover', () => {
                btn.setFillStyle(color, 0.45);
                description.setVisible(true);
            });
            btn.on('pointerout', () => {
                btn.setFillStyle(color, 0.2);
                description.setVisible(false);
            });

            const btnLabel = scene.add.text(W / 2 - 80, y - 10, '', {
                fontSize: '14px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            const pips = scene.add.text(W / 2 + 80, y - 10, '◇◇', {
                fontSize: '15px', fontFamily: 'monospace', color: '#888888'
            }).setOrigin(0.5);

            const cost = scene.add.text(W / 2, y + 8, '', {
                fontSize: '12px', fontFamily: 'monospace', color: '#888888'
            }).setOrigin(0.5);

            const preview = scene.add.text(W / 2, y + 24, '', {
                fontSize: '11px', fontFamily: 'monospace', color: '#66ff99'
            }).setOrigin(0.5);

            this.buttons[key] = { btn, btnLabel, pips, cost, preview, description };
        });

        this.closeBtn = scene.add.text(W - 8, 4, '✕', {
            fontSize: '16px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(1, 0)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => this.closeBtn.setColor('#ffffff'))
          .on('pointerout',  () => this.closeBtn.setColor('#666666'))
          .on('pointerdown', () => this.hide());

        const allObjects = [
            this.bg, this.titleText, this.statsText, this.closeBtn,
            ...Object.values(this.buttons).flatMap(b => [b.btn, b.btnLabel, b.pips, b.cost, b.preview, b.description])
        ];

        this.container = scene.add.container(0, 0, allObjects).setDepth(10000);
    }

    _upgrade(path) {
        if (!this.tower) return;

        const level = this.tower.upgradePaths[path];
        if (level >= 2) return;

        // Read cost from the tower's own upgrade definitions
        const cost = this.tower.upgradeDefinitions[path].costs[level];

        if (this.scene.money < cost) {
            // Flash money text red
            this.scene.tweens.add({
                targets: this.scene.moneyText,
                alpha: 0.2, yoyo: true, duration: 80, repeat: 2
            });
            return;
        }

        this.scene.money -= cost;
        this.scene.moneyText.setText(`Money: $${this.scene.money}`);

        this.tower.applyUpgrade(path);
        this._refresh();
    }

    _getUpgradePreview(tower, path) {
        const level = tower.upgradePaths[path];
        if (level >= 2) return null;

        // Calculate new stats based on the upgrade definition
        const def = tower.upgradeDefinitions[path];
        const newLevel = level + 1;

        let newDamage = tower.damage;
        let newFireRate = tower.fireRate;
        let newRange = tower.range;

        // Parse the apply function to determine stat changes
        if (path === 'damage') {
            // Most towers: damage += value * lvl
            newDamage += 8 * newLevel;
        } else if (path === 'speed') {
            // Speed affects fireRate (lower = faster)
            newFireRate = Math.max(50, tower.fireRate - 60 * newLevel);
        } else if (path === 'range') {
            // Most towers: range += value * lvl
            newRange += 200 * newLevel;
        }

        // Handle tower-specific calculations
        if (tower.type === 'firetower') {
            if (path === 'damage') newDamage = tower.damage + 12 * newLevel;
            if (path === 'speed') newFireRate = Math.max(100, tower.fireRate - 100 * newLevel);
            if (path === 'range') newRange = tower.range + 60 * newLevel;
        } else if (tower.type === 'icetower') {
            if (path === 'damage') newDamage = tower.damage + 6 * newLevel;
            if (path === 'speed') newFireRate = Math.max(200, tower.fireRate - 200 * newLevel);
            if (path === 'range') newRange = tower.range + 50 * newLevel;
        } else if (tower.type === 'rocktower') {
            if (path === 'damage') newDamage = tower.damage + 20 * newLevel;
            if (path === 'speed') newFireRate = Math.max(400, tower.fireRate - 400 * newLevel);
            if (path === 'range') newRange = tower.range + 80 * newLevel;
        } else if (tower.type === 'darktower') {
            if (path === 'damage') newDamage = tower.damage + 10 * newLevel;
            if (path === 'speed') newFireRate = Math.max(150, tower.fireRate - 80 * newLevel);
            if (path === 'range') newRange = tower.range + 100 * newLevel;
        } else if (tower.type === 'lighttower') {
            if (path === 'damage') newDamage = tower.damage + 9 * newLevel;
            if (path === 'speed') newFireRate = Math.max(100, tower.fireRate - 70 * newLevel);
            if (path === 'range') newRange = tower.range + 120 * newLevel;
        } else if (tower.type === 'psychictower') {
            if (path === 'damage') newDamage = tower.damage + 11 * newLevel;
            if (path === 'speed') newFireRate = Math.max(120, tower.fireRate - 90 * newLevel);
            if (path === 'range') newRange = tower.range + 110 * newLevel;
        } else if (tower.type === 'windtower') {
            if (path === 'damage') newDamage = tower.damage + 8 * newLevel;
            if (path === 'speed') newFireRate = Math.max(140, tower.fireRate - 75 * newLevel);
            if (path === 'range') newRange = tower.range + 130 * newLevel;
        }

        return { damage: newDamage, fireRate: newFireRate, range: newRange };
    }

    _getPreviewText(tower, path) {
        const preview = this._getUpgradePreview(tower, path);
        if (!preview) return '';

        if (path === 'damage') {
            const delta = preview.damage - tower.damage;
            return `${tower.damage} → ${preview.damage} (+${delta})`;
        } else if (path === 'speed') {
            const currentRate = (1000 / tower.fireRate).toFixed(1);
            const newRate = (1000 / preview.fireRate).toFixed(1);
            return `${currentRate}/s → ${newRate}/s`;
        } else if (path === 'range') {
            const delta = preview.range - tower.range;
            return `${tower.range}px → ${preview.range}px (+${delta})`;
        }
        return '';
    }

    _refresh() {
        if (!this.tower) return;
        const t = this.tower;

        // Update title with tower type
        this.titleText.setText(t.type.toUpperCase().replace('TOWER', ' TOWER'));

        // Update stats
        this.statsText.setText(
            `DMG: ${t.damage}    RATE: ${(1000 / t.fireRate).toFixed(1)}/s\nRNG: ${t.range}px`
        );

        // Update each button from tower's own upgrade definitions
        Object.entries(this.buttons).forEach(([key, { btn, btnLabel, pips, cost, preview }]) => {
            const level  = t.upgradePaths[key];
            const def    = t.upgradeDefinitions[key];

            btnLabel.setText(def.label);
            pips.setText('◆'.repeat(level) + '◇'.repeat(2 - level));

            if (level >= 2) {
                cost.setText('MAXED');
                preview.setText('');
                btn.setAlpha(0.35).disableInteractive();
            } else {
                cost.setText(`Cost: $${def.costs[level]}`);
                preview.setText(this._getPreviewText(t, key));
                btn.setAlpha(1).setInteractive({ useHandCursor: true });
            }
        });
    }

    show(tower) {
        this.tower   = tower;
        this.visible = true;

        const cam = this.scene.cameras.main;
        const W = 300, H = 420;

        let px = tower.x + 40;
        let py = tower.y - H / 2;
        px = Phaser.Math.Clamp(px, 4, cam.width  - W - 4);
        py = Phaser.Math.Clamp(py, 4, cam.height - H - 4);

        this.container.setPosition(px, py).setVisible(true).setAlpha(0);
        this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 150 });

        this._refresh();
    }

    hide() {
        this.visible = false;
        this.tower   = null;

        if (!this.container) return;
        this.scene.tweens.add({
            targets: this.container, alpha: 0, duration: 100,
            onComplete: () => this.container?.setVisible(false)
        });
    }
}