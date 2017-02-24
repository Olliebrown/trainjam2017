import Phaser from 'phaser'

export default class extends Phaser.Button {
  constructor(game, x, y, callback){
    super(game, x, y, "button-close", callback);
  }
}
