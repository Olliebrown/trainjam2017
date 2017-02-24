import Phaser from 'phaser'
import TreeNode from './TreeNode'

export default class {
  constructor(mapWidth, mapHeight){
    this.collisionMatrix = [];
    for(let x=0; x<mapWidth; x++){
      this.collisionMatrix.push([]);
      for(let y=0; y<mapHeight; y++){
        this.collisionMatrix[x].push(0);
      }
    }
    this.directions = [new Phaser.Point(1,0), new Phaser.Point(0,1), new Phaser.Point(-1,0), new Phaser.Point(0, -1)];
  }

  getListOfPoints(currentNode){
    let normalList = [];
    let temp = currentNode;
    while(temp.parent != null){
      normalList.push(new Phaser.Point(temp.x, temp.y));
      temp = temp.parent;
    }
    return normalList.reverse();
  }

  checkInMatrix(x, y){
    return x >= 0 && y >=0 && x < this.collisionMatrix.length && y < this.collisionMatrix[0].length;
  }

  getTheNextLocation(pX, pY, tX, tY, collisionTiles){
    for(let i=0; i<collisionTiles.length; i++){
      this.collisionMatrix[collisionTiles[i].x][collisionTiles[i].y] = 1;
    }

    this.visitedNodes = {};
    this.nextNodes = [new TreeNode(pX, pY, null, tX, tY)];
    let currentNode = null;
    while(this.nextNodes.length > 0){
      this.nextNodes.sort((a, b)=>{return a.fitness - b.fitness});
      currentNode = this.nextNodes.splice(0, 1)[0];
      if(currentNode.x == tX && currentNode.y == tY){
        break;
      }
      if(!this.visitedNodes.hasOwnProperty(currentNode.x + "," + currentNode.y)){
        this.visitedNodes[currentNode.x + "," + currentNode.y] = true;
        for(let i=0; i<this.directions.length; i++){
          let newNode = new TreeNode(currentNode.x + this.directions[i].x, currentNode.y + this.directions[i].y, currentNode, tX, tY);
          if(this.checkInMatrix(newNode.x, newNode.y) && this.collisionMatrix[newNode.x][newNode.y] == 0){
            this.nextNodes.push(newNode);
          }
        }
      }
    }

    if(currentNode.x != tX || currentNode.y != tY){
      return [];
    }

    return this.getListOfPoints(currentNode);
  }
}
