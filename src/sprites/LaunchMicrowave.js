import Phaser from 'phaser'

export default class extends Phaser.Button {
  constructor(game, x, y, callback){
    super(game, x, y, "blend-btn-sheet", callback);
    this.anchor.set(0.5);
  }
}
