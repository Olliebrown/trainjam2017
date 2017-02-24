import Phaser from 'phaser'

export default class extends Phaser.Sprite {

  constructor ({ game, x, y, tile }) {
    super(game, x, y, 'sewer-sprites', tile.index - 1)

    this.game = game
    this.anchor.setTo(0.5, 0.5)
    this.fixedToCamera = true
    this.scale.setTo(0.5, 0.5)

    this.name = tile.properties.name
    this.description = tile.properties.description

    console.info('Picked up ' + this.name + ' with index ' + tile.index)
  }

  update () {
  }

}
