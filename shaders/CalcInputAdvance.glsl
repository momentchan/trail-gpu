precision highp float;

varying vec2 vUv;

uniform sampler2D uInputTex;     // 1×M, xyz = candidate position
uniform sampler2D uNodePrev;     // N×M, xyz = last written node at index=head
uniform sampler2D uTrailPrev;    // 1×M, RG = (head, valid)
uniform float uMinStep;
uniform int   uNodes;
uniform int   uTrails;

int trailIndexFromUV(vec2 uv) {
  return int(floor(uv.y * float(uTrails)));
}
vec2 trailUV(int trail) {
  float v = (float(trail) + 0.5) / float(uTrails);
  return vec2(0.5, v);
}
vec2 nodeUV(int node, int trail) {
  float u = (float(node) + 0.5) / float(uNodes);
  float v = (float(trail) + 0.5) / float(uTrails);
  return vec2(u, v);
}

void main() {
  // which trail row are we on (since this is a 1×M target)
  int trail = trailIndexFromUV(vUv);

  // prev state
  vec4 prev = texture2D(uTrailPrev, trailUV(trail));
  int head  = int(floor(prev.x + 0.5));
  int valid = int(floor(prev.y + 0.5));

  // empty?
  bool empty = (valid <= 0 || head < 0 || head >= uNodes);

  // read input candidate
  vec3 inputPos = texture2D(uInputTex, trailUV(trail)).xyz;

  float adv = 0.0;
  if (empty) {
    // first point should advance
    adv = 1.0;
  } else {
    // read last node at current head
    vec3 lastPos = texture2D(uNodePrev, nodeUV(head, trail)).xyz;
    float d = distance(lastPos, inputPos);
    adv = step(uMinStep, d);
  }

  // output R=advance flag
  gl_FragColor = vec4(adv, 0.0, 0.0, 1.0);
}
