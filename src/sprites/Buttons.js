import Phaser from 'phaser'

export class XButton extends Phaser.Button {
  constructor(game, x, y, callback) {
    super(game, x, y, 'close-btn-sheet', callback, null, 2, 0, 1, 0);
    this.anchor.set(0.5);
  }
}

export class StartButton extends Phaser.Button {
  constructor(game, x, y, callback, context) {
    if(context == undefined) context = null
    super(game, x, y, 'start-btn-sheet', callback, context, 2, 0, 1, 0);
    this.anchor.set(0.5);
  }
}

export class SlotButton extends Phaser.Button {
  constructor(game, x, y, callback) {
    super(game, x, y, 'slot-btn-sheet', callback, null, 2, 0, 1, 0);
    this.anchor.set(0.5);
  }
}
