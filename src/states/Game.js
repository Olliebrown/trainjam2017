import Phaser from 'phaser'
import Player from '../sprites/Player'
import { EnemyTrigger } from '../sprites/Enemy'
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
    this.object_layer = this.tilemap.objects.object_spawns;

    this.tilemap.setCollisionByExclusion([0], true, 'sewer')
    this.tilemap.setCollisionByExclusion([0], true, 'enemy_spawns')
    this.tilemap.setTileIndexCallback(Item.TILE_INDEX_LIST, this.itemTrigger, this, 'interact')

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

    this.musicIntro.play()

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
    this.enemy_spawns_triggers = new Phaser.Group(this.game, this.game.world, 'enemy_triggers', false, true)
    this.enemies = new Phaser.Group(this.game)
    this.createEnemyTriggers()

    // Setup keyboard input
    this.keys = this.game.input.keyboard.createCursorKeys()
    this.keys.space = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR)

    // Finish UI and overlay setup
    this.game.ui = this.makeUI()
    this.overlay = this.game.add.group()

    // this.makeTestInventory()
    // this.triggerCatwalkIntro()
  }

  makeTestInventory() {
    for(let i = 0; i<8; i++) {
      this.game.ui.inventory.push(Item.TILE_INDEX_LIST[i])
    }
    this.updateInventory()
  }

  makeTestInventory2() {
    for(let i = 0; i<8; i++) {
      let newItem = Item.makeFromID({ game: this.game, id: Item.TILE_INDEX_LIST[i+7]-1, invIndex: i })
      this.game.ui.inventory.push(newItem)
      this.game.ui.inventoryLayer.add(newItem)
    }
  }

  showOverlay() {
    var bm_data = this.game.add.bitmapData(OVERLAY_WIDTH, OVERLAY_HEIGHT)
    bm_data.ctx.beginPath()
    bm_data.ctx.rect(0, 0, OVERLAY_WIDTH, OVERLAY_HEIGHT)
    bm_data.ctx.fillStyle = '#111111'
    bm_data.ctx.fill()
    var y_offset = (this.game.height - OVERLAY_HEIGHT) / 2
    var x_offset = (this.game.width - OVERLAY_WIDTH) / 2
    var overlay_bg = new Phaser.Sprite(this.game, x_offset, y_offset, bm_data)
    overlay_bg.fixedToCamera = true
    this.overlay.add(overlay_bg)
    this.game.world.bringToTop(this.overlay)
  }

  hideOverlay() {
    this.overlay.removeAll()
  }

  createEnemyObjectTriggers() {
    let objects = this.object_layer
    for (let o in objects) {
      var trigger = new EnemyTrigger({
        game: this.game, x: o.x, y: o.y,
        width: o.width, height: o.height,
        level: o.properties.level,
        player: this.player,
        enemy_group: this.enemies,
        tilemap: this.tilemap
      })
      this.enemy_spawns_triggers.add(trigger)
    }
  }

  createEnemyTriggers() {
    var tiles = this.slime_layer.getTiles(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
    for (var t in tiles) {
      var tile = tiles[t]
      if (tile.index !== -1) {
        var trigger = new EnemyTrigger({
          game: this.game,
          x: tile.x * tile.width,
          y: tile.y * tile.height,
          player: this.player,
          enemy_group: this.enemies,
          tilemap: this.tilemap
        })
        this.enemy_spawns_triggers.add(trigger)
      }
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
    this.game.ui.inventory.push(item.index)
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
      var item_width = 0
      var item_height = 0

      var items = []
      for (var i in this.game.ui.inventory) {
        var id_ = this.game.ui.inventory[i]
        var new_item = Item.makeFromGlobalID({
          game: this.game, x: i * 130 + 200, y: centerY - 100, id: id_
        })
        new_item.sprites[0].scale.setTo(1.5)
        new_item.sprites[0].events.onInputDown.add((function() {this.triggerCatwalkIntro(id_)}), this)
        item_width = new_item.sprites[0].width
        item_height = new_item.sprites[0].height
        new_item.sprites[0].x = i * new_item.width
        this.overlay.add(new_item)
      }

    }
  }

  triggerCatwalkIntro (player_item_id, enemy_item_id) {
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

      var strip = new Phaser.Sprite(this.game, 0, this.game.height / 2, 'catwalk-intro-strip')
      strip.anchor.setTo(0.5)
      strip.fixedToCamera = true
      this.overlay.add(strip)

      var player_item = Item.makeFromGlobalID({
        game: this.game, x: 50, y: 400, id: player_item_id
      })

      player_item.sprites[0].scale.setTo(2)
      player_item.sprites[0].cameraOffset.x = -100

      var player_tween = this.game.add.tween(player_item.sprites[0].cameraOffset).to(
        { x: 400},
        1500, Phaser.Easing.Bounce.Out, true)

      this.overlay.add(player_item)

      var enemy_item = Item.makeFromGlobalID({
        game: this.game, x: 50, y: 550, id: player_item_id
      })

      enemy_item.sprites[0].scale.setTo(2)
      enemy_item.sprites[0].cameraOffset.x = -100

      var enemy_tween = this.game.add.tween(enemy_item.sprites[0].cameraOffset).to(
        { x: 1250},
        1500, Phaser.Easing.Bounce.Out, true)

      this.overlay.add(enemy_item)

      var strip_tween = this.game.add.tween(strip.cameraOffset).to(
        { x: this.game.width / 2 },
        2000, Phaser.Easing.Bounce.Out, true)

      this.game.time.events.add(500, (function() {this.camera.shake()}), this)

      strip_tween.onComplete.add((function() {this.triggerCatwalk(player_item_id, enemy_item_id)}), this)

    }
  }

  triggerCatwalk (player_item_id, enemy_item_id) {
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

      var player_item = Item.makeFromGlobalID({
        game: this.game, x: 400, y: 400, id: player_item_id
      })

      player_item.sprites[0].scale.setTo(2)

      this.overlay.add(player_item)

      var enemy_item = Item.makeFromGlobalID({
        game: this.game, x: 1250, y: 550, id: player_item_id
      })

      enemy_item.sprites[0].scale.setTo(2)

      this.overlay.add(enemy_item)

    }
  }

  triggerCatwalkStart() {
    if (this.state == STATES.main) {
      this.state = STATES.initCatwalk
      this.game.time.events.add(Phaser.Timer.SECOND * 2, this.triggerItemChoice, this)
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
          newItem = Item.makeFromGlobalID({
            game: this.game, id: this.game.ui.inventory[i],
            invIndex: i, animate: Item.DROP_CASCADE
          })
        } else {
          newItem = Item.makeFromGlobalID({
            game: this.game, id: this.game.ui.inventory[i], invIndex: i
          })
        }

        this.game.add.existing(newItem)
        this.game.ui.inventoryLayer.add(newItem)
      }
    } else {
      for(let i in this.game.ui.inventory) {
        let newItem = {}
        if (i == this.game.ui.inventory.length - 1) {
          newItem = Item.makeFromGlobalID({
            game: this.game, id: this.game.ui.inventory[i],
            invIndex: i, animate: Item.DROP_FROM_TOP
          })
        } else {
          newItem = Item.makeFromGlobalID({
            game: this.game, id: this.game.ui.inventory[i], invIndex: i
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
