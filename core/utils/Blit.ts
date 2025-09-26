// trail-gpu/core/compute/_blit.ts
import * as THREE from 'three';
import { FullscreenQuad } from './FullscreenQuad';

const blitVS = /* glsl */ `
precision highp float;
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const blitFS = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
varying vec2 vUv;
void main(){
  gl_FragColor = texture2D(uTex, vUv);
}
`;

export class Blitter {
    private mat: THREE.ShaderMaterial;
    private fsq: FullscreenQuad;
    private u: { [k: string]: THREE.IUniform };

    constructor(private gl: THREE.WebGLRenderer) {
        this.mat = new THREE.ShaderMaterial({
            vertexShader: blitVS,
            fragmentShader: blitFS,
            uniforms: { uTex: { value: null } },
            depthTest: false, depthWrite: false, blending: THREE.NoBlending
        });
        this.u = this.mat.uniforms;
        this.fsq = new FullscreenQuad(this.mat);
    }

    copy(tex: THREE.Texture, target: THREE.WebGLRenderTarget) {
        this.u.uTex.value = tex;
        this.fsq.render(this.gl, target);
    }
}
