import Phaser from 'phaser'
import { centerGameObjects, loadAudio } from '../utils'
import { StartButton } from '../sprites/Buttons'

export default class extends Phaser.State {
  init () {}

  preload () {
    this.background = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'title-splash')
    this.background.scale.set(Math.max(this.game.width / this.background.width, this.game.height / this.background.height))
    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 300, 'loaderBg')
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 300, 'loaderBar')
    centerGameObjects([this.background, this.loaderBg, this.loaderBar])

    // this.background = new Phaser.Sprite(this.game,
    //   this.game.world.centerX, this.game.world.centerY, 'title-splash')
    // this.loaderBg = new Phaser.Sprite(this.game,
    //   this.game.world.centerX, this.game.world.centerY + 300, 'loaderBg')
    // this.loaderBar = new Phaser.Sprite(this.game,
    //   this.game.world.centerX, this.game.world.centerY + 300, 'loaderBar')
    //
    // centerGameObjects([this.background, this.loaderBar, this.loaderBg])
    //
    // this.splash.add(this.background)
    // this.splash.add(this.loaderBg)
    // this.splash.add(this.loaderBar)
    // this.splash.scale.set(0.75)
    // this.splash.x += 200
    // this.splash.y += 100

    this.load.setPreloadSprite(this.loaderBar)

    //
    // load your assets
    //
    this.game.load.tilemap('game', 'assets/tilemaps/game.json', null, Phaser.Tilemap.TILED_JSON)

    this.game.load.image('sewer-tiles', 'assets/images/sewer-tiles.png')
    this.game.load.image('item-tiles', 'assets/images/item-tiles.png')
    this.game.load.image('drawer', 'assets/images/inventory-drawer.png')

    this.game.load.spritesheet('sewer-sprites', 'assets/images/sewer-tiles.png', 128, 128)
    this.game.load.spritesheet('item-sprites', 'assets/images/item-tiles.png', 128, 128)
    this.game.load.spritesheet('start-btn-sheet', 'assets/images/button-start.png', 200, 100);
    this.game.load.spritesheet('slot-btn-sheet', 'assets/images/button-slot.png', 150, 125);
    this.game.load.spritesheet('close-btn-sheet', 'assets/images/button-close.png', 100, 100)

    this.game.load.spritesheet('enemies', 'assets/images/enemies.png', 128, 128)
    this.game.load.spritesheet('player', 'assets/images/char.png', 128, 128)
    this.game.load.spritesheet('microwave', 'assets/images/microwave.png', 512, 256)
    this.game.load.spritesheet('eyes', 'assets/images/eyes.png', 256, 256)
    this.game.load.spritesheet('catwalk-bits', 'assets/images/catwalk-bits.png', 601, 250)

    this.game.load.image('background', 'assets/images/overlay-background.png')
    this.game.load.image('bang', 'assets/images/bang.png')
    this.game.load.image('door', 'assets/images/MicroDoor.png')

    this.game.load.image('catwalk-gradient', 'assets/images/catwalk-grad.png')
    this.game.load.image('catwalk-floor', 'assets/images/catwalk-floor.png')
    this.game.load.image('catwalk-lights-front', 'assets/images/catwalk-lights-front.png')
    this.game.load.image('catwalk-lights-back', 'assets/images/catwalk-lights-back.png')

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
    this.loaderBg.visible = false
    this.loaderBar.visible = false

    let splash = this
    let startButton = new StartButton(this.game, this.game.world.centerX,
      this.game.world.centerY + 300, () => { splash.state.start('Game') })
    let style = {fontSize:'36px', fill:'#ffffff'};
    let startText = new Phaser.Text(this.game, startButton.x, startButton.y - 5,'Start', style);
    startText.anchor.set(0.5);

    this.add.existing(startButton)
    this.add.existing(startText)
  }
}
