import Phaser from 'phaser'
//import { getRandomIntInclusive } from '../utils'

export class Microwave extends Phaser.Sprite {

  constructor ({ game, x, y, name, player }) {
    super(game, x, y, 'microwave', 0)

    this.game = game
    this.anchor.setTo(0.5)
    this.scale.setTo(0.4)
    this.name = name
    this.triggered = false
    this.player = player

    this.game.physics.arcade.enable(this)
  }

  isOverlapping () {
    let playerRect = new Phaser.Rectangle(
      this.player.x - this.player.width/2,
      this.player.y - this.player.height/2,
      this.player.width, this.player.height)

    let microwaveRect = new Phaser.Rectangle(
      this.x - this.width/2, this.y - this.height/2,
      this.width, this.height)
    return Phaser.Rectangle.intersects(playerRect, microwaveRect)
  }

}
