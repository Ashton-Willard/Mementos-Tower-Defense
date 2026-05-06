import Turret, { UPGRADE_PATHS } from '../objects/Turret.js';

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
        this.load.atlas('turret', 'src/assets/spritesheet2.png', 'src/assets/spritesheet.json');
        this.load.atlas('turret_up', 'src/assets/spritesheetup.png', 'src/assets/spritesheetup.json');
    }

    create() {
        const bg = this.add.image(0, 0, 'titleBG')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.45
        );

        const enemy = this.add.image(
            this.scale.width / 2,
            this.scale.height * 0.32,
            'enemy_showcase'
        )
            .setOrigin(0.5)
            .setScale(2.8)
            .setAlpha(1);

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
                this.tweens.add({ targets: back, scale: 1.35, duration: 120, ease: 'Quad.easeOut' });
            });

            back.on('pointerout', () => {
                this.tweens.add({ targets: back, scale: 1.2, duration: 120, ease: 'Quad.easeOut' });
            });

            back.on('pointerdown', () => {
                this.hideAllPages();
                this.showMenu();
            });

            page.add(back);

            const ambientLeft = this.add.rectangle(
                this.scale.width * 0.15,
                this.scale.height * 0.2,
                12,
                120,
                0xff0000,
                0.4
            );
            const ambientRight = this.add.rectangle(
                this.scale.width * 0.85,
                this.scale.height * 0.8,
                12,
                120,
                0xff0000,
                0.4
            );

            this.tweens.add({
                targets: [ambientLeft, ambientRight],
                alpha: { from: 0.2, to: 0.7 },
                duration: 1400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            page.add(ambientLeft);
            page.add(ambientRight);

            return page;
        };

        this.playPage = createPage();
        this.towersPage = createPage();
        this.upgradesPage = createPage();
        this.settingsPage = createPage();

        const hideAllPages = () => {
            this.playPage.setVisible(false);
            this.towersPage.setVisible(false);
            this.upgradesPage.setVisible(false);
            this.settingsPage.setVisible(false);
        };

        this.hideAllPages = hideAllPages;

        const showPage = (page) => {
            hideAllPages();
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
                this.tweens.add({ targets: text, scale: 1.08, duration: 120, ease: 'Quad.easeOut' });
            });

            text.on('pointerout', () => {
                this.tweens.add({ targets: text, scale: 1, duration: 120, ease: 'Quad.easeOut' });
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

        this.hideMenu = () => {
            this.menuButtons.forEach(b => b.setVisible(false));
        };

        this.showMenu = () => {
            this.menuButtons.forEach(b => b.setVisible(true));
        };

        const playTitle = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.18,
            'PLAY',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ff2a2a',
                stroke: '#000000',
                strokeThickness: 8
            }
        ).setOrigin(0.5);

        const startButton = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.38,
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
            this.tweens.add({
                targets: startButton,
                scale: 1.08,
                duration: 140,
                ease: 'Quad.easeOut'
            });
        });

        startButton.on('pointerout', () => {
            this.tweens.add({
                targets: startButton,
                scale: 1,
                duration: 140,
                ease: 'Quad.easeOut'
            });
        });

        startButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });

        const diffLabel = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.50,
            'DIFFICULTY',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        const difficulties = ['EASY', 'NORMAL', 'HARD'];
        let selectedDiff = 'NORMAL';

        const diffButtons = difficulties.map((d, i) => {
            const t = this.add.text(
                this.scale.width / 2 + (i - 1) * 160,
                this.scale.height * 0.56,
                d,
                {
                    fontFamily: 'Arial',
                    fontSize: '30px',
                    color: d === selectedDiff ? '#ff2a2a' : '#bbbbbb'
                }
            ).setOrigin(0.5);

            t.setInteractive({ useHandCursor: true });

            t.on('pointerover', () => {
                this.tweens.add({ targets: t, scale: 1.08, duration: 120, ease: 'Quad.easeOut' });
            });

            t.on('pointerout', () => {
                this.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Quad.easeOut' });
            });

            t.on('pointerdown', () => {
                selectedDiff = d;
                diffButtons.forEach(btn => btn.setColor('#bbbbbb'));
                t.setColor('#ff2a2a');
            });

            return t;
        });

        const mapPreview = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height * 0.72,
            this.scale.width * 0.4,
            this.scale.height * 0.22,
            0x111111,
            1
        );
        const mapBorder = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height * 0.72,
            this.scale.width * 0.4 + 6,
            this.scale.height * 0.22 + 6,
            0xff0000,
            0.4
        );

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
            this.scale.height * 0.72,
            'CORRIDOR OF SHADOWS',
            {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        this.playPage.add(playTitle);
        this.playPage.add(startButton);
        this.playPage.add(diffLabel);
        diffButtons.forEach(b => this.playPage.add(b));
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
            'Review all tower upgrade paths',
            {
                fontFamily: 'Arial',
                fontSize: '26px',
                color: '#dddddd'
            }
        ).setOrigin(0.5);

        const towerInfo = [
            { type: 'lightningtower', name: 'Lightning Tower', icon: 'lightningtower' },
            { type: 'firetower',      name: 'Fire Tower',      icon: 'firetower' },
            { type: 'icetower',       name: 'Ice Tower',       icon: 'icetower' },
            { type: 'rocktower',      name: 'Rock Tower',      icon: 'rocktower' },
            { type: 'darktower',      name: 'Dark Tower',      icon: 'darktower' },
            { type: 'lighttower',     name: 'Light Tower',     icon: 'lighttower' },
            { type: 'psychictower',   name: 'Psychic Tower',   icon: 'psychictower' },
            { type: 'windtower',      name: 'Wind Tower',      icon: 'windtower' }
        ];

        const pathDetails = {
            damage: 'Heavy damage boost with each upgrade.',
            speed:  'Faster attack rate to hit more enemies quickly.',
            range:  'Increases target radius so the tower can reach farther.'
        };

        const listX = this.scale.width * 0.06;
        const listY = this.scale.height * 0.28;
        const listWidth = this.scale.width * 0.54;
        const listHeight = this.scale.height * 0.62;
        const sectionWidth = listWidth - 24;
        const sectionSpacing = 18;
        const cardHeight = 84;
        const cardPadding = 16;

        const detailX = this.scale.width * 0.70;
        const detailWidth = this.scale.width * 0.24;

        const detailPanel = this.add.rectangle(
            detailX,
            listY,
            detailWidth,
            listHeight,
            0x111111,
            1
        ).setOrigin(0, 0);

        const detailBorder = this.add.rectangle(
            detailX - 3,
            listY - 3,
            detailWidth + 6,
            listHeight + 6,
            0xff0000,
            0.25
        ).setOrigin(0, 0);

        const detailHeader = this.add.text(
            detailX + detailWidth / 2,
            listY + 20,
            'Upgrade Details',
            {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff'
            }
        ).setOrigin(0.5, 0);

        const detailName = this.add.text(
            detailX + detailWidth / 2,
            listY + 64,
            'Select an upgrade',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffcc33',
                wordWrap: { width: detailWidth - 32 }
            }
        ).setOrigin(0.5, 0);

        const detailDesc = this.add.text(
            detailX + 20,
            listY + 110,
            'Click any upgrade card to see the label and cost here.',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#dddddd',
                wordWrap: { width: detailWidth - 40 }
            }
        ).setOrigin(0, 0);

        const detailBonus = this.add.text(
            detailX + 20,
            listY + 220,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#a8ff7f',
                wordWrap: { width: detailWidth - 40 }
            }
        ).setOrigin(0, 0);

        const upgradesScroll = this.add.container(listX, listY);
        const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(listX, listY, listWidth, listHeight);
        upgradesScroll.setMask(new Phaser.Display.Masks.GeometryMask(this, maskShape));

        const upgradeIcons = [];
        let selectedCard = null;
        const setTowerIconsUpgraded = () => {
            upgradeIcons.forEach(icon => {
                if (icon.originalFrame) {
                    icon.setTexture('turret_up', icon.originalFrame);
                }
            });
        };

        const selectUpgrade = (upgradeCard, tower, path, def) => {
            if (selectedCard) {
                selectedCard.setStrokeStyle(0);
            }
            selectedCard = upgradeCard;
            selectedCard.setStrokeStyle(2, 0xffcc33);
            detailName.setText(`${tower.name} · ${def.label}`);
            detailDesc.setText(pathDetails[path]);
            detailBonus.setText(`Base cost: $${def.costs[0]} / Next level: $${def.costs[1]}`);
            setTowerIconsUpgraded();
        };

        let currentY = 0;
        towerInfo.forEach((tower) => {
            const sectionTop = currentY;
            const sectionHeight = 140 + (cardHeight + 12) * 3;

            const sectionBg = this.add.rectangle(
                0,
                sectionTop,
                sectionWidth,
                sectionHeight,
                0x111111,
                1
            ).setOrigin(0, 0);

            const sectionBorder = this.add.rectangle(
                0,
                sectionTop,
                sectionWidth,
                sectionHeight,
                0xff0000,
                0.18
            ).setOrigin(0, 0).setStrokeStyle(2, 0xff0000, 0.18);

            const towerIcon = this.add.image(20, sectionTop + 34, 'turret', tower.icon)
                .setOrigin(0, 0)
                .setScale(1.2);
            towerIcon.originalFrame = tower.icon;
            upgradeIcons.push(towerIcon);

            const towerLabel = this.add.text(
                100,
                sectionTop + 42,
                tower.name,
                {
                    fontFamily: 'Arial',
                    fontSize: '22px',
                    color: '#ffffff'
                }
            ).setOrigin(0, 0);

            const towerDesc = this.add.text(
                100,
                sectionTop + 74,
                'Damage, speed, and range upgrades available.',
                {
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    color: '#bbbbbb',
                    wordWrap: { width: sectionWidth - 140 }
                }
            ).setOrigin(0, 0);

            upgradesScroll.add([sectionBg, sectionBorder, towerIcon, towerLabel, towerDesc]);

            ['damage', 'speed', 'range'].forEach((path, index) => {
                const def = UPGRADE_PATHS[tower.type][path];
                const cardY = sectionTop + 120 + index * (cardHeight + 12);
                const card = this.add.rectangle(
                    0,
                    cardY,
                    sectionWidth - cardPadding * 2,
                    cardHeight,
                    0x191919,
                    1
                ).setOrigin(0, 0).setStrokeStyle(2, 0x2a2a2a, 1);

                const cardTitle = this.add.text(
                    20,
                    cardY + 12,
                    def.label,
                    {
                        fontFamily: 'Arial',
                        fontSize: '18px',
                        color: '#ffffff'
                    }
                ).setOrigin(0, 0);

                const cardSub = this.add.text(
                    20,
                    cardY + 40,
                    pathDetails[path],
                    {
                        fontFamily: 'Arial',
                        fontSize: '14px',
                        color: '#a8ff7f',
                        wordWrap: { width: sectionWidth - cardPadding * 4 }
                    }
                ).setOrigin(0, 0);

                const cardCost = this.add.text(
                    sectionWidth - cardPadding * 2 - 16,
                    cardY + 16,
                    `$${def.costs[0]}`,
                    {
                        fontFamily: 'Arial',
                        fontSize: '18px',
                        color: '#ffcc33'
                    }
                ).setOrigin(1, 0);

                card.setInteractive({ useHandCursor: true });
                card.on('pointerover', () => card.setFillStyle(0x2a2a2a));
                card.on('pointerout', () => card.setFillStyle(0x191919));
                card.on('pointerdown', () => selectUpgrade(card, tower, path, def));

                upgradesScroll.add([card, cardTitle, cardSub, cardCost]);
            });

            currentY += sectionHeight + sectionSpacing;
        });

        const scrollHeight = currentY;
        this.upgradesScrollY = 0;
        this.upgradesScroll = upgradesScroll;
        this.upgradesScrollBounds = Math.min(0, listHeight - scrollHeight - 20);
        this.upgradesPage.add(upgradesScroll);

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (!this.upgradesPage.visible) return;
            this.upgradesScrollY = Phaser.Math.Clamp(this.upgradesScrollY - deltaY * 0.5, this.upgradesScrollBounds, 0);
            this.upgradesScroll.setY(listY + this.upgradesScrollY);
        });

        this.upgradesPage.add(detailBorder);
        this.upgradesPage.add(detailPanel);
        this.upgradesPage.add(upgradesTitle);
        this.upgradesPage.add(upgradesHint);
        this.upgradesPage.add(detailHeader);
        this.upgradesPage.add(detailName);
        this.upgradesPage.add(detailDesc);
        this.upgradesPage.add(detailBonus);

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

        this.cameras.main.fadeIn(900, 0, 0, 0);
    }
}