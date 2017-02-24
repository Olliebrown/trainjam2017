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

export class EnemyTrigger extends Phaser.Sprite {

  constructor ({ game, x, y, player}) {
    super(game, x, y, 'trigger', 10)
    this.player = player
    this.active = false
  }

  update () {
    if (this.game.physics.arcade.overlap(this.player, this)) {
      this.active = true
    } else {
      this.active = false
    }
  }
}
