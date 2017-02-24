import Phaser from 'phaser'

export default class extends Phaser.Sprite {

  constructor ({ game, x, y}) {
    super(game, x, y, 'player')

    this.game = game
    this.anchor.setTo(0.5)

    this.game.physics.arcade.enable(this)
    this.body.collideWorldBounds = true
  }

}
