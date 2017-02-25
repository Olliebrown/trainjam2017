import Phaser from 'phaser'
import WebFont from 'webfontloader'
import { loadAudio } from '../utils'

export default class extends Phaser.State {
  init () {
    this.stage.backgroundColor = '#466E7D'
    this.fontsReady = true
    // this.fontsLoaded = this.fontsLoaded.bind(this)
  }

  preload () {
    // WebFont.load({
    //   google: {
    //     // families: ['Nunito']
    //   },
    //   active: this.fontsLoaded
    // })
    this.fontsReady = true

    let text = this.add.text(this.world.centerX, this.world.centerY,
      'loading fonts', { font: '16px Arial', fill: '#dddddd', align: 'center' })
    text.anchor.setTo(0.5, 0.5)

    this.load.image('loaderBg', './assets/images/loader-bg.png')
    this.load.image('loaderBar', './assets/images/loader-bar.png')
    this.load.image('title-splash', './assets/images/title-splash.png')

    loadAudio(this.game, 'BGM-catwalk-intro', 'assets/music/mus_pageant1')
    loadAudio(this.game, 'BGM-catwalk-loop', 'assets/music/mus_pageant2')
  }

  render () {
    if (this.fontsReady) {
      this.state.start('Splash')
    }
  }

  fontsLoaded () {
    this.fontsReady = true
  }

}
