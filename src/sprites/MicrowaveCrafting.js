import Phaser from 'phaser'
import Item from '../sprites/Item'
import XButton from '../sprites/XButton'
import LaunchMicrowave from '../sprites/LaunchMicrowave'

const MIN_MICROWAVE = 2;
const MAX_MICROWAVE = 4;

export default class extends Phaser.Group {
  constructor (game) {
    super(game);

    this.turnTheMicrowave = new LaunchMicrowave(this.game, this.game.width - 50, this.game.height/2, this.microwave);
    this.goBack = new XButton(this.game, 0, 0, this.getBack);
    this.game.add.existing(this.goBack);
    this.game.add.existing(this.turnTheMicrowave);
    this.fixedToCamera = true;

    this.game.camera.setPosition(0, 0);
  }

  getNumberOfItemsInMicrowave(){
    let result = 0;
    for(let i=0; i<this.state.ui.inventory.length; i++){
      if(this.state.ui.inventory[i].inMicrowave){
        result += 1;
      }
    }
    return result;
  }

  microwave(){
    if(this.state.ui.microwave.getNumberOfItemsInMicrowave() >= MIN_MICROWAVE &&
      this.state.ui.microwave.getNumberOfItemsInMicrowave() <= MAX_MICROWAVE){
      let indeces = [];
      for(let i=0; i<this.state.ui.inventory.length; i++){
        if(this.state.items[i].inMicrowave){
          this.state.ui.inventory[i].destroy();
          indeces.push(state.items[i].index);
          this.state.ui.inventory.splice(i, 1);
          i--;
        }
      }
      this.state.ui.inventory.push(new Item({game:state.game, x:-1, y:-1,
        indeces:indeces, name:"", description: ""}));
      this.game.add.existing(this.state.ui.inventory[state.items.length - 1]);
      console.log("Microwaving....");
    }
    else{
      console.log("you need at least 2 items");
    }
  }

  getBack(){
    for(let i=0; i<this.state.ui.inventory.length; i++){
      items[i].inMicrowave = false;
    }
    this.destroy();
  }

  update(){
    this.updateItemLocations();

    if(this.game.input.activePointer.justPressed()){
      for(let i=0; i<this.items.length; i++){
        if(this.items[i].mouseOn(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY)){
          if(this.items[i].inMicrowave || this.getNumberOfItemsInMicrowave() < MAX_MICROWAVE){
            this.items[i].inMicrowave = !this.items[i].inMicrowave;
          }
          else{
            console.log("The Microwave is Full");
          }
          break;
        }
      }
      this.game.input.activePointer.reset();
    }
  }
}
