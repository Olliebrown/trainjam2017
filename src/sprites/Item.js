/* globals game */
import Phaser from 'phaser'
//import Glow from '../filters/Glow'

export class Item extends Phaser.Group {

  constructor ({ game, x, y, indices, name, description, powerTier, invIndex }) {

    // Should this be a button using an inventory slot
    if((!x || !y) && invIndex !== null) {
      x = Item.INVENTORY_SLOTS[invIndex].x
      y = Item.INVENTORY_SLOTS[invIndex].y
    }

    // Initialize empty Group as container
    super(game, null, 'ItemBtnGroup', false);

    // Initialize base properties
    this.game = game
    this.inMicrowave = false

    this.name = name
    this.description = description
    this.powerTier = powerTier

    this.baseX = x
    this.baseY = y

    this.sprites = []
    this.indices = indices

    // Make sprite(s)
    for(let i=0; i<indices.length; i++) {
      let sprite = new Phaser.Sprite(game, x, y, 'sewer-sprites', indices[i])
      sprite.anchor.set(0.5, 0.5)
      sprite.scale.setTo(0.45, 0.45)
      this.game.physics.arcade.enable(sprite)
      sprite.fixedToCamera = true
      this.sprites.push(sprite)
      this.addChild(sprite)
    }

    // Make inventory button
    if(invIndex !== null) {
      // Make close button
      this.closeBtn = this.game.add.button(x + 20, y - 40, 'close-btn-sheet',
            onBtnClose, this, 2, 0, 1, 0)
      this.closeBtn.scale.set(0.333)
      this.closeBtn.fixedToCamera = true
      this.addChild(this.closeBtn)

      // Make index number
      if(invIndex != null) {
        this.invIndex = invIndex
        this.number = this.game.add.text(x - 40, y - 15, invIndex,
          { font: 'Courier', fontSize: 24 })
        this.number.fixedToCamera = true
        this.addChild(this.number)
      }
    }

    // this.filters = [ new Glow(game) ]
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
    for(let i=0; i<this.sprites.length; i++){
      if(this.inMicrowave){
        this.sprites[i].x = this.game.ui.microwave.background.x +
          (this.game.ui.microwave.getInventoryIndex(this) -
          this.game.ui.microwave.getNumberOfItemsInMicrowave()/2 + 0.5) * this.sprites[i].width;
        this.sprites[i].y = this.game.ui.microwave.background.y - 20;
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
      indices: this.indices, name: this.name,
      description: this.description, invIndex: this.invIndex
    })
  }

  copyDecriment (x, y) {
    return new Item({
      game: this.game, x: x, y: y,
      indices: this.indices, name: this.name,
      description: this.description, invIndex: this.invIndex-1
    })
  }
}

function onBtnClose(itmButton) {
  let inventory = game.ui.inventory
  let removeIndex = itmButton.parent.index

  for(let i=0; i<inventory.length - 1; i++) {
    if(i >= removeIndex) {
      inventory[i] = inventory[i+1];
    }
  }

  inventory.pop();

}

// Static class members
Item.INVENTORY_SLOTS = []
Item.INVENTORY_MAX = 8

// Initialize static properties
Item.init = (itemTileset) => {

  // Build inventory slot coordinates
  for(let i=1; i<=8; i++) {
    Item.INVENTORY_SLOTS.push(
      new Phaser.Point(game.width - 50, game.height / 2 + 75*(i-4) - 35)
    )
  }

  // Build item list from TILED info
  let tileProps = itemTileset.tileProperties;
  Item.ITEM_ARRAY = []
  Item.TILE_INDEX_LIST = []
  Object.keys(tileProps).forEach((key) => {
    if(tileProps[key].isItem) {
      Item.ITEM_ARRAY.push({
        triggerIndex: parseInt(key) + 1,
        tileID: parseInt(key),
        name: tileProps[key].name,
        description: tileProps[key].description,
        powerTier: tileProps[key].powerTier
      })

      Item.TILE_INDEX_LIST.push(parseInt(key) + 1)
    }
  });

  // Build reverse lookup arrays
  Item.ITEM_BY_NAME = {}
  Item.ITEM_BY_TILE_ID = {}
  for(let i in Item.ITEM_ARRAY) {
    Item.ITEM_BY_NAME[Item.ITEM_ARRAY[i].name] = Item.ITEM_ARRAY[i]
    Item.ITEM_BY_TILE_ID[Item.ITEM_ARRAY[i].tileID] = Item.ITEM_ARRAY[i]
  }

  console.info(Item.TILE_INDEX_LIST)
  console.info(Item.ITEM_BY_NAME)
  console.info(Item.ITEM_BY_TILE_ID)
};

// Build a new Item from its name (as specified in the Tiled file)
Item.makeFromName = ({ game, name, x, y, invIndex }) => {
  let item = Item.ITEM_BY_NAME[name]
  if(!item) { return null }

  return new Item({ game, x, y, invIndex, indices: [ item.tileID ],
    name: item.name, description: item.description, powerTier: item.powerTier })
}

// Build a new Item from its ID (as specified in the Tiled file)
Item.makeFromID = ({ game, id, x, y, invIndex }) => {
  let item = Item.ITEM_BY_TILE_ID[id]
  if(!item) { return null }

  return new Item({ game, x, y, invIndex, indices: [ item.tileID ],
    name: item.name, description: item.description, powerTier: item.powerTier })
}
