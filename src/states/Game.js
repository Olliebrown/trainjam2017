/* globals __DEV__ */
import Phaser from 'phaser'
import Player from '../sprites/Player'
import {setResponsiveWidth} from '../utils'

const PLAYER_SPEED = 100

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    // tilemap / world setup
    this.game.physics.startSystem(Phaser.Physics.ARCADE)
    this.tilemap = this.game.add.tilemap('game')

    this.enemy_spawns_triggers = new Phaser.Group(this.game)

    this.game.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)

    this.tilemap.addTilesetImage('sewer-tiles')
    this.tilemap.addTilesetImage('triggers', 'player')

    this.bg_layer = this.tilemap.createLayer('bg')
    this.sewer_layer = this.tilemap.createLayer('sewer')
    this.enemy_spawns_layer = this.tilemap.createLayer('enemy_spawns')
    // this.enemy_spawns_layer.visible = false


    this.tilemap.setCollisionByExclusion([0], true, 'sewer')
    // this.tilemap.setCollisionByExclusion([0], true, 'enemy_spawns')
    this.tilemap.setTileIndexCallback([65], this.generateEnemy, this, 'enemy_spawns')

    this.loadEnemyTriggers()

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
    console.log(this.enemy_spawns_triggers)
  }

  loadEnemyTriggers() {
    var tiles = this.enemy_spawns_layer.getTiles(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)
    for (var t in tiles) {
      var tile = tiles[t]
      if (tile.canCollide == true) {
        console.log(tile)
        // var trigger = new Phaser.Sprite(this.game, tile.x, tile.y, 'player')
        this.enemy_spawns_triggers.add(tile)
      }
    }
  }

  generateEnemy () {
    console.log("Generating enemy?")
  }

  update () {
    this.game.physics.arcade.collide(this.player, this.sewer_layer)
    // this.game.physics.arcade.overlap(this.player, this.enemy_spawns_triggers, this.generateEnemy, null, this)

    this.game.physics.arcade.collide(this.player, this.enemy_spawns_layer)
    if (this.keys.left.isDown) {
      this.player.body.velocity.x = -PLAYER_SPEED
    } else if (this.keys.right.isDown) {
      this.player.body.velocity.x = PLAYER_SPEED
    } else if (this.keys.up.isDown) {
      this.player.body.velocity.y = -PLAYER_SPEED
    } else if (this.keys.down.isDown) {
      this.player.body.velocity.y = PLAYER_SPEED
    }
  }

  render () {
    if (__DEV__) {
    }
  }
}
