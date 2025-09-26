import { ShaderDef } from "../spec/constants";
import { FullscreenQuad } from "../utils/FullscreenQuad";
import * as THREE from 'three';



export class TrailWriteNodePass {
    private material: THREE.ShaderMaterial;
    private fsq: FullscreenQuad;
    private u: { [k: string]: THREE.IUniform }

    constructor(
        private gl: THREE.WebGLRenderer,
        shader: ShaderDef,
        nodes: number,
        trails: number,
    ) {
        this.material = new THREE.ShaderMaterial({
            vertexShader: shader.vertex,
            fragmentShader: shader.fragment,
            uniforms: {
                uNodePrev: { value: null },
                uTrailCurr: { value: null },
                uAdvanceTex: { value: null },
                uInputTex: { value: null },
                uNodes: { value: nodes },
                uTrails: { value: trails },
                uTimeSec: { value: 0 },
            },
            depthTest: false,
            depthWrite: false,
            blending: THREE.NoBlending,
        });

        this.u = this.material.uniforms;
        this.fsq = new FullscreenQuad(this.material);
    }

    run(io: {
        nodePrev: THREE.Texture,
        trailCurr: THREE.Texture,
        advanceTex: THREE.Texture,
        inputTex: THREE.Texture,
        outRT: THREE.WebGLRenderTarget,
        timeSec: number,
    }) {
        this.u.uNodePrev.value = io.nodePrev;
        this.u.uTrailCurr.value = io.trailCurr;
        this.u.uAdvanceTex.value = io.advanceTex;
        this.u.uInputTex.value = io.inputTex;
        this.u.uTimeSec.value = io.timeSec;
        this.fsq.render(this.gl, io.outRT);
    }

    get materialRef() {
        return this.material;
    }
}