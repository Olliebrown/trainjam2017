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
    this.player = player
    this.active = false
    this.enemy_group = enemy_group
  }

  update () {
    if (this.game.physics.arcade.overlap(this.player, this)) {
      if (!this.active) {
        console.log("ho")
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
    console.log("spawnEnemy")
    var enemy = new Enemy({
      game: this.game,
      x: this.x,
      y: this.y
    })
    this.enemy_group.add(enemy)
  }
}
