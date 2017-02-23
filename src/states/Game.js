/* globals __DEV__ */
import Phaser from 'phaser'
import Mushroom from '../sprites/Mushroom'
import {setResponsiveWidth} from '../utils'

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    // set the sprite width to 30% of the game width
    this.tilemap = this.game.add.tilemap('game')

    this.game.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels)

    this.tilemap.addTilesetImage('sewer-tiles')

    this.bg_layer = this.tilemap.createLayer('bg')
    this.sewer_layer = this.tilemap.createLayer('sewer')
  }

  render () {
    if (__DEV__) {
      // this.game.debug.spriteInfo(this.mushroom, 32, 32)
    }
  }
}
