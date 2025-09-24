precision highp float;

uniform sampler2D uNodePrev;  // Nx1 RGBA (x,y,z,time)
uniform sampler2D uTrailNext;  // 1x1 RGBA (head, valid, advance, time)
uniform sampler2D uInputTex;  // 1x1 RGBA (x,y,z,1)
uniform int uNodes;  // number of nodes
uniform int uTrails;  // number of trails

varying vec2 vUv;

vec4 readNodePrev(int node, int trail) {
    float u = (float(node) + 0.5) / float(uNodes);
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uNodePrev, vec2(u, v));
}

vec4 readTrailNext(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uTrailNext, vec2(0.5, v));
}

vec3 readInputPos(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uInputTex, vec2(0.5, v)).xyz;
}

int pixelIndex() {
    float x = vUv.x * float(uNodes);
    return int(floor(x));
}


void main() {
    int node = int(float(gl_FragCoord.x - 0.5));
    int trail = int(float(gl_FragCoord.y - 0.5));

    vec4 prevNode = readNodePrev(node, trail);
    vec4 trailNext = readTrailNext(trail);
    int head = int(floor(trailNext.x + 0.5));
    float advance = trailNext.z;
    float time = trailNext.w;

    vec3 inputPos = readInputPos(trail);

    vec4 outNode = prevNode;
    if(advance > 0.5 && node == head) {
        outNode = vec4(inputPos, time);
    }

    gl_FragColor = outNode;
}