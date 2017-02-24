/* globals __DEV__ */
import Phaser from 'phaser'
import Player from '../sprites/Player'
import {EnemyTrigger, Enemy} from '../sprites/Enemy'
import { Item } from '../sprites/Item'
import Pathfinder from '../ai/Pathfinder'
import { centerGameObjects } from '../utils'

const PLAYER_SPEED = 100

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    let state = this

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

    this.pathfinder = new Pathfinder(this.tilemap.width, this.tilemap.height);

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

    // camera
    this.game.camera.follow(this.player)
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
    this.tilemap.removeTile(item.x, item.y, 'interact')
    console.info('Picked up ' + item.properties.name)
  }

  makeItemList() {
    let tileProps = this.tilemap.tilesets[0].tileProperties;
    let itemList = []
    Object.keys(tileProps).forEach((key) => {
      if(tileProps[key].isItem) {
        itemList.push(key)
        console.info('item: ' + key)
      }
    });
    return itemList
  }

  makeUI() {
    let drawer = this.game.add.sprite(this.game.width - 50, this.game.height / 2, 'drawer')
    centerGameObjects([drawer])
    drawer.fixedToCamera = true
    return {
      drawer: drawer
    }
  }

  triggerCatwalk (player, enemy) {
    console.log("player", player)
    console.log("enemy", enemy)
  }

  update () {
    this.game.physics.arcade.collide(this.player, this.interact_layer)
    this.game.physics.arcade.overlap(this.player, this.enemies, this.triggerCatwalk, null, this)

    if(this.game.input.activePointer.isDown){
      let mousePoint = new Phaser.Point(Math.floor(this.game.input.activePointer.worldX / this.tilemap.tileWidth),
        Math.floor(this.game.input.activePointer.worldY / this.tilemap.tileHeight));
      let playerPoint = this.player.getTileLocation(this.tilemap.tileWidth);
      let targets = this.pathfinder.getTheNextLocation(playerPoint.x, playerPoint.y, mousePoint.x, mousePoint.y,
        this.sewer_layer.getTiles(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels, true));
      this.player.setListOfTargets(targets, this.tilemap.tileWidth, this.game.input.activePointer.worldX, this.game.input.activePointer.worldY);
    }

  }

  render () {
    if (__DEV__) {
    }
  }
}
