precision highp float;

uniform sampler2D uTrailPrev;        // Previous trail state (1xN: head, valid, advance, time)
uniform sampler2D uAdvanceTex;       // Advance texture (1xN: advance, 0)
uniform float uTimeSec;              // Current time in seconds

uniform int uNodes;                  // Number of nodes per trail
uniform int uFixedLen;               // Fixed length of trail

varying vec2 vUv;

void main() {
    vec4 prev = texture2D(uTrailPrev, vec2(0.5, vUv.y));
    int head = int(floor(prev.x + 0.5));
    int valid = int(floor(prev.y + 0.5));

    float adv = texture2D(uAdvanceTex, vec2(0.5, vUv.y)).r;

    bool empty = (valid <= 0 || head < 0 || head >= uNodes);

    if(adv > 0.5) {
        if(empty) {
            head = 0;
            valid = 1;
        } else {
            head = (head + 1) % uNodes;
            valid = min(valid + 1, uNodes);
        }
    }

    gl_FragColor = vec4(head, valid, 0.0, uTimeSec);
}
