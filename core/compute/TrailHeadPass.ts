// trail-gpu/core/compute/TrailHeadPass.ts
import * as THREE from 'three';
import { ShaderDef } from '../spec/constants';
import { FullscreenQuad } from '../utils/FullscreenQuad';

export class TrailHeadPass {
  private material: THREE.ShaderMaterial;
  private fsq: FullscreenQuad;
  private u: { [k: string]: THREE.IUniform };

  constructor(
    private gl: THREE.WebGLRenderer,
    shader: ShaderDef,
    nodes: number,
    trails: number,
    fixedLength: boolean
  ) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: shader.vertex,
      fragmentShader: shader.fragment,
      uniforms: {
        uTrailPrev:  { value: null }, // 1×M
        uAdvanceTex: { value: null }, // 1×M (R 0/1)
        uNodes:      { value: nodes },
        uTrails:     { value: trails },
        uFixedLen:   { value: fixedLength ? 1 : 0 },
        uTimeSec:    { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    this.u = this.material.uniforms;
    this.fsq = new FullscreenQuad(this.material);
  }

  setFixedLength(on: boolean) {
    this.u.uFixedLen.value = on ? 1 : 0;
  }

  run(io: {
    trailPrev: THREE.Texture;
    advanceTex: THREE.Texture;
    outRT: THREE.WebGLRenderTarget;
    timeSec: number;
  }) {
    this.u.uTrailPrev.value  = io.trailPrev;
    this.u.uAdvanceTex.value = io.advanceTex;
    this.u.uTimeSec.value    = io.timeSec;
    this.fsq.render(this.gl, io.outRT);
  }

  get materialRef() { return this.material; }
}
