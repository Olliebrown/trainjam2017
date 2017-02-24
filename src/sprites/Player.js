import Phaser from 'phaser'

export default class extends Phaser.Sprite {

  constructor ({ game, x, y }) {
    super(game, x, y, 'sewer-sprites', 10)

    this.listOfTargets = [];
    this.speed = 2;

    this.game = game
    this.anchor.setTo(0.5)
    this.game.physics.arcade.enable(this)
    this.body.collideWorldBounds = true
  }

  setListOfTargets(targets, tileSize){
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
      let target = this.listOfTargets[0];
      if(Math.abs(this.x - target.x) + Math.abs(this.y - target.Y) < 5){
        this.listOfTargets.splice(0, 1);
      }
      else{
        let vector = new Phaser.Point(target.x - this.x, target.y- this.y);
        vector.normalize();
        this.x += vector.x * this.speed;
        this.y += vector.y * this.speed;
      }

    }

  }
}
