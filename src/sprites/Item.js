/* globals game */
import Phaser from 'phaser'
//import Glow from '../filters/Glow'

export class Item extends Phaser.Group {

  constructor ({ game, x, y, indices, name, description, powerTier, invIndex, animate }) {

    // Clean invIndex
    if(invIndex !== undefined) {
      invIndex = parseInt(invIndex)
    }

    // Should this be a button using an inventory slot
    if((x === undefined || y === undefined) && invIndex !== undefined) {
      x = Item.INVENTORY_SLOTS[invIndex].x
      y = Item.INVENTORY_SLOTS[invIndex].y
    }

    // Initialize empty Group as container
    super(game, null, 'ItemBtnGroup', false)

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

    // Pick starting positions
    if(animate == Item.DROP_FROM_TOP || (animate == Item.DROP_CASCADE && invIndex+1 >= Item.INVENTORY_MAX)) {
      x = Item.INVENTORY_START.x
      y = Item.INVENTORY_START.y
    } else if(animate == Item.DROP_CASCADE) {
      x = Item.INVENTORY_SLOTS[invIndex + 1].x
      y = Item.INVENTORY_SLOTS[invIndex + 1].y
    }

    // Build sprites
    for(let i=0; i<indices.length; i++) {
      let sprite = new Phaser.Sprite(game,
        x + Item.COMBINED_LOCATIONS[indices.length - 1][i].x,
        y + Item.COMBINED_LOCATIONS[indices.length - 1][i].y,
        'item-sprites', indices[i])
      sprite.anchor.set(0.5, 0.5)
      sprite.scale.setTo(0.45, 0.45)
      sprite.inputEnabled = true
      this.game.physics.arcade.enable(sprite)
      sprite.fixedToCamera = true
      this.sprites.push(sprite)
      this.addChild(sprite)
    }

    if(invIndex !== undefined) {
      // Make close button
      this.closeBtn = this.game.add.button(this.baseX + 20, this.baseY - 40, 'close-btn-sheet',
            onBtnClose, this, 2, 0, 1, 0)
      this.closeBtn.scale.set(0.333)
      this.closeBtn.fixedToCamera = true
      this.addChild(this.closeBtn)

      // Make index number
      this.invIndex = invIndex
      this.number = this.game.add.text(this.baseX - 40, this.baseY - 15, invIndex,
        { font: 'Courier', fontSize: 24 })
      this.number.fixedToCamera = true
      this.addChild(this.number)

      if(animate !== undefined) { this.makeDrop() }
    }

    // this.filters = [ new Glow(game) ]
  }

  makeDrop() {
    // Animate falling item
    this.closeBtn.visible = false
    this.number.visible = false

    for(let i=0; i<this.sprites.length; i++){
      var itemDropTween = this.game.add.tween(this.sprites[i].cameraOffset).to(
        { x: this.baseX + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].x,
          y: this.baseY + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].y}, 500, Phaser.Easing.Bounce.Out, true)

