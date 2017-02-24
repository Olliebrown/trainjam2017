import Phaser from 'phaser'
import Item from './Item'

export default class extends Phaser.Group {

  constructor ({ game, x, y, indeces }) {
    super(game);

    this.x = x;
    this.y = y;

    this.game = game
    this.game.physics.arcade.enable(this)
    this.items = [];
    this.inMicrowave = true;
    for(let i=0; i<indeces.length; i++){
      this.items.push(new Item({game:this.game, x:this.game.rnd.integerInRange(-20, 20), y:this.game.rnd.integerInRange(-20, 20), index:indeces[i]}));
      this.add(this.items[this.items.length - 1]);
    }
  }

  update () {
  }

  mouseOn(x, y){
    let hitted = false;
    for(let i=0; i<this.items.length; i++){
      hitted |= this.items[i].mouseOn(x, y);
    }
    return hitted;
  }

}
