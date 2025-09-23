precision highp float;

uniform sampler2D uNodePrev;  // Nx1 RGBA (x,y,z,time)
uniform sampler2D uTrailNext;  // 1x1 RGBA (head, valid, advance, time)
uniform sampler2D uInputTex;  // 1x1 RGBA (x,y,z,1)
uniform int uCount;  // number of nodes

varying vec2 vUv;

int pixelIndex() {
    float x = vUv.x * float(uCount);
    return int(floor(x));
}

vec4 readNodePrev(int k) {
    float u = (float(k) + 0.5) / float(uCount);
    return texture2D(uNodePrev, vec2(u, 0.5));
}

void main() {
    int idx = pixelIndex();
    vec4 prevNode = readNodePrev(idx);

    vec4 trailNext = texture2D(uTrailNext, vec2(0.5));
    int newHead = int(floor(trailNext.x + 0.5));
    float advance = trailNext.z;
    float time = trailNext.w;

    vec3 inputPos = texture2D(uInputTex, vec2(0.5)).xyz;

    vec4 outNode = prevNode;
    if(advance > 0.5 && idx == newHead) {
        outNode = vec4(inputPos, time);
    }

    gl_FragColor = outNode;
}