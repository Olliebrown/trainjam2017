/* globals Game */
import Phaser from 'phaser'
import { Item } from './Item'
import { XButton, StartButton } from './Buttons'

const MIN_MICROWAVE = 2;
const MAX_MICROWAVE = 5;

export class MicrowaveCrafting extends Phaser.Group {
  constructor (game) {
    super(game);

    this.MAX_MICROWAVE = MAX_MICROWAVE
    this.MIN_MICROWAVE = MIN_MICROWAVE

    this.underlayer = new Phaser.Image(this.game,
      this.game.width/2 - 35, this.game.height/2 - 50, 'background', 1);
    this.underlayer.anchor.set(0.5);
    this.underlayer.scale.set(1.3)
    this.add(this.underlayer);

    this.background = new Phaser.Image(this.game,
      this.game.width/2, this.game.height/2 - 50, 'microwave', 1);
    this.background.anchor.set(0.5);
    this.background.scale.set(1.5)
    this.add(this.background);

    this.door = new Phaser.Image(this.game, this.background.x - 10, this.background.y + 20, 'door');
    this.door.anchor.set(0.5)
    this.door.scale.set(1.5);
    this.door.visible = false;
    this.add(this.door)
    this.game.world.bringToTop(this.door)

    this.turnTheMicrowave = new StartButton(this.game,
      this.background.x + this.background.width/2 - 114,
      this.background.y + this.background.height/2 - 59,
      this.microwave);
    this.turnTheMicrowave.scale.set(0.48)
    this.turnTheMicrowave.anchor.set(1);

    let style = {fontSize:'16px', fill:'#ffffff'};
    this.microwaveText = new Phaser.Text(this.game,
      this.turnTheMicrowave.x - 30, this.turnTheMicrowave.y - 12,
      'Start', style);
    this.microwaveText.anchor.set(1);

    this.goBack = new XButton(this.game,
      this.background.x - this.background.width/2 + 20,
      this.background.y - this.background.height/2, this.getBack);
    this.goBack.anchor.set(0);

    this.add(this.goBack);
    this.add(this.turnTheMicrowave);
    this.add(this.microwaveText);
    this.fixedToCamera = true;
    this.game.camera.setPosition(0, 0);

    this.alive = false;
    this.visible = false;
  }

  getNumberOfItemsInMicrowave() {
    let result = 0;
    for(let i=0; i<this.game.ui.inventoryLayer.length; i++){
      if(this.game.ui.inventoryLayer.getAt(i).inMicrowave){
        result += 1;
      }
    }
    return result;
  }

  getInMicrowave() {
    let items = []
    for(let i=0; i<this.game.ui.inventoryLayer.length; i++){
      if(this.game.ui.inventoryLayer.getAt(i).inMicrowave) {
        items.push(this.game.ui.inventoryLayer.getAt(i));
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

  microwave() {
    if(this.game.ui.microwave.getNumberOfItemsInMicrowave() >= MIN_MICROWAVE &&
       this.game.ui.microwave.getNumberOfItemsInMicrowave() <= MAX_MICROWAVE) {
      this.game.ui.microwave.door.visible = true;
      this.game.sounds.get('microwave_start').onStop.add(() => {
        this.game.sounds.play('microwave_done', 1)
        this.game.ui.microwave.microwavePhase2()
      })
      this.game.sounds.play('microwave_start', 1)
    } else {
      console.info('you need at least 2 items');
      this.game.sounds.play('inventory_full', 1)
    }
  }

  microwavePhase2() {
    let items = this.game.ui.microwave.getInMicrowave();
    this.game.ui.microwave.door.visible = false;
    let indices = [], removeIDs = []

    // Make new list of indices for combined item
    for(let i=0; i<items.length; i++){
      for(let j=0; j<items[i].indices.length; j++){
        indices.push(items[i].indices[j]);
      }
      removeIDs.push(items[i].invIndex)
    }

    // Remove items that are in the microwave from inventory
    let cascade = -1
    for(let r=0; r < removeIDs.length; r++) {
      let offset = false
      for(let i=0; i < this.game.ui.inventory.length - (r+1); i++) {

        let rID = removeIDs[r]
        if(rID == i) {
          offset = true
          cascade = Math.min(cascade, i)
        }

        if(offset) {
          this.game.ui.inventory[i] = this.game.ui.inventory[i + 1]
        }
      }
    }

    for(let i = 0; i<removeIDs.length; i++) {
      this.game.ui.inventory.pop();
    }

    this.game.ui.inventory.push(Item.convertFrameToGlobal(indices))
    this.game.ui.inventoryNeedsUpdate = true
    this.game.ui.inventoryCascade = cascade
    this.game.ui.inventoryShuffle = this.game.ui.inventory.length - 1

    this.game.ui.microwave.alive = false;
    this.game.ui.microwave.visible = false;
    Item.disableMicrowaveSelection(this.game)
  }

  getBack(){
    for(let i=0; i<this.game.ui.inventoryLayer.length; i++) {
      this.game.ui.inventoryLayer.getAt(i).inMicrowave = false;
    }

    this.game.ui.microwave.alive = false;
    this.game.ui.microwave.visible = false;
    Item.disableMicrowaveSelection(this.game)
  }

  update() {
    if(!this.alive) {
      return;
    }

    // if(this.game.input.activePointer.justPressed()) {
    //   for(let i=0; i<this.game.ui.inventoryLayer.length; i++){
    //     let item = this.game.ui.inventoryLayer.getAt(i)
    //     if(item.mouseOn(this.game.input.activePointer.x, this.game.input.activePointer.y)){
    //       if(this.getNumberOfItemsInMicrowave() < MAX_MICROWAVE) {
    //         item.inMicrowave = !item.inMicrowave;
    //         if(item.inMicrowave) {
    //           this.game.sounds.play('microwave_button', 4)
    //         }
    //       }
    //       else {
    //         this.game.sounds.play('inventory_full', 4)
    //       }
    //       break;
    //     }
    //   }
    //   this.game.input.activePointer.reset();
    // }
  }
}
