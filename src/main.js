import 'pixi'
import 'p2'
import Phaser from 'phaser'

import BootState from './states/Boot'
import SplashState from './states/Splash'
import GameState from './states/Game'

const TARGET_HEIGHT = 800
const TARGET_WIDTH = 1280

class Game extends Phaser.Game {

  constructor () {
    let width = document.documentElement.clientWidth < TARGET_WIDTH ? TARGET_WIDTH : document.documentElement.clientWidth
    let height = document.documentElement.clientHeight < TARGET_HEIGHT ? TARGET_HEIGHT : document.documentElement.clientHeight

    super("100%", "100%", Phaser.WEBGL_MULTI, 'content', null)

    this.state.add('Boot', BootState, false)
    this.state.add('Splash', SplashState, false)
    this.state.add('Game', GameState, false)

    this.state.start('Boot')
  }
}

window.game = new Game()
