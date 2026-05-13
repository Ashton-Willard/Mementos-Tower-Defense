import { saveManager } from '../systems/SaveManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('titleBG', 'src/assets/titleBG.png');
        this.load.image('enemy_showcase', 'src/assets/enemies/enemy_shadow.png');
        this.load.image('back_arrow', 'src/assets/ui/back_arrow_red.png');

        // Placeholder map images
        this.load.image('map1', 'src/assets/maps/map1.png');
        this.load.image('map2', 'src/assets/maps/BloonsCutMap1.png');
        // GameScene preload() is missing these two lines:
this.load.atlas('turret',   'src/assets/spritesheet2.png',  'src/assets/spritesheet.json');
this.load.atlas('turretup', 'src/assets/spritesheetup.png', 'src/assets/spritesheetup.json');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Background
        this.add.image(0, 0, 'titleBG')
            .setOrigin(0, 0)
            .setDisplaySize(W, H);

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
        const enemy = this.add.image(W / 2, H * 0.32, 'enemy_showcase')
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

            const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.94);
            page.add(overlay);

            const back = this.add.image(80, 80, 'back_arrow')
                .setOrigin(0.5)
                .setScale(1.2)
                .setInteractive({ useHandCursor: true });

            back.on('pointerover', () => this.tweens.add({ targets: back, scale: 1.35, duration: 120 }));
            back.on('pointerout',  () => this.tweens.add({ targets: back, scale: 1.2,  duration: 120 }));
            back.on('pointerdown', () => {
                this.hideAllPages();
                this.showMenu();
            });

            page.add(back);
            return page;
        };

        this.playPage      = createPage();
        this.towersPage    = createPage();
        this.upgradesPage  = createPage();
        this.settingsPage  = createPage();

        this.hideAllPages = () => {
            this.playPage.setVisible(false);
            this.towersPage.setVisible(false);
            this.upgradesPage.setVisible(false);
            this.settingsPage.setVisible(false);
        };

        const showPage = (page) => {
            this.hideAllPages();
            page.setVisible(true);
            page.y   = 40;
            page.alpha = 0;
            this.tweens.add({ targets: page, alpha: 1, y: 0, duration: 280, ease: 'Quad.easeOut' });
        };

        // ============================================================
        // MENU BUTTONS
        // ============================================================
        const createMenuButton = (label, x, callback) => {
            const text = this.add.text(x, H * 0.82, label, {
                fontFamily: 'Arial', fontSize: '36px', color: '#ffffff'
            }).setOrigin(0.5);

            text.setInteractive({ useHandCursor: true });
            text.on('pointerover', () => this.tweens.add({ targets: text, scale: 1.08, duration: 120 }));
            text.on('pointerout',  () => this.tweens.add({ targets: text, scale: 1,    duration: 120 }));
            text.on('pointerdown', callback);
            return text;
        };

        const spacing = W / 6;

        const playBtn     = createMenuButton('PLAY',     spacing * 1, () => { this.hideMenu(); showPage(this.playPage);     });
        const towersBtn   = createMenuButton('TOWERS',   spacing * 2, () => { this.hideMenu(); showPage(this.towersPage);   });
        const upgradesBtn = createMenuButton('UPGRADES', spacing * 3, () => { this.hideMenu(); showPage(this.upgradesPage); });
        const settingsBtn = createMenuButton('SETTINGS', spacing * 4, () => { this.hideMenu(); showPage(this.settingsPage); });
        const exitBtn     = createMenuButton('EXIT',     spacing * 5, () => { if (window.close) window.close(); });

        this.menuButtons = [playBtn, towersBtn, upgradesBtn, settingsBtn, exitBtn];
        this.hideMenu = () => this.menuButtons.forEach(b => b.setVisible(false));
        this.showMenu = () => this.menuButtons.forEach(b => b.setVisible(true));

        // ============================================================
        // PLAY PAGE
        // ============================================================
        let selectedDiff     = 'NORMAL';
        let selectedMapIndex = 0;

        const mapKeys = ['map1', 'map2'];
        const mapNames = ['CORRIDOR OF SHADOWS', 'STONE WAY'];

        const startButton = this.add.text(W / 2, H * 0.32, 'START RUN', {
            fontFamily: 'Arial', fontSize: '48px', color: '#ffffff',
            stroke: '#ff0000', strokeThickness: 6
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startButton.on('pointerover', () => this.tweens.add({ targets: startButton, scale: 1.08, duration: 140 }));
        startButton.on('pointerout',  () => this.tweens.add({ targets: startButton, scale: 1,    duration: 140 }));
        startButton.on('pointerdown', () => {
            this.scene.start('MainScene', { difficulty: selectedDiff, map: mapKeys[selectedMapIndex] });
        });

        const diffLabel = this.add.text(W / 2, H * 0.46, 'DIFFICULTY', {
            fontFamily: 'Arial', fontSize: '32px', color: '#ffffff'
        }).setOrigin(0.5);

        const difficulties = ['EASY', 'NORMAL', 'HARD'];
        const diffButtons  = difficulties.map((d, i) => {
            const t = this.add.text(W / 2 + (i - 1) * 160, H * 0.52, d, {
                fontFamily: 'Arial', fontSize: '30px',
                color: d === selectedDiff ? '#ff2a2a' : '#bbbbbb'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            t.on('pointerover', () => this.tweens.add({ targets: t, scale: 1.08, duration: 120 }));
            t.on('pointerout',  () => this.tweens.add({ targets: t, scale: 1,    duration: 120 }));
            t.on('pointerdown', () => {
                selectedDiff = d;
                diffButtons.forEach(b => b.setColor('#bbbbbb'));
                t.setColor('#ff2a2a');
            });
            return t;
        });

        const previewY   = H * 0.72;
        const leftArrow  = this.add.text(W * 0.28, previewY, '<', { fontFamily: 'Arial', fontSize: '64px', color: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        const rightArrow = this.add.text(W * 0.72, previewY, '>', { fontFamily: 'Arial', fontSize: '64px', color: '#ffffff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const mapPreview = this.add.image(W / 2, previewY, mapKeys[0]).setOrigin(0.5);
        mapPreview.setDisplaySize(W * 0.35, H * 0.22);

        const mapBorder = this.add.rectangle(W / 2, previewY, W * 0.35 + 10, H * 0.22 + 10, 0xff0000, 0.35).setOrigin(0.5);
        this.tweens.add({ targets: mapBorder, alpha: { from: 0.25, to: 0.7 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const mapText = this.add.text(W / 2, H * 0.60, mapNames[0], { fontFamily: 'Arial', fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);

        const updateMap = () => {
            mapPreview.setTexture(mapKeys[selectedMapIndex]);
            mapText.setText(mapNames[selectedMapIndex]);
        };

        leftArrow.on('pointerdown',  () => { selectedMapIndex = (selectedMapIndex - 1 + mapKeys.length) % mapKeys.length; updateMap(); });
        rightArrow.on('pointerdown', () => { selectedMapIndex = (selectedMapIndex + 1) % mapKeys.length; updateMap(); });

        this.playPage.add(startButton);
        this.playPage.add(diffLabel);
        diffButtons.forEach(b => this.playPage.add(b));
        this.playPage.add(leftArrow);
        this.playPage.add(rightArrow);
        this.playPage.add(mapPreview);
        this.playPage.add(mapBorder);
        this.playPage.add(mapText);

        // ============================================================
        // TOWERS PAGE
        // ============================================================
        const towersTitle = this.add.text(W / 2, H * 0.07, 'TOWERS', {
            fontFamily: 'Arial', fontSize: '52px', color: '#ff2a2a',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);
        this.towersPage.add(towersTitle);

        // All 8 tower data with real spritesheet frame names
        const towerInfos = [
            {
                frame: 'lightningtower',
                name:  'Lightning Tower',
                cost:  '$100',
                damage: '15',  range: '1000',  rate: '200ms',
                type:  'Single target',
                desc:  'Fires high-voltage bolts at the nearest enemy. Longest range in the game — ideal for covering wide stretches of the path.'
            },
            {
                frame: 'firetower',
                name:  'Fire Tower',
                cost:  '$150',
                damage: '20',  range: '250',  rate: '400ms',
                type:  'Splash damage',
                desc:  'Launches explosive fireballs that deal splash damage to enemies caught nearby. Great for tightly packed groups.'
            },
            {
                frame: 'icetower',
                name:  'Ice Tower',
                cost:  '$120',
                damage: '10',  range: '150',  rate: '800ms',
                type:  'Area burst',
                desc:  'Fires icy shards in all four directions. Short range but punishes enemies that cluster together on slow sections.'
            },
            {
                frame: 'rocktower',
                name:  'Rock Tower',
                cost:  '$200',
                damage: '40',  range: '220',  rate: '1500ms',
                type:  'Single target',
                desc:  'Hurls massive boulders with devastating impact. Slow fire rate, but the highest single-hit damage of any basic tower.'
            },
            {
                frame: 'darktower',
                name:  'Dark Tower',
                cost:  '$160',
                damage: '25',  range: '300',  rate: '600ms',
                type:  'Single target',
                desc:  'Channels void energy into focused shadow bolts. Balanced range and damage — reliable all-rounder for mid-path coverage.'
            },
            {
                frame: 'lighttower',
                name:  'Light Tower',
                cost:  '$170',
                damage: '18',  range: '400',  rate: '350ms',
                type:  'Single target',
                desc:  'Fires rapid beams of radiant light. Above-average range with a fast fire rate — strong against fast enemies.'
            },
            {
                frame: 'psychictower',
                name:  'Psychic Tower',
                cost:  '$175',
                damage: '22',  range: '280',  rate: '500ms',
                type:  'Single target',
                desc:  'Projects psionic force that bypasses conventional defenses. Solid middle-ground stats with excellent upgrade potential.'
            },
            {
                frame: 'windtower',
                name:  'Wind Tower',
                cost:  '$155',
                damage: '16',  range: '350',  rate: '450ms',
                type:  'Single target',
                desc:  'Compresses air into high-velocity blasts. Good range and a comfortable fire rate make it an easy early-game pick.'
            }
        ];

        // ── LEFT: 4×2 tower grid ──────────────────────────────────────
        const COLS      = 4;
        const CELL_W    = W * 0.54 / COLS;
        const CELL_H    = H * 0.34;
        const GRID_LEFT = W * 0.04;
        const GRID_TOP  = H * 0.17;
        const ICON_SIZE = 52;

        // Detail panel objects — cleared on each selection
        let towerDetailObjs = [];
        const clearTowerDetail = () => {
            towerDetailObjs.forEach(o => o.destroy());
            towerDetailObjs = [];
        };

        // ── RIGHT: detail panel background ───────────────────────────
        const detailPanelX = W * 0.62;
        const detailPanelW = W * 0.34;

        const detailBg = this.add.rectangle(
            detailPanelX + detailPanelW / 2, H * 0.57,
            detailPanelW, H * 0.72,
            0x0d0d1a, 0.95
        ).setOrigin(0.5);
        const detailBorder = this.add.rectangle(
            detailPanelX + detailPanelW / 2, H * 0.57,
            detailPanelW + 2, H * 0.72 + 2,
            0xff2a2a, 0.3
        ).setOrigin(0.5);
        this.tweens.add({
            targets: detailBorder,
            alpha: { from: 0.15, to: 0.5 },
            duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        const detailPrompt = this.add.text(
            detailPanelX + detailPanelW / 2, H * 0.55,
            'Select a tower\nto view details',
            { fontFamily: 'Arial', fontSize: '20px', color: '#555555', align: 'center' }
        ).setOrigin(0.5);

        this.towersPage.add(detailBg);
        this.towersPage.add(detailBorder);
        this.towersPage.add(detailPrompt);

        const buildTowerDetail = (info) => {
            clearTowerDetail();
            detailPrompt.setVisible(false);

            let dy = H * 0.20;
            const px = detailPanelX + 16;
            const pw = detailPanelW - 32;

            // Tower sprite (large)
            const frame     = this.textures.get('turret').get(info.frame);
            const maxSz     = 80;
            const sc        = Math.min(maxSz / frame.realWidth, maxSz / frame.realHeight);
            const bigIcon   = this.add.image(detailPanelX + detailPanelW / 2, dy, 'turret', info.frame).setScale(sc);
            dy += 54;

            // Name
            const nameT = this.add.text(detailPanelX + detailPanelW / 2, dy, info.name, {
                fontFamily: 'Arial', fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5, 0);
            dy += 30;

            // Cost badge
            const costT = this.add.text(detailPanelX + detailPanelW / 2, dy, 'Cost: ' + info.cost, {
                fontFamily: 'Arial', fontSize: '14px', color: '#f0c040'
            }).setOrigin(0.5, 0);
            dy += 24;

            // Type badge
            const typeT = this.add.text(detailPanelX + detailPanelW / 2, dy, info.type, {
                fontFamily: 'Arial', fontSize: '12px', color: '#4ecca3',
                backgroundColor: '#0a2a22', padding: { x: 8, y: 3 }
            }).setOrigin(0.5, 0);
            dy += 30;

            // Divider
            const div1 = this.add.graphics();
            div1.lineStyle(1, 0x333333, 0.8);
            div1.moveTo(px, dy); div1.lineTo(px + pw, dy); div1.strokePath();
            dy += 14;

            // Stats
            const statDefs = [
                { label: 'Damage',    val: info.damage,  color: '#ff6666' },
                { label: 'Range',     val: info.range,   color: '#66ccff' },
                { label: 'Fire Rate', val: info.rate,    color: '#66ff99' },
            ];

            const statObjs = [];
            statDefs.forEach(s => {
                const lbl = this.add.text(px, dy, s.label, {
                    fontFamily: 'Arial', fontSize: '13px', color: '#888888'
                });
                const val = this.add.text(px + pw, dy, s.val, {
                    fontFamily: 'Arial', fontSize: '13px', color: s.color, fontStyle: 'bold'
                }).setOrigin(1, 0);
                statObjs.push(lbl, val);
                dy += 22;
            });

            dy += 8;

            // Divider
            const div2 = this.add.graphics();
            div2.lineStyle(1, 0x333333, 0.8);
            div2.moveTo(px, dy); div2.lineTo(px + pw, dy); div2.strokePath();
            dy += 14;

            // Description
            const descT = this.add.text(px, dy, info.desc, {
                fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa',
                wordWrap: { width: pw }, lineSpacing: 4
            });

            towerDetailObjs.push(bigIcon, nameT, costT, typeT, div1, div2, descT, ...statObjs);
            towerDetailObjs.forEach(o => this.towersPage.add(o));
        };

        // ── Build 4×2 grid ────────────────────────────────────────────
        let activeTowerCard = null;

        towerInfos.forEach((info, i) => {
            const col  = i % COLS;
            const row  = Math.floor(i / COLS);
            const cx   = GRID_LEFT + col * CELL_W + CELL_W / 2;
            const cy   = GRID_TOP  + row * CELL_H;

            // Card background
            const card = this.add.rectangle(cx, cy + CELL_H / 2, CELL_W - 8, CELL_H - 8, 0x0d0d1a)
                .setStrokeStyle(1, 0x2a2a4e)
                .setInteractive({ useHandCursor: true });

            // Tower icon from spritesheet
            const frame  = this.textures.get('turret').get(info.frame);
            const scale  = Math.min(ICON_SIZE / frame.realWidth, ICON_SIZE / frame.realHeight);
            const icon   = this.add.image(cx, cy + CELL_H * 0.28, 'turret', info.frame).setScale(scale);

            // Tower name
            const nameT  = this.add.text(cx, cy + CELL_H * 0.62, info.name, {
                fontFamily: 'Arial', fontSize: '11px', color: '#cccccc', align: 'center',
                wordWrap: { width: CELL_W - 12 }
            }).setOrigin(0.5, 0);

            // Cost
            const costT  = this.add.text(cx, cy + CELL_H * 0.80, info.cost, {
                fontFamily: 'Arial', fontSize: '12px', color: '#f0c040', fontStyle: 'bold'
            }).setOrigin(0.5, 0);

            const selectCard = () => {
                // Reset previous card
                if (activeTowerCard) {
                    activeTowerCard.card.setFillStyle(0x0d0d1a);
                    activeTowerCard.card.setStrokeStyle(1, 0x2a2a4e);
                }
                activeTowerCard = { card, icon };
                card.setFillStyle(0x1a2a1a);
                card.setStrokeStyle(2, 0x4ecca3);
                buildTowerDetail(info);
            };

            card.on('pointerover', () => {
                if (activeTowerCard?.card !== card) card.setFillStyle(0x151525);
                icon.setTint(0xaaddff);
            });
            card.on('pointerout', () => {
                if (activeTowerCard?.card !== card) card.setFillStyle(0x0d0d1a);
                icon.clearTint();
            });
            card.on('pointerdown', selectCard);
            icon.setInteractive({ useHandCursor: true }).on('pointerdown', selectCard);

            this.towersPage.add(card);
            this.towersPage.add(icon);
            this.towersPage.add(nameT);
            this.towersPage.add(costT);
        });

        this.towersPage.add(towersTitle);

        // ============================================================
        // UPGRADES PAGE
        // ============================================================
        const upgradesTitle = this.add.text(W / 2, H * 0.08, 'UPGRADES', {
            fontFamily: 'Arial', fontSize: '52px', color: '#ff2a2a',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);
        this.upgradesPage.add(upgradesTitle);

        const upgradeData = {
            lightningtower: {
                label: 'Lightning Tower', cost: 100,
                upgrades: [
                    { label: 'Chain Strike',       path: 'damage', tier: 'Lv 1 / $75',  desc: 'Adds arc damage that chains to nearby enemies.', stats: [{ n: 'Damage', b: 15, a: 23, u: '+8' }, { n: 'Range', b: 1000, a: 1000 }, { n: 'Fire rate', b: 200, a: 200 }] },
                    { label: 'Chain Strike II',    path: 'damage', tier: 'Lv 2 / $200', desc: 'Further boosts chain damage for devastating multi-hit combos.', stats: [{ n: 'Damage', b: 23, a: 31, u: '+8' }, { n: 'Range', b: 1000, a: 1000 }, { n: 'Fire rate', b: 200, a: 200 }] },
                    { label: 'Overclock',          path: 'speed',  tier: 'Lv 1 / $100', desc: 'Overclocks internal timing circuits. Fires significantly faster.', stats: [{ n: 'Damage', b: 15, a: 15 }, { n: 'Range', b: 1000, a: 1000 }, { n: 'Fire rate', b: 200, a: 140, u: '-60ms' }] },
                    { label: 'Overclock II',       path: 'speed',  tier: 'Lv 2 / $250', desc: 'Pushes the tower to its operational limit for near-instant firing.', stats: [{ n: 'Damage', b: 15, a: 15 }, { n: 'Range', b: 1000, a: 1000 }, { n: 'Fire rate', b: 140, a: 80, u: '-60ms' }] },
                    { label: 'Broadcast',          path: 'range',  tier: 'Lv 1 / $60',  desc: 'Extends signal radius to target enemies further down the path.', stats: [{ n: 'Damage', b: 15, a: 15 }, { n: 'Range', b: 1000, a: 1200, u: '+200' }, { n: 'Fire rate', b: 200, a: 200 }] },
                    { label: 'Broadcast II',       path: 'range',  tier: 'Lv 2 / $175', desc: 'Full-field broadcast — almost no enemy escapes detection range.', stats: [{ n: 'Damage', b: 15, a: 15 }, { n: 'Range', b: 1200, a: 1400, u: '+200' }, { n: 'Fire rate', b: 200, a: 200 }] },
                    { label: 'Storm God (Master)', path: 'master', tier: '$500',         desc: 'Unlocks full storm form. Massive across-the-board amplification.', stats: [{ n: 'Damage', b: 31, a: 77, u: '×2.5' }, { n: 'Range', b: 1400, a: 1700, u: '+300' }, { n: 'Fire rate', b: 80, a: 32, u: '×0.4' }] },
                ]
            },
            firetower: {
                label: 'Fire Tower', cost: 150,
                upgrades: [
                    { label: 'Inferno',           path: 'damage', tier: 'Lv 1 / $80',  desc: 'Superheats projectiles for increased burn damage on impact.', stats: [{ n: 'Damage', b: 20, a: 32, u: '+12' }, { n: 'Range', b: 250, a: 250 }, { n: 'Fire rate', b: 400, a: 400 }] },
                    { label: 'Inferno II',        path: 'damage', tier: 'Lv 2 / $220', desc: 'Scorching core melts through armored enemies.', stats: [{ n: 'Damage', b: 32, a: 44, u: '+12' }, { n: 'Range', b: 250, a: 250 }, { n: 'Fire rate', b: 400, a: 400 }] },
                    { label: 'Rapid Burn',        path: 'speed',  tier: 'Lv 1 / $90',  desc: 'Reduces reload time between fire blasts.', stats: [{ n: 'Damage', b: 20, a: 20 }, { n: 'Range', b: 250, a: 250 }, { n: 'Fire rate', b: 400, a: 300, u: '-100ms' }] },
                    { label: 'Rapid Burn II',     path: 'speed',  tier: 'Lv 2 / $200', desc: 'Continuous fire stream with minimal cooldown.', stats: [{ n: 'Damage', b: 20, a: 20 }, { n: 'Range', b: 250, a: 250 }, { n: 'Fire rate', b: 300, a: 200, u: '-100ms' }] },
                    { label: 'Spread',            path: 'range',  tier: 'Lv 1 / $70',  desc: 'Wider flame spread catches enemies across a larger area.', stats: [{ n: 'Damage', b: 20, a: 20 }, { n: 'Range', b: 250, a: 310, u: '+60' }, { n: 'Fire rate', b: 400, a: 400 }] },
                    { label: 'Spread II',         path: 'range',  tier: 'Lv 2 / $180', desc: 'Extended reach ignites enemies before they get close.', stats: [{ n: 'Damage', b: 20, a: 20 }, { n: 'Range', b: 310, a: 370, u: '+60' }, { n: 'Fire rate', b: 400, a: 400 }] },
                    { label: 'Infernal (Master)', path: 'master', tier: '$550',         desc: 'Unleashes hellfire. Splash radius triples, damage multiplied.', stats: [{ n: 'Damage', b: 44, a: 132, u: '×3.0' }, { n: 'Range', b: 370, a: 470, u: '+100' }, { n: 'Fire rate', b: 200, a: 120, u: '×0.6' }] },
                ]
            },
            icetower: {
                label: 'Ice Tower', cost: 120,
                upgrades: [
                    { label: 'Frostbite',              path: 'damage', tier: 'Lv 1 / $60',  desc: 'Deep-freeze coating increases shard damage.', stats: [{ n: 'Damage', b: 10, a: 16, u: '+6' }, { n: 'Range', b: 150, a: 150 }, { n: 'Fire rate', b: 800, a: 800 }] },
                    { label: 'Frostbite II',           path: 'damage', tier: 'Lv 2 / $160', desc: 'Crystalline shards shatter on impact for extra damage.', stats: [{ n: 'Damage', b: 16, a: 22, u: '+6' }, { n: 'Range', b: 150, a: 150 }, { n: 'Fire rate', b: 800, a: 800 }] },
                    { label: 'Blizzard',               path: 'speed',  tier: 'Lv 1 / $80',  desc: 'Rapid frost cycles fire shards faster.', stats: [{ n: 'Damage', b: 10, a: 10 }, { n: 'Range', b: 150, a: 150 }, { n: 'Fire rate', b: 800, a: 600, u: '-200ms' }] },
                    { label: 'Blizzard II',            path: 'speed',  tier: 'Lv 2 / $200', desc: 'Full blizzard mode — relentless shard barrage.', stats: [{ n: 'Damage', b: 10, a: 10 }, { n: 'Range', b: 150, a: 150 }, { n: 'Fire rate', b: 600, a: 400, u: '-200ms' }] },
                    { label: 'Arctic Reach',           path: 'range',  tier: 'Lv 1 / $70',  desc: 'Cold front extends the tower\'s effective range.', stats: [{ n: 'Damage', b: 10, a: 10 }, { n: 'Range', b: 150, a: 200, u: '+50' }, { n: 'Fire rate', b: 800, a: 800 }] },
                    { label: 'Arctic Reach II',        path: 'range',  tier: 'Lv 2 / $175', desc: 'Sub-zero field slows and damages at long range.', stats: [{ n: 'Damage', b: 10, a: 10 }, { n: 'Range', b: 200, a: 250, u: '+50' }, { n: 'Fire rate', b: 800, a: 800 }] },
                    { label: 'Absolute Zero (Master)', path: 'master', tier: '$450',         desc: 'Freezes all enemies on screen briefly. Massive damage boost.', stats: [{ n: 'Damage', b: 22, a: 44, u: '×2.0' }, { n: 'Range', b: 250, a: 400, u: '+150' }, { n: 'Fire rate', b: 400, a: 200, u: '×0.5' }] },
                ]
            },
            rocktower: {
                label: 'Rock Tower', cost: 200,
                upgrades: [
                    { label: 'Boulder',         path: 'damage', tier: 'Lv 1 / $100', desc: 'Larger rocks with greater mass hit harder.', stats: [{ n: 'Damage', b: 40, a: 60, u: '+20' }, { n: 'Range', b: 220, a: 220 }, { n: 'Fire rate', b: 1500, a: 1500 }] },
                    { label: 'Boulder II',      path: 'damage', tier: 'Lv 2 / $300', desc: 'Titan-class boulders obliterate anything in their path.', stats: [{ n: 'Damage', b: 60, a: 80, u: '+20' }, { n: 'Range', b: 220, a: 220 }, { n: 'Fire rate', b: 1500, a: 1500 }] },
                    { label: 'Rapid Fire',      path: 'speed',  tier: 'Lv 1 / $120', desc: 'Mechanical loader cuts reload time significantly.', stats: [{ n: 'Damage', b: 40, a: 40 }, { n: 'Range', b: 220, a: 220 }, { n: 'Fire rate', b: 1500, a: 1100, u: '-400ms' }] },
                    { label: 'Rapid Fire II',   path: 'speed',  tier: 'Lv 2 / $280', desc: 'Double-barrel launch for sustained rock coverage.', stats: [{ n: 'Damage', b: 40, a: 40 }, { n: 'Range', b: 220, a: 220 }, { n: 'Fire rate', b: 1100, a: 700, u: '-400ms' }] },
                    { label: 'Trebuchet',       path: 'range',  tier: 'Lv 1 / $80',  desc: 'Extended arm arc launches rocks much further.', stats: [{ n: 'Damage', b: 40, a: 40 }, { n: 'Range', b: 220, a: 300, u: '+80' }, { n: 'Fire rate', b: 1500, a: 1500 }] },
                    { label: 'Trebuchet II',    path: 'range',  tier: 'Lv 2 / $200', desc: 'Siege-class range — rocks reach almost anywhere on the map.', stats: [{ n: 'Damage', b: 40, a: 40 }, { n: 'Range', b: 300, a: 380, u: '+80' }, { n: 'Fire rate', b: 1500, a: 1500 }] },
                    { label: 'Titan (Master)',  path: 'master', tier: '$600',         desc: 'Awakens the stone giant. Damage per hit becomes devastating.', stats: [{ n: 'Damage', b: 80, a: 280, u: '×3.5' }, { n: 'Range', b: 380, a: 580, u: '+200' }, { n: 'Fire rate', b: 700, a: 490, u: '×0.7' }] },
                ]
            },
            darktower: {
                label: 'Dark Tower', cost: 160,
                upgrades: [
                    { label: 'Shadow Bolt',        path: 'damage', tier: 'Lv 1 / $85',  desc: 'Bolts charged with void energy deal increased damage.', stats: [{ n: 'Damage', b: 25, a: 35, u: '+10' }, { n: 'Range', b: 300, a: 300 }, { n: 'Fire rate', b: 600, a: 600 }] },
                    { label: 'Shadow Bolt II',     path: 'damage', tier: 'Lv 2 / $230', desc: 'Pure darkness shreds through enemy defenses.', stats: [{ n: 'Damage', b: 35, a: 45, u: '+10' }, { n: 'Range', b: 300, a: 300 }, { n: 'Fire rate', b: 600, a: 600 }] },
                    { label: 'Dark Pulse',         path: 'speed',  tier: 'Lv 1 / $95',  desc: 'Void pulses discharge faster between shots.', stats: [{ n: 'Damage', b: 25, a: 25 }, { n: 'Range', b: 300, a: 300 }, { n: 'Fire rate', b: 600, a: 520, u: '-80ms' }] },
                    { label: 'Dark Pulse II',      path: 'speed',  tier: 'Lv 2 / $240', desc: 'Rapid shadow discharge overwhelms enemy health pools.', stats: [{ n: 'Damage', b: 25, a: 25 }, { n: 'Range', b: 300, a: 300 }, { n: 'Fire rate', b: 520, a: 440, u: '-80ms' }] },
                    { label: 'Void Reach',         path: 'range',  tier: 'Lv 1 / $75',  desc: 'Tendrils of darkness extend the targeting field.', stats: [{ n: 'Damage', b: 25, a: 25 }, { n: 'Range', b: 300, a: 400, u: '+100' }, { n: 'Fire rate', b: 600, a: 600 }] },
                    { label: 'Void Reach II',      path: 'range',  tier: 'Lv 2 / $190', desc: 'Void field covers a massive area around the tower.', stats: [{ n: 'Damage', b: 25, a: 25 }, { n: 'Range', b: 400, a: 500, u: '+100' }, { n: 'Fire rate', b: 600, a: 600 }] },
                    { label: 'Void Lord (Master)', path: 'master', tier: '$500',         desc: 'Ascends to Void Lord form. Projectiles pierce through all enemies.', stats: [{ n: 'Damage', b: 45, a: 126, u: '×2.8' }, { n: 'Range', b: 500, a: 750, u: '+250' }, { n: 'Fire rate', b: 440, a: 220, u: '×0.5' }] },
                ]
            },
            lighttower: {
                label: 'Light Tower', cost: 170,
                upgrades: [
                    { label: 'Radiant Beam',     path: 'damage', tier: 'Lv 1 / $90',  desc: 'Focused light beams burn through enemy armor.', stats: [{ n: 'Damage', b: 18, a: 27, u: '+9' }, { n: 'Range', b: 400, a: 400 }, { n: 'Fire rate', b: 350, a: 350 }] },
                    { label: 'Radiant Beam II',  path: 'damage', tier: 'Lv 2 / $250', desc: 'Concentrated solar energy vaporizes weaker enemies instantly.', stats: [{ n: 'Damage', b: 27, a: 36, u: '+9' }, { n: 'Range', b: 400, a: 400 }, { n: 'Fire rate', b: 350, a: 350 }] },
                    { label: 'Burst',            path: 'speed',  tier: 'Lv 1 / $100', desc: 'Capacitors charge faster for a quicker firing cycle.', stats: [{ n: 'Damage', b: 18, a: 18 }, { n: 'Range', b: 400, a: 400 }, { n: 'Fire rate', b: 350, a: 280, u: '-70ms' }] },
                    { label: 'Burst II',         path: 'speed',  tier: 'Lv 2 / $260', desc: 'Light pulses in rapid succession, barely pausing between shots.', stats: [{ n: 'Damage', b: 18, a: 18 }, { n: 'Range', b: 400, a: 400 }, { n: 'Fire rate', b: 280, a: 210, u: '-70ms' }] },
                    { label: 'Brilliance',       path: 'range',  tier: 'Lv 1 / $80',  desc: 'Beam cohesion improvements let light travel further.', stats: [{ n: 'Damage', b: 18, a: 18 }, { n: 'Range', b: 400, a: 520, u: '+120' }, { n: 'Fire rate', b: 350, a: 350 }] },
                    { label: 'Brilliance II',    path: 'range',  tier: 'Lv 2 / $210', desc: 'Full-spectrum reach — covers nearly the entire lane.', stats: [{ n: 'Damage', b: 18, a: 18 }, { n: 'Range', b: 520, a: 640, u: '+120' }, { n: 'Fire rate', b: 350, a: 350 }] },
                    { label: 'Seraph (Master)',  path: 'master', tier: '$520',         desc: 'Divine light form. Blinds and damages all enemies in range simultaneously.', stats: [{ n: 'Damage', b: 36, a: 90, u: '×2.5' }, { n: 'Range', b: 640, a: 940, u: '+300' }, { n: 'Fire rate', b: 210, a: 94, u: '×0.45' }] },
                ]
            },
            psychictower: {
                label: 'Psychic Tower', cost: 175,
                upgrades: [
                    { label: 'Mind Crush',        path: 'damage', tier: 'Lv 1 / $88',  desc: 'Psychic force amplified to crush enemy vitals.', stats: [{ n: 'Damage', b: 22, a: 33, u: '+11' }, { n: 'Range', b: 280, a: 280 }, { n: 'Fire rate', b: 500, a: 500 }] },
                    { label: 'Mind Crush II',     path: 'damage', tier: 'Lv 2 / $240', desc: 'Mental devastation — enemies take full psychic impact.', stats: [{ n: 'Damage', b: 33, a: 44, u: '+11' }, { n: 'Range', b: 280, a: 280 }, { n: 'Fire rate', b: 500, a: 500 }] },
                    { label: 'Psyche Wave',       path: 'speed',  tier: 'Lv 1 / $98',  desc: 'Mental cycles accelerate for faster psi-pulse discharge.', stats: [{ n: 'Damage', b: 22, a: 22 }, { n: 'Range', b: 280, a: 280 }, { n: 'Fire rate', b: 500, a: 410, u: '-90ms' }] },
                    { label: 'Psyche Wave II',    path: 'speed',  tier: 'Lv 2 / $250', desc: 'Psionic feedback loop fires at near-continuous rate.', stats: [{ n: 'Damage', b: 22, a: 22 }, { n: 'Range', b: 280, a: 280 }, { n: 'Fire rate', b: 410, a: 320, u: '-90ms' }] },
                    { label: 'Mental Link',       path: 'range',  tier: 'Lv 1 / $82',  desc: 'Psychic field extends to detect enemies further away.', stats: [{ n: 'Damage', b: 22, a: 22 }, { n: 'Range', b: 280, a: 390, u: '+110' }, { n: 'Fire rate', b: 500, a: 500 }] },
                    { label: 'Mental Link II',    path: 'range',  tier: 'Lv 2 / $215', desc: 'Full telepathic reach across the battlefield.', stats: [{ n: 'Damage', b: 22, a: 22 }, { n: 'Range', b: 390, a: 500, u: '+110' }, { n: 'Fire rate', b: 500, a: 500 }] },
                    { label: 'Overmind (Master)', path: 'master', tier: '$480',         desc: 'Becomes the Overmind. Simultaneously targets and slows multiple enemies.', stats: [{ n: 'Damage', b: 44, a: 114, u: '×2.6' }, { n: 'Range', b: 500, a: 720, u: '+220' }, { n: 'Fire rate', b: 320, a: 160, u: '×0.5' }] },
                ]
            },
            windtower: {
                label: 'Wind Tower', cost: 155,
                upgrades: [
                    { label: 'Gust Strike',         path: 'damage', tier: 'Lv 1 / $82',  desc: 'Compressed air blasts deal higher impact damage.', stats: [{ n: 'Damage', b: 16, a: 24, u: '+8' }, { n: 'Range', b: 350, a: 350 }, { n: 'Fire rate', b: 450, a: 450 }] },
                    { label: 'Gust Strike II',      path: 'damage', tier: 'Lv 2 / $220', desc: 'Razor-wind shreds through enemy formations.', stats: [{ n: 'Damage', b: 24, a: 32, u: '+8' }, { n: 'Range', b: 350, a: 350 }, { n: 'Fire rate', b: 450, a: 450 }] },
                    { label: 'Tempest',             path: 'speed',  tier: 'Lv 1 / $92',  desc: 'Storm cycling increases burst fire frequency.', stats: [{ n: 'Damage', b: 16, a: 16 }, { n: 'Range', b: 350, a: 350 }, { n: 'Fire rate', b: 450, a: 375, u: '-75ms' }] },
                    { label: 'Tempest II',          path: 'speed',  tier: 'Lv 2 / $245', desc: 'Full tempest mode — gales fire in rapid succession.', stats: [{ n: 'Damage', b: 16, a: 16 }, { n: 'Range', b: 350, a: 350 }, { n: 'Fire rate', b: 375, a: 300, u: '-75ms' }] },
                    { label: 'Whirlwind',           path: 'range',  tier: 'Lv 1 / $78',  desc: 'Vortex extension reaches enemies across wider lanes.', stats: [{ n: 'Damage', b: 16, a: 16 }, { n: 'Range', b: 350, a: 480, u: '+130' }, { n: 'Fire rate', b: 450, a: 450 }] },
                    { label: 'Whirlwind II',        path: 'range',  tier: 'Lv 2 / $205', desc: 'Atmospheric reach — wind detects targets at extreme range.', stats: [{ n: 'Damage', b: 16, a: 16 }, { n: 'Range', b: 480, a: 610, u: '+130' }, { n: 'Fire rate', b: 450, a: 450 }] },
                    { label: 'Tempest God (Master)',path: 'master', tier: '$460',         desc: 'Storms across the entire map. Knockback added to every shot.', stats: [{ n: 'Damage', b: 32, a: 70, u: '×2.2' }, { n: 'Range', b: 610, a: 890, u: '+280' }, { n: 'Fire rate', b: 300, a: 120, u: '×0.4' }] },
                ]
            }
        };

        const UW       = W;
        const UH       = H;
        const listX    = UW * 0.14;
        const upgradeX = UW * 0.38;
        const detailX  = UW * 0.62;
        const rowH     = 44;
        const startY   = UH * 0.22;

        const makeHeader = (txt, x) => {
            const t = this.add.text(x, UH * 0.16, txt, {
                fontFamily: 'Arial', fontSize: '16px', color: '#888888', fontStyle: 'italic'
            }).setOrigin(0.5, 0);
            this.upgradesPage.add(t);
        };
        makeHeader('Tower', listX);
        makeHeader('Upgrades', upgradeX);
        makeHeader('Details', detailX);

        [[UW * 0.26, UH * 0.14, UW * 0.26, UH * 0.92],
         [UW * 0.50, UH * 0.14, UW * 0.50, UH * 0.92]].forEach(([x1, y1, x2, y2]) => {
            const g = this.add.graphics();
            g.lineStyle(1, 0x333333, 0.6);
            g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath();
            this.upgradesPage.add(g);
        });

        let activeTowerKey = null;
        let activeUpgBtn   = null;
        let detailObjects  = [];
        let upgradeBtns    = [];

        const clearDetail = () => { detailObjects.forEach(o => o.destroy()); detailObjects = []; };
        const clearUpgrades = () => { upgradeBtns.forEach(o => o.destroy()); upgradeBtns = []; activeUpgBtn = null; clearDetail(); };

        Object.keys(upgradeData).forEach((key, i) => {
            const data = upgradeData[key];
            const y    = startY + i * rowH;

            const bg = this.add.rectangle(listX, y + rowH / 2, UW * 0.22, rowH - 4, 0x1a1a2e)
                .setOrigin(0.5).setInteractive();
            const label   = this.add.text(listX - UW * 0.09, y + 8,  data.label,             { fontFamily: 'Arial', fontSize: '15px', color: '#dddddd' });
            const costTxt = this.add.text(listX - UW * 0.09, y + 26, `Base cost: $${data.cost}`, { fontFamily: 'Arial', fontSize: '11px', color: '#888888' });

            const selectTower = () => {
                activeTowerKey = key;
                label.setColor('#ffffff');
                clearUpgrades();
                buildUpgradeList(key);
            };

            bg.on('pointerover', () => { if (activeTowerKey !== key) bg.setFillStyle(0x2a2a3e); });
            bg.on('pointerout',  () => { if (activeTowerKey !== key) bg.setFillStyle(0x1a1a2e); });
            bg.on('pointerdown', selectTower);
            label.setInteractive().on('pointerdown', selectTower);

            this.upgradesPage.add(bg);
            this.upgradesPage.add(label);
            this.upgradesPage.add(costTxt);
        });

        const pathColors = { damage: '#ff6666', speed: '#66ccff', range: '#66ff99', master: '#ffcc00' };
        const pathLabels = { damage: 'DAMAGE', speed: 'FIRE RATE', range: 'RANGE', master: 'MASTER' };

        const buildUpgradeList = (key) => {
            const data    = upgradeData[key];
            let   curPath = null;
            let   idx     = 0;

            data.upgrades.forEach((upg) => {
                if (upg.path !== curPath) {
                    curPath = upg.path;
                    const hdr = this.add.text(upgradeX - UW * 0.11, startY + idx * 30, pathLabels[curPath], {
                        fontFamily: 'Arial', fontSize: '10px', color: pathColors[curPath], fontStyle: 'bold'
                    });
                    this.upgradesPage.add(hdr);
                    upgradeBtns.push(hdr);
                    idx++;
                }

                const btnY = startY + idx * 30;
                const bg   = this.add.rectangle(upgradeX, btnY + 12, UW * 0.22, 26, 0x1a1a2e).setOrigin(0.5).setInteractive();
                const lbl  = this.add.text(upgradeX - UW * 0.10, btnY + 2,  upg.label, { fontFamily: 'Arial', fontSize: '13px', color: '#cccccc' });
                const tier = this.add.text(upgradeX - UW * 0.10, btnY + 16, upg.tier,  { fontFamily: 'Arial', fontSize: '10px', color: '#666666' });

                const selectUpgrade = () => {
                    if (activeUpgBtn) { activeUpgBtn.bg.setFillStyle(0x1a1a2e); activeUpgBtn.lbl.setColor('#cccccc'); }
                    activeUpgBtn = { bg, lbl };
                    bg.setFillStyle(0x2a3a2a);
                    lbl.setColor('#ffffff');
                    buildDetail(upg);
                };

                bg.on('pointerover',  () => { if (activeUpgBtn?.bg !== bg) bg.setFillStyle(0x222222); });
                bg.on('pointerout',   () => { if (activeUpgBtn?.bg !== bg) bg.setFillStyle(0x1a1a2e); });
                bg.on('pointerdown',  selectUpgrade);
                lbl.setInteractive().on('pointerdown', selectUpgrade);

                this.upgradesPage.add(bg);
                this.upgradesPage.add(lbl);
                this.upgradesPage.add(tier);
                upgradeBtns.push(bg, lbl, tier);
                idx++;
            });
        };

        const buildDetail = (upg) => {
            clearDetail();
            let dy = startY;

            const title   = this.add.text(detailX - UW * 0.12, dy, upg.label, { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', fontStyle: 'bold' });
            dy += 28;
            const tierTxt = this.add.text(detailX - UW * 0.12, dy, upg.tier,  { fontFamily: 'Arial', fontSize: '12px', color: pathColors[upg.path] });
            dy += 22;
            const descTxt = this.add.text(detailX - UW * 0.12, dy, upg.desc,  { fontFamily: 'Arial', fontSize: '13px', color: '#aaaaaa', wordWrap: { width: UW * 0.24 } });
            dy += descTxt.height + 16;
            const statsHdr = this.add.text(detailX - UW * 0.12, dy, 'STAT CHANGES', { fontFamily: 'Arial', fontSize: '10px', color: '#555555', fontStyle: 'bold' });
            dy += 18;

            upg.stats.forEach(s => {
                const changed = s.u !== undefined;
                const base    = this.add.text(detailX - UW * 0.12, dy,
                    s.n + ':  ' + s.b + (s.a !== undefined && s.a !== s.b ? '  →  ' + s.a : ''), {
                        fontFamily: 'Arial', fontSize: '13px', color: changed ? '#ffffff' : '#555555'
                    });
                if (changed) {
                    const cc    = s.u.startsWith('+') ? '#66ff99' : '#66ccff';
                    const badge = this.add.text(detailX + UW * 0.06, dy, s.u, { fontFamily: 'Arial', fontSize: '13px', color: cc, fontStyle: 'bold' });
                    detailObjects.push(badge);
                }
                detailObjects.push(base);
                dy += 22;
            });

            detailObjects.push(title, tierTxt, descTxt, statsHdr);
            detailObjects.forEach(o => this.upgradesPage.add(o));
        };

        // ============================================================
        // SETTINGS PAGE
        // ============================================================
        const settingsTitle = this.add.text(W / 2, H * 0.16, 'SETTINGS', {
            fontFamily: 'Arial', fontSize: '64px', color: '#ff2a2a',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        const settingsHint = this.add.text(W / 2, H * 0.24, 'Tune your experience', {
            fontFamily: 'Arial', fontSize: '26px', color: '#dddddd'
        }).setOrigin(0.5);

        const createSlider = (label, y, initialValue) => {
            const labelText = this.add.text(W * 0.30, y, label, { fontFamily: 'Arial', fontSize: '28px', color: '#ffffff' }).setOrigin(0, 0.5);
            const bar       = this.add.rectangle(W * 0.60, y, W * 0.30, 8, 0x444444, 1);
            const barGlow   = this.add.rectangle(W * 0.60, y, W * 0.30 + 6, 14, 0xff0000, 0.35);
            this.tweens.add({ targets: barGlow, alpha: { from: 0.18, to: 0.6 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            const knob = this.add.circle(W * 0.45 + initialValue * W * 0.30, y, 14, 0xffffff, 1).setInteractive({ useHandCursor: true });
            knob.on('pointerover', () => this.tweens.add({ targets: knob, scale: 1.2, duration: 120, ease: 'Quad.easeOut' }));
            knob.on('pointerout',  () => this.tweens.add({ targets: knob, scale: 1,   duration: 120, ease: 'Quad.easeOut' }));
            return { labelText, bar, barGlow, knob };
        };

        const masterSlider = createSlider('Master Volume',      H * 0.40, 0.8);
        const musicSlider  = createSlider('Music Volume',       H * 0.50, 0.6);
        const sfxSlider    = createSlider('SFX Volume',         H * 0.60, 0.7);
        const sensSlider   = createSlider('Mouse Sensitivity',  H * 0.70, 0.5);

        const createToggle = (label, y, initialOn) => {
            const labelText = this.add.text(W * 0.30, y, label, { fontFamily: 'Arial', fontSize: '28px', color: '#ffffff' }).setOrigin(0, 0.5);
            const box  = this.add.rectangle(W * 0.78, y, 40, 24, 0x222222, 1).setInteractive({ useHandCursor: true });
            const knob = this.add.circle(W * 0.78 + (initialOn ? 8 : -8), y, 10, initialOn ? 0xff0000 : 0x888888, 1).setInteractive({ useHandCursor: true });
            const toggle = () => {
                const on = knob.fillColor === 0xff0000;
                this.tweens.add({ targets: knob, x: W * 0.78 + (on ? -8 : 8), duration: 140, ease: 'Quad.easeOut' });
                knob.setFillStyle(on ? 0x888888 : 0xff0000, 1);
            };
            box.on('pointerdown', toggle);
            knob.on('pointerdown', toggle);
            return { labelText, box, knob };
        };

        const gfxToggle        = createToggle('Graphics: High', H * 0.80, true);
        const fullscreenToggle = createToggle('Fullscreen',      H * 0.88, false);

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