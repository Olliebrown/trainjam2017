import Phaser from 'phaser'
import Item from '../sprites/Item'
import CombinedItem from '../sprites/CombinedItem'
import XButton from '../sprites/XButton'
import LaunchMicrowave from '../sprites/LaunchMicrowave'

const MIN_MICROWAVE = 2;
const MAX_MICROWAVE = 4;

export default class extends Phaser.State {
  init () {}
  preload () {}

  create () {
    this.items = [new Item({game: this.game, x: -1, y:-1, index:0}), new Item({game: this.game, x: -1, y:-1, index:1}),
      new Item({game: this.game, x: -1, y:-1, index:5}), new Item({game: this.game, x: -1, y:-1, index:2}),
      new Item({game: this.game, x: -1, y:-1, index:3})];
    for(let i=0; i<this.items.length; i++){
      this.game.add.existing(this.items[i]);
    }
    this.turnTheMicrowave = new LaunchMicrowave(this.game, this.game.width - 50, this.game.height/2, this.microwave);
    this.goBack = new XButton(this.game, 0, 0, this.getBack);
    this.game.add.existing(this.goBack);
    this.game.add.existing(this.turnTheMicrowave);

    this.game.camera.setPosition(0, 0);
  }

  getNumberOfItemsInMicrowave(){
    let result = 0;
    for(let i=0; i<this.items.length; i++){
      if(this.items[i].inMicrowave){
        result += 1;
      }
    }
    return result;
  }

  microwave(){
    let state = this.game.state.getCurrentState();
    if(state.getNumberOfItemsInMicrowave() >= MIN_MICROWAVE && state.getNumberOfItemsInMicrowave() <= MAX_MICROWAVE){
      let indeces = [];
      for(let i=0; i<state.items.length; i++){
        if(state.items[i].inMicrowave){
          state.items[i].destroy();
          indeces.push(state.items[i].index);
          state.items.splice(i, 1);
          i--;
        }
      }
      state.items.push(new CombinedItem({game:state.game, x:-1, y:-1, indeces:indeces}));
      state.game.add.existing(state.items[state.items.length - 1]);
      console.log("Microwaving....");
    }
    else{
      console.log("you need at least 2 items");
    }
  }

  getBack(){
    let items = this.game.state.getCurrentState().items;
    for(let i=0; i<items.length; i++){
      items[i].inMicrowave = false;
    }
    this.game.state.start("Game", true, false);
  }

  updateItemLocations(){
    let microwave = [];
    let outside = [];
    for(let i=0; i<this.items.length; i++){
      if(this.items[i].inMicrowave){
        microwave.push(this.items[i]);
      }
      else{
        outside.push(this.items[i]);
      }
    }

    for(let i=0; i<microwave.length; i++){
      microwave[i].x = this.game.width/2  + (i - microwave.length/2 + 0.5) * microwave[i].width;
      microwave[i].y = this.game.height/2 - microwave[i].height/2;
    }
    for(let i=0; i<outside.length; i++){
      outside[i].x = this.game.width/2  + (i - outside.length/2 + 0.5) * outside[i].width;
      outside[i].y = this.game.height - outside[i].height/2 - 20;
    }
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
