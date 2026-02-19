import Turret from './Turret.js';

export default class CannonTurret extends Turret {
    constructor(scene) {
        super(scene);
        this.setTexture('sprites', 'cannon');
        this.stats = {
            1: { damage: 40, range: 150, fireRate: 1500 },
            2: { damage: 60, range: 170, fireRate: 1300 },
            3: { damage: 80, range: 200, fireRate: 1100 }
        };
    }
}