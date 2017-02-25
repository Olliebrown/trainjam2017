import Phaser from 'phaser'
//import { getRandomIntInclusive } from '../utils'

export class Microwave extends Phaser.Sprite {

  constructor ({ game, x, y }) {
    super(game, x, y, 'microwave', 0)

    this.game = game
    this.anchor.setTo(0.5)
    this.scale.setTo(0.4)
//    this.inputEnabled = true

    this.game.physics.arcade.enable(this)
  }

}
