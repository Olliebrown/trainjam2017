import Phaser from 'phaser'
import Player from '../sprites/Player'
import { EnemyTrigger } from '../sprites/Enemy'
import { Microwave } from '../sprites/Microwave'
import { MicrowaveCrafting } from '../sprites/MicrowaveCrafting'
import { Item } from '../sprites/Item'
import Pathfinder from '../ai/Pathfinder'
import { centerGameObjects } from '../utils'

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
    let state = this

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

    this.tilemap.setCollisionByExclusion([0], true, 'sewer')
    this.tilemap.setCollisionByExclusion([0], true, 'enemy_spawns')
    this.tilemap.setTileIndexCallback(Item.TILE_INDEX_LIST, this.itemTrigger, this, 'interact')

    // Make the microwave sprites
    this.createMicrowaves()

    // Initialize A* pathfinding
    this.pathfinder = new Pathfinder(this.tilemap.width, this.tilemap.height)
    this.bg_layer.inputEnabled = true
    this.bg_layer.events.onInputDown.add(this.doPathfinding, this)

    // Load and build music loop
    this.musicIntro = this.game.add.audio('BGM-intro')
    this.musicIntro.volume = 0.5
    this.musicLoop = this.game.add.audio('BGM-loop')
    this.musicLoop.volume = 0.5
    this.musicLoop.loop = true

    this.musicIntro.onStop.addOnce(() => {
      state.musicLoop.play()
    });

    // this.musicIntro.play()

    // Get sounds
    this.game.sounds = this.game.add.audioSprite('sounds')
    this.game.lastItem = new Phaser.Point(-1, -1)

    // player setup
    this.player = new Player({
      game: this.game,
      x: 128 + 64, y: this.tilemap.heightInPixels - 640 + 64
    })
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

    // this.makeTestInventory()

    // this.state = STATES.choosingItem
    // this.triggerCatwalkIntro(37, 37)
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
        y: m.y + m.height/2
      })

      newMicrowave.events.onInputDown.add(() => {
        this.game.ui.microwave.alive = true
        this.game.ui.microwave.visible = true
        this.state = STATES.microwaving
      }, this)

      this.game.add.existing(newMicrowave)
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
      uiLayer: ui_group, inventoryLayer: inventory_group,
      inventory: [], inventoryNeedsUpdate: false, microwave: this.microwave
    }
  }

  triggerItemChoice (player, enemy) {

    if (this.state == STATES.initCatwalk) {
      this.state = STATES.choosingItem
      this.showOverlay()

      var centerX = this.game.width / 2
      var centerY = this.game.height / 2

      var grad = new Phaser.Sprite(this.game, centerX, centerY, 'catwalk-intro-gradient')
      grad.anchor.setTo(0.5)
      grad.fixedToCamera = true
      this.overlay.add(grad)

      var tier = enemy.pickItemPowerTier()

      var fontStyle = {
        font: 'bold 32px Arial',
        fill: '#fff',
        boundsAlignH: 'center',
        boundsAlignV: 'center'
      }

      var text = new Phaser.Text(this.game, 0, 0, 'Choose your Object!', fontStyle)
      text.setTextBounds(0, 100, this.game.width, this.game.height)
      text.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2)
      text.fixedToCamera = true

      this.overlay.add(text)

      var itemGroup = this.game.add.group()
      itemGroup.fixedToCamera = true

      var yOffset = centerY - 100, xOffset = 200
      for (var i in this.game.ui.inventory) {
        var id_ = this.game.ui.inventory[i]
        var new_item = Item.makeFromGlobalIDs({
          game: this.game, x: xOffset, y: yOffset, idArray: id_, scale: 1.5
        })

        new_item.setMouseDown((function() {
          this.triggerCatwalkIntro(id_, tier)}), this)

        this.overlay.add(new_item)

        xOffset += new_item.sprites[0].width + 10
        if(i == 3) {
          yOffset += 200
          xOffset = 200
        }
      }

    }
  }

  triggerCatwalkIntro (player_item_id, enemy_item_tier) {
    if (this.state == STATES.choosingItem) {
      this.state = STATES.catwalkIntro
      this.hideOverlay()
      this.showOverlay()

      var centerX = this.game.width / 2
      var centerY = this.game.height / 2

      var grad = new Phaser.Sprite(this.game, centerX, centerY, 'catwalk-intro-gradient')
      grad.anchor.setTo(0.5)
      grad.fixedToCamera = true
      this.overlay.add(grad)

      // Build and add versus strip
      var strip = new Phaser.Sprite(this.game, 0, this.game.height / 2, 'catwalk-intro-strip')
      strip.anchor.setTo(0.5)
      strip.fixedToCamera = true
      this.overlay.add(strip)

      var strip_tween = this.game.add.tween(strip.cameraOffset).to(
        { x: this.game.width / 2 },
        2000, Phaser.Easing.Bounce.Out, true)

      strip_tween.onComplete.add((function() {
        this.game.time.events.add(500, (function() {
          this.camera.shake()
          this.triggerCatwalk(player_item_id, enemy_item_tier)
        }), this)
      }), this)

      // Build and add Player item
      var player_item = Item.makeFromGlobalIDs({
        game: this.game, x: 50, y: 400, idArray: player_item_id, scale: 2
      })

      player_item.makeTween({ startX: -100, finalLoc: { x: 400 }, time: 1500,
        easing: Phaser.Easing.Bounce.Out, autostart: true })

      this.overlay.add(player_item)

      // Build and add enemy item
      var enemy_item = Item.makeFromPowerTier({
        game: this.game, x: 50, y: 550, powerTier: enemy_item_tier, scale: 2
      })

      enemy_item.makeTween({ startX: -100, finalLoc: { x: 1250 }, time: 1500,
        easing: Phaser.Easing.Bounce.Out, autostart: true })

      this.overlay.add(enemy_item)

    }
  }

  triggerCatwalk (player_item_id, enemy_item_tier) {
    if (this.state == STATES.catwalkIntro) {
      this.state = STATES.catwalk
      this.hideOverlay()
      this.showOverlay()

      var centerX = this.game.width / 2
      var centerY = this.game.height / 2

      var grad = new Phaser.Sprite(this.game, centerX, centerY, 'catwalk-gradient')
      grad.anchor.setTo(0.5)
      grad.fixedToCamera = true
      this.overlay.add(grad)

      var player_board = new Phaser.Sprite(this.game, 0, this.game.height - 300, 'catwalk-bits', 0)
      player_board.fixedToCamera = true
      this.overlay.add(player_board)

      var enemy_board = new Phaser.Sprite(this.game, this.game.width - 601,  this.game.height - 300, 'catwalk-bits', 1)
      enemy_board.fixedToCamera = true
      this.overlay.add(enemy_board)

      var player_item = Item.makeFromGlobalIDs({
        game: this.game, x: 400, y: 400, idArray: player_item_id
      })

      player_item.sprites[0].scale.setTo(2)

      this.overlay.add(player_item)

      var enemy_item = Item.makeFromPowerTier({
        game: this.game, x: 1250, y: 550, powerTier: enemy_item_tier
      })

      enemy_item.sprites[0].scale.setTo(2)

      this.overlay.add(enemy_item)

    }
  }

  triggerCatwalkStart(player, enemy) {
    if (this.state == STATES.main) {
      this.state = STATES.initCatwalk
      this.game.time.events.add(Phaser.Timer.SECOND * 2, this.triggerItemChoice, this, player, enemy)
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
            invIndex: i, animate: Item.DROP_CASCADE
          })
        } else {
          newItem = Item.makeFromGlobalIDs({
            game: this.game, idArray: this.game.ui.inventory[i], invIndex: i
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
            invIndex: i, animate: Item.DROP_FROM_TOP
          })
        } else {
          newItem = Item.makeFromGlobalIDs({
            game: this.game, idArray: this.game.ui.inventory[i], invIndex: i
          })
        }

        this.game.add.existing(newItem)
        this.game.ui.inventoryLayer.add(newItem)
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
      this.game.physics.arcade.overlap(this.player, this.enemies, this.triggerCatwalkStart, null, this)

      for(let i in this.enemy_spawns_triggers) {
        this.enemy_spawns_triggers[i].checkOverlap()
      }

      if(this.keys.space.justPressed()){
        this.game.ui.microwave.alive = true;
        this.game.ui.microwave.visible = true;
      }

    }
  }

  render () {
    // this.game.ui.inventory.forEach((item) => {
    //   this.game.debug.geom(new Phaser.Rectangle(
    //     item.x - 45, item.y - 35, 90, 70), '#ffffff', false)
    // })
  }

}
