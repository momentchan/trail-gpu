precision highp float;

uniform sampler2D uParticlesPrev;
uniform float uTimeSec;
uniform float uDeltaTime;
uniform float uSpeed;
uniform float uNoiseScale;
uniform float uTimeScale;
uniform float uParticleCount;

varying vec2 vUv;

int pixelIndex() {
    float y = vUv.y * float(uParticleCount);
    return int(floor(y));
}

vec4 readParticle(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uParticlesPrev, vec2(0.5, v));
}

float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453123); }
float noise3(vec3 p){
  vec3 i = floor(p), f = fract(p);
  float n000 = hash(i + vec3(0,0,0));
  float n100 = hash(i + vec3(1,0,0));
  float n010 = hash(i + vec3(0,1,0));
  float n110 = hash(i + vec3(1,1,0));
  float n001 = hash(i + vec3(0,0,1));
  float n101 = hash(i + vec3(1,0,1));
  float n011 = hash(i + vec3(0,1,1));
  float n111 = hash(i + vec3(1,1,1));
  vec3 u = f*f*(3.0-2.0*f);
  float nx00 = mix(n000,n100,u.x);
  float nx10 = mix(n010,n110,u.x);
  float nx01 = mix(n001,n101,u.x);
  float nx11 = mix(n011,n111,u.x);
  float nxy0 = mix(nx00,nx10,u.y);
  float nxy1 = mix(nx01,nx11,u.y);
  return mix(nxy0,nxy1,u.z)*2.0-1.0; // [-1,1]
}
// build a pseudo 3D vector field from 3 correlated noises
vec3 flow(vec3 p, float t){
  vec3 q = p + t;
  return normalize(vec3(
    noise3(vec3(q.y, q.z, q.x)),
    noise3(vec3(q.z, q.x, q.y)),
    noise3(vec3(q.x, q.y, q.z))
  ));
}


void main() {
    int idx = pixelIndex();

    vec4 prev = readParticle(idx);
    vec3 pos = prev.xyz;
    float aux = prev.w;

    float t = uTimeSec * uTimeScale;
    vec3 v= flow(pos * uNoiseScale, t);

    pos += v * uSpeed * uDeltaTime;

    gl_FragColor = vec4(pos, aux);  
}