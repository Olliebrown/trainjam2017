import Phaser from 'phaser'
import Item from '../sprites/Item'
import XButton from '../sprites/XButton'
import LaunchMicrowave from '../sprites/LaunchMicrowave'

const MIN_MICROWAVE = 2;
const MAX_MICROWAVE = 4;

export class MicrowaveCrafting extends Phaser.Group {
  constructor (game) {
    super(game);

    let temp = new Phaser.Image(this.game, this.game.width/2, this.game.height/2 - 50, 'background');
    temp.anchor.set(0.5);
    this.add(temp);
    this.turnTheMicrowave = new LaunchMicrowave(this.game, temp.x + temp.width/2, temp.y + temp.height/2 - 30, this.microwave);
    this.turnTheMicrowave.anchor.set(1);
    this.goBack = new XButton(this.game, temp.x - temp.width/2 + 10, temp.y - temp.height/2 + 10, this.getBack);
    this.goBack.anchor.set(0);
    this.add(this.goBack);
    this.add(this.turnTheMicrowave);
    this.fixedToCamera = true;
    this.game.camera.setPosition(0, 0);

    this.alive = false;
    this.visible = false;
  }

  getNumberOfItemsInMicrowave(){
    let result = 0;
    for(let i=0; i<this.game.ui.inventory.length; i++){
      if(this.game.ui.inventory[i].inMicrowave){
        result += 1;
      }
    }
    return result;
  }

  microwave(){
    if(this.game.ui.microwave.getNumberOfItemsInMicrowave() >= MIN_MICROWAVE &&
      this.game.ui.microwave.getNumberOfItemsInMicrowave() <= MAX_MICROWAVE){
      let indeces = [];
      for(let i=0; i<this.game.ui.inventory.length; i++){
        if(this.game.items[i].inMicrowave){
          this.game.ui.inventory[i].destroy();
          indeces.push(state.items[i].index);
          this.game.ui.inventory.splice(i, 1);
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
    for(let i=0; i<this.game.ui.inventory.length; i++){
      this.game.ui.inventory[i].inMicrowave = false;
    }
    this.game.ui.microwave.alive = false;
    this.game.ui.microwave.visible = false;
  }

  update(){
    if(this.game.input.activePointer.justPressed()){
      for(let i=0; i<this.game.ui.inventory.length; i++){
        if(this.game.ui.inventory[i].mouseOn(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY)){
          if(this.game.ui.inventory[i].inMicrowave || this.getNumberOfItemsInMicrowave() < MAX_MICROWAVE){
            this.game.ui.inventory[i].inMicrowave = !this.items[i].inMicrowave;
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
