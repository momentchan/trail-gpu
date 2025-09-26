precision highp float;

// Uniforms
uniform sampler2D uNodePrev;         // Previous node positions (NxM: x, y, z, time)
uniform sampler2D uTrailCurr;        // Next trail state (1xM: head, valid, advance, time)
uniform sampler2D uInputTex;         // Input positions (1xM: x, y, z, 1)
uniform sampler2D uAdvanceTex;       // Advance texture (1xN: advance, 0)
uniform int uNodes;                  // Number of nodes per trail
uniform int uTrails;                 // Number of trails

varying vec2 vUv;

/**
 * Reads previous node data for a specific node and trail
 */
vec4 readNodePrev(int node, int trail) {
    float u = (float(node) + 0.5) / float(uNodes);
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uNodePrev, vec2(u, v));
}

/**
 * Reads next trail state for a specific trail
 */
vec4 readTrailNext(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uTrailCurr, vec2(0.5, v));
}

/**
 * Reads input position for a specific trail
 */
vec3 readInputPos(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uInputTex, vec2(0.5, v)).xyz;
}

void main() {
    // Get current node and trail indices from fragment coordinates
    int node = int(float(gl_FragCoord.x - 0.5));
    int trail = int(float(gl_FragCoord.y - 0.5));
    
    // Read previous node data
    vec4 prevNode = readNodePrev(node, trail);
    
    // Read next trail state
    vec4 trailNext = readTrailNext(trail);
    int head = int(floor(trailNext.x + 0.5));
    float advance = texture2D(uAdvanceTex, vec2(0.5, vUv.y)).r;
    float time = trailNext.w;
    
    // Read current input position
    vec3 inputPos = readInputPos(trail);
    
    // Initialize output with previous node data
    vec4 outNode = prevNode;
    
    // If trail is advancing and this is the head node, write new position
    if (advance > 0.5 && node == head) {
        outNode = vec4(inputPos, time);
    }
    
    // Output the node data
    gl_FragColor = outNode;
}
