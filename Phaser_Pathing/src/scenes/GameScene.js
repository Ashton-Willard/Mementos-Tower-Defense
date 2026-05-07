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

        // NEW placeholder map images
        this.load.image('map1_placeholder', 'src/assets/maps/map1_placeholder.png');
        this.load.image('map2_placeholder', 'src/assets/maps/map2_placeholder.png');
        this.load.image('map3_placeholder', 'src/assets/maps/map3_placeholder.png');
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

            // Ambient bars
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
        // PLAY PAGE CONTENT
        // ============================================================

        let selectedDiff = 'NORMAL';
        let selectedMapIndex = 0;

        // Only two maps
        const mapKeys = ['map1', 'map2'];
        const mapNames = ['CORRIDOR OF SHADOWS', 'MAP 2'];

        // START BUTTON (unchanged)
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

        // DIFFICULTY SELECTOR (unchanged)
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

        // MAP CAROUSEL (2 maps)
        const previewY = this.scale.height * 0.72;

        // Left arrow
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

        // Right arrow
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

        // Map preview (placeholder rectangle)
        const mapPreview = this.add.rectangle(
            this.scale.width / 2,
            previewY,
            this.scale.width * 0.35,
            this.scale.height * 0.22,
            0x111111
        ).setOrigin(0.5);

        // Animated border
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

        // Map name text
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

        // Hover animations
        [leftArrow, rightArrow].forEach(arrow => {
            arrow.on('pointerover', () => {
                this.tweens.add({ targets: arrow, scale: 1.15, duration: 120 });
            });
            arrow.on('pointerout', () => {
                this.tweens.add({ targets: arrow, scale: 1, duration: 120 });
            });
        });

        // Update map
        const updateMap = () => {
            mapText.setText(mapNames[selectedMapIndex]);
        };

        // Arrow logic
        leftArrow.on('pointerdown', () => {
            selectedMapIndex = (selectedMapIndex - 1 + mapKeys.length) % mapKeys.length;
            updateMap();
        });

        rightArrow.on('pointerdown', () => {
            selectedMapIndex = (selectedMapIndex + 1) % mapKeys.length;
            updateMap();
        });

        // Add to playPage
        this.playPage.add(startButton);
        this.playPage.add(diffLabel);
        diffButtons.forEach(b => this.playPage.add(b));
        this.playPage.add(leftArrow);
        this.playPage.add(rightArrow);
        this.playPage.add(mapPreview);
        this.playPage.add(mapBorder);
        this.playPage.add(mapText);


        // Fade in
        this.cameras.main.fadeIn(900, 0, 0, 0);
    }
}
