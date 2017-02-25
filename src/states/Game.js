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
  choosingItem: 2
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
    Item.init(this.tilemap.tilesets[0])

    this.game.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)

    this.tilemap.addTilesetImage('sewer-tiles')
    this.tilemap.addTilesetImage('item-tiles')

    // this.itemIndexList = this.makeItemList();

    this.bg_layer = this.tilemap.createLayer('bg')
    this.sewer_layer = this.tilemap.createLayer('sewer')
    this.interact_layer = this.tilemap.createLayer('interact')
    this.slime_layer = this.tilemap.createLayer('slime')

    this.tilemap.setCollisionByExclusion([0], true, 'sewer')
    this.tilemap.setCollisionByExclusion([0], true, 'enemy_spawns')
    this.tilemap.setTileIndexCallback(Item.TILE_INDEX_LIST, this.itemTrigger, this, 'interact')

    this.pathfinder = new Pathfinder(this.tilemap.width, this.tilemap.height)

    // Load and build music loop
    // this.tilemap.setTileIndexCallback([65], this.itemTrigger, this, 'interact')
    // this.tilemap.setTileIndexCallback(this.itemIndexList, this.itemTrigger, this, 'interact')

    this.musicIntro = this.game.add.audio('BGM-intro')
    this.musicLoop = this.game.add.audio('BGM-loop')
    this.musicLoop.loop = true

    this.musicIntro.onStop.addOnce(() => {
      state.musicLoop.play()
    });

    this.musicIntro.play()

    // Get sounds
    this.game.sounds = this.game.add.audioSprite('sounds')

    // player setup
    this.player = new Player({
      game: this.game,
      x: 128 + 64, y: this.tilemap.heightInPixels - 256 + 64
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
    // this.overlay.fixedToCamera = true
    this.overlay = this.game.add.group()

    // camera
    this.game.camera.follow(this.player)

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
  }

  hideOverlay() {
    this.overlay.removeAll()
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
      return;
    }

    this.tilemap.removeTile(item.x, item.y, 'interact')
    this.game.ui.inventory.push(item.index)
    this.game.sounds.play('reverb_pose_sound_1', 1)
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
      inventory: [], microwave: this.microwave
    }
  }

  updateInventory() {
    this.game.ui.inventoryLayer.destroy();
    this.game.ui.inventoryLayer = this.game.add.group()

    for(let i in this.game.ui.inventory) {
      let newItem = Item.makeFromID({
        game: this.game, id: this.game.ui.inventory[i]-1, invIndex: i
      })
      this.game.add.existing(newItem)
      this.game.ui.inventoryLayer.add(newItem)
    }
  }

  triggerItemChoice (player, enemy) {

    if (this.state == STATES.main) {
      console.info('triggering item choice')
      this.state = STATES.choosingItem
      this.showOverlay()
      var itemGroup = this.game.add.group()
      var item_width = 0
      for (var i in this.game.ui.inventory) {
        var item = this.game.ui.inventory[i]
        var new_item = item.copy(0, 0)

        new_item.scale.setTo(1.5)
        item_width = new_item.width
        itemGroup.add(new_item)
      }

      var selection_width = item_width * itemGroup.children.length
      var x_offset = (this.game.width - selection_width) / 2
      var y_offset = (this.game.height - itemGroup.height) / 2

      for (let i in itemGroup.children) {
        console.info('doing the thing')
        let item = itemGroup.children[i]
        item.x = i * item.width
        itemGroup.children[i] = item
      }
      itemGroup.x = x_offset
      itemGroup.y = y_offset
      this.overlay.add(itemGroup)
    }
  }

  triggerCatwalkIntro (player_item, enemy_item) {
    if (this.state == STATES.main) {
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

      var strip_tween = this.game.add.tween(strip.cameraOffset).to(
        { x: this.game.width / 2 },
        2000, Phaser.Easing.Bounce.Out, true)

      strip_tween.onComplete.add((function() {this.camera.shake()}), this)

    }
  }

  endCatwalkIntro () {
  }

  update () {
    this.game.physics.arcade.collide(this.player, this.interact_layer)
    this.game.physics.arcade.overlap(this.player, this.enemies, this.triggerItemChoice, null, this)

    let pointer = this.game.input.activePointer;
    if(pointer && !this.game.ui.microwave.alive && !this.HUD.body.hitTest(pointer.worldX, pointer.worldY) &&
      (pointer.isMouse && pointer.leftButton.isDown) || (!pointer.isMouse && pointer.isDown)) {
      let mousePoint = new Phaser.Point(Math.floor(pointer.worldX / this.tilemap.tileWidth),
        Math.floor(pointer.worldY / this.tilemap.tileHeight));

      if(this.tilemap.hasTile(mousePoint.x, mousePoint.y, 'bg') !== null) {
        let playerPoint = this.player.getTileLocation(this.tilemap.tileWidth);
        let targets = this.pathfinder.getTheNextLocation(playerPoint.x, playerPoint.y, mousePoint.x, mousePoint.y,
          this.sewer_layer.getTiles(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels, true));
        this.player.setListOfTargets(targets, this.tilemap.tileWidth, pointer.worldX, pointer.worldY);
      }

      pointer.reset();
    }
    if(this.keys.space.justPressed()){
      this.game.ui.microwave.alive = true;
      this.game.ui.microwave.visible = true;
    }

  }

  render () {
    // this.game.ui.inventory.forEach((item) => {
    //   this.game.debug.geom(new Phaser.Rectangle(
    //     item.x - 45, item.y - 35, 90, 70), '#ffffff', false)
    // })
  }
}
