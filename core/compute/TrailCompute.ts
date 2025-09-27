import * as THREE from 'three';
import { RenderTargetPool } from './RenderTargetPool';
import { TrailAdvancePass } from './TrailAdvancePass';
import { TrailHeadPass } from './TrailHeadPass';
import { TrailWriteNodePass } from './TrailWriteNodePass';
import { Blitter } from '../utils/Blit';
import { assertPositive, validateRenderer } from '../spec/validators';
import { makeRTParams, ShaderPack, TrailConfig } from '../spec/constants';
import { RenderTargetUtils } from '../utils/RenderTargetUtils';

export interface TrailTextures {
    trail: THREE.WebGLRenderTarget;    // 1 x M
    node: THREE.WebGLRenderTarget;     // N x M
    input: THREE.WebGLRenderTarget;    // 1 x M
}

export class TrailCompute {
    private pool: RenderTargetPool;
    private rtParams: THREE.RenderTargetOptions;

    private trailA!: THREE.WebGLRenderTarget;
    private trailB!: THREE.WebGLRenderTarget;
    private nodeA!: THREE.WebGLRenderTarget;
    private nodeB!: THREE.WebGLRenderTarget;
    private inputRT!: THREE.WebGLRenderTarget;
    private advanceRT!: THREE.WebGLRenderTarget;


    private advancePass: TrailAdvancePass;
    private headPass: TrailHeadPass;
    private writePass: TrailWriteNodePass;


    private blitter: Blitter;
    private flip = false;
    private disposed = false;


    constructor(
        private gl: THREE.WebGLRenderer,
        private cfg: TrailConfig,
        shaders: ShaderPack,
        pool?: RenderTargetPool,
    ) {
        validateRenderer(gl);
        assertPositive(cfg.trailsNum, 'trailsNum');
        assertPositive(cfg.nodesPerTrail, 'nodesPerTrail');

        this.pool = pool ?? new RenderTargetPool();
        this.rtParams = makeRTParams();

        this.trailA = this.pool.get(1, cfg.trailsNum, this.rtParams);
        this.trailB = this.pool.get(1, cfg.trailsNum, this.rtParams);
        this.nodeA = this.pool.get(cfg.nodesPerTrail, cfg.trailsNum, this.rtParams);
        this.nodeB = this.pool.get(cfg.nodesPerTrail, cfg.trailsNum, this.rtParams);
        this.inputRT = this.pool.get(1, cfg.trailsNum, this.rtParams);
        this.advanceRT = this.pool.get(1, cfg.trailsNum, this.rtParams);

        RenderTargetUtils.clearRT(this.gl, this.trailA, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.trailB, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.nodeA, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.nodeB, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.inputRT, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.advanceRT, new THREE.Color(0, 0, 0));

        this.advancePass = new TrailAdvancePass(this.gl, shaders.advance, cfg.advance);
        this.advancePass.setupDims(cfg.nodesPerTrail, cfg.trailsNum);
        this.headPass = new TrailHeadPass(this.gl, shaders.head, cfg.nodesPerTrail, cfg.trailsNum, cfg.fixedLength ?? false);
        this.writePass = new TrailWriteNodePass(this.gl, shaders.write, cfg.nodesPerTrail, cfg.trailsNum);

        this.blitter = new Blitter(this.gl);
    }

    writeInputFromTexture(srcTex: THREE.Texture) {
        this.ensureAlive();
        this.blitter.copy(srcTex, this.inputRT);
    }

    step(timeSec: number, deltaTime: number) {
        this.ensureAlive();
        const read = this.flip ? this.getTexB() : this.getTexA();
        const write = this.flip ? this.getTexA() : this.getTexB();

        // advance
        this.advancePass.run({
            inputTex: read.input.texture,
            nodePrev: read.node.texture,
            trailPrev: read.trail.texture,
            outRT: this.advanceRT,
            timeSec,
            deltaTime
        });

        // update head/valid
        this.headPass.run({
            trailPrev: read.trail.texture,
            advanceTex: this.advanceRT.texture,
            outRT: write.trail,
            timeSec,
        });


        // write node
        this.writePass.run({
            nodePrev: read.node.texture,
            trailCurr: write.trail.texture,
            advanceTex: this.advanceRT.texture,
            inputTex: read.input.texture,
            outRT: write.node,
            timeSec,
        });

        this.flip = !this.flip;
    }

    resize(nodesPerTrail: number, trailsNum: number) {
        this.ensureAlive();

        this.pool.release(this.trailA);
        this.pool.release(this.trailB);
        this.pool.release(this.nodeA);
        this.pool.release(this.nodeB);
        this.pool.release(this.inputRT);
        this.pool.release(this.advanceRT);

        this.cfg.nodesPerTrail = nodesPerTrail;
        this.cfg.trailsNum = trailsNum;

        this.trailA = this.pool.get(1, trailsNum, this.rtParams);
        this.trailB = this.pool.get(1, trailsNum, this.rtParams);
        this.nodeA = this.pool.get(nodesPerTrail, trailsNum, this.rtParams);
        this.nodeB = this.pool.get(nodesPerTrail, trailsNum, this.rtParams);
        this.inputRT = this.pool.get(1, trailsNum, this.rtParams);
        this.advanceRT = this.pool.get(1, trailsNum, this.rtParams);

        RenderTargetUtils.clearRT(this.gl, this.trailA, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.trailB, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.nodeA, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.nodeB, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.inputRT, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.advanceRT, new THREE.Color(0, 0, 0));

        this.advancePass.setupDims(nodesPerTrail, trailsNum);
    }
    get readTextures(): TrailTextures {
        this.ensureAlive();
        return this.flip ? this.getTexB() : this.getTexA();
    }

    setUpdateDistanceMin(v: number) { this.advancePass.setMinStep(v); }
    
    setFixedLength(on: boolean) { this.headPass.setFixedLength(on); }

    dispose() {
        if (this.disposed) return;
        this.pool.release(this.trailA);
        this.pool.release(this.trailB);
        this.pool.release(this.nodeA);
        this.pool.release(this.nodeB);
        this.pool.release(this.inputRT);
        this.pool.release(this.advanceRT);
        this.disposed = true;
    }

    private getTexA(): TrailTextures {
        return { trail: this.trailA, node: this.nodeA, input: this.inputRT };
    }
    private getTexB(): TrailTextures {
        return { trail: this.trailB, node: this.nodeB, input: this.inputRT };
    }

    private clearRT(rt: THREE.WebGLRenderTarget, color: THREE.Color) {
        const prev = this.gl.getRenderTarget();
        const prevAuto = this.gl.autoClear;
        this.gl.autoClear = true;
        this.gl.setRenderTarget(rt);
        this.gl.setClearColor(color, 0); // transparent
        this.gl.clearColor();
        this.gl.setRenderTarget(prev);
        this.gl.autoClear = prevAuto;
    }

    private ensureAlive() {
        if (this.disposed) throw new Error('[TrailGPU] TrailCompute already disposed');
    }
}