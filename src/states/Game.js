/* globals __DEV__ */
import Phaser from 'phaser'
import Player from '../sprites/Player'
import {EnemyTrigger, Enemy} from '../sprites/Enemy'
import Item from '../sprites/Item'
import Pathfinder from '../ai/Pathfinder'
import { centerGameObjects } from '../utils'

const PLAYER_SPEED = 100

const INVENTORY_MAX = 8
const INVENTORY_SLOTS = []

export default class extends Phaser.State {
  init () {}
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
      y: 512
    })


    this.enemy_spawns_triggers = new Phaser.Group(this.game, this.game.world, 'enemy_triggers', false, true)
    this.enemies = new Phaser.Group(this.game)
    this.createEnemyTriggers()


    this.keys = this.game.input.keyboard.createCursorKeys()
    this.keys.space = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR)

    this.game.add.existing(this.player)

    this.ui = this.makeUI()

    this.overlay = this.game.add.group()
    this.overlay.fixedToCamera = true

    // camera
    this.game.camera.follow(this.player)


  }

  showOverlay() {
    var overlay_bg = new Phaser.Sprite(this.game, 10, 10, 'sewer-sprites', 2)
    overlay_bg.width = this.game.width - 20
    overlay_bg.height = this.game.height - 20
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
    if(this.ui.inventory.length >= INVENTORY_MAX) {
      return;
    }

    this.ui.inventory.push(new Item({
      game: this.game, tile: item,
      x: INVENTORY_SLOTS[this.ui.inventory.length].x,
      y: INVENTORY_SLOTS[this.ui.inventory.length].y,
    }))

    this.ui.drawer.add(this.ui.inventory[this.ui.inventory.length-1])
    this.tilemap.removeTile(item.x, item.y, 'interact')
  }

  makeItemList() {
    let tileProps = this.tilemap.tilesets[0].tileProperties;
    let itemList = []
    Object.keys(tileProps).forEach((key) => {
      if(tileProps[key].isItem) {
        itemList.push(parseInt(key) + 1)
        console.info('item: ' + key)
      }
    });
    return itemList
  }

  makeUI() {
    let ui_group = this.game.add.group()
    let drawer = new Phaser.Sprite(this.game, this.game.width - 50, this.game.height / 2, 'drawer')
    ui_group.add(drawer)
    centerGameObjects([drawer])
    drawer.fixedToCamera = true
    return {
      drawer: ui_group,
      inventory: []
    }
  }

  triggerCatwalk (player, enemy) {
    this.showOverlay()
  }

  update () {
    this.game.physics.arcade.collide(this.player, this.interact_layer)
    this.game.physics.arcade.overlap(this.player, this.enemies, this.triggerCatwalk, null, this)

    let pointer = this.game.input.activePointer;
    if(pointer && (pointer.isMouse && pointer.leftButton.isDown) || (pointer.isDown)) {
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

  }

  render () {
    if (__DEV__) {
    }
  }
}
