import Phaser from 'phaser'

const IDLE_COUNTDOWN = 60

export default class extends Phaser.Sprite {

  constructor ({ game, x, y }) {
    super(game, x, y, 'player', 0)

    this.animations.add('idle', [0, 1, 2], 7, true)
    this.animations.add('stopped', [5], 7, true)
    this.animations.add('walk', [3, 5, 4, 5], 7, true)

    this.listOfTargets = [];
    this.speed = 10;

    this.game = game
    this.anchor.setTo(0.5)
    this.game.physics.arcade.enable(this)
    this.body.collideWorldBounds = true
    this.idle_countdown = IDLE_COUNTDOWN
  }

  setListOfTargets(targets, tileSize, tX, tY){
    this.listOfTargets = [];
    for(let i=0; i<targets.length; i++){
      this.listOfTargets.push(new Phaser.Point((targets[i].x + 0.5) * tileSize, (targets[i].y + 0.5) * tileSize));
    }
  }

  getTileLocation(tileSize){
    return new Phaser.Point(Math.floor(this.x / tileSize), Math.floor(this.y / tileSize));
  }

  update () {
    super.update();

    if(this.listOfTargets.length > 0){
      this.idle_countdown = IDLE_COUNTDOWN
      this.animations.play('walk')
      let target = this.listOfTargets[0];
      if(Math.abs(this.x - target.x) + Math.abs(this.y - target.y) < this.speed){
        this.x = target.x;
        this.y = target.y;
        this.listOfTargets.splice(0, 1);
      }
      else{
        let vector = new Phaser.Point(target.x - this.x, target.y- this.y);
        vector.normalize();
        this.x += vector.x * this.speed;
        this.y += vector.y * this.speed;
      }

    } else {
      if (this.idle_countdown == 0) {
        this.animations.play('idle')
      }
      else {
        this.idle_countdown -= 1
        this.animations.play('stopped')
      }
    }

  }
}
