import Phaser from 'phaser'

export const ITEM_FRAMES = [ 11, 18, 19, 26, 27, 34, 35 ]
const ITEM_MAX = ITEM_FRAMES.length - 1

export default class extends Phaser.Sprite {

  constructor ({ game, x, y, index }) {
    super(game, x, y, 'sewer-sprites', ITEM_FRAMES[Math.min(index, ITEM_MAX)])

    this.game = game
    this.anchor.setTo(0.5)
    this.game.physics.arcade.enable(this)
    this.inMicrowave = false;
  }

  update () {
  }

  mouseOn(x, y){
    return this.body.hitTest(x, y);
  }

}
