// Tube Fragment Shader
// Renders trail tubes with color and lighting

precision highp float;

// Uniforms
uniform vec3 uColor;                 // Base color of the tube
uniform float uTime;                 // Time for animations
uniform int uDebug;                  // Debug mode

// Varyings
varying float vSeg;                  // Segment index
varying float vTrail;                // Trail index
varying float vRadial;               // Radial index
varying vec3 vWorldPos;              // World position
varying vec3 vTubeNormal;            // Normal vector
varying vec2 vUv;                    // UV coordinates

void main() {
    // Simple color with slight variation
    vec3 color = uColor;
    
    // Add subtle animation
    float pulse = sin(uTime * 2.0 + vSeg * 0.1) * 0.1 + 0.9;
    color *= pulse;
    
    // Debug highlighting
    if (uDebug > 0) {
        color = mix(color, vec3(1.0, 0.0, 0.0), 0.3);
    }
    
    csm_DiffuseColor = vec4(color, 1.0);
    csm_Roughness = 0.8;
    csm_Metalness = 0.2;
}
