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
        x + Item.COMBINED_LOCATIONS[indices.length - 1][i].x,
        y + Item.COMBINED_LOCATIONS[indices.length - 1][i].y,
        'item-sprites', indices[i])
      sprite.anchor.set(0.5)
      sprite.scale.setTo(scale)
      sprite.inputEnabled = true
      this.game.physics.arcade.enable(sprite)
      sprite.fixedToCamera = true
      this.sprites.push(sprite)
      this.addChild(sprite)
    }
    this.eyes = null;
    if(indices.length > 1){
      let image = new Phaser.Image(game, x, y, 'eyes', game.rnd.integerInRange(0, 3));
      image.anchor.set(0.5)
      image.scale.setTo(0.5 * scale);
      image.fixedToCamera = true;
      this.eyes = image;
      this.addChild(image);
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
      // this.number = this.game.add.text(this.baseX - 40, this.baseY - 15, invIndex,
      //   { font: 'Courier', fontSize: 24 })
      // this.number.fixedToCamera = true
      // this.addChild(this.number)

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
    //this.number.visible = false

    for(let i=0; i<this.sprites.length; i++){
      let itemDropTween = this.game.add.tween(this.sprites[i].cameraOffset).to(
        { x: this.baseX + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].x,
          y: this.baseY + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].y}, 500, Phaser.Easing.Bounce.Out, true)

      if(i == 0){
        itemDropTween.onComplete.add(() => {
          this.closeBtn.visible = true
          //this.number.visible = true
        }, this)
      }
    }
    if(this.eyes != null){
      //let itemDropTween =
      this.game.add.tween(this.eyes.cameraOffset).to(
        { x: this.baseX,y: this.baseY}, 500, Phaser.Easing.Bounce.Out, true)
    }
  }

  update () {
    if(this.inMicrowave) {
      for(let i=0; i<this.sprites.length; i++) {
        this.sprites[i].cameraOffset.x = this.game.ui.microwave.background.x +
          (this.game.ui.microwave.getInventoryIndex(this) -
           this.game.ui.microwave.getNumberOfItemsInMicrowave()/2 + 0.5) * this.sprites[i].width + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].x;

        this.sprites[i].cameraOffset.y = this.game.ui.microwave.background.y - 20 + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].y;
      }

      if(this.eyes != null){
        this.eyes.cameraOffset.x = this.game.ui.microwave.background.x +
          (this.game.ui.microwave.getInventoryIndex(this) -
           this.game.ui.microwave.getNumberOfItemsInMicrowave()/2 + 0.5) * this.eyes.width;
        this.eyes.cameraOffset.y = this.game.ui.microwave.background.y - 20;
      }


      if(this.invIndex !== undefined) {
        this.closeBtn.visible = false
        //this.number.visible = false
      }
    } else {
      for(let i=0; i<this.sprites.length; i++) {
        this.sprites[i].cameraOffset.x = this.baseX + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].x;
        this.sprites[i].cameraOffset.y = this.baseY + Item.COMBINED_LOCATIONS[this.sprites.length - 1][i].y;
      }
      if(this.eyes != null){
        this.eyes.cameraOffset.x = this.baseX;
        this.eyes.cameraOffset.y = this.baseY;
      }

      if(this.invIndex !== undefined) {
        this.closeBtn.visible = true
        //this.number.visible = true
      }
    }
  }

  setMouseDown(onDown, context) {
    for(let i in this.sprites) {
      this.sprites[i].events.onInputDown.add(onDown, context)
    }
  }

  setSelectionHandler(gameScene, power_tier) {
    for (var i in this.sprites) {
      this.sprites[i].events.onInputDown.add(function() {
        gameScene.triggerCatwalkIntro(this.indices, this.invIndexRef, power_tier)
      }, this)
    }
  }

  makeLocationTween({ startX, startY, finalLoc, time, easing, autostart }) {
    for(let i=0; i<this.sprites.length; i++) {
      if(startX !== undefined) this.sprites[i].cameraOffset.x = startX
      if(startY !== undefined) this.sprites[i].cameraOffset.y = startY

      this.game.add.tween(this.sprites[i].cameraOffset).to(
        finalLoc, time, easing, autostart)
    }
    if (this.eyes !== null) {
      this.game.add.tween(this.eyes.cameraOffset).to(
        finalLoc, time, easing, autostart)
    }
  }

  makeScaleTween({scale, time, easing, autostart, delay, repeat, yoyo}) {
    for (var i in this.sprites) {
      this.game.add.tween(this.sprites[i].scale).to(
        {x: scale, y: scale},
        2000, Phaser.Easing.Sinusoidal.Out, true, 0, -1, true
      )
    }
    if (this.eyes !== null) {
      this.game.add.tween(this.eyes.scale).to(
        {x: scale, y: scale},
        2000, Phaser.Easing.Sinusoidal.Out, true, 0, -1, true
      )
    }
  }

  makeRotationTween({rotation, time, easing, autostart, delay, repeat, yoyo}) {
    for (var i in this.sprites) {
      this.game.add.tween(this.sprites[i]).to(
        {rotation: rotation},
        time, easing, autostart, delay, repeat, yoyo
      )
    }
    if (this.eyes !== null) {
      this.game.add.tween(this.eyes.cameraOffset).to(
        {rotation: rotation},
        time, easing, autostart, delay, repeat, yoyo
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
      new Phaser.Point(game.width - 50, game.height / 2 + 75*(i-4) - 35)
    )
  }

  Item.COMBINED_LOCATIONS = [
    [new Phaser.Point(0, 0)],
    [new Phaser.Point(-10, -10), new Phaser.Point(10, 10)],
    [new Phaser.Point(0, -10), new Phaser.Point(10, 10), new Phaser.Point(-10, 10)],
    [new Phaser.Point(-10, 0), new Phaser.Point(10, 0), new Phaser.Point(0, -10), new Phaser.Point(0, 10)],
    [new Phaser.Point(-10, 0), new Phaser.Point(10, 0), new Phaser.Point(0, -10), new Phaser.Point(0, 10), new Phaser.Point(0, 0)],
    [new Phaser.Point(-10, 0), new Phaser.Point(10, 0), new Phaser.Point(0, -10), new Phaser.Point(0, 10), new Phaser.Point(0, 0)]
  ];

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
    name: "", description: "", powerTier: powerTier[powerTier.length - 1] })
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
