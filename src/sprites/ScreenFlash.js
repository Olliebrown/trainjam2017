import Phaser from 'phaser'

// Note: Blatently stolen from the Juicy Phaser plugin
// https://github.com/photonstorm/phaser-plugins/tree/master/Juicy

export class ScreenFlash extends Phaser.Sprite {

  constructor(game, color) {
    // Parameter defaults
    color = color || 'white'

    // Large rectangle to fill screen
    let bmd = game.add.bitmapData(game.width, game.height)
    bmd.ctx.fillStyle = color
    bmd.ctx.fillRect(0, 0, game.width, game.height)

    // Pass to sprite and set default alpha
    super(game, 0, 0, bmd)
    this.alpha = 0
    this.game = game
  }

  flash(maxAlpha, duration) {
    // Parameter defaults
    maxAlpha = maxAlpha || 1
    duration = duration || 100

    // Create a tween for alpha
    var flashTween = this.game.add.tween(this).to(
      { alpha: maxAlpha }, duration, Phaser.Easing.Bounce.InOut,
      true, 0, 0, true);

    // Set alpha back to 0 after tween
    flashTween.onComplete.add(() => { this.alpha = 0; }, this)
  }
}
