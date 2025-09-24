// GPU Particle System Update Shader
// Updates particle positions using a 3D flow field based on noise

precision highp float;

// Uniforms
uniform sampler2D uParticlesPrev;    // Previous particle positions (1xN texture)
uniform float uTimeSec;              // Current time in seconds
uniform float uDeltaTime;            // Time delta for integration
uniform float uSpeed;                // Particle movement speed
uniform float uNoiseScale;           // Scale factor for noise coordinates
uniform float uTimeScale;            // Time scale for animation
uniform float uParticleCount;        // Total number of particles

varying vec2 vUv;

/**
 * Gets the particle index from UV coordinates
 */
int pixelIndex() {
    float y = vUv.y * float(uParticleCount);
    return int(floor(y));
}

/**
 * Reads particle data from the previous frame
 */
vec4 readParticle(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uParticlesPrev, vec2(0.5, v));
}

/**
 * Hash function for noise generation
 */
float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

/**
 * 3D Perlin-style noise function
 * Generates smooth noise values in the range [-1, 1]
 */
float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    // Get noise values at cube corners
    float n000 = hash(i + vec3(0, 0, 0));
    float n100 = hash(i + vec3(1, 0, 0));
    float n010 = hash(i + vec3(0, 1, 0));
    float n110 = hash(i + vec3(1, 1, 0));
    float n001 = hash(i + vec3(0, 0, 1));
    float n101 = hash(i + vec3(1, 0, 1));
    float n011 = hash(i + vec3(0, 1, 1));
    float n111 = hash(i + vec3(1, 1, 1));
    
    // Smooth interpolation
    vec3 u = f * f * (3.0 - 2.0 * f);
    
    // Interpolate along x-axis
    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);
    
    // Interpolate along y-axis
    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);
    
    // Interpolate along z-axis and normalize to [-1, 1]
    return mix(nxy0, nxy1, u.z) * 2.0 - 1.0;
}

/**
 * Generates a 3D flow field using correlated noise
 * Creates smooth, continuous vector field for particle movement
 */
vec3 flow(vec3 p, float t) {
    vec3 q = p + t;
    
    // Create three correlated noise values for x, y, z components
    // Using different coordinate permutations for variety
    return normalize(vec3(
        noise3(vec3(q.y, q.z, q.x)),  // x-component
        noise3(vec3(q.z, q.x, q.y)),  // y-component
        noise3(vec3(q.x, q.y, q.z))   // z-component
    ));
}

void main() {
    int idx = pixelIndex();
    
    // Read previous particle state
    vec4 prev = readParticle(idx);
    vec3 pos = prev.xyz;  // Position
    float aux = prev.w;   // Auxiliary data (unused in this implementation)
    
    // Calculate flow field velocity
    float t = uTimeSec * uTimeScale;
    vec3 velocity = flow(pos * uNoiseScale, t);
    
    // Update position using Euler integration
    pos += velocity * uSpeed * uDeltaTime;
    
    // Output new particle state
    gl_FragColor = vec4(pos, aux);
}
