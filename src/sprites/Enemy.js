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
    var enemy = new Enemy({
      game: this.game,
      x: this.player.x + this.width / 2,
      y: this.player.y, level: this.level
    })
    this.player.listOfTargets = []
    this.enemy_group.add(enemy)
  }
}
