import Phaser from 'phaser'
//import Glow from '../filters/Glow'

export class Item extends Phaser.Group {

  constructor ({ game, x, y, indeces, name, description}) {
    super(game);

    this.mainX = x;
    this.mainY = y;

    this.sprites = [];
    this.indeces = indeces;
    for(let i=0; i<indeces.length; i++){
      let sprite = new Phaser.Sprite(game, this.mainX, this.mainY, 'sewer-sprites', indeces[i]);
      sprite.anchor.set(0.5, 0.5);
      sprite.scale.setTo(0.45, 0.45)
      sprite.x = x
      sprite.y = y
      this.game.physics.arcade.enable(sprite);
      this.sprites.push(sprite);
      this.add(sprite);
    }

    // Make close button
    this.closeBtn = this.game.add.button(20, 40, 'close-btn-sheet',
          onBtnClose, this, 2, 0, 1, 0, this)
    this.closeBtn.scale.set(0.333)
    this.add(this.closeBtn)

    // Make index number
    this.number = this.game.add.text(40, 15, indeces[0],
      { font: 'Courier', fontSize: 24 }, this)
    this.add(this.number)

    this.game = game
    this.fixedToCamera = true
    this.inMicrowave = false;

    this.name = name
    this.description = description
    // this.filters = [ new Glow(game) ]

    // console.info('Picked up ' + this.name + ' with index ' + tile.index)
  }

  shiftUp() {
    console.info('shifting up ' + this.index)
    if(this.index > 0) {
      this.index--
      this.number.setText(this.index)
      this.y -= 75
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
      description: this.description
    })
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
