import Phaser from 'phaser'
import { getRandomIntInclusive } from '../utils'

export class Enemy extends Phaser.Sprite {

  constructor ({ game, x, y}) {
    var frame_count = game.cache.getFrameCount('enemies')
    var rand_frame = getRandomIntInclusive(0, frame_count - 1)
    super(game, x, y, 'enemies', rand_frame)

    this.game = game
    this.anchor.setTo(0.5)

    this.game.physics.arcade.enable(this)
    this.body.collideWorldBounds = true
  }

}

export class EnemyTrigger extends Phaser.Sprite {

  constructor ({ game, x, y, player, enemy_group, tilemap, level, width, height }) {
    super(game, x, y)

    this.game = game
    this.x = this.x + this.width / 2
    this.y = this.y + this.height / 2

    this.width = width
    this.height = height

    this.player = player
    this.anchor.setTo(0.5)
    this.visible = false

    this.enemy_group = enemy_group
    this.tilemap = tilemap
    this.triggered = false
    this.level = level
  }

  overlaps() {
    var distance = Phaser.Math.distance(this.player.x, this.player.y, this.x, this.y)
    if (distance < 128) {
      return true
    } else {
      return false
    }
  }

  update () {
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
      y: this.player.y
    })
    this.player.listOfTargets = []
    this.enemy_group.add(enemy)
  }
}
