import Phaser from 'phaser'

export default class extends Phaser.Button {
  constructor(game, x, y, callback){
    super(game, x, y, "close-btn-sheet", callback, null, 2, 0, 1, 0);
    this.anchor.set(0.5);
  }
}
