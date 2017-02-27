/* globals game */
import Phaser from 'phaser'
import {shuffleArray} from '../utils'
//import Glow from '../filters/Glow'

export class Item extends Phaser.Group {

  constructor ({ game, x, y, scale, indices, name, description,
                 powerTier, invIndex, animate, shuffle }) {

    // Clean invIndex
    if(invIndex !== undefined) {
      invIndex = parseInt(invIndex)
    }

    if(scale === undefined) {
      scale = 0.45
    }

    // Should this be a button using an inventory slot
    if((x === undefined || y === undefined) && invIndex !== undefined) {
      x = Item.INVENTORY_SLOTS[invIndex].x
      y = Item.INVENTORY_SLOTS[invIndex].y
    }

    // Pick starting position
    if(animate == Item.DROP_FROM_TOP || (animate == Item.DROP_CASCADE && invIndex+1 >= Item.INVENTORY_MAX)) {
      x = Item.INVENTORY_START.x
      y = Item.INVENTORY_START.y
    } else if(animate == Item.DROP_CASCADE) {
      x = Item.INVENTORY_SLOTS[invIndex + 1].x
      y = Item.INVENTORY_SLOTS[invIndex + 1].y
    }

    // Initialize empty Group as container
    super(game, null, 'ItemBtnGroup', false)
    this.fixedToCamera = true

    this.x = x
    this.y = y
    this.cameraOffset.x = x
    this.cameraOffset.y = y

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

    // Build sprites
    if(shuffle !== undefined && shuffle) {
      shuffleArray(indices, this.game.rnd);
    }

    for(let i = 1; i<indices.length; i++){
      if(this.game.rnd.realInRange(0, 1) < 0.1){
        let i1 = this.game.rnd.integerInRange(0, indices.length - 1);
        indices.splice(i1, 1);
      }
    }
    while(indices.length > 5){
      let i1 = this.game.rnd.integerInRange(0, indices.length - 1);
      indices.splice(i1, 1);
    }
    for(let i=0; i<indices.length; i++) {
      let sprite = new Phaser.Sprite(game,
        Item.COMBINED_LOCATIONS[indices.length - 1][i].x,
        Item.COMBINED_LOCATIONS[indices.length - 1][i].y,
        'item-sprites', indices[i])
      sprite.anchor.set(0.5)
      sprite.scale.setTo(scale)
      sprite.inputEnabled = true
      this.game.physics.arcade.enable(sprite)
      this.sprites.push(sprite)
      this.add(sprite)
    }

    // Make eyes for combined items
    this.eyes = null;
    if(indices.length > 1){
      let image = new Phaser.Image(game, 0, 0, 'eyes', game.rnd.integerInRange(0, 3));
      image.anchor.set(0.5)
      image.scale.setTo(0.5 * scale);
      this.eyes = image;
      this.add(image);
    }

    if(invIndex !== undefined) {
      this.invIndex = invIndex

      // Make close button
      this.closeBtn = this.game.add.button(20, -40, 'close-btn-sheet',
            onBtnClose, this, 2, 0, 1, 0)
      this.closeBtn.scale.set(0.333)
      this.add(this.closeBtn)

      if(animate !== undefined) { this.makeDrop() }
    }

    // this.filters = [ new Glow(game) ]
  }

  getLowerPowerBound() {
    var indices_count = this.indices.length
    var powers = Item.convertFrameToPowerTier(this.indices)
    var sum_power = 0
    powers.forEach(function(i) {
      sum_power += i
    })
    var avg_power = sum_power / powers.length

    var power_nom = avg_power + indices_count
    var power_denom = Item.getMaxPowerTier() + 4

    var power_bound = Math.floor(7 * power_nom / power_denom)
    return power_bound
  }

  getPowerRoll() {
    var lower = this.getLowerPowerBound()
    return this.game.rnd.integerInRange(lower, Item.UPPER_POWER_BOUND)
  }

  makeDrop() {
    // Animate falling item
    this.closeBtn.visible = false

    this.cameraOffset.set(this.x, this.y)
    let tween = this.game.add.tween(this.cameraOffset).to(
      Item.INVENTORY_SLOTS[this.invIndex], 500, Phaser.Easing.Bounce.Out, true)

    tween.onComplete.add(() => { this.closeBtn.visible = true }, this)

    // }
    // if(this.eyes != null){
    //   //let itemDropTween =
    //   this.game.add.tween(this.eyes.cameraOffset).to(
    //     { x: this.baseX,y: this.baseY}, 500, Phaser.Easing.Bounce.Out, true)
    // }
  }

