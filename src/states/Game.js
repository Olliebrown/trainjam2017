/* globals __DEV__ */
import Phaser from 'phaser'
import Player from '../sprites/Player'
import {setResponsiveWidth} from '../utils'

const PLAYER_SPEED = 5

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    // tilemap / world setup
    this.game.physics.startSystem(Phaser.Physics.ARCADE)
    this.tilemap = this.game.add.tilemap('game')

    this.game.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)

    this.tilemap.addTilesetImage('sewer-tiles')

    this.bg_layer = this.tilemap.createLayer('bg')
    this.sewer_layer = this.tilemap.createLayer('sewer')

    this.tilemap.setCollision([0, 1], true, 'sewer')

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

  update () {
    this.game.physics.arcade.collide(this.player, this.sewer_layer)
    if (this.keys.left.isDown) {
      this.player.x -= PLAYER_SPEED
    } else if (this.keys.right.isDown) {
      this.player.x += PLAYER_SPEED
    } else if (this.keys.up.isDown) {
      this.player.y -= PLAYER_SPEED
    } else if (this.keys.down.isDown) {
      this.player.y += PLAYER_SPEED
    }
  }

  render () {
    if (__DEV__) {
      // this.game.debug.spriteInfo(this.mushroom, 32, 32)
    }
  }
}
