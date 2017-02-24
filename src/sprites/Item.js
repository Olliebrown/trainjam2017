import Phaser from 'phaser'
import Glow from '../filters/Glow'

export class Item extends Phaser.Sprite {

  constructor ({ game, x, y, tile }) {
    super(game, x, y, 'sewer-sprites', tile.index - 1)

    this.game = game
    this.anchor.setTo(0.5, 0.5)
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

  constructor({ game, x, y, index, itemTile }) {
    super(game)
    this.game = game

    this.item = new Item({ game, x, y, tile: itemTile })
    this.add(this.item)

    let closeBtn = this.game.add.button(x + 20, y - 40, 'close-btn-sheet',
      onBtnClose, this, 2, 0, 1, 0, this)
    closeBtn.scale.set(0.333)
    this.add(closeBtn)

    let number = this.game.add.text(x - 40, y - 15, index, { font: 'Courier', fontSize: 24 }, this)
    this.add(number)

    this.fixedToCamera = true;
  }
}

function onBtnClose(button, group) {
  console.info('Close button Clicked')
}