  update () {
    if(this.invIndex !== undefined) {
      if(this.inMicrowave) {
        let mwave = this.game.ui.microwave
        let newX = this.game.ui.microwave.background.x +
          (mwave.getInventoryIndex(this) - mwave.getNumberOfItemsInMicrowave()/2 + 0.5) * 64
        let newY = this.game.ui.microwave.background.y - 20

        this.cameraOffset.x = newX
        this.cameraOffset.y = newY

        this.closeBtn.visible = false
      } else {
        this.cameraOffset.x = Item.INVENTORY_SLOTS[this.invIndex].x
        this.cameraOffset.y = Item.INVENTORY_SLOTS[this.invIndex].y

        this.closeBtn.visible = true
      }
    }
  }

  setMouseDown(onDown, context) {
    for(let i in this.sprites) {
      this.sprites[i].events.onInputDown.add(onDown, context)
    }
  }

  setMicrowaveSelectionHandler() {
    console.info('Enabling microwave input')
    for (var i in this.sprites) {
      this.sprites[i].events.onInputDown.add(() => {
        if(this.game.ui.microwave.getNumberOfItemsInMicrowave() < this.game.ui.microwave.MAX_MICROWAVE) {
          this.inMicrowave = !this.inMicrowave
          if(this.inMicrowave) {
            this.game.sounds.play('microwave_button', 4)
          }
        }
        else {
          this.game.sounds.play('inventory_full', 4)
        }
      }, this)
    }
  }

  removeMicrowaveSelectionHandler() {
    for (var i in this.sprites) {
      this.sprites[i].events.onInputDown.removeAll(this)
    }
  }

  setCatwalkSelectionHandler(gameScene, enemy) {
    for (var i in this.sprites) {
      this.sprites[i].events.onInputDown.add(() => {
        gameScene.triggerCatwalkIntro(this.indices, this.invIndexRef, enemy)
      }, this)
    }
  }

  makeLocationTween({ startX, startY, finalLoc, time, easing, autostart, delay, repeat, yoyo }) {
    for(let i=0; i<this.sprites.length; i++) {
      if(startX !== undefined) this.sprites[i].cameraOffset.x = startX
      if(startY !== undefined) this.sprites[i].cameraOffset.y = startY

      this.game.add.tween(this.sprites[i].cameraOffset).to(
        finalLoc, time, easing, autostart, delay, repeat, yoyo)
    }
    if (this.eyes !== null) {
      this.game.add.tween(this.eyes.cameraOffset).to(
        finalLoc, time, easing, autostart, delay, repeat, yoyo)
    }
  }

  makeScaleTween({scale, time, easing, autostart, delay, repeat, yoyo}) {
    for (var i in this.sprites) {
      this.game.add.tween(this.sprites[i].scale).to(
        {x: scale, y: scale}, time, easing, autostart, delay, repeat, yoyo
      )
    }

    if (this.eyes !== null) {
      this.game.add.tween(this.eyes.scale).to(
        {x: scale, y: scale}, time, easing, autostart, delay, repeat, yoyo
      )
    }
  }

  makeRotationTween({rotation, time, easing, autostart, delay, repeat, yoyo}) {
    for (var i in this.sprites) {
      this.game.add.tween(this.sprites[i]).to(
        {rotation: rotation}, time, easing, autostart, delay, repeat, yoyo
      )
    }
    if (this.eyes !== null) {
      this.game.add.tween(this.eyes).to(
        {rotation: rotation}, time, easing, autostart, delay, repeat, yoyo
      )
    }
  }

