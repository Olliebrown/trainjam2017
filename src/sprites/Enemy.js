import Phaser from 'phaser'
import { getRandomIntInclusive } from '../utils'

export class Enemy extends Phaser.Sprite {

  constructor ({ game, x, y, level }) {
    var frame_count = game.cache.getFrameCount('enemies')
    var rand_frame = getRandomIntInclusive(0, frame_count - 1)
    super(game, x, y, 'enemies', rand_frame)

    this.game = game
    this.anchor.setTo(0.5)
    this.level = level

    this.game.physics.arcade.enable(this)
    this.body.collideWorldBounds = true
  }

  permute(input, permArr, usedChars) {
    if(permArr === undefined) permArr = []
    if(usedChars === undefined) usedChars = []

    var i, ch
    for (i = 0; i < input.length; i++) {
      ch = input.splice(i, 1)[0]
      usedChars.push(ch)
      if (input.length == 0) {
        permArr.push(usedChars.slice())
      }

      this.permute(input, permArr, usedChars)
      input.splice(i, 0, ch);
      usedChars.pop();
    }

    return permArr
  }

  pickItemPowerTier() {
    let options = []
    switch(this.level) {

    case 1: // Power levels 1 and 2 only, 1 or 2-combos
      options = [[1], [2], [1, 2], [2, 1], [1, 1], [2, 2]];
      break;

    case 2: // Power levels 3 and 4 only, 1 or 2-combos
      options = [[3], [4], [3, 4], [4, 3], [3, 3], [4, 4]];
      break;

    case 3: // Power levels, 5, 6, 7 & 8, 1 or 2-combos
      options = [[5], [6], [7], [8],
                 [5, 6], [6, 7], [7, 8],
                 [5, 7], [6, 8], [5, 8],
                 [5, 5], [6, 6], [7, 7], [8, 8]];
      break;

    case 4: // Power levels 7 - 10, 1 or 2-combos
      options = [[7, 8], [8, 9], [9, 10],
                 [7, 9], [8, 10], [7, 10],
                 [7, 7], [8, 8], [9, 9], [10, 10]];
      break;

    case 5: // Power levels 5 - 8, 2 or 3-combos
      options = [[5, 6], [6, 7], [7, 8],
        [5, 7], [6, 8], [5, 8],
        [5, 5], [6, 6], [7, 7], [8, 8],
        this.permute([5, 6, 7]), this.permute([6, 7, 8])]
      break;

    case 6: // Power levels 7 - 10, 2 or 3 combos
      options = [[7, 8], [8, 9], [9, 10],
        [7, 9], [8, 10], [7, 10],
        [7, 7], [8, 8], [9, 9], [10, 10],
        this.permute([7, 8, 9]), this.permute([8, 9, 10])]
      break;

    case 7: // Power levels 11 - 14, 2 or 3 combos
      options = [[11, 12], [12, 13], [13, 14],
        [11, 13], [12, 14], [11, 14],
        [11, 11], [12, 12], [13, 13], [14, 14],
        this.permute([11, 12, 13]), this.permute([12, 13, 14])]
      break;

    case 8: // Power levels 12 - 15, 3 or 4 combos
      options = [this.permute([12, 13, 14]), this.permute([13, 14, 15]),
        this.permute([12, 13, 15]), this.permute([12, 14, 15]),
        this.permute([12, 13, 14, 15])]
      break;
    }

    let random = getRandomIntInclusive(0, options.length - 1);
    return options[random]
  }

}

export class EnemyTrigger extends Phaser.Rectangle {

  constructor ({ game, x, y, width, height, player, enemy_group, tilemap, level }) {
    super(x, y, width, height)

    this.game = game
    this.player = player

    this.enemy_group = enemy_group
    this.tilemap = tilemap
    this.triggered = false
    this.level = level
  }

  overlaps() {
    let playerRect = new Phaser.Rectangle(
      this.player.x - this.player.width/2,
      this.player.y - this.player.height/2,
      this.player.width, this.player.height)
    return Phaser.Rectangle.intersects(playerRect, this)
  }

  checkOverlap () {
    if (this.overlaps()) {
      if (!this.triggered) {
        this.triggered = true
        if (Math.random() > 0.75) {
          this.spawnEnemy()
        }
      }
    } else {
      this.triggered = false
    }
  }

  spawnEnemy () {
    this.player.listOfTargets = []
    var enemy = new Enemy({
      game: this.game,
      x: this.player.x + 20,
      y: this.player.y, level: this.level
    })
    this.enemy_group.add(enemy)
  }
}
