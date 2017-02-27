import Phaser from 'phaser'
import Player from '../sprites/Player'
import { EnemyTrigger } from '../sprites/Enemy'
import { Microwave } from '../sprites/Microwave'
import { MicrowaveCrafting } from '../sprites/MicrowaveCrafting'
import { Item, removeFromInventory } from '../sprites/Item'
import Pathfinder from '../ai/Pathfinder'
import { centerGameObjects, getScreenSizeScale, getRandomIntInclusive } from '../utils'
import Juicy from '../plugins/Juicy.js'

const OVERLAY_WIDTH = 1600
const OVERLAY_HEIGHT = 900

const STATES = {
  main: 1,
  initCatwalk: 2,
  choosingItem: 3,
  catwalkIntro: 4,
  catwalk: 5,
  microwaving: 6
}

export default class extends Phaser.State {
  init () {
    this.state = STATES.main
  }

  preload () {}

  create () {
    let thisState = this

    // Screenflash effect
    this.juicy = this.game.plugins.add(Juicy);
    this.game.screenFlash = this.juicy.createScreenFlash();
    this.game.add.existing(this.game.screenFlash);

    // tilemap / world setup
    this.game.physics.startSystem(Phaser.Physics.ARCADE)
    this.tilemap = this.game.add.tilemap('game')

    this.game.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)

    this.tilemap.addTilesetImage('sewer-tiles')
    this.tilemap.addTilesetImage('item-tiles')

    // Serch for the item tilemap to initialize the item class
    let itemTilemapIndex = -1
    for(let i in this.tilemap.tilesets) {
      if(this.tilemap.tilesets[i].name === 'item-tiles') {
        itemTilemapIndex = i
        break
      }
    }

    if(itemTilemapIndex < 0) {
      console.error('ERROR: Could not find the item tilemap')
    } else {
      Item.init(this.tilemap.tilesets[itemTilemapIndex])
    }

    // Initialize tilemap layers
    this.bg_layer = this.tilemap.createLayer('bg')
    this.sewer_layer = this.tilemap.createLayer('sewer')
    this.interact_layer = this.tilemap.createLayer('interact')
    this.slime_layer = this.tilemap.createLayer('slime')
    this.enemy_layer = this.tilemap.objects.object_spawns;
    this.microwave_layer = this.tilemap.objects.microwaves;
    this.microwaveGroup = this.game.add.group()

    this.tilemap.setCollisionByExclusion([0], true, 'sewer')
    this.tilemap.setCollisionByExclusion([0], true, 'enemy_spawns')
    this.tilemap.setTileIndexCallback(Item.TILE_INDEX_LIST, this.itemTrigger, this, 'interact')

    // player setup
    this.player = new Player({
      game: this.game,
      x: 128 + 64, y: this.tilemap.heightInPixels - 640 + 64
    })

    // Make the microwave sprites
    this.createMicrowaves()
    this.lastMicrowave = ''

    this.game.world.bringToTop(this.player)

    // Initialize A* pathfinding
    this.pathfinder = new Pathfinder(this.tilemap.width, this.tilemap.height)
    this.bg_layer.inputEnabled = true
    this.bg_layer.events.onInputDown.add(this.doPathfinding, this)

    // Load and build music loop
    this.musicIntro = this.game.add.audio('BGM-intro')
    this.musicIntro.volume = 0.5
    this.musicIntro.onFadeComplete.add(this.pauseAfterFade, this)

    this.musicLoop = this.game.add.audio('BGM-loop')
    this.musicLoop.volume = 0.5
    this.musicLoop.loop = true
    this.musicLoop.onFadeComplete.add(this.pauseAfterFade, this)

    this.musicIntro.onStop.addOnce(() => {
      thisState.musicLoop.play()
      thisState.currentBGM = thisState.musicLoop
    });

    // Load catwalk music and build loop
    this.catwalkIntro = this.game.add.audio('BGM-catwalk-intro')
    this.catwalkIntro.volume = 0.5
    this.catwalkIntro.onFadeComplete.add(this.pauseAfterFade, this)

