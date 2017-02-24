/* globals game */
import Phaser from 'phaser'
//import Glow from '../filters/Glow'

export class Item extends Phaser.Sprite {

  constructor ({ game, x, y, indeces, name, description, invIndex }) {
    if(!x || !y) {
      x = Item.INVENTORY_SLOTS[invIndex].x
      y = Item.INVENTORY_SLOTS[invIndex].y
    }
    super(game, x, y, 0)

    this.baseX = x
    this.baseY = y

    this.sprites = []
    this.indeces = indeces

    for(let i=0; i<indeces.length; i++) {
      let sprite = new Phaser.Sprite(game, 0, 0, 'sewer-sprites', indeces[i] - 1)
      sprite.anchor.set(0.5, 0.5)
      sprite.scale.setTo(0.45, 0.45)
      this.game.physics.arcade.enable(sprite)
      sprite.fixedToCamera = true
      this.sprites.push(sprite)
      this.addChild(sprite)
    }

    // Make close button
    this.closeBtn = this.game.add.button(20, -40, 'close-btn-sheet',
          onBtnClose, this, 2, 0, 1, 0)
    this.closeBtn.scale.set(0.333)
    this.closeBtn.fixedToCamera = true
    this.addChild(this.closeBtn)

    // Make index number
    if(invIndex != null) {
      this.invIndex = invIndex
      this.number = this.game.add.text(-40, -15, invIndex,
        { font: 'Courier', fontSize: 24 })
      this.number.fixedToCamera = true
      this.addChild(this.number)
    }

    this.game = game
    this.inMicrowave = false

    this.name = name
    this.description = description
    // this.filters = [ new Glow(game) ]

    // console.info('Picked up ' + this.name + ' with index ' + tile.index)
  }

  shiftUp() {
    console.info('shifting up ' + this.invIndex)
    if(this.invIndex > 0) {
      this.invIndex--
      this.number.setText(this.invIndex)

      this.closeBtn.cameraOffset.y = this.closeBtn.cameraOffset.y - 75
      this.number.cameraOffset.y -= 75
      for(let i in this.sprites) {
        this.sprites[i].cameraOffset.y -= 75
      }
    }
  }

  update () {
  }

  mouseOn(x, y){
    let hitted = false;
    for(let i=0; i<this.sprites.length; i++){
      hitted |= this.sprites[i].body.hitTest(x, y);
    }
    return hitted;
  }

  copy (x, y) {
    return new Item({
      game: this.game, x: x, y: y,
      indeces: this.indeces, name: this.name,
      description: this.description, invIndex: this.invIndex
    })
  }

  copyDecriment (x, y) {
    return new Item({
      game: this.game, x: x, y: y,
      indeces: this.indeces, name: this.name,
      description: this.description, invIndex: this.invIndex-1
    })
  }
}

function onBtnClose(itmButton) {
  let inventory = game.ui.inventory
  let removeIndex = itmButton.parent.index

  for(let i=0; i<inventory.length - 1; i++) {
    if(i >= removeIndex) {
      inventory[i].destroy()
      inventory[i] = inventory[i+1].copyDecriment()
    }
  }

  inventory.pop();
}

Item.INVENTORY_SLOTS = []
Item.MAX_SLOTS = 8

Item.init = () => {
  for(let i=1; i<=8; i++) {
    Item.INVENTORY_SLOTS.push(
      new Phaser.Point(game.width - 50, game.height / 2 + 75*(i-4) - 35)
    )
  }
};
