import Phaser from 'phaser'
import { centerGameObjects, loadAudio } from '../utils'

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
    this.game.load.image('TrainJam-09', 'assets/images/TrainJam-09.png')
    this.game.load.image('drawer', 'assets/images/inventory-drawer.png')
    this.game.load.spritesheet('sewer-sprites', 'assets/images/sewer-tiles.png', 128, 128)
    this.game.load.spritesheet('slot-btn-sheet', 'assets/images/button-slot.png', 150, 125);
    this.game.load.spritesheet('blend-btn-sheet', 'assets/images/button-blend.png', 200, 100);
    this.game.load.spritesheet('bclose-btn-sheet', 'assets/images/button-close.png', 100, 100);
    this.game.load.image('background', 'assets/images/overlay-background.png')
    this.game.load.image('trigger', 'assets/images/trigger.png')
    this.game.load.image('catwalk-intro-strip', 'assets/images/catwalk-intro-stripe.png')
    this.game.load.image('catwalk-intro-gradient', 'assets/images/catwalk-intro-grad.png')
    this.game.load.spritesheet('close-btn-sheet', 'assets/images/button-close.png', 100, 100)
    this.game.load.spritesheet('player', 'assets/images/char.png', 128, 128)

    loadAudio(this.game, 'BGM-intro', 'assets/music/mus_song1_1')
    loadAudio(this.game, 'BGM-loop', 'assets/music/mus_song1_2')
  }

  create () {
    this.state.start('Game')
  }

}