    this.catwalkLoop = this.game.add.audio('BGM-catwalk-loop')
    this.catwalkLoop.volume = 0.5
    this.catwalkLoop.loop = true
    this.catwalkLoop.onFadeComplete.add(this.pauseAfterFade, this)

    this.catwalkIntro.onStop.add(() => {
      thisState.catwalkLoop.play()
      thisState.currentBGM = thisState.catwalkLoop
    });

    // Start main BGM
    this.musicIntro.play()
    this.currentBGM = this.musicIntro

    // Get sounds
    this.game.sounds = this.game.add.audioSprite('sounds')
    this.game.lastItem = new Phaser.Point(-1, -1)

    this.game.add.existing(this.player)
    this.game.camera.follow(this.player)

    // Setup enemy spawn triggers
    this.enemy_spawns_triggers = []
    this.enemies = new Phaser.Group(this.game)
    this.createEnemyObjectTriggers()

    // Setup keyboard input
    this.keys = this.game.input.keyboard.createCursorKeys()
    this.keys.space = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR)

    // Finish UI and overlay setup
    this.game.ui = this.makeUI()
    this.overlay = this.game.add.group()

    this.game.world.bringToTop(this.game.screenFlash)
  }

  showOverlay() {
    var bm_data = this.game.add.bitmapData(this.game.width, this.game.height)
    bm_data.ctx.beginPath()
    bm_data.ctx.rect(0, 0, this.game.width, this.game.height)
    bm_data.ctx.fillStyle = '#111111'
    bm_data.ctx.fill()
    var overlay_bg = new Phaser.Sprite(this.game, 0, 0, bm_data)
    overlay_bg.alpha = 0.9
    overlay_bg.fixedToCamera = true
    this.overlay.add(overlay_bg)

    var obm_data = this.game.add.bitmapData(OVERLAY_WIDTH, OVERLAY_HEIGHT)
    obm_data.ctx.beginPath()
    obm_data.ctx.rect(0, 0, OVERLAY_WIDTH, OVERLAY_HEIGHT)
    obm_data.ctx.fillStyle = '#111111'
    obm_data.ctx.fill()
    var y_offset = (this.game.height - OVERLAY_HEIGHT) / 2
    var x_offset = (this.game.width - OVERLAY_WIDTH) / 2
    var overlay = new Phaser.Sprite(this.game, x_offset, y_offset, obm_data)
    overlay.fixedToCamera = true
    this.overlay.add(overlay)
    this.game.world.bringToTop(this.overlay)
  }

  hideOverlay() {
    this.overlay.removeAll(true)
  }

  createEnemyObjectTriggers() {
    let objects = this.enemy_layer
    for (let i in objects) {
      let o = objects[i]
      let trigger = new EnemyTrigger({
        game: this.game, x: o.x, y: o.y,
        width: o.width, height: o.height,
        level: o.properties.level,
        player: this.player,
        enemy_group: this.enemies,
        tilemap: this.tilemap
      })
      this.enemy_spawns_triggers.push(trigger)
    }
  }

  createMicrowaves() {
    let mwaves = this.microwave_layer
    for (let i in mwaves) {
      let m = mwaves[i]
      let newMicrowave = new Microwave({
        game: this.game,
        x: m.x + m.width/2,
        y: m.y + m.height/2,
        name: m.name,
        player: this.player
      })

      this.microwaveGroup.add(newMicrowave)
    }
  }

  itemTrigger (player, item) {
    if(this.game.ui.inventory.length >= Item.INVENTORY_MAX) {
      if(this.game.lastItem.x != item.x && this.game.lastItem.y) {
        this.game.lastItem = item
        this.game.sounds.play('inventory_full', 4)
      }
      return;
    }

    this.tilemap.removeTile(item.x, item.y, 'interact')
    this.game.ui.inventory.push([item.index])
    this.game.sounds.play('item_pickup', 1)
    this.updateInventory()
  }

  makeUI() {
    // Make groups for UI
    let ui_group = this.game.add.group()
    let inventory_group = this.game.add.group()

    // Make inventory drawer
    this.drawer = new Phaser.Sprite(this.game, this.game.width - 50, this.game.height / 2, 'drawer')
    this.drawer.fixedToCamera = true
    centerGameObjects([this.drawer])
    this.HUD = this.drawer;
    this.game.physics.arcade.enable(this.drawer);
    ui_group.add(this.drawer)

    // Make microwave crafting interface
    this.microwave = new MicrowaveCrafting(this.game)
    ui_group.add(this.microwave);

    return {
      uiLayer: ui_group, inventoryLayer: inventory_group, inventoryCascade: -1,
      inventoryShuffle: -1, inventory: [], inventoryNeedsUpdate: false, microwave: this.microwave
    }
  }

  // CATWALK: 2 -> Player chooses item to use in catwalk or is shown defeat
  triggerItemChoice (player, enemy) {

    if (this.state == STATES.initCatwalk) {
      this.state = STATES.choosingItem
      this.showOverlay()

      var centerX = this.game.width / 2
      var centerY = this.game.height / 2

      var grad = new Phaser.Sprite(this.game, centerX, centerY, 'catwalk-intro-gradient')
      let scale = getScreenSizeScale(grad, this.game)
      grad.scale.set(scale)
      grad.anchor.setTo(0.5)
      grad.fixedToCamera = true
      this.overlay.add(grad)

      var fontStyle = {
        font: 'bold 32px Arial',
        fill: '#fff',
        boundsAlignH: 'center',
        boundsAlignV: 'center'
      }

      let textString = 'Who will vogue?'
      if(this.game.ui.inventory.length == 0) {
        textString = 'You need an item to vogue!'
      }

      var text = new Phaser.Text(this.game, 0, 0, textString, fontStyle)
      text.setTextBounds(0, 100, this.game.width, this.game.height)
      text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2)
      text.fixedToCamera = true

      this.overlay.add(text)

      if(this.game.ui.inventory.length == 0) {
        this.game.time.events.add(Phaser.Timer.SECOND * 2,
          () => { this.endCatwalk('noitems', -1, enemy) }, this);
      } else {
        var yOffset = centerY - 100, xOffset = 200
        for (var i in this.game.ui.inventory) {
          var id_ = this.game.ui.inventory[i]
          var new_item = Item.makeFromGlobalIDs({
            game: this.game, x: xOffset, y: yOffset, idArray: id_, scale: 1.5
          })

          new_item.invIndexRef = i
          new_item.setCatwalkSelectionHandler(this, enemy)
          this.overlay.add(new_item)

          xOffset += new_item.sprites[0].width + 10
          if(i == 3) {
            yOffset += 200
            xOffset = 200
          }
        }
      }
    }
  }

  // CATWALK: 3 -> Animate the catwalk intro
  triggerCatwalkIntro (player_item_indices, invIndex, enemy) {
    if (this.state == STATES.choosingItem) {
      var enemy_item_tiers = enemy.pickItemPowerTier()
      this.state = STATES.catwalkIntro
      this.hideOverlay()
      this.showOverlay()

      var centerX = this.game.width / 2
      var centerY = this.game.height / 2

      var grad = new Phaser.Sprite(this.game, centerX, centerY, 'catwalk-intro-gradient')
      let scale = getScreenSizeScale(grad, this.game)
      grad.scale.set(scale)
      grad.anchor.setTo(0.5)
      grad.fixedToCamera = true
      this.overlay.add(grad)

      // Build and add versus strip
      var strip = new Phaser.Sprite(this.game, this.game.width + 100, - this.game.height/2 - 100, 'catwalk-intro-strip')
      strip.scale.set(scale)
      strip.anchor.setTo(0.5)
      strip.fixedToCamera = true
      this.overlay.add(strip)

      var strip_tween = this.game.add.tween(strip.cameraOffset).to(
        { x: this.game.width / 2, y: this.game.height / 2 }, 1000, Phaser.Easing.Elastic.In, true)

      strip_tween.onComplete.add(() => {
        this.camera.shake()
        this.camera.onShakeComplete.add(() => {
          this.game.time.events.add(500, () => {
            this.triggerCatwalk(player_item_indices, invIndex, enemy_item_tiers, enemy)
          }, this)
        })
      }, this)

      // Build and add Player item
      var player_item = new Item({
        game: this.game, x: -256, y: 200,
        scale: 2, indices: player_item_indices
      })

      player_item.cameraOffset.set(-256, 200)
      this.game.add.tween(player_item.cameraOffset).to(
        { x: 300 }, 1500, Phaser.Easing.Bounce.Out, true)

      this.overlay.add(player_item)

      // Build and add enemy item
      var enemy_item = Item.makeFromPowerTier({
        game: this.game, x: this.game.width + 256, y: 600,
        scale: 2, powerTier: enemy_item_tiers
      })

      enemy_item.cameraOffset.set(this.game.width + 256, 600)
      this.game.add.tween(enemy_item.cameraOffset).to(
        { x: this.game.width - 300 }, 1500, Phaser.Easing.Bounce.Out, true)

      this.overlay.add(enemy_item)
    }
  }

  // CATWALK: 4 -> Animate the catwalk
  triggerCatwalk (player_item_indices, invIndex, enemy_item_tiers, enemy) {
    if (this.state == STATES.catwalkIntro) {
      this.state = STATES.catwalk
      this.hideOverlay()
      this.showOverlay()

      var centerX = this.game.width / 2
      var centerY = this.game.height / 2

      // Add the background gradient
      var grad = new Phaser.Sprite(this.game, centerX, centerY, 'catwalk-gradient')
      let scale = getScreenSizeScale(grad, this.game)
      grad.scale.set(scale)
      grad.anchor.setTo(0.5)
      grad.fixedToCamera = true
      this.overlay.add(grad)

      // Create the floor and lights
      var floor = new Phaser.Sprite(this.game, this.game.width, this.game.height, 'catwalk-floor')
      floor.scale.set(scale)
      floor.anchor.setTo(1.0)
      floor.fixedToCamera = true
      this.overlay.add(floor)

      var lightsBack = new Phaser.Sprite(this.game, this.game.width + 90, this.game.height - 270, 'catwalk-lights-back')
      lightsBack.scale.set(scale)
      lightsBack.anchor.setTo(1.0)
      lightsBack.fixedToCamera = true
      this.overlay.add(lightsBack)

      var lightsFront = new Phaser.Sprite(this.game, this.game.width + 45, this.game.height - 195, 'catwalk-lights-front')
      lightsFront.scale.set(scale)
      lightsFront.anchor.setTo(1.0)
      lightsFront.fixedToCamera = true
      this.overlay.add(lightsFront)

      // Create the items
      var player_item = new Item({
        game: this.game, scale: 2,
        x: this.game.width, y: this.game.height - 335,
        indices: player_item_indices
      })

      var enemy_item = Item.makeFromPowerTier({
        game: this.game, x: 1250, y: 550, powerTier: enemy_item_tiers, scale: 2.0
      })

      // Animate them
      let playerAnim = this.makeItemCatwalkAnimation(player_item, floor.width/10)
      let enemyAnim = this.makeItemCatwalkAnimation(enemy_item, floor.width/10, playerAnim)

      this.overlay.add(player_item)
      this.overlay.add(enemy_item)
      this.overlay.bringToTop(lightsFront)

      var player_power = player_item.getPowerRoll()
      var enemy_power = enemy_item.getPowerRoll()
      var outcome

      if (player_power >= enemy_power) {
        outcome = 'win'
      } else {
        outcome = 'lose'
      }


      enemyAnim.onComplete.add(() => {
        this.game.time.events.add(1000, () => {
          this.endCatwalk(outcome, invIndex, enemy)
        })
      })
    }
  }

  makeItemCatwalkAnimation(item, stepWidth, chainFrom) {
    // Steps Animation
    item.cameraOffset.set(this.game.width+256, this.game.height - 360)
    let stepTweens = [
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-0*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, chainFrom === undefined),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-1*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-2*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-3*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-4*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-5*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-6*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-7*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-8*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false)
    ]

    for(let i=0; i<stepTweens.length-1; i++) {
      stepTweens[i].chain(stepTweens[i+1])
    }

    stepTweens[stepTweens.length-1].onComplete.add(() => {
      let which = getRandomIntInclusive(1, 3)
      this.game.sounds.play('pose' + which, 1)
      this.game.sounds.play('shutter_noise', 1)
      this.game.time.events.add(getRandomIntInclusive(0, 500), () => { this.game.screenFlash.flash(); })
      this.game.time.events.add(getRandomIntInclusive(100, 600), () => { this.game.screenFlash.flash(); })
      this.game.time.events.add(getRandomIntInclusive(200, 700), () => { this.game.screenFlash.flash(); })
      this.game.time.events.add(getRandomIntInclusive(300, 800), () => { this.game.screenFlash.flash(); })
      this.game.time.events.add(getRandomIntInclusive(400, 900), () => { this.game.screenFlash.flash(); })
      this.game.time.events.add(getRandomIntInclusive(500, 1000), () => { this.game.screenFlash.flash(); })
    })

    // Spin Animation (with delay)
    let spinTween = this.game.add.tween(item.scale)
      .to({ x: -1.0 }, 200, Phaser.Easing.Sinusoidal.In, false, 400, 0, true)
    stepTweens[stepTweens.length - 1].chain(spinTween)

    let aboutFace = this.game.add.tween(item.scale)
      .to({ x: -1.0}, 200, Phaser.Easing.Sinusoidal.Out, false)
    spinTween.chain(aboutFace);

    // Step back
    let stepBackTweens = [
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-7*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-6*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-5*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-4*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-3*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-2*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width-1*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width+0*stepWidth }, 400, Phaser.Easing.Sinusoidal.InOut, false),
      this.game.add.tween(item.cameraOffset)
        .to({ x: this.game.width+256}, 400, Phaser.Easing.Sinusoidal.InOut, false)
    ]

    aboutFace.chain(stepBackTweens[0])
    for(let i=0; i<stepBackTweens.length-1; i++) {
      stepBackTweens[i].chain(stepBackTweens[i+1])
    }

    if(chainFrom !== undefined) {
      chainFrom.onComplete.add(() => { stepTweens[0].start() })
    }

    return stepBackTweens[0]
  }

  // CATWALK: 5 -> Finish the catwalk sequence
  endCatwalk(outcome, invIndex, enemy) {
    this.hideOverlay()
    this.showOverlay()

    var centerX = this.game.width / 2
    var centerY = this.game.height / 2

    var grad = new Phaser.Sprite(this.game, centerX, centerY, 'catwalk-gradient')
    let scale = getScreenSizeScale(grad, this.game)
    grad.scale.set(scale)
    grad.anchor.setTo(0.5)
    grad.fixedToCamera = true
    this.overlay.add(grad)

    var fontStyle = {
      font: 'bold 128px Arial',
      fill: '#fff',
      boundsAlignH: 'center',
      boundsAlignV: 'center'
    }

    let textString = 'You WON!'
    if(outcome == 'lose') {
      textString = 'You Lost'
      removeFromInventory(invIndex)
    }

    var text = new Phaser.Text(this.game, 0, 0, textString, fontStyle)
    text.setTextBounds(0, centerY - 20, this.game.width, this.game.height)
    text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2)
    text.fixedToCamera = true

    this.overlay.add(text)
    this.game.time.events.add(2000, () => {
      this.hideOverlay()
      this.state = STATES.main
      this.enemies.removeAll(true)
      this.fadeToMainBGM()
    }, this)
  }

  // CATWALK: 1 -> First funtion called to begin catwalk sequence
  triggerCatwalkStart(player, enemy) {
    if (this.state == STATES.main) {
      this.state = STATES.initCatwalk
      this.game.time.events.add(Phaser.Timer.SECOND * 2, this.triggerItemChoice, this, player, enemy)
      this.fadeToCatwalkBGM()
    }
  }

  endCatwalkIntro () {
  }

  updateInventory() {
    this.game.ui.inventoryLayer.destroy();
    this.game.ui.inventoryLayer = this.game.add.group()

    if(this.game.ui.inventoryCascade >= 0) {
      for(let i in this.game.ui.inventory) {
        let newItem = {}
        if (i >= this.game.ui.inventoryCascade) {
          newItem = Item.makeFromGlobalIDs({
            game: this.game, idArray: this.game.ui.inventory[i],
            invIndex: i, animate: Item.DROP_CASCADE,
            shuffle: (i == this.game.ui.inventoryShuffle)
          })
        } else {
          newItem = Item.makeFromGlobalIDs({
            game: this.game, idArray: this.game.ui.inventory[i], invIndex: i,
            shuffle: (i == this.game.ui.inventoryShuffle)
          })
        }

        this.game.add.existing(newItem)
        this.game.ui.inventoryLayer.add(newItem)
      }
    } else {
      for(let i in this.game.ui.inventory) {
        let newItem = {}
        if (i == this.game.ui.inventory.length - 1) {
          newItem = Item.makeFromGlobalIDs({
            game: this.game, idArray: this.game.ui.inventory[i],
            invIndex: i, animate: Item.DROP_FROM_TOP,
            shuffle: (i == this.game.ui.inventoryShuffle)
          })
        } else {
          newItem = Item.makeFromGlobalIDs({
            game: this.game, idArray: this.game.ui.inventory[i], invIndex: i,
            shuffle: (i == this.game.ui.inventoryShuffle)
          })
        }

        this.game.add.existing(newItem)
        this.game.ui.inventoryLayer.add(newItem)
        this.game.ui.inventoryShuffle = -1
      }
    }

    this.game.ui.inventoryNeedsUpdate = false
    this.game.ui.inventoryCascade = -1
  }

  doPathfinding(obj, pointer) {
    if(!this.game.ui.microwave.alive &&
       !this.HUD.body.hitTest(pointer.worldX, pointer.worldY) &&
       this.state == STATES.main) {

      let mousePoint = new Phaser.Point(Math.floor(pointer.worldX / this.tilemap.tileWidth),
                                        Math.floor(pointer.worldY / this.tilemap.tileHeight))

      if(this.tilemap.hasTile(mousePoint.x, mousePoint.y, 'bg') !== null) {
        let playerPoint = this.player.getTileLocation(this.tilemap.tileWidth)
        let targets = this.pathfinder.getTheNextLocation(
          playerPoint.x, playerPoint.y, mousePoint.x, mousePoint.y,
          this.sewer_layer.getTiles(0, 0, this.tilemap.widthInPixels,
          this.tilemap.heightInPixels, true));
        this.player.setListOfTargets(targets, this.tilemap.tileWidth, pointer.worldX, pointer.worldY);
      }

      pointer.reset();
    }
  }

  update () {
    if (this.state == STATES.main) {
      if(this.game.ui.inventoryNeedsUpdate) {
        this.updateInventory()
      }

      this.game.physics.arcade.collide(this.player, this.interact_layer)

      // CATWALK: 0 -> sequence starts here
      this.game.physics.arcade.overlap(this.player, this.enemies, this.triggerCatwalkStart, null, this)

      this.game.physics.arcade.overlap(this.player, this.microwaveGroup,
        (player, mwave) => {
          if(mwave.name != this.lastMicrowave) {
            this.game.ui.microwave.alive = true
            this.game.ui.microwave.visible = true
            this.lastMicrowave = mwave.name
            mwave.triggered = true
            Item.enableMicrowaveSelection(this.game)
          }
        }, null, this)

      for(let i in this.enemy_spawns_triggers) {
        this.enemy_spawns_triggers[i].checkOverlap()
      }

      // Clear microwave collision
      if(this.lastMicrowave != '') {
        for(let i=0; i<this.microwaveGroup.length; i++) {
          let mwave = this.microwaveGroup.getChildAt(i)
          if(mwave.triggered) {
            if(!mwave.isOverlapping()) {
              this.lastMicrowave = ''
              mwave.triggered = false
            }
          }
        }
      }
    }
  }

  fadeToCatwalkBGM() {
    this.currentBGM.fadeOut(500)

    let thisState = this
    this.catwalkIntro.onStop.add(() => {
      thisState.catwalkLoop.play()
      thisState.currentBGM = thisState.catwalkLoop
    });

    this.catwalkIntro.restart()
    this.currentBGM = this.catwalkIntro
  }

  fadeToMainBGM() {
    this.currentBGM.fadeOut(500)
    this.musicLoop.fadeIn(500);
    this.currentBGM = this.musicLoop
  }

  render () {
  }

  pauseAfterFade(sound, volume) {
    if(volume < 0.01) {
      sound.onStop.removeAll()
      sound.stop()
    }
  }
}
