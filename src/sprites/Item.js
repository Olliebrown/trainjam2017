import Phaser from 'phaser'
import Glow from '../filters/Glow'

export class Item extends Phaser.Sprite {

  constructor ({ game, x, y, tile }) {
    super(game, x, y, 'sewer-sprites', tile.index - 1)

    this.game = game
    this.anchor.setTo(0.5, 0.5)
    this.fixedToCamera = true
    this.scale.setTo(0.45, 0.45)
    this.game.physics.arcade.enable(this)
    this.inMicrowave = false

    this.name = tile.properties.name
    this.description = tile.properties.description
    // this.filters = [ new Glow(game) ]

    console.info('Picked up ' + this.name + ' with index ' + tile.index)
  }

  update () {
  }

  mouseOn(x, y){
    return this.body.hitTest(x, y);
  }

}

export class ItemButton extends Phaser.Group {

  constructor({ game, x, y, index }) {
    super(game)

    let closeBtn = game.make.Button(game, x, y, 'close-btn-sheet', this, this.onClose, 2, 0, 1, 0)
    this.add(closeBtn)

    let number = game.make.text(game, x, y, index, { font: 'Courier' })
    this.add(number)
  }

}
