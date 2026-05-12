import { saveManager } from '../systems/SaveManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('titleBG', 'src/assets/titleBG.png');
        this.load.image('tower_lightning', 'src/assets/towers/tower_lightning.png');
        this.load.image('tower_rock', 'src/assets/towers/tower_rock.png');
        this.load.image('enemy_showcase', 'src/assets/enemies/enemy_shadow.png');
        this.load.image('back_arrow', 'src/assets/ui/back_arrow_red.png');

        // Placeholder map images
        this.load.image('map1', 'src/assets/maps/map1.png');
        this.load.image('map2', 'src/assets/maps/BloonsCutMap1.png');
    }

    create() {
        // Background
        const bg = this.add.image(0, 0, 'titleBG')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        // Dark overlay
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.45
        );

        // ============================================================
        // AUTHENTICATION: LOGOUT BUTTON (Top-right corner)
        // ============================================================
        const logoutBtn = this.add.text(
            this.scale.width - 80,
            80,
            'LOGOUT',
            {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ff2a2a',
                stroke: '#000000',
                strokeThickness: 6
            }
        )
        .setOrigin(1, 0.5)
        .setInteractive({ useHandCursor: true });

        logoutBtn.on('pointerover', () => {
            this.tweens.add({ targets: logoutBtn, scale: 1.1, duration: 120, ease: 'Quad.easeOut' });
        });

        logoutBtn.on('pointerout', () => {
            this.tweens.add({ targets: logoutBtn, scale: 1, duration: 120, ease: 'Quad.easeOut' });
        });

        logoutBtn.on('pointerdown', async () => {
            // Lazy-load Firebase Auth
            const { signOut } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js");
            const { auth } = await import("../systems/firebase.js");

            await signOut(auth);

            // Re-show the login wrapper (HTML)
            const wrapper = document.getElementById("auth-wrapper");
            if (wrapper) wrapper.style.display = "flex";

            // Reset flag so login screen shows next time
            localStorage.removeItem("gameAlreadyOpened");

            // Go back to AuthScene
            this.scene.start("AuthScene");
        });


        // Floating enemy showcase
        const enemy = this.add.image(
            this.scale.width / 2,
            this.scale.height * 0.32,
            'enemy_showcase'
        )
            .setOrigin(0.5)
            .setScale(2.8);

        this.tweens.add({
            targets: enemy,
            y: enemy.y + 20,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: enemy,
            scale: { from: 2.7, to: 2.9 },
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ============================================================
        // PAGE CREATION
        // ============================================================
        const createPage = () => {
            const page = this.add.container(0, 0).setVisible(false);

            const overlay = this.add.rectangle(
                this.scale.width / 2,
                this.scale.height / 2,
                this.scale.width,
                this.scale.height,
                0x000000,
                0.94
            );
            page.add(overlay);

            const back = this.add.image(80, 80, 'back_arrow')
                .setOrigin(0.5)
                .setScale(1.2)
                .setInteractive({ useHandCursor: true });

            back.on('pointerover', () => {
                this.tweens.add({ targets: back, scale: 1.35, duration: 120 });
            });

            back.on('pointerout', () => {
                this.tweens.add({ targets: back, scale: 1.2, duration: 120 });
            });

            back.on('pointerdown', () => {
                this.hideAllPages();
                this.showMenu();
            });

            page.add(back);

            return page;
        };

        this.playPage = createPage();
        this.towersPage = createPage();
        this.upgradesPage = createPage();
        this.settingsPage = createPage();

        this.hideAllPages = () => {
            this.playPage.setVisible(false);
            this.towersPage.setVisible(false);
            this.upgradesPage.setVisible(false);
            this.settingsPage.setVisible(false);
        };

        const showPage = (page) => {
            this.hideAllPages();
            page.setVisible(true);
            page.y = 40;
            page.alpha = 0;

            this.tweens.add({
                targets: page,
                alpha: 1,
                y: 0,
                duration: 280,
                ease: 'Quad.easeOut'
            });
        };

        // ============================================================
        // MENU BUTTONS
        // ============================================================
        const createMenuButton = (label, x, callback) => {
            const text = this.add.text(
                x,
                this.scale.height * 0.82,
                label,
                {
                    fontFamily: 'Arial',
                    fontSize: '36px',
                    color: '#ffffff'
                }
            ).setOrigin(0.5);

            text.setInteractive({ useHandCursor: true });

            text.on('pointerover', () => {
                this.tweens.add({ targets: text, scale: 1.08, duration: 120 });
            });

            text.on('pointerout', () => {
                this.tweens.add({ targets: text, scale: 1, duration: 120 });
            });

            text.on('pointerdown', callback);

            return text;
        };

        const spacing = this.scale.width / 6;

        const playBtn = createMenuButton('PLAY', spacing * 1, () => {
            this.hideMenu();
            showPage(this.playPage);
        });

        const towersBtn = createMenuButton('TOWERS', spacing * 2, () => {
            this.hideMenu();
            showPage(this.towersPage);
        });

        const upgradesBtn = createMenuButton('UPGRADES', spacing * 3, () => {
            this.hideMenu();
            showPage(this.upgradesPage);
        });

        const settingsBtn = createMenuButton('SETTINGS', spacing * 4, () => {
            this.hideMenu();
            showPage(this.settingsPage);
        });

        const exitBtn = createMenuButton('EXIT', spacing * 5, () => {
            if (window.close) window.close();
        });

        this.menuButtons = [playBtn, towersBtn, upgradesBtn, settingsBtn, exitBtn];

        this.hideMenu = () => this.menuButtons.forEach(b => b.setVisible(false));
        this.showMenu = () => this.menuButtons.forEach(b => b.setVisible(true));

        // ============================================================
        // PLAY PAGE CONTENT (2 MAP CAROUSEL)
        // ============================================================

        let selectedDiff = 'NORMAL';
        let selectedMapIndex = 0;

        const mapKeys = ['map1', 'map2'];
        const mapNames = ['CORRIDOR OF SHADOWS', 'STONE WAY'];

        // START BUTTON
        const startButton = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.32,
            'START RUN',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#ff0000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);

        startButton.setInteractive({ useHandCursor: true });

        startButton.on('pointerover', () => {
            this.tweens.add({ targets: startButton, scale: 1.08, duration: 140 });
        });

        startButton.on('pointerout', () => {
            this.tweens.add({ targets: startButton, scale: 1, duration: 140 });
        });

        startButton.on('pointerdown', () => {
            this.scene.start('MainScene', { 
                difficulty: selectedDiff,
                map: mapKeys[selectedMapIndex]
            });
        });

        // DIFFICULTY SELECTOR
        const diffLabel = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.46,
            'DIFFICULTY',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        const difficulties = ['EASY', 'NORMAL', 'HARD'];

        const diffButtons = difficulties.map((d, i) => {
            const t = this.add.text(
                this.scale.width / 2 + (i - 1) * 160,
                this.scale.height * 0.52,
                d,
                {
                    fontFamily: 'Arial',
                    fontSize: '30px',
                    color: d === selectedDiff ? '#ff2a2a' : '#bbbbbb'
                }
            ).setOrigin(0.5);

            t.setInteractive({ useHandCursor: true });

            t.on('pointerover', () => {
                this.tweens.add({ targets: t, scale: 1.08, duration: 120 });
            });

            t.on('pointerout', () => {
                this.tweens.add({ targets: t, scale: 1, duration: 120 });
            });

            t.on('pointerdown', () => {
                selectedDiff = d;
                diffButtons.forEach(btn => btn.setColor('#bbbbbb'));
                t.setColor('#ff2a2a');
            });

            return t;
        });

        // MAP CAROUSEL
        const previewY = this.scale.height * 0.72;

        const leftArrow = this.add.text(
            this.scale.width * 0.28,
            previewY,
            '<',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ffffff'
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const rightArrow = this.add.text(
            this.scale.width * 0.72,
            previewY,
            '>',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ffffff'
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const mapPreview = this.add.image(
            this.scale.width / 2,
            previewY,
            mapKeys[selectedMapIndex]
        ).setOrigin(0.5);

        mapPreview.setDisplaySize(this.scale.width * 0.35, this.scale.height * 0.22);

        const mapBorder = this.add.rectangle(
            this.scale.width / 2,
            previewY,
            this.scale.width * 0.35 + 10,
            this.scale.height * 0.22 + 10,
            0xff0000,
            0.35
        ).setOrigin(0.5);

        this.tweens.add({
            targets: mapBorder,
            alpha: { from: 0.25, to: 0.7 },
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const mapText = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.60,
            mapNames[selectedMapIndex],
            {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        const updateMap = () => {
            mapPreview.setTexture(mapKeys[selectedMapIndex]);
            mapText.setText(mapNames[selectedMapIndex]);
        };

        leftArrow.on('pointerdown', () => {
            selectedMapIndex = (selectedMapIndex - 1 + mapKeys.length) % mapKeys.length;
            updateMap();
        });

        rightArrow.on('pointerdown', () => {
            selectedMapIndex = (selectedMapIndex + 1) % mapKeys.length;
            updateMap();
        });

        // Add PLAY page elements
        this.playPage.add(startButton);
        this.playPage.add(diffLabel);
        diffButtons.forEach(b => this.playPage.add(b));
        this.playPage.add(leftArrow);
        this.playPage.add(rightArrow);
        this.playPage.add(mapPreview);
        this.playPage.add(mapBorder);
        this.playPage.add(mapText);

        const towersTitle = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.16,
            'TOWERS',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ff2a2a',
                stroke: '#000000',
                strokeThickness: 8
            }
        ).setOrigin(0.5);

        const towerStatsPanel = this.add.rectangle(
            this.scale.width * 0.22,
            this.scale.height * 0.58,
            this.scale.width * 0.30,
            this.scale.height * 0.40,
            0x111111,
            1
        );
        const towerStatsBorder = this.add.rectangle(
            this.scale.width * 0.22,
            this.scale.height * 0.58,
            this.scale.width * 0.30 + 6,
            this.scale.height * 0.40 + 6,
            0xff0000,
            0.45
        );

        this.tweens.add({
            targets: towerStatsBorder,
            alpha: { from: 0.25, to: 0.7 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const towerNameText = this.add.text(
            this.scale.width * 0.22,
            this.scale.height * 0.40,
            'Select a Tower',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        const towerStatsText = this.add.text(
            this.scale.width * 0.22,
            this.scale.height * 0.58,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#dddddd',
                wordWrap: { width: this.scale.width * 0.26 }
            }
        ).setOrigin(0.5);

        const towers = [
            {
                key: 'tower_lightning',
                name: 'Lightning Tower',
                damage: 'High burst damage',
                range: 'Long range',
                rate: 'Fast fire rate',
                desc: 'Channels unstable lightning to obliterate clustered enemies.'
            },
            {
                key: 'tower_rock',
                name: 'Rock Tower',
                damage: 'Moderate impact damage',
                range: 'Medium range',
                rate: 'Slow fire rate',
                desc: 'Launches crushing boulders that stagger and shatter armored foes.'
            }
        ];

        const hoverLabel = this.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setVisible(false);

        this.towerIcons = [];

        towers.forEach((t, i) => {
            const icon = this.add.image(
                this.scale.width * 0.60 + i * 220,
                this.scale.height * 0.52,
                t.key
            )
                .setOrigin(0.5)
                .setScale(1.7);

            const glow = this.add.rectangle(
                icon.x,
                icon.y,
                icon.width * 1.9,
                icon.height * 1.9,
                0xff0000,
                0.18
            );

            this.tweens.add({
                targets: glow,
                alpha: { from: 0.12, to: 0.4 },
                duration: 1600 + i * 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            icon.setInteractive({ useHandCursor: true });

            icon.on('pointerover', () => {
                hoverLabel.setText(t.name);
                hoverLabel.setPosition(icon.x, icon.y - 130);
                hoverLabel.setVisible(true);
                this.tweens.add({ targets: icon, scale: 1.9, duration: 120, ease: 'Quad.easeOut' });
            });

            icon.on('pointerout', () => {
                hoverLabel.setVisible(false);
                this.tweens.add({ targets: icon, scale: 1.7, duration: 120, ease: 'Quad.easeOut' });
            });

            icon.on('pointerdown', () => {
                towerNameText.setText(t.name);
                towerStatsText.setText(
                    'Damage: ' + t.damage +
                    '\nRange: ' + t.range +
                    '\nFire Rate: ' + t.rate +
                    '\n\n' + t.desc
                );
            });

            this.towerIcons.push(icon);
            this.towersPage.add(glow);
            this.towersPage.add(icon);
        });

        this.towersPage.add(towersTitle);
        this.towersPage.add(towerStatsPanel);
        this.towersPage.add(towerStatsBorder);
        this.towersPage.add(towerNameText);
        this.towersPage.add(towerStatsText);
        this.towersPage.add(hoverLabel);

        const upgradesTitle = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.16,
            'UPGRADES',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ff2a2a',
                stroke: '#000000',
                strokeThickness: 8
            }
        ).setOrigin(0.5);

        const upgradesHint = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.24,
            'Unlock permanent bonuses for your runs',
            {
                fontFamily: 'Arial',
                fontSize: '26px',
                color: '#dddddd'
            }
        ).setOrigin(0.5);

        const upgradesGraphics = this.add.graphics();
        upgradesGraphics.lineStyle(4, 0xff0000, 0.6);

        const nodePositions = [
            { x: this.scale.width * 0.35, y: this.scale.height * 0.40, label: 'Damage I' },
            { x: this.scale.width * 0.50, y: this.scale.height * 0.40, label: 'Damage II' },
            { x: this.scale.width * 0.65, y: this.scale.height * 0.40, label: 'Damage III' },
            { x: this.scale.width * 0.35, y: this.scale.height * 0.55, label: 'Range I' },
            { x: this.scale.width * 0.50, y: this.scale.height * 0.55, label: 'Range II' },
            { x: this.scale.width * 0.65, y: this.scale.height * 0.55, label: 'Range III' },
            { x: this.scale.width * 0.35, y: this.scale.height * 0.70, label: 'Speed I' },
            { x: this.scale.width * 0.50, y: this.scale.height * 0.70, label: 'Speed II' },
            { x: this.scale.width * 0.65, y: this.scale.height * 0.70, label: 'Speed III' }
        ];

        const connectPairs = [
            [0, 1], [1, 2],
            [3, 4], [4, 5],
            [6, 7], [7, 8],
            [0, 3], [3, 6],
            [1, 4], [4, 7],
            [2, 5], [5, 8]
        ];

        connectPairs.forEach(pair => {
            const a = nodePositions[pair[0]];
            const b = nodePositions[pair[1]];
            upgradesGraphics.moveTo(a.x, a.y);
            upgradesGraphics.lineTo(b.x, b.y);
        });

        upgradesGraphics.strokePath();

        const upgradeTooltip = this.add.text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setVisible(false);

        const upgradeNodes = [];

        nodePositions.forEach((pos, i) => {
            const node = this.add.circle(
                pos.x,
                pos.y,
                26,
                0x222222,
                1
            );
            const glow = this.add.circle(
                pos.x,
                pos.y,
                32,
                0xff0000,
                0.35
            );

            this.tweens.add({
                targets: glow,
                alpha: { from: 0.18, to: 0.6 },
                duration: 1500 + i * 80,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            node.setInteractive({ useHandCursor: true });

            node.on('pointerover', () => {
                upgradeTooltip.setText(pos.label + '\n+10% bonus');
                upgradeTooltip.setPosition(pos.x, pos.y - 60);
                upgradeTooltip.setVisible(true);
                this.tweens.add({ targets: node, scale: 1.15, duration: 120, ease: 'Quad.easeOut' });
            });

            node.on('pointerout', () => {
                upgradeTooltip.setVisible(false);
                this.tweens.add({ targets: node, scale: 1, duration: 120, ease: 'Quad.easeOut' });
            });

            node.on('pointerdown', () => {
                this.tweens.add({
                    targets: glow,
                    alpha: { from: 0.9, to: 0.35 },
                    duration: 220,
                    yoyo: true,
                    ease: 'Quad.easeOut'
                });
            });

            upgradeNodes.push(node);
            this.upgradesPage.add(glow);
            this.upgradesPage.add(node);
        });

        this.upgradesPage.add(upgradesGraphics);
        this.upgradesPage.add(upgradesTitle);
        this.upgradesPage.add(upgradesHint);
        this.upgradesPage.add(upgradeTooltip);

        const settingsTitle = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.16,
            'SETTINGS',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ff2a2a',
                stroke: '#000000',
                strokeThickness: 8
            }
        ).setOrigin(0.5);

        const settingsHint = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.24,
            'Tune your experience',
            {
                fontFamily: 'Arial',
                fontSize: '26px',
                color: '#dddddd'
            }
        ).setOrigin(0.5);

        const createSlider = (label, y, initialValue) => {
            const labelText = this.add.text(
                this.scale.width * 0.30,
                y,
                label,
                {
                    fontFamily: 'Arial',
                    fontSize: '28px',
                    color: '#ffffff'
                }
            ).setOrigin(0, 0.5);

            const bar = this.add.rectangle(
                this.scale.width * 0.60,
                y,
                this.scale.width * 0.30,
                8,
                0x444444,
                1
            );

            const barGlow = this.add.rectangle(
                this.scale.width * 0.60,
                y,
                this.scale.width * 0.30 + 6,
                14,
                0xff0000,
                0.35
            );

            this.tweens.add({
                targets: barGlow,
                alpha: { from: 0.18, to: 0.6 },
                duration: 1600,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            const knobX = this.scale.width * 0.45 + initialValue * this.scale.width * 0.30;
            const knob = this.add.circle(
                knobX,
                y,
                14,
                0xffffff,
                1
            );

            knob.setInteractive({ useHandCursor: true });

            knob.on('pointerover', () => {
                this.tweens.add({ targets: knob, scale: 1.2, duration: 120, ease: 'Quad.easeOut' });
            });

            knob.on('pointerout', () => {
                this.tweens.add({ targets: knob, scale: 1, duration: 120, ease: 'Quad.easeOut' });
            });

            return { labelText, bar, barGlow, knob };
        };

        const masterSlider = createSlider('Master Volume', this.scale.height * 0.40, 0.8);
        const musicSlider = createSlider('Music Volume', this.scale.height * 0.50, 0.6);
        const sfxSlider = createSlider('SFX Volume', this.scale.height * 0.60, 0.7);
        const sensSlider = createSlider('Mouse Sensitivity', this.scale.height * 0.70, 0.5);

        const createToggle = (label, y, initialOn) => {
            const labelText = this.add.text(
                this.scale.width * 0.30,
                y,
                label,
                {
                    fontFamily: 'Arial',
                    fontSize: '28px',
                    color: '#ffffff'
                }
            ).setOrigin(0, 0.5);

            const box = this.add.rectangle(
                this.scale.width * 0.78,
                y,
                40,
                24,
                0x222222,
                1
            );

            const knob = this.add.circle(
                this.scale.width * 0.78 + (initialOn ? 8 : -8),
                y,
                10,
                initialOn ? 0xff0000 : 0x888888,
                1
            );

            box.setInteractive({ useHandCursor: true });
            knob.setInteractive({ useHandCursor: true });

            const toggle = () => {
                const on = knob.fillColor === 0xff0000;
                const targetX = this.scale.width * 0.78 + (on ? -8 : 8);
                const targetColor = on ? 0x888888 : 0xff0000;
                this.tweens.add({ targets: knob, x: targetX, duration: 140, ease: 'Quad.easeOut' });
                knob.setFillStyle(targetColor, 1);
            };

            box.on('pointerdown', toggle);
            knob.on('pointerdown', toggle);

            return { labelText, box, knob };
        };

        const gfxToggle = createToggle('Graphics: High', this.scale.height * 0.80, true);
        const fullscreenToggle = createToggle('Fullscreen', this.scale.height * 0.88, false);

        this.settingsPage.add(settingsTitle);
        this.settingsPage.add(settingsHint);

        [masterSlider, musicSlider, sfxSlider, sensSlider].forEach(s => {
            this.settingsPage.add(s.labelText);
            this.settingsPage.add(s.bar);
            this.settingsPage.add(s.barGlow);
            this.settingsPage.add(s.knob);
        });

        [gfxToggle, fullscreenToggle].forEach(t => {
            this.settingsPage.add(t.labelText);
            this.settingsPage.add(t.box);
            this.settingsPage.add(t.knob);
        });

        // Fade in
        this.cameras.main.fadeIn(900, 0, 0, 0);
    }
}