      if(i == 0){
        itemDropTween.onComplete.add(() => {
          this.closeBtn.visible = true
          this.number.visible = true
        }, this)
      }
    }
  }

  update () {
    for(let i=0; i<this.sprites.length; i++){
      if(this.inMicrowave) {
        this.sprites[i].cameraOffset.x = this.game.ui.microwave.background.x +
          (this.game.ui.microwave.getInventoryIndex(this) -
           this.game.ui.microwave.getNumberOfItemsInMicrowave()/2 + 0.5) * this.sprites[i].width + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].x;

        this.sprites[i].cameraOffset.y = this.game.ui.microwave.background.y - 20 + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].y;
      }
      else{
        this.sprites[i].cameraOffset.x = this.baseX + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].x;
        this.sprites[i].cameraOffset.y = this.baseY + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].y;
      }
    }
  }

  mouseOn(x, y){
    let hitted = false;
    for(let i=0; i<this.sprites.length; i++){
      if(this.game.math.distance(x, y, this.sprites[i].cameraOffset.x, this.sprites[i].cameraOffset.y) < this.sprites[i].width){
        hitted = true;
      }
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
}

function onBtnClose(itmButton) {
  let removeIndex = itmButton.parent.invIndex
  for(let i=0; i<game.ui.inventory.length - 1; i++) {
    if(i >= removeIndex) {
      game.ui.inventory[i] = game.ui.inventory[i+1]
    }
  }

  game.ui.inventory.pop();
  game.ui.inventoryNeedsUpdate = true
  game.ui.inventoryCascade = removeIndex
}

// Static class members
Item.INVENTORY_SLOTS = []
Item.INVENTORY_MAX = 8
Item.INVENTORY_START = {}

Item.DROP_FROM_TOP = 0
Item.DROP_CASCADE = 1

// Initialize static properties
Item.init = (itemTileset) => {

  // Build inventory slot coordinates
  for(let i=8; i>=1; i--) {
    Item.INVENTORY_SLOTS.push(
      new Phaser.Point(game.width - 50, game.height / 2 + 75*(i-4) - 35)
    )
  }

  Item.COMBINED_LOCATIONS = [
    [new Phaser.Point(0, 0)],
    [new Phaser.Point(-10, -10), new Phaser.Point(10, 10)],
    [new Phaser.Point(0, -10), new Phaser.Point(10, 10), new Phaser.Point(-10, 10)],
    [new Phaser.Point(-10, 0), new Phaser.Point(10, 0), new Phaser.Point(0, -10), new Phaser.Point(0, 10)]];

  // Start at the top of the inventory
  Item.INVENTORY_START = new Phaser.Point(game.width - 50, game.height / 2 + 75*(-4) - 35)

  // Build item list from TILED info
  let tileProps = itemTileset.tileProperties;
  Item.ITEM_ARRAY = []
  Item.TILE_INDEX_LIST = []
  Object.keys(tileProps).forEach((key) => {
    if(tileProps[key].isItem) {
      let globalID = parseInt(key) + itemTileset.firstgid
      Item.ITEM_ARRAY.push({
        globalID: globalID, frameID: parseInt(key),
        name: tileProps[key].name,
        description: tileProps[key].description,
        powerTier: tileProps[key].powerTier
      })

      Item.TILE_INDEX_LIST.push(globalID)
    }
  });

  // Build reverse lookup arrays
  Item.FRAME_2_GLOBAL = {}
  Item.ITEM_BY_NAME = {}
  Item.ITEM_BY_GLOBAL_ID = {}
  Item.ITEM_BY_POWER_TIER = {}

  for(let i in Item.ITEM_ARRAY) {
    Item.FRAME_2_GLOBAL[Item.ITEM_ARRAY[i].frameID] = Item.ITEM_ARRAY[i].globalID
    Item.ITEM_BY_NAME[Item.ITEM_ARRAY[i].name] = Item.ITEM_ARRAY[i]
    Item.ITEM_BY_GLOBAL_ID[Item.ITEM_ARRAY[i].globalID] = Item.ITEM_ARRAY[i]

    if(Item.ITEM_BY_POWER_TIER[Item.ITEM_ARRAY[i].powerTier] === undefined) {
      Item.ITEM_BY_POWER_TIER[Item.ITEM_ARRAY[i].powerTier] = new Array()
    }
    Item.ITEM_BY_POWER_TIER[Item.ITEM_ARRAY[i].powerTier].push(Item.ITEM_ARRAY[i])
  }
}

// Build a new Item from its name (as specified in the Tiled file)
Item.makeFromName = ({ game, name, x, y, invIndex, animate }) => {
  let item = Item.ITEM_BY_NAME[name]
  if(item === undefined) {
    console.error(`Unknown item name (${name})`)
    return null
  }

  return new Item({ game, x, y, invIndex, indices: [ item.tileID ], animate,
    name: item.name, description: item.description, powerTier: item.powerTier })
}

Item.convertFrameToGlobal = (frameIDs) => {
  let globalIDs = []
  for(let i in frameIDs) {
    globalIDs.push(Item.FRAME_2_GLOBAL[frameIDs[i]])
  }
  return globalIDs
}

// Build a new Item from its ID (as specified in the Tiled file)
Item.makeFromGlobalIDs = ({ game, idArray, x, y, invIndex, animate }) => {
  let item, indices = []
  for(let i in idArray) {
    item = Item.ITEM_BY_GLOBAL_ID[idArray[i]]
    if(item === undefined) {
      console.error(`Unknown item global ID (${idArray[i]})`)
      return null
    }
    indices.push(item.frameID)
  }

  return new Item({ game, x, y, invIndex, indices, animate,
    name: item.name, description: item.description, powerTier: item.powerTier })
}

// Build a new Item from its power-tier plus an index
Item.makeFromPowerTier = ({ game, powerTier, index, x, y, invIndex, animate }) => {
  if(Item.ITEM_BY_POWER_TIER[powerTier] === undefined) {
    console.error(`Unknown item power tier (${powerTier})`)
    return null
  }

  if(index === undefined) index = 0
  let item = Item.ITEM_BY_POWER_TIER[powerTier][index]
  if(item === undefined) {
    console.error(`Unknown item power tier index (${powerTier}[${index}])`)
    return null
  }

  return new Item({ game, x, y, invIndex, indices: [ item.frameID ], animate,
    name: item.name, description: item.description, powerTier: item.powerTier })
}
