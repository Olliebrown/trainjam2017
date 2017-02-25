import Phaser from 'phaser'
import Item from '../sprites/Item'
import XButton from '../sprites/XButton'
import LaunchMicrowave from '../sprites/LaunchMicrowave'

const MIN_MICROWAVE = 2;
const MAX_MICROWAVE = 4;

export class MicrowaveCrafting extends Phaser.Group {
  constructor (game) {
    super(game);

    this.background = new Phaser.Image(this.game, this.game.width/2, this.game.height/2 - 50, 'background');
    this.background.anchor.set(0.5);
    this.add(this.background);
    this.turnTheMicrowave = new LaunchMicrowave(this.game, this.background.x + this.background.width/2,
      this.background.y + this.background.height/2 - 30, this.microwave);
    this.turnTheMicrowave.anchor.set(1);
    this.goBack = new XButton(this.game, this.background.x - this.background.width/2 + 10,
      this.background.y - this.background.height/2 + 10, this.getBack);
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

  getInMicrowave(){
    let items = [];
    for(let i=0; i<this.game.ui.inventory.length; i++){
      if(this.game.ui.inventory[i].inMicrowave){
        items.push(this.game.ui.inventory[i]);
      }
    }
    return items;
  }

  getInventoryIndex(object){
    let items = this.getInMicrowave();

    for(let i=0; i<items.length; i++){
      if(object == items[i]){
        return i;
      }
    }
  }

  microwave(){
    if(this.game.ui.microwave.getNumberOfItemsInMicrowave() >= MIN_MICROWAVE &&
      this.game.ui.microwave.getNumberOfItemsInMicrowave() <= MAX_MICROWAVE){
      let items = this.game.ui.microwave.getInMicrowave();
      let indeces = [];
      for(let i=0; i<items.length; i++){
        for(let j=0; j<items[i].indeces.length; j++){
          indeces.push(items[i].indeces[j]);
        }
        items[i].onBtnClose(items[i].closeBtn);
      }
      this.game.ui.inventory.push(new Item({game:this.game, x:-1, y:-1,
        indeces:indeces, name:"", description: "", invIndex:this.game.ui.inventory.length}));
      this.game.add.existing(this.state.ui.inventory[this.game.ui.inventory.length - 1]);
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
    if(!this.alive){
      return;
    }
    if(this.game.input.activePointer.justPressed()){
      for(let i=0; i<this.game.ui.inventory.length; i++){
        if(this.game.ui.inventory[i].mouseOn(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY)){
          if(this.game.ui.inventory[i].inMicrowave || this.getNumberOfItemsInMicrowave() < MAX_MICROWAVE){
            this.game.ui.inventory[i].inMicrowave = !this.game.ui.inventory[i].inMicrowave;
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
