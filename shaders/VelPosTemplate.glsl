precision highp float;

uniform sampler2D uPositionsPrev;
uniform sampler2D uVelocitiesPrev;
uniform float uTimeSec;
uniform float uDeltaTime;
uniform float uParticleCount;

// Default physics uniforms
uniform vec3 uGravity;
uniform float uDamping;
uniform float uMaxSpeed;

// Output mode: 0 = position, 1 = velocity
uniform int uOutputMode;

varying vec2 vUv;

int pixelIndex() {
    float y = vUv.y * float(uParticleCount);
    return int(floor(y));
}

vec4 readParticlePos(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uPositionsPrev, vec2(0.5, v));
}

vec4 readParticleVel(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uVelocitiesPrev, vec2(0.5, v));
}

// Custom force function - override this in your shader
vec3 calculateCustomForces(vec3 pos, vec3 vel, float aux1, float aux2, float time) {
    // Add your custom forces here
    return vec3(0.0);
}

void main() {
    int idx = pixelIndex();
    
    vec4 posData = readParticlePos(idx);
    vec4 velData = readParticleVel(idx);
    
    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    float aux1 = posData.w;
    float aux2 = velData.w;
    
    if (uOutputMode == 0) {
        // Output position
        // Apply forces and integrate position
        vec3 totalForce = uGravity + calculateCustomForces(pos, vel, aux1, aux2, uTimeSec);
        
        // Integrate velocity
        vel += totalForce * uDeltaTime;
        
        // Apply damping
        vel *= (1.0 - uDamping * uDeltaTime);
        
        // Limit speed
        float speed = length(vel);
        if (speed > uMaxSpeed) {
            vel = normalize(vel) * uMaxSpeed;
        }
        
        // Integrate position
        pos += vel * uDeltaTime;
        
        gl_FragColor = vec4(pos, aux1);
    } else {
        // Output velocity (if using separate velocity texture)
        gl_FragColor = vec4(vel, aux2);
    }
}
