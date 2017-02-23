import Phaser from 'phaser'
import { centerGameObjects } from '../utils'

export default class extends Phaser.State {
  init () {}

  preload () {
    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBg')
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'loaderBar')
    centerGameObjects([this.loaderBg, this.loaderBar])

    this.load.setPreloadSprite(this.loaderBar)
    //
    // load your assets
    //
    this.game.load.tilemap('game', 'assets/tilemaps/game.json', null, Phaser.Tilemap.TILED_JSON)
    this.game.load.image('sewer-tiles', 'assets/images/sewer-tiles.png')
    this.game.load.image('player', 'assets/images/player.png')
    this.game.load.audio('BGM-intro', 'assets/music/mus_song1_1.ogg')
    this.game.load.audio('BGM-loop', 'assets/music/mus_song1_2.ogg')
  }

  create () {
    this.state.start('Game')
  }

}
