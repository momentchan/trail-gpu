// Ribbon Fragment Shader
// Renders trail ribbons with color and debug highlighting

precision highp float;

// Uniforms
uniform vec3 uColor;                 // Base color of the ribbon
uniform int uDebug;                  // Debug mode (highlights specific segments)

// Varyings
varying float vSeg;                  // Segment index
varying float vTrail;                // Trail index
varying float vSide;                 // Side of ribbon
varying vec2 vUv;                    // UV coordinates

void main() {
    int segment = int(vSeg);
    
    // Debug highlighting
    float debugHighlight = (segment == uDebug) ? 1.0 : 0.0;
    
    // Mix base color with debug color
    vec3 color = mix(uColor, vec3(1.0, 0.0, 0.0), debugHighlight);
    
    csm_DiffuseColor = vec4(color, 1.0);
}
