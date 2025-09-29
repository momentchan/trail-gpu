// Tube Fragment Shader - Simplified
// Renders trail tubes with color and lighting

precision highp float;

// Uniforms
uniform vec3 uColor;                 // Base color of the tube
uniform float uTime;                 // Time for animations

// Varyings
varying float vSeg;                  // Segment index
varying float vTrail;                // Trail index
varying float vRadial;               // Radial index
varying vec3 vWorldPos;              // World position
varying vec3 vTubeNormal;            // Normal vector
varying vec2 vUv;                    // UV coordinates

void main() {
    // Bright color for visibility
    vec3 color = vec3(1.0, 0.0, 1.0); // Bright magenta
    
    // Add some variation based on trail and segment
    float variation = sin(vTrail * 0.5 + vSeg * 0.1 + uTime * 2.0) * 0.3 + 0.7;
    color *= variation;
    
    csm_DiffuseColor = vec4(color, 1.0);
    csm_Roughness = 0.5;
    csm_Metalness = 0.0;
}