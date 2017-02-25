export const centerGameObjects = (objects) => {
  objects.forEach(function (object) {
    object.anchor.setTo(0.5)
  })
}

export const setResponsiveWidth = (sprite, percent, parent) => {
  let percentWidth = (sprite.texture.width - (parent.width / (100 / percent))) * 100 / sprite.texture.width
  sprite.width = parent.width / (100 / percent)
  sprite.height = sprite.texture.height - (sprite.texture.height * percentWidth / 100)
}

export const loadAudio = (game, key, file) => {
  if (game.device.iOS || game.device.safari) {
    game.load.audio(key, [file + '.m4a'])
  } else {
    game.load.audio(key, [file + '.ogg', file + '.mp3', file + '.ac3'])
  }
}

export const getRandomIntInclusive = (min, max)  => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const shuffleArray = (array, rnd) => {
  for(let i=0; i<2 * array.length; i++){
    let i1 = rnd.integerInRange(0, array.length - 1);
    let i2 = rnd.integerInRange(0, array.length - 1);
    let temp = array[i1]
    array[i1] = array[i2]
    array[i2] = temp
  }
}
