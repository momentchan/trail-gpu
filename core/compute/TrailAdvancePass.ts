import * as THREE from 'three';
import { FullscreenQuad } from '../utils/FullscreenQuad';
import { AdvanceConfig, ShaderDef } from '../spec/constants';


export class TrailAdvancePass {
    private material: THREE.ShaderMaterial;
    private fsq: FullscreenQuad;
    private u: { [k: string]: THREE.IUniform }


    constructor(
        private gl: THREE.WebGLRenderer,
        shader: ShaderDef,
        private cfg: AdvanceConfig,
    ) {
        this.material = new THREE.ShaderMaterial({
            vertexShader: shader.vertex,
            fragmentShader: shader.fragment,
            uniforms: {
                uInputTex: { value: null },
                uNodePrev: { value: null },
                uTrailPrev: { value: null },
                uMode: { value: this.toModeEnum(cfg.mode) }, // 0 dist, 1 time, 2 external
                uMinStep: { value: cfg.distance?.minStep ?? 0.05 },
                uStepSec: { value: cfg.time?.stepSec ?? 0.05 },
                uExternalTex: { value: cfg.external?.texture ?? null },
                uTrails: { value: 0 },
                uNodes: { value: 0 },
                uTimeSec: { value: 0 },
                uDeltaTime: { value: 0 },
            },
            depthTest: false,
            depthWrite: false,
            blending: THREE.NoBlending,
        });

        this.u = this.material.uniforms;
        this.fsq = new FullscreenQuad(this.material);
    }

    setupDims(nodes: number, trails: number) {
        this.u.uNodes.value = nodes;
        this.u.uTrails.value = trails;
    }

    setMinStep(v: number) {
        this.u.uMinStep.value = v;
    }

    run(io: {
        inputTex: THREE.Texture;
        nodePrev: THREE.Texture;
        trailPrev: THREE.Texture;
        outRT: THREE.WebGLRenderTarget;
        timeSec: number;
        deltaTime: number;
    }) {
        this.u.uInputTex.value = io.inputTex;
        this.u.uNodePrev.value = io.nodePrev;
        this.u.uTrailPrev.value = io.trailPrev;
        this.u.uTimeSec.value = io.timeSec;
        this.u.uDeltaTime.value = io.deltaTime;

        this.fsq.render(this.gl, io.outRT);
    }

    private toModeEnum(m: AdvanceConfig['mode']) {
        return m === 'distance' ? 0 : m === 'time' ? 1 : 2;
    }


    get materialRef() {
        return this.material;
    }
}