import Phaser from 'phaser'

export default class {
  constructor(x, y, p, tX, tY){
    this.parent = p;
    this.x = x;
    this.y = y;
    this.fitness = Math.abs(this.x - tX) + Math.abs(this.y - tY);
  }
}