  mouseOn(x, y) {
    let hitted = false;
    for(let i=0; i<this.sprites.length; i++) {
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
  removeFromInventory(removeIndex)
}

export const removeFromInventory = (removeIndex) => {
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
Item.UPPER_POWER_BOUND = 8

Item.DROP_FROM_TOP = 0
Item.DROP_CASCADE = 1

// Initialize static properties
Item.init = (itemTileset) => {

  // Build inventory slot coordinates
  for(let i=8; i>=1; i--) {
    Item.INVENTORY_SLOTS.push(
      new Phaser.Point(game.width - 50, game.height/2 + 75*(i-4) - 35)
    )
  }

  // Start at the top of the inventory
  Item.INVENTORY_START = new Phaser.Point(game.width - 50, game.height / 2 + 75*(-4) - 35)

  // Locaitons for combined items
  Item.COMBINED_LOCATIONS = [
    [new Phaser.Point(0, 0)],
    [new Phaser.Point(-10, -10), new Phaser.Point(10, 10)],
    [new Phaser.Point(0, -10), new Phaser.Point(10, 10), new Phaser.Point(-10, 10)],
    [new Phaser.Point(-10, 0), new Phaser.Point(10, 0), new Phaser.Point(0, -10), new Phaser.Point(0, 10)],
    [new Phaser.Point(-10, 0), new Phaser.Point(10, 0), new Phaser.Point(0, -10), new Phaser.Point(0, 10), new Phaser.Point(0, 0)],
    [new Phaser.Point(-10, 0), new Phaser.Point(10, 0), new Phaser.Point(0, -10), new Phaser.Point(0, 10), new Phaser.Point(0, 0)]
  ];

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
  Item.POWER_TIER_FROM_FRAME_ID = {}

  for(let i in Item.ITEM_ARRAY) {
    Item.FRAME_2_GLOBAL[Item.ITEM_ARRAY[i].frameID] = Item.ITEM_ARRAY[i].globalID
    Item.ITEM_BY_NAME[Item.ITEM_ARRAY[i].name] = Item.ITEM_ARRAY[i]
    Item.ITEM_BY_GLOBAL_ID[Item.ITEM_ARRAY[i].globalID] = Item.ITEM_ARRAY[i]
    Item.POWER_TIER_FROM_FRAME_ID[Item.ITEM_ARRAY[i].frameID] = Item.ITEM_ARRAY[i].powerTier

    if(Item.ITEM_BY_POWER_TIER[Item.ITEM_ARRAY[i].powerTier] === undefined) {
      Item.ITEM_BY_POWER_TIER[Item.ITEM_ARRAY[i].powerTier] = new Array()
    }
    Item.ITEM_BY_POWER_TIER[Item.ITEM_ARRAY[i].powerTier].push(Item.ITEM_ARRAY[i])
  }
}

// Build a new Item from its name (as specified in the Tiled file)
Item.makeFromName = ({ game, name, x, y, invIndex, animate, scale }) => {
  let item = Item.ITEM_BY_NAME[name]
  if(item === undefined) {
    console.error(`Unknown item name (${name})`)
    return null
  }

  return new Item({ game, x, y, invIndex, indices: [ item.tileID ], animate, scale,
    name: item.name, description: item.description, powerTier: item.powerTier })
}

Item.convertFrameToGlobal = (frameIDs) => {
  let globalIDs = []
  for(let i in frameIDs) {
    globalIDs.push(Item.FRAME_2_GLOBAL[frameIDs[i]])
  }
  return globalIDs
}

Item.convertFrameToPowerTier = (frameIDs) => {
  let powerTiers = []
  for(let i in frameIDs) {
    powerTiers.push(Item.POWER_TIER_FROM_FRAME_ID[frameIDs[i]])
  }
  return powerTiers
}

// Build a new Item from its ID (as specified in the Tiled file)
Item.makeFromGlobalIDs = ({ game, idArray, x, y, invIndex, animate, scale }) => {
  let item, indices = []
  for(let i in idArray) {
    item = Item.ITEM_BY_GLOBAL_ID[idArray[i]]
    if(item === undefined) {
      console.error(`Unknown item global ID (${idArray[i]})`)
      return null
    }
    indices.push(item.frameID)
  }

  return new Item({ game, x, y, invIndex, indices, animate, scale,
    name: item.name, description: item.description, powerTier: item.powerTier })
}

// Build a new Item from its power-tier plus an index
Item.makeFromPowerTier = ({ game, powerTier, index, x, y, invIndex, animate, scale }) => {
  // if(Item.ITEM_BY_POWER_TIER[powerTier] === undefined) {
  //   console.error(`Unknown item power tier (${powerTier})`)
  //   return null
  // }

  if(index === undefined) index = 0
  let indeces = [];
  for(let i=0; i<powerTier.length; i++){
    let item = Item.ITEM_BY_POWER_TIER[powerTier[i]][index]
    indeces.push(item.frameID);
  }

  // if(item === undefined) {
  //   console.error(`Unknown item power tier index (${powerTier}[${index}])`)
  //   return null
  // }

  return new Item({ game, x, y, invIndex, indices: indeces, animate, scale,
    name: '', description: '', powerTier: powerTier[powerTier.length - 1] })
}

Item.getMaxPowerTier = () => {
  var max = 0
  for (var f in Item.ITEM_BY_POWER_TIER) {
    f = parseInt(f)
    if (f > max) {
      max = f
    }
  }
  return max
}

Item.enableMicrowaveSelection = (game) => {
  for(let i=0; i<game.ui.inventoryLayer.length; i++) {
    let item = game.ui.inventoryLayer.getChildAt(i)
    item.setMicrowaveSelectionHandler()
  }
}

Item.disableMicrowaveSelection = (game) => {
  for(let i=0; i<game.ui.inventoryLayer.length; i++) {
    let item = game.ui.inventoryLayer.getChildAt(i)
    item.removeMicrowaveSelectionHandler()
  }
}
