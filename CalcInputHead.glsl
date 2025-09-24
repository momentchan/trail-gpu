precision highp float;

uniform sampler2D uTrailPrev;  // 1xtrails RGBA (head, valid, unused, unused)
uniform sampler2D uNodePrev;  // nodes x trails RGBA (x,y,z,time)
uniform sampler2D uInputTex;  // 1xtrails RGBA (x,y,z,1)
uniform float uTimeSec;  // time in seconds
uniform float uUpdateDistanceMin;
uniform int uNodes;  // number of nodes
uniform int uTrails;  // number of trails
varying vec2 vUv;

int trailIndexFromUV(vec2 uv) {
    return int(floor(uv.y * float(uTrails)));
}

vec4 readInputForTrail(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uInputTex, vec2(0.5, v));
}

vec2 nodeUV(int node, int trail) {
    float u = (float(node) + 0.5) / float(uNodes);
    float v = (float(trail) + 0.5) / float(uTrails);
    return vec2(u, v);
}

vec2 trailUV(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return vec2(0.5, v);
}

vec4 readTrailPrev(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uTrailPrev, vec2(0.5, v));
}

vec4 readNodePrev(int node, int trail) {
    float u = (float(node) + 0.5) / float(uNodes);
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uNodePrev, vec2(u, v));
}

vec3 readInputPos(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uInputTex, vec2(0.5, v)).xyz;
}

void main() {
    int trail = trailIndexFromUV(vUv);

    vec4 tp = texture2D(uTrailPrev, trailUV(trail));
    int head = int(floor(tp.x + 0.5));
    int valid = int(floor(tp.y + 0.5));

    vec3 inputPos = readInputPos(trail);

    int newHead = head;
    int newValid = valid;
    float advance = 0.0;

    bool empty = (valid <= 0 || head < 0 || head >= uNodes);
    if(empty) {
        //first point
        newHead = 0;
        newValid = 1;
        advance = 1.0;
    } else {
        //check distance
        vec3 lastPos = readNodePrev(head, trail).xyz;
        if(distance(lastPos, inputPos) >= uUpdateDistanceMin) {
            newHead = (head + 1) % uNodes;
            newValid = min(valid + 1, uNodes);
            advance = 1.0;
        }
    }
    gl_FragColor = vec4(float(newHead), float(newValid), advance, uTimeSec);
}
