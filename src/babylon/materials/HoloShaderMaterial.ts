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
 * Custom shader material that adds a subtle shimmer effect over card portraits.
 * Creates an elegant metallic sheen that follows the cursor position.
 */
export class HoloShaderMaterial extends ShaderMaterial {
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
        uniform vec2 mousePos;                // Mouse position (0-1)
        uniform float time;                   // Animation time

        void main(void) {
          // Sample base texture
          vec4 baseColor = texture2D(textureSampler, vUV);

          // Calculate distance from mouse position
          vec2 toMouse = vUV - mousePos;
          float distToMouse = length(toMouse);

          // Create animated shimmer sweep
          // Diagonal sweep pattern that animates
          float angle = atan(toMouse.y, toMouse.x);
          float sweepPos = sin(time * 2.0 + angle * 3.0);

          // Shimmer intensity based on distance from sweep line
          float shimmer = smoothstep(0.9, 0.5, abs(sweepPos - distToMouse * 2.0));

          // Add mouse proximity boost
          float mouseFactor = smoothstep(0.6, 0.0, distToMouse);
          shimmer = mix(shimmer, shimmer * 2.0, mouseFactor * 0.5);

          // Subtle edge glow (Fresnel-like effect)
          float edgeFactor = pow(1.0 - abs(vUV.x - 0.5) * 2.0, 4.0);
          edgeFactor *= pow(1.0 - abs(vUV.y - 0.5) * 2.0, 4.0);
          float edgeGlow = edgeFactor * 0.15;

          // Combine effects: base + shimmer + edge glow
          // Shimmer is pure white/silver at 25% opacity
          vec3 shimmerColor = vec3(1.0, 1.0, 1.0);
          vec3 glowColor = vec3(0.8, 0.9, 1.0); // Slight blue tint for edge

          vec3 finalColor = baseColor.rgb;
          finalColor += shimmerColor * shimmer * 0.25; // Subtle shimmer overlay
          finalColor += glowColor * edgeGlow; // Subtle edge glow

          gl_FragColor = vec4(finalColor, baseColor.a);
        }
      `;
    }

    super(name, scene, 'holo', {
      attributes: ['position', 'uv'],
      uniforms: [
        'worldViewProjection',
        'textureSampler',
        'mousePos',
        'time'
      ]
    });

    // Set base texture
    this.setTexture('textureSampler', baseTexture);

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
   * Update mouse position for cursor-following shimmer effect
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
    super.dispose();
  }
}
