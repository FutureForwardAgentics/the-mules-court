import {
  ShaderMaterial,
  Scene,
  Texture,
  Vector2,
  Effect
} from '@babylonjs/core';

/**
 * HoloShaderMaterial
 *
 * Custom shader material that creates a holographic/iridescent effect
 * with cursor-following rainbow shimmer.
 */
export class HoloShaderMaterial extends ShaderMaterial {
  private rainbowTexture: Texture;
  private distortionTexture: Texture;
  private sparkleTexture: Texture;
  private time: number = 0;

  constructor(name: string, scene: Scene, baseTexture: Texture) {
    // Register the shader if not already registered
    if (!Effect.ShadersStore['holoVertexShader']) {
      Effect.ShadersStore['holoVertexShader'] = `
        precision highp float;

        // Attributes
        attribute vec3 position;
        attribute vec2 uv;

        // Uniforms
        uniform mat4 worldViewProjection;

        // Varying
        varying vec2 vUV;

        void main(void) {
          gl_Position = worldViewProjection * vec4(position, 1.0);
          vUV = uv;
        }
      `;

      Effect.ShadersStore['holoFragmentShader'] = `
        precision highp float;

        // Varying
        varying vec2 vUV;

        // Uniforms
        uniform sampler2D textureSampler;     // Base card texture
        uniform sampler2D rainbowSampler;     // Rainbow gradient
        uniform sampler2D distortionSampler;  // Distortion map
        uniform sampler2D sparkleSampler;     // Sparkle pattern
        uniform vec2 mousePos;                // Mouse position (0-1)
        uniform float time;                   // Animation time

        void main(void) {
          // Sample base texture
          vec4 baseColor = texture2D(textureSampler, vUV);

          // Calculate distance from mouse position for cursor-following effect
          vec2 toMouse = vUV - mousePos;
          float distToMouse = length(toMouse);
          float mouseFactor = smoothstep(0.8, 0.0, distToMouse); // Stronger near mouse

          // Animated distortion for shimmer effect
          vec2 distortionUV = vUV + vec2(time * 0.03, time * 0.02);
          vec2 distortion = texture2D(distortionSampler, distortionUV).rg * 0.05;

          // Sample rainbow with mouse-relative offset and distortion
          vec2 rainbowUV = vUV + toMouse * 0.2 + distortion;
          rainbowUV.x += time * 0.1; // Animated scroll
          vec4 rainbowColor = texture2D(rainbowSampler, rainbowUV);

          // Sample sparkles with animated rotation
          float angle = time * 0.5;
          vec2 sparkleUV = vUV - vec2(0.5);
          sparkleUV = vec2(
            sparkleUV.x * cos(angle) - sparkleUV.y * sin(angle),
            sparkleUV.x * sin(angle) + sparkleUV.y * cos(angle)
          ) + vec2(0.5);
          vec4 sparkleColor = texture2D(sparkleSampler, sparkleUV + distortion);

          // Blend holographic effect based on mouse proximity
          float holoStrength = mouseFactor * 0.4 + 0.1; // Always subtle, stronger near mouse
          vec4 holoEffect = mix(baseColor, rainbowColor, holoStrength);
          holoEffect += sparkleColor * mouseFactor * 0.3; // Sparkles only near mouse

          // Add edge iridescence (view-angle dependent simulation)
          float edgeFactor = pow(1.0 - abs(vUV.x - 0.5) * 2.0, 3.0);
          edgeFactor *= pow(1.0 - abs(vUV.y - 0.5) * 2.0, 3.0);
          holoEffect += rainbowColor * edgeFactor * 0.2;

          gl_FragColor = holoEffect;
        }
      `;
    }

    super(name, scene, 'holo', {
      attributes: ['position', 'uv'],
      uniforms: [
        'worldViewProjection',
        'textureSampler',
        'rainbowSampler',
        'distortionSampler',
        'sparkleSampler',
        'mousePos',
        'time'
      ]
    });

    // Load textures
    this.setTexture('textureSampler', baseTexture);

    this.rainbowTexture = new Texture('/img/shaders/rainbow_gradient.png', scene);
    this.setTexture('rainbowSampler', this.rainbowTexture);

    this.distortionTexture = new Texture('/img/shaders/distortion_map.png', scene);
    this.setTexture('distortionSampler', this.distortionTexture);

    this.sparkleTexture = new Texture('/img/shaders/sparkle_pattern.png', scene);
    this.setTexture('sparkleSampler', this.sparkleTexture);

    // Initialize uniforms
    this.setVector2('mousePos', new Vector2(0.5, 0.5));
    this.setFloat('time', 0);

    // Setup animation
    scene.onBeforeRenderObservable.add(() => {
      this.time += scene.getEngine().getDeltaTime() / 1000.0;
      this.setFloat('time', this.time);
    });
  }

  /**
   * Update mouse position for cursor-following effect
   * @param x Mouse X position (0-1, normalized)
   * @param y Mouse Y position (0-1, normalized)
   */
  public updateMousePosition(x: number, y: number): void {
    this.setVector2('mousePos', new Vector2(x, y));
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.rainbowTexture.dispose();
    this.distortionTexture.dispose();
    this.sparkleTexture.dispose();
    super.dispose();
  }
}
