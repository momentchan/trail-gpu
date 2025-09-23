precision highp float;

uniform sampler2D uTrailPrev;  // 1x1 RGBA (head, valid, unused, unused)
uniform sampler2D uNodePrev;  // Nx1 RGBA (x,y,z,time)
uniform sampler2D uInputTex;  // 1x1 RGBA (x,y,z,1)
uniform float uTimeSec;  // time in seconds
uniform float uUpdateDistanceMin;
uniform int uCount;  // number of nodes

vec4 readTrailPrev() {
    return texture2D(uTrailPrev, vec2(0.5));
}

vec4 readNodePrev(int k) {
    float u = (float(k) + 0.5) / float(uCount);
    return texture2D(uNodePrev, vec2(u, 0.5));
}

void main() {
    vec4 tp = readTrailPrev();
    int prevHead = int(floor(tp.x + 0.5));
    int prevValid = int(floor(tp.y + 0.5));

    vec3 inputPos = texture2D(uInputTex, vec2(0.5)).xyz;

    int newHead = prevHead;
    int newValid = prevValid;
    float advance = 0.0;

    if(prevHead < 0) {
        //first point
        newHead = 0;
        newValid = 1;
        advance = 1.0;
    } else {
        //check distance
        vec3 lastPos = readNodePrev(prevHead).xyz;
        float dist = distance(lastPos, inputPos);
        if(dist >= uUpdateDistanceMin) {
            newHead = (prevHead + 1) % uCount;
            newValid = min(prevValid + 1, uCount);
            advance = 1.0;
        }
    }
    gl_FragColor = vec4(float(newHead), float(newValid), advance, uTimeSec);
}
