import Phaser from 'phaser'
import Glow from '../filters/Glow'

export default class Item extends Phaser.Group {

  constructor ({ game, x, y, indeces, name, description}) {
    super(game);

    this.mainX = x;
    this.mainY = y;

    this.sprites = [];
    this.indeces = indeces;
    for(let i=0; i<indeces.length; i++){
        let sprite = new Phaser.Sprite(game, this.mainX, this.mainY, 'sewer-sprites', indeces[i]);
        sprite.anchor.set(0.5, 0.5);
        sprite.scale.setTo(0.45, 0.45)
        this.game.physics.arcade.enable(sprite);
        this.sprites.push(sprite);
        this.add(sprite);
      }

    this.game = game
    this.fixedToCamera = true
    this.inMicrowave = false;

    this.name = name
    this.description = description
    // this.filters = [ new Glow(game) ]

    // console.info('Picked up ' + this.name + ' with index ' + tile.index)
  }

  update () {
    for(let i=0; i<this.sprites.length; i++){
      if(this.inMicrowave){
        this.sprites[i].x = this.game.width / 2 + (i - microwave.length/2 + 0.5) * this.sprites[i].width;
        this.sprites[i].y = this.game.height / 2;
      }
      else{
        this.sprites[i].x = this.mainX;
        this.sprites[i].y = this.mainY;
      }

    }
  }

  mouseOn(x, y){
    let hitted = false;
    for(let i=0; i<this.sprites.length; i++){
      hitted |= this.sprites[i].body.hitTest(x, y);
    }
    return hitted;
  }

  copy (x, y) {
    return new Item({
      game: this.game,
      x: x,
      y: y,
      indeces: this.indeces,
      name: this.name,
      description: this.description
    })
  }

}
