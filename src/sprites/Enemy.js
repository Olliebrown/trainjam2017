import Phaser from 'phaser'

export class Enemy extends Phaser.Sprite {

  constructor ({ game, x, y}) {
    super(game, x, y, 'sewer-sprites', 10)

    this.game = game
    this.anchor.setTo(0.5)

    this.game.physics.arcade.enable(this)
    this.body.collideWorldBounds = true
  }

}

export class EnemyTrigger extends Phaser.Sprite {

  constructor ({ game, x, y, player, enemy_group}) {
    super(game, x, y, 'trigger', 10)
    this.game = game
    this.x = this.x + this.width / 2
    this.y = this.y + this.height / 2
    this.player = player
    this.anchor.setTo(0.5)
    this.active = false
    this.enemy_group = enemy_group
  }

  checkOverlap(player, trigger) {
    var distance = this.game.physics.arcade.distanceBetween(player, trigger)
    if (distance < 10) {
      return true
    } else {
      return false
    }
  }

  update () {
    if (this.game.physics.arcade.overlap(this.player, this, null, this.checkOverlap, this)) {
      if (!this.active) {
        if (Math.random() > 0.5) {
          this.spawnEnemy()
        }
        this.active = true
      }
    } else {
      this.active = false
    }
  }

  spawnEnemy () {
    var enemy = new Enemy({
      game: this.game,
      x: this.x,
      y: this.y
    })
    enemy.y = enemy.y - enemy.height
    this.enemy_group.add(enemy)
  }
}
