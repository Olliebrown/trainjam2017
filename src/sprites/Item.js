import Phaser from 'phaser'
//import Glow from '../filters/Glow'

export class Item extends Phaser.Group {

  constructor ({ game, x, y, indeces, name, description, invIndex }) {
    super(game, null, 'Item Object', true)

    this.mainX = this.x = x
    this.mainY = this.y = y

    this.sprites = []
    this.indeces = indeces
    for(let i=0; i<indeces.length; i++) {
      let sprite = new Phaser.Sprite(game, x, y, 'sewer-sprites', indeces[i] - 1)
      sprite.anchor.set(0.5, 0.5)
      sprite.scale.setTo(0.45, 0.45)
      this.game.physics.arcade.enable(sprite)
      this.sprites.push(sprite)
      this.add(sprite)
    }

    // Make close button
    this.closeBtn = this.game.add.button(x + 20, y - 40, 'close-btn-sheet',
          onBtnClose, this, 2, 0, 1, 0, this)
    this.closeBtn.scale.set(0.333)
    this.add(this.closeBtn)

    // Make index number
    if(invIndex != null) {
      this.invIndex = invIndex
      this.number = this.game.add.text(x - 40, y - 15, invIndex,
        { font: 'Courier', fontSize: 24 }, this)
      this.add(this.number)
    }

    this.game = game
    this.fixedToCamera = true
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
      this.y -= 75
    }
  }

  update () {
    for(let i=0; i<this.sprites.length; i++){
      if(this.inMicrowave){
        this.sprites[i].x = this.game.width / 2 + (i - microwave.length/2 + 0.5) * this.sprites[i].width;
        this.sprites[i].y = this.game.height / 2;
      }
      else{
        this.sprites[i].x = this.mainX;
        this.sprites[i].y = this.mainY;
      }

    }
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
}

function onBtnClose(itmButton) {
  let reducedInventory = itmButton.game.ui.inventory.filter((item, index) => {
    if(index == itmButton.parent.invIndex) {
      return false
    } else if(index > itmButton.parent.invIndex) {
      item.shiftUp()
      return true
    } else {
      return true
    }
  });

  itmButton.game.ui.inventory = reducedInventory
  itmButton.parent.destroy()
}
