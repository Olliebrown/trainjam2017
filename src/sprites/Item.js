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
    this.index = index

    this.item = new Item({ game, x, y, tile: itemTile })
    this.add(this.item)

    this.closeBtn = this.game.add.button(x + 20, y - 40, 'close-btn-sheet',
      onBtnClose, this, 2, 0, 1, 0, this)
    this.closeBtn.scale.set(0.333)
    this.add(this.closeBtn)

    this.number = this.game.add.text(x - 40, y - 15, index,
      { font: 'Courier', fontSize: 24 }, this)
    this.add(this.number)

    this.fixedToCamera = true
  }

  shiftUp() {
    console.info('shifting up ' + this.index)
    if(this.index > 0) {
      this.index--
      this.number.setText(this.index)
      this.y -= 75
    }
  }
}

function onBtnClose(itmButton) {
  let reducedInventory = itmButton.game.ui.inventory.filter((item, index) => {
    if(index == itmButton.parent.index) {
      return false
    } else if(index > itmButton.parent.index) {
      item.shiftUp()
      return true
    } else {
      return true
    }
  });

  itmButton.game.ui.inventory = reducedInventory
  itmButton.parent.destroy()
}
