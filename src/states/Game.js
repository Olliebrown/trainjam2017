/* globals __DEV__ */
import Phaser from 'phaser'
import Player from '../sprites/Player'
import {Item, ITEM_FRAMES} from '../sprites/Item'
import Pathfinder from '../ai/Pathfinder'
import {setResponsiveWidth} from '../utils'

const PLAYER_SPEED = 200

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
    this.tilemap.addTilesetImage('triggers', 'player')

    this.itemIndexList = this.makeItemList();

    this.bg_layer = this.tilemap.createLayer('bg')
    this.sewer_layer = this.tilemap.createLayer('sewer')
    this.interact_layer = this.tilemap.createLayer('interact')
    this.enemy_spawns_layer = this.tilemap.createLayer('enemy_spawns')
    this.enemy_spawns_layer.visible = false

    this.tilemap.setCollisionByExclusion([0], true, 'sewer')

    this.pathfinder = new Pathfinder(this.tilemap.width, this.tilemap.height);

    this.tilemap.setTileIndexCallback([65], this.generateEnemy, this, 'enemy_spawns')
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

    this.keys = this.game.input.keyboard.createCursorKeys()
    this.keys.space = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR)

    this.game.add.existing(this.player)

    // camera
    this.game.camera.follow(this.player)
  }

  generateEnemy () {
    console.info('Generating enemy?')
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

  update () {
    this.game.physics.arcade.collide(this.player, this.enemy_spawns_layer)
    this.game.physics.arcade.collide(this.player, this.interact_layer)

    if(this.game.input.activePointer.isDown){
      let mousePoint = new Phaser.Point(Math.floor(this.game.input.activePointer.worldX / this.tilemap.tileWidth),
        Math.floor(this.game.input.activePointer.worldY / this.tilemap.tileHeight));
      let playerPoint = this.player.getTileLocation(this.tilemap.tileWidth);
      let targets = this.pathfinder.getTheNextLocation(playerPoint.x, playerPoint.y, mousePoint.x, mousePoint.y,
        this.sewer_layer.getTiles(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels, true));
      this.player.setListOfTargets(targets, this.tilemap.tileWidth);
    }

  }

  render () {
    if (__DEV__) {
    }
  }
}
