// Tube Vertex Shader
// Renders trails as 3D tubes with proper geometry and lighting

precision highp float;

// Uniforms
uniform sampler2D uNodeTex;          // Node positions (NxM: x, y, z, time)
uniform sampler2D uTrailTex;         // Trail state (1xM: head, valid, advance, time)
uniform float uBaseWidth;            // Base radius of the tube
uniform int uNodes;                  // Number of nodes per trail
uniform int uTrails;                 // Number of trails
uniform vec3 uCameraPos;             // Camera position

// Attributes
attribute float aSeg;                // Segment index [0...nodes-1]
attribute float aRadial;             // Radial index [0...segments-1]
attribute vec3 aNormal;              // Normal vector
attribute float aTrail;              // Trail index [0...trails-1]

// Varyings
varying float vSeg;                  // Segment index for fragment shader
varying float vTrail;                // Trail index for fragment shader
varying float vRadial;               // Radial index for fragment shader
varying vec3 vWorldPos;              // World position for lighting
varying vec3 vTubeNormal;            // Normal for lighting
varying vec2 vUv;                    // UV coordinates

/**
 * Reads node data for a specific node and trail
 */
vec4 readNode(int node, int trail) {
    float u = (float(node) + 0.5) / float(uNodes);
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uNodeTex, vec2(u, v));
}

/**
 * Reads trail head and valid count
 */
ivec2 readHeadValid(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    vec4 trailData = texture2D(uTrailTex, vec2(0.5, v));
    int head = int(floor(trailData.x + 0.5));
    int valid = int(floor(trailData.y + 0.5));
    return ivec2(head, valid);
}

/**
 * Converts logical index to physical buffer index
 * Handles circular buffer wrapping
 */
int logicalToPhysical(int i, int head, int valid, int nodes) {
    int start = (head - valid + 1 + nodes) % nodes;
    return (start + i) % nodes;
}

/**
 * Reads position by logical index
 * Handles edge cases for beginning and end of trail
 */
vec3 readPosByLogical(int i, int head, int valid, int nodes, int trail) {
    if (i < 0) i = 0;
    if (i >= valid) {
        return readNode(head, trail).xyz;
    }
    int k = logicalToPhysical(i, head, valid, nodes);
    return readNode(k, trail).xyz;
}

void main() {
    int trail = int(aTrail);
    int node = int(aSeg);
    float radial = aRadial;
    
    // Handle special cases for caps
    if (node < 0) {
        // This is a cap vertex - use simple positioning for now
        vec3 centerPos = vec3(0.0);
        vec3 normal = aNormal;
        
        if (node == -1) {
            // Start cap - use first valid position
            ivec2 hv = readHeadValid(trail);
            centerPos = readPosByLogical(0, hv.x, hv.y, uNodes, trail);
        } else if (node == -2) {
            // End cap - use last valid position
            ivec2 hv = readHeadValid(trail);
            centerPos = readPosByLogical(hv.y - 1, hv.x, hv.y, uNodes, trail);
        }
        
        // Simple cap positioning
        float radius = uBaseWidth;
        float angle = (radial / 8.0) * 2.0 * 3.14159265359;
        vec3 offset = vec3(cos(angle) * radius, 0.0, sin(angle) * radius);
        vec3 pos = centerPos + offset;
        
        vSeg = float(node);
        vTrail = float(trail);
        vRadial = radial;
        vWorldPos = pos;
        vTubeNormal = normal;
        vUv = uv;
        
        mat4 invModel = inverse(modelMatrix);
        mat3 invModel3 = mat3(invModel);
        
        vec3 posOS = (invModel * vec4(pos, 1.0)).xyz;
        vec3 normalOS = normalize(transpose(invModel3) * normal);
        
        csm_Position = posOS;
        csm_Normal = normalOS;
        return;
    }
    
    // Regular tube vertex
    // Read trail state
    ivec2 hv = readHeadValid(trail);
    int head = hv.x;
    int valid = hv.y;
    
    // Get current position
    vec3 p = readPosByLogical(node, head, valid, uNodes, trail);
    
    // Calculate tangent vector for proper tube orientation
    vec3 pPrev = readPosByLogical(node - 1, head, valid, uNodes, trail);
    vec3 pNext = readPosByLogical(node + 1, head, valid, uNodes, trail);
    vec3 tangent = normalize(pNext - pPrev);
    
    // Create orthogonal basis for tube cross-section
    vec3 side = normalize(cross(tangent, vec3(0.0, 1.0, 0.0)));
    if (length(side) < 0.1) {
        side = normalize(cross(tangent, vec3(1.0, 0.0, 0.0)));
    }
    vec3 up = normalize(cross(side, tangent));
    
    // Calculate tube radius with tapering
    float progress = float(node) / float(max(float(valid - 1), 1.0));
    float radius = uBaseWidth * (1.0 - progress * 0.5);
    
    // Position vertex around tube circumference
    float angle = (radial / 8.0) * 2.0 * 3.14159265359;
    vec3 offset = (side * cos(angle) + up * sin(angle)) * radius;
    vec3 pos = p + offset;
    
    // Calculate proper normal
    vec3 normal = normalize(offset);
    
    // Pass data to fragment shader
    vSeg = float(node);
    vTrail = float(trail);
    vRadial = radial;
    vWorldPos = pos;
    vTubeNormal = normal;
    vUv = uv;
    
    // Transform to object space
    mat4 invModel = inverse(modelMatrix);
    mat3 invModel3 = mat3(invModel);
    
    vec3 posOS = (invModel * vec4(pos, 1.0)).xyz;
    vec3 normalOS = normalize(transpose(invModel3) * normal);
    
    csm_Position = posOS;
    csm_Normal = normalOS;
}