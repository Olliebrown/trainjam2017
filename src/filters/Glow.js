import Phaser from 'phaser'

export default class extends Phaser.Filter {
  constructor(game) {
    super(game)

    this.fragmentSrc = `
      precision lowp float;
      varying vec2 vTextureCoord;
      varying vec4 vColor;
      uniform sampler2D uSampler;
      uniform vec4 date;

      void main() {
        vec4 sum = vec4(0);
        vec2 texcoord = vTextureCoord;

        vec4 baseColor = texture2D(uSampler, texcoord);
        if(baseColor.a > 0.3)
        {
          gl_FragColor = baseColor;
        }
        else
        {
          for(int xx = -2; xx <= 2; xx++) {
            for(int yy = -2; yy <= 2; yy++) {
              float dist = sqrt(float(xx*xx) + float(yy*yy));
              float factor = 0.0;
              if (dist == 0.0) {
                factor = 2.0;
              } else {
                factor = 2.0/dist;
              }
              sum += texture2D(uSampler, texcoord + vec2(xx, yy) * 0.002) * factor;
            }
          }
          vec4 blur = sum * 0.111111;
          gl_FragColor = vec4(blur.g, blur.g, 0.0, blur.a);
        }
      }`;
  }
}
