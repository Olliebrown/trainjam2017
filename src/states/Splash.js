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
    this.game.load.image('item-tiles', 'assets/images/item-tiles.png')
    this.game.load.image('drawer', 'assets/images/inventory-drawer.png')
    this.game.load.image('trigger', 'assets/images/trigger.png')

    this.game.load.spritesheet('sewer-sprites', 'assets/images/sewer-tiles.png', 128, 128)
    this.game.load.spritesheet('item-sprites', 'assets/images/item-tiles.png', 128, 128)

    this.game.load.spritesheet('slot-btn-sheet', 'assets/images/button-slot.png', 150, 125);
    this.game.load.spritesheet('start-btn-sheet', 'assets/images/button-start.png', 200, 100);
    this.game.load.spritesheet('close-btn-sheet', 'assets/images/button-close.png', 100, 100)

    this.game.load.spritesheet('enemies', 'assets/images/enemies.png', 128, 128)
    this.game.load.spritesheet('player', 'assets/images/char.png', 128, 128)
    this.game.load.spritesheet('microwave', 'assets/images/microwave.png', 512, 256)

    this.game.load.image('background', 'assets/images/overlay-background.png')
    this.game.load.image('bang', 'assets/images/bang.png')
    this.game.load.image('catwalk-intro-strip', 'assets/images/catwalk-intro-stripe.png')
    this.game.load.image('catwalk-intro-gradient', 'assets/images/catwalk-intro-grad.png')

    this.game.load.audioSprite('sounds', [
      'assets/sounds/soundsprite.ogg', 'assets/sounds/soundsprite.mp3',
      'assets/sounds/soundsprite.m4a', 'assets/sounds/soundsprite.ac3'
    ], 'assets/sounds/soundsprite.json')

    loadAudio(this.game, 'BGM-intro', 'assets/music/mus_song1_1')
    loadAudio(this.game, 'BGM-loop', 'assets/music/mus_song1_2')
  }

  create () {
    this.state.start('Game')
  }

}
