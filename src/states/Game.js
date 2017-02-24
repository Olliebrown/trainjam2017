/* globals __DEV__ */
import Phaser from 'phaser'
import Player from '../sprites/Player'
import { EnemyTrigger, Enemy } from '../sprites/Enemy'
import { MicrowaveCrafting } from '../sprites/MicrowaveCrafting'
import { Item } from '../sprites/Item'
import Pathfinder from '../ai/Pathfinder'
import { centerGameObjects } from '../utils'

const PLAYER_SPEED = 100

const INVENTORY_MAX = 8
let INVENTORY_SLOTS = []

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

    for(let i=1; i<=8; i++) {
      INVENTORY_SLOTS.push(
        new Phaser.Rectangle(this.game.width - 50, this.game.height / 2 + 75*(i-4) - 35, 64, 64)
      )
    }

    // tilemap / world setup
    this.game.physics.startSystem(Phaser.Physics.ARCADE)
    this.tilemap = this.game.add.tilemap('game')

    this.game.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)

    this.tilemap.addTilesetImage('sewer-tiles')

    this.itemIndexList = this.makeItemList();

    this.bg_layer = this.tilemap.createLayer('bg')
    this.sewer_layer = this.tilemap.createLayer('sewer')
    this.interact_layer = this.tilemap.createLayer('interact')
    this.enemy_spawns_layer = this.tilemap.createLayer('enemy_spawns')
    this.enemy_spawns_layer.visible = false

    this.tilemap.setCollisionByExclusion([0], true, 'sewer')
    this.tilemap.setCollisionByExclusion([0], true, 'enemy_spawns')

    this.pathfinder = new Pathfinder(this.tilemap.width, this.tilemap.height)

    this.tilemap.setTileIndexCallback([65], this.itemTrigger, this, 'interact')
    this.tilemap.setTileIndexCallback(this.itemIndexList, this.itemTrigger, this, 'interact')

    this.musicIntro = this.game.add.audio('BGM-intro')
    this.musicLoop = this.game.add.audio('BGM-loop')
    this.musicLoop.loop = true

    this.musicIntro.onStop.addOnce(() => {
      state.musicLoop.play()
    });

    this.musicIntro.play()

    // player setup
    this.player = new Player({
      game: this.game,
      x: 512,
      y: this.tilemap.heightInPixels - 256
    })

    this.enemy_spawns_triggers = new Phaser.Group(this.game, this.game.world, 'enemy_triggers', false, true)
    this.enemies = new Phaser.Group(this.game)
    this.createEnemyTriggers()


    this.keys = this.game.input.keyboard.createCursorKeys()
    this.keys.space = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR)

    this.game.add.existing(this.player)

    this.game.ui = this.makeUI()

    this.overlay = this.game.add.group()
    // this.overlay.fixedToCamera = true

    // camera
    this.game.camera.follow(this.player)

    // this.triggerCatwalkIntro()
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
    var tiles = this.enemy_spawns_layer.getTiles(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
    for (var t in tiles) {
      var tile = tiles[t]
      if (tile.canCollide) {
        var trigger = new EnemyTrigger({
          game: this.game,
          x: tile.x * tile.width,
          y: tile.y * tile.height,
          player: this.player,
          enemy_group: this.enemies
        })
        this.enemy_spawns_triggers.add(trigger)
      }
    }
  }

  itemTrigger (player, item) {
    if(this.game.ui.inventory.length >= INVENTORY_MAX) {
      return;
    }

    let invIndex = this.game.ui.inventory.length
    this.game.ui.inventory.push(new Item({
      game: this.game, indeces: [item.index], invIndex: invIndex,
      name: item.properties.name, description: item.properties.description,
      x: INVENTORY_SLOTS[invIndex].x, y: INVENTORY_SLOTS[invIndex].y
    }))

    let newItem = this.game.ui.inventory[invIndex]
    this.game.ui.drawer.add(newItem)
    this.tilemap.removeTile(item.x, item.y, 'interact')
  }

  makeItemList() {
    let tileProps = this.tilemap.tilesets[0].tileProperties;
    let itemList = []
    Object.keys(tileProps).forEach((key) => {
      if(tileProps[key].isItem) {
        itemList.push(parseInt(key) + 1)
      }
    });
    return itemList
  }

  makeUI() {
    let ui_group = this.game.add.group()
    let drawer = new Phaser.Sprite(this.game, this.game.width - 50, this.game.height / 2, 'drawer')
    this.HUD = drawer;
    this.game.physics.arcade.enable(drawer);
    ui_group.add(drawer)
    centerGameObjects([drawer])
    let microwave = new MicrowaveCrafting(this.game)
    ui_group.add(microwave);
    drawer.fixedToCamera = true

    return {
      drawer: ui_group,
      inventory: [],
      microwave: microwave
    }
  }

  triggerItemChoice (player, enemy) {
    if (this.state == STATES.main) {
      console.log("triggering item choice")
      this.state = STATES.choosingItem
      this.showOverlay()
      var itemGroup = this.game.add.group()
      var item_width = 0
      for (var i in this.ui.inventory) {
        var item = this.ui.inventory[i]
        var new_item = item.copy(0, 0)
        new_item.scale.setTo(1.5)
        item_width = new_item.width
        itemGroup.add(new_item)
      }
      var selection_width = item_width * itemGroup.children.length
      var x_offset = (this.game.width - selection_width) / 2
      var y_offset = (this.game.height - itemGroup.height) / 2

      for (var i in itemGroup.children) {
        console.log("doing the thing")
        var item = itemGroup.children[i]
        item.x = i * item.width
      }
      console.log(itemGroup.children)
      itemGroup.x = x_offset
      itemGroup.y = y_offset
      this.overlay.add(itemGroup)
    }
  }

  triggerCatwalkIntro () {
    if (this.state == STATES.main) {
      this.state = STATES.catwalkIntro
      this.hideOverlay()
      this.showOverlay()

      var grad = new Phaser.Sprite(this.game, 0, 0, 'catwalk-intro-gradient')
      grad.anchor.setTo(0.5)
      grad.x = this.game.width / 2
      grad.y = this.game.height / 2
      grad.fixedToCamera = true
      this.overlay.add(grad)

      var strip = new Phaser.Sprite(this.game, -100, -100, 'catwalk-intro-strip')
      strip.anchor.setTo(0.5)
      var target_x = this.game.width / 2
      console.log(target_x)
      // strip.y = this.game.height / 2
      strip.fixedToCamera = true
      this.overlay.add(strip)

      // var strip_tween = this.game.add.tween(strip)

      // this.intween = strip_tween.to(
      //   { x: target_x },
      //   4000, Phaser.Easing.Bounce.Out, true)


      // window.strip = strip_tween

    }
  }

  update () {
    this.game.physics.arcade.collide(this.player, this.interact_layer)
    this.game.physics.arcade.overlap(this.player, this.enemies, this.triggerCatwalkIntro, null, this)

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
    this.game.ui.inventory.forEach((item) => {
      this.game.debug.rectangle(new Phaser.Rectangle(
        item.x, item.y, 64, 64), '#ffffff', false)
    })
    if (__DEV__) {
    }
  }
}
