// ui/TowerUpgradeUI.js
export default class TowerUpgradeUI {
    constructor(scene) {
        this.scene   = scene;
        this.tower   = null;
        this.visible = false;

        this._buildPanel();
        this.hide();

        scene.events.on('towerSelected', (tower) => this.show(tower));

        // Close when clicking empty space
        scene.input.on('pointerdown', (ptr, targets) => {
            if (this.visible && targets.length === 0) this.hide();
        });
    }

    _buildPanel() {
        const scene = this.scene;
        const W = 224, H = 340;

        // ── BACKGROUND ───────────────────────────────────────────────
        this.bg = scene.add.rectangle(0, 0, W, H, 0x1a1a2e, 0.97)
            .setStrokeStyle(2, 0x4ecca3)
            .setOrigin(0);

        // ── TITLE ────────────────────────────────────────────────────
        this.titleText = scene.add.text(W / 2, 14, 'TOWER', {
            fontSize: '13px', fontFamily: 'monospace',
            color: '#4ecca3', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        // ── STATS ────────────────────────────────────────────────────
        this.statsText = scene.add.text(10, 34, '', {
            fontSize: '10px', fontFamily: 'monospace',
            color: '#aaaaaa', lineSpacing: 3
        });

        // ── UPGRADE BUTTONS (damage / speed / range) ─────────────────
        this.buttons = {};
        const paths = [
            { key: 'damage', color: 0xff6622, y: 110 },
            { key: 'speed',  color: 0x4488ff, y: 168 },
            { key: 'range',  color: 0x44cc66, y: 226 },
        ];

        paths.forEach(({ key, color, y }) => {
            const btn = scene.add.rectangle(W / 2, y, 200, 44, color, 0.2)
                .setStrokeStyle(1, color)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => btn.setFillStyle(color, 0.45))
                .on('pointerout',  () => btn.setFillStyle(color, 0.2))
                .on('pointerdown', () => this._upgrade(key));

            const btnLabel = scene.add.text(W / 2 - 58, y - 9, '', {
                fontSize: '11px', fontFamily: 'monospace',
                color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            const pips = scene.add.text(W / 2 + 58, y - 9, '◇◇', {
                fontSize: '12px', fontFamily: 'monospace', color: '#888888'
            }).setOrigin(1, 0.5);

            const cost = scene.add.text(W / 2, y + 10, '', {
                fontSize: '9px', fontFamily: 'monospace', color: '#888888'
            }).setOrigin(0.5);

            this.buttons[key] = { btn, btnLabel, pips, cost };
        });

        // ── MASTER UPGRADE BUTTON ────────────────────────────────────
        // Shown only when all 3 paths are maxed and not yet mastered
        const masterY = 300;
        const masterColor = 0xffdd00;

        this.masterBg = scene.add.rectangle(W / 2, masterY, 200, 44, masterColor, 0.15)
            .setStrokeStyle(2, masterColor)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.masterBg.setFillStyle(masterColor, 0.4))
            .on('pointerout',  () => this.masterBg.setFillStyle(masterColor, 0.15))
            .on('pointerdown', () => this._masterUpgrade());

        this.masterLabel = scene.add.text(W / 2, masterY - 8, '✦ MASTER UPGRADE', {
            fontSize: '11px', fontFamily: 'monospace',
            color: '#ffdd00', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.masterCost = scene.add.text(W / 2, masterY + 9, '', {
            fontSize: '9px', fontFamily: 'monospace', color: '#aaaaaa'
        }).setOrigin(0.5);

        // Shown when already mastered
        this.masteredLabel = scene.add.text(W / 2, masterY, '✦ MASTERED', {
            fontSize: '13px', fontFamily: 'monospace',
            color: '#ffdd00', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ── CLOSE BUTTON ─────────────────────────────────────────────
        this.closeBtn = scene.add.text(W - 8, 4, '✕', {
            fontSize: '13px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(1, 0)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => this.closeBtn.setColor('#ffffff'))
          .on('pointerout',  () => this.closeBtn.setColor('#666666'))
          .on('pointerdown', () => this.hide());

        // ── CONTAINER ────────────────────────────────────────────────
        const allObjects = [
            this.bg, this.titleText, this.statsText, this.closeBtn,
            this.masterBg, this.masterLabel, this.masterCost, this.masteredLabel,
            ...Object.values(this.buttons).flatMap(b => [b.btn, b.btnLabel, b.pips, b.cost])
        ];
        this.container = scene.add.container(0, 0, allObjects).setDepth(10000);
    }

    _upgrade(path) {
        if (!this.tower) return;

        const level = this.tower.upgradePaths[path];
        if (level >= 2) return;

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
        this.scene.moneyText?.setText(`💰 $${this.scene.money}`);

        this.tower.applyUpgrade(path);
        this._refresh();
    }

    _masterUpgrade() {
        if (!this.tower) return;
        if (!this.tower.masterUnlocked || this.tower.isMastered) return;

        const cost = this.tower.masterDefinition.cost;
        if (this.scene.money < cost) {
            this.scene.tweens.add({
                targets: this.scene.moneyText,
                alpha: 0.2, yoyo: true, duration: 80, repeat: 2
            });
            return;
        }

        this.scene.money -= cost;
        this.scene.moneyText?.setText(`💰 $${this.scene.money}`);

        this.tower.applyMasterUpgrade();
        this._refresh();

        // Briefly flash the panel gold
        this.scene.tweens.add({
            targets: this.bg,
            strokeColor: 0xffdd00,
            duration: 600,
            yoyo: true,
            onComplete: () => this.bg.setStrokeStyle(2, 0x4ecca3)
        });
    }

    _refresh() {
        if (!this.tower) return;
        const t = this.tower;

        // Title
        this.titleText.setText(
            t.type.replace('tower', '').toUpperCase() + ' TOWER'
            + (t.isMastered ? ' ✦' : '')
        );

        // Stats
        this.statsText.setText(
            `DMG: ${t.damage}    RATE: ${(1000 / t.fireRate).toFixed(1)}/s\nRNG: ${t.range}px`
        );

        // Upgrade buttons
        Object.entries(this.buttons).forEach(([key, { btn, btnLabel, pips, cost }]) => {
            const level = t.upgradePaths[key];
            const def   = t.upgradeDefinitions[key];

            btnLabel.setText(def.label);
            pips.setText('◆'.repeat(level) + '◇'.repeat(2 - level));

            if (level >= 2 || t.isMastered) {
                cost.setText(level >= 2 ? 'MAXED' : '');
                btn.setAlpha(0.35).disableInteractive();
            } else {
                cost.setText(`Cost: $${def.costs[level]}`);
                btn.setAlpha(1).setInteractive({ useHandCursor: true });
            }
        });

        // Master upgrade button visibility
        const showMasterBtn     = t.masterUnlocked && !t.isMastered;
        const showMasteredLabel = t.isMastered;

        this.masterBg.setVisible(showMasterBtn);
        this.masterLabel.setVisible(showMasterBtn);
        this.masterCost.setVisible(showMasterBtn);
        this.masteredLabel.setVisible(showMasteredLabel);

        if (showMasterBtn) {
            this.masterLabel.setText(`✦ ${t.masterDefinition.label}`);
            this.masterCost.setText(`Cost: $${t.masterDefinition.cost}`);
        }
    }

    show(tower) {
        this.tower   = tower;
        this.visible = true;

        const cam = this.scene.cameras.main;
        const W = 224, H = 340;

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