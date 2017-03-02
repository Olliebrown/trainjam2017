import Phaser from 'phaser'
import { centerGameObjects, loadAudio, getScreenSizeScale } from '../utils'
import { StartButton, XButton } from '../sprites/Buttons'

export default class extends Phaser.State {
  init () {
    alert('hello changes')
  }

  preload () {
    this.background = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'title-splash')
    this.background.scale.set(getScreenSizeScale(this.background, this.game))

    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 300, 'loaderBg')
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 300, 'loaderBar')
    centerGameObjects([this.background, this.loaderBg, this.loaderBar])

    this.musicLoop = this.game.add.audio('BGM-catwalk-loop')
    this.musicLoop.volume = 0.75
    this.musicLoop.loop = true
    this.musicLoop.onFadeComplete.add(() => {
      this.musicLoop.stop()
      this.state.start('Game')
    }, this)
    this.musicLoop.play()

    this.load.setPreloadSprite(this.loaderBar)

    //
    // load your assets
    //
    this.game.load.tilemap('game', 'assets/tilemaps/game.json', null, Phaser.Tilemap.TILED_JSON)

    this.game.load.image('title-credits', 'assets/images/title-credits.png')
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
    this.creditsScreen = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'title-credits')
    this.creditsScreen.scale.set(getScreenSizeScale(this.creditsScreen, this.game))
    this.creditsScreen.visible = false
    this.creditsScreen.anchor.set(0.5)
    this.add.existing(this.creditsScreen)

    this.xButton = new XButton(this.game, 50, 50, () => {
      splash.creditsScreen.visible = false
      splash.xButton.visible = false

      splash.startButton.visble = true
      splash.startText.visble = true
      splash.creditsButton.visble = true
      splash.creditsText.visble = true
    })
    this.xButton.visible = false
    this.add.existing(this.xButton)

    this.startButton = new StartButton(this.game, this.game.world.centerX - 200,
      this.game.world.centerY + 300, () => {
        splash.musicLoop.fadeOut(500)
      })

    let style = {fontSize:'36px', fill:'#ffffff'};
    this.startText = new Phaser.Text(this.game, this.startButton.x, this.startButton.y - 5,'Start', style);
    this.startText.anchor.set(0.5);

    this.add.existing(this.startButton)
    this.add.existing(this.startText)

    this.creditsButton = new StartButton(this.game, this.game.world.centerX + 200,
      this.game.world.centerY + 300, () => {
        splash.creditsScreen.visible = true
        splash.xButton.visible = true

        splash.startButton.visble = false
        splash.startText.visble = false
        splash.creditsButton.visble = false
        splash.creditsText.visble = false
      })
    this.creditsText = new Phaser.Text(this.game, this.creditsButton.x, this.creditsButton.y - 5,'Credits', style);
    this.creditsText.anchor.set(0.5);

    this.add.existing(this.creditsButton)
    this.add.existing(this.creditsText)

    this.game.world.bringToTop(this.creditsScreen)
    this.game.world.bringToTop(this.xButton)
  }
}
