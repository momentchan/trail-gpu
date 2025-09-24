// Trail Head Calculation Shader
// Determines when to advance the trail head based on distance threshold

precision highp float;

// Uniforms
uniform sampler2D uTrailPrev;        // Previous trail state (1xN: head, valid, advance, time)
uniform sampler2D uNodePrev;         // Previous node positions (NxM: x, y, z, time)
uniform sampler2D uInputTex;         // Input positions (1xN: x, y, z, 1)
uniform float uTimeSec;              // Current time in seconds
uniform float uUpdateDistanceMin;    // Minimum distance to trigger trail advancement
uniform int uNodes;                  // Number of nodes per trail
uniform int uTrails;                 // Number of trails

varying vec2 vUv;

/**
 * Gets trail index from UV coordinates
 */
int trailIndexFromUV(vec2 uv) {
    return int(floor(uv.y * float(uTrails)));
}

/**
 * Reads input position for a specific trail
 */
vec4 readInputForTrail(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uInputTex, vec2(0.5, v));
}

/**
 * Gets UV coordinates for a specific node in a trail
 */
vec2 nodeUV(int node, int trail) {
    float u = (float(node) + 0.5) / float(uNodes);
    float v = (float(trail) + 0.5) / float(uTrails);
    return vec2(u, v);
}

/**
 * Gets UV coordinates for a specific trail
 */
vec2 trailUV(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return vec2(0.5, v);
}

void main() {
    int trail = trailIndexFromUV(vUv);
    
    // Read previous trail state
    vec4 trailPrev = texture2D(uTrailPrev, trailUV(trail));
    int head = int(floor(trailPrev.x + 0.5));
    int valid = int(floor(trailPrev.y + 0.5));
    
    // Read current input position
    vec3 inputPos = readInputForTrail(trail).xyz;
    
    // Initialize new state
    int newHead = head;
    int newValid = valid;
    float advance = 0.0;
    
    // Check if trail is empty (first point)
    bool empty = (valid <= 0 || head < 0 || head >= uNodes);
    
    if (empty) {
        // First point: initialize trail
        newHead = 0;
        newValid = 1;
        advance = 1.0;
    } else {
        // Check distance threshold
        vec3 lastPos = texture2D(uNodePrev, nodeUV(head, trail)).xyz;
        float distance = distance(lastPos, inputPos);
        
        if (distance >= uUpdateDistanceMin) {
            // Advance trail head
            newHead = (head + 1) % uNodes;
            newValid = min(valid + 1, uNodes);
            advance = 1.0;
        }
        // If distance is too small, keep current state (advance = 0.0)
    }
    
    // Output new trail state: (head, valid, advance, time)
    gl_FragColor = vec4(float(newHead), float(newValid), advance, uTimeSec);
}
