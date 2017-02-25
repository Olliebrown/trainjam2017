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

  constructor ({ game, x, y, player, enemy_group, tilemap}) {
    super(game, x, y, 'trigger', 10)
    this.game = game
    this.x = this.x + this.width / 2
    this.y = this.y + this.height / 2
    this.player = player
    this.anchor.setTo(0.5)
    this.visible = false
    this.enemy_group = enemy_group
    this.tilemap = tilemap
    this.triggered = false
    this.points = [
      new Phaser.Point(this.x + (this.width / 2), this.y - this.height / 2),
      new Phaser.Point(this.x + (this.width / 2), this.y + this.height * 1.5),
      new Phaser.Point(this.x - this.width / 2, this.y - this.height / 2),
      new Phaser.Point(this.x + this.width * 1.5, this.y - this.height / 2)
    ]
  }

  overlaps() {
    var distance = Phaser.Math.distance(this.player.x, this.player.y, this.x, this.y)
    if (distance < 10) {
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
    var spawn_point = null;
    for (var i in this.points) {
      var p = this.points[i]
      var tile_x = Math.floor(p.x / this.tilemap.tileWidth)
      var tile_y = Math.floor(p.y / this.tilemap.tileHeight)

      if (this.tilemap.hasTile(tile_x, tile_y, 'sewer') === false) {
        if (this.game.physics.arcade.getObjectsAtLocation(p.x, p.y, this.enemy_group).length == 0) {
          if (Phaser.Math.distance(this.player.x, this.player.y, p.x, p.y) > 128) {
            console.log(this.tilemap.hasTile(tile_x, tile_y, 'sewer'))
            spawn_point = p
          }
        } else {
        }
      } else {
        console.log(tile_x, tile_y)
        console.log(this.tilemap.hasTile(tile_x, tile_y, 'sewer'))
      }
    }
    if (spawn_point !== null) {
      var enemy = new Enemy({
        game: this.game,
        x: spawn_point.x,
        y: spawn_point.y
      })
      this.player.listOfTargets = []
      this.enemy_group.add(enemy)
    }
  }
}
