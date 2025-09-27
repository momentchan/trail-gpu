import * as THREE from 'three';
import { RenderTargetPool } from './RenderTargetPool';
import { Blitter } from '../utils/Blit';
import { assertPositive, validateRenderer, TrailGPUError } from '../spec/validators';
import { makeRTParams } from '../spec/constants';
import { ParticleConfig, ParticleShaderConfig, CustomUniforms } from '../../types';
import { createDataTexture, generateRandomParticlePositions } from '../../utils';
import { ParticleVelocityPass } from './ParticleVelocityPass';
import { ParticlePositionPass } from './ParticlePositionPass';
import { RenderTargetUtils } from '../utils/RenderTargetUtils';

interface ParticleTextures {
    position: THREE.WebGLRenderTarget;
    velocity: THREE.WebGLRenderTarget;
}

export class ParticleCompute {
    private pool: RenderTargetPool;
    private rtParams: THREE.RenderTargetOptions;

    // Dual texture buffers for position and velocity
    private posA: THREE.WebGLRenderTarget;
    private posB: THREE.WebGLRenderTarget;
    private velA: THREE.WebGLRenderTarget;
    private velB: THREE.WebGLRenderTarget;

    private velocityPass: ParticleVelocityPass;
    private positionPass: ParticlePositionPass;
    private blitter: Blitter;

    private flip = false;
    private disposed = false;


    constructor(
        private gl: THREE.WebGLRenderer,
        private cfg: ParticleConfig,
        shaderConfig: ParticleShaderConfig,
        pool?: RenderTargetPool
    ) {
        validateRenderer(gl);
        assertPositive(cfg.count, 'particle count');

        this.pool = pool ?? new RenderTargetPool();
        this.rtParams = makeRTParams();

        // Create render targets
        this.posA = this.pool.get(1, cfg.count, this.rtParams);
        this.posB = this.pool.get(1, cfg.count, this.rtParams);
        this.velA = this.pool.get(1, cfg.count, this.rtParams);
        this.velB = this.pool.get(1, cfg.count, this.rtParams);

        RenderTargetUtils.clearRT(this.gl, this.posA, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.posB, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.velA, new THREE.Color(0, 0, 0));
        RenderTargetUtils.clearRT(this.gl, this.velB, new THREE.Color(0, 0, 0));

        // Create separate pass instances
        this.velocityPass = new ParticleVelocityPass(
            gl,
            cfg,
            shaderConfig.velocityShader,
            shaderConfig.uniforms
        );
        this.positionPass = new ParticlePositionPass(
            gl,
            cfg,
            shaderConfig.positionShader,
            shaderConfig.uniforms
        );
        this.blitter = new Blitter(gl);

        // Initialize textures
        this._initializeTextures();
    }

    step(timeSec: number, deltaTime: number, customUniforms?: CustomUniforms): void {
        this._ensureAlive();
        const read = this.flip ? this.getTexB() : this.getTexA();
        const write = this.flip ? this.getTexA() : this.getTexB();

        // PASS 1: Calculate velocity first
        this.velocityPass.run({
            positionsTex: read.position.texture,
            velocitiesTex: read.velocity.texture,
            outRT: write.velocity,
            timeSec,
            deltaTime,
            customUniforms
        });

        // PASS 2: Update position using the new velocity
        this.positionPass.run({
            positionsTex: read.position.texture,
            velocitiesTex: write.velocity.texture, // Use the updated velocity
            outRT: write.position,
            timeSec,
            deltaTime,
            customUniforms
        });


        this.flip = !this.flip;
    }

    get positionsTexture(): THREE.Texture {
        this._ensureAlive();
        const read = this.flip ? this.getTexB() : this.getTexA();
        return read.position.texture;
    }

    get velocitiesTexture(): THREE.Texture {
        this._ensureAlive();
        const read = this.flip ? this.getTexB() : this.getTexA();
        return read.velocity.texture;
    }

    // Update shader at runtime
    updateShader(shaderConfig: ParticleShaderConfig): void {
        this._ensureAlive();

        this.velocityPass.dispose();
        this.positionPass.dispose();

        this.velocityPass = new ParticleVelocityPass(
            this.gl,
            this.cfg,
            shaderConfig.velocityShader,
            shaderConfig.uniforms
        );
        this.positionPass = new ParticlePositionPass(
            this.gl,
            this.cfg,
            shaderConfig.positionShader,
            shaderConfig.uniforms
        );
    }

    // Add/update custom uniform
    setUniform(name: string, value: any): void {
        this._ensureAlive();
        this.velocityPass.setUniform(name, value);
        this.positionPass.setUniform(name, value);
    }

    // Get uniform value
    getUniform(name: string): any {
        this._ensureAlive();
        return this.velocityPass.getUniform(name) ||
            this.positionPass.getUniform(name);
    }

    dispose(): void {
        if (this.disposed) {
            return;
        }
        this.pool.release(this.posA);
        this.pool.release(this.posB);
        this.pool.release(this.velA);
        this.pool.release(this.velB);

        this.velocityPass.dispose();
        this.positionPass.dispose();
        this.disposed = true;
    }


    private _initializeTextures(): void {
        // Initialize position textures
        if (this.cfg.initialPositions) {
            const posInitTexture = createDataTexture(this.cfg.initialPositions, 1, this.cfg.count);
            this.blitter.copy(posInitTexture, this.posA);
            this.blitter.copy(posInitTexture, this.posB);
            posInitTexture.dispose();
        } else {
            // Default random positions
            const randomPositions = generateRandomParticlePositions(this.cfg.count);
            const posInitTexture = createDataTexture(randomPositions, 1, this.cfg.count);
            this.blitter.copy(posInitTexture, this.posA);
            this.blitter.copy(posInitTexture, this.posB);
            posInitTexture.dispose();
        }

        // Initialize velocity textures
        if (this.cfg.initialVelocities) {
            const velInitTexture = createDataTexture(this.cfg.initialVelocities, 1, this.cfg.count);
            this.blitter.copy(velInitTexture, this.velA);
            this.blitter.copy(velInitTexture, this.velB);
            velInitTexture.dispose();
        } else {
            // Default zero velocities
            const zeroVelocities = new Float32Array(this.cfg.count * 4);
            zeroVelocities.fill(0);
            const velInitTexture = createDataTexture(zeroVelocities, 1, this.cfg.count);
            this.blitter.copy(velInitTexture, this.velA);
            this.blitter.copy(velInitTexture, this.velB);
            velInitTexture.dispose();
        }
    }

    get count(): number {
        return this.cfg.count;
    }

    private getTexA(): ParticleTextures {
        return { position: this.posA, velocity: this.velA };
    }

    private getTexB(): ParticleTextures {
        return { position: this.posB, velocity: this.velB };
    }

    private _ensureAlive(): void {
        if (this.disposed) {
            throw new TrailGPUError('ParticleCompute already disposed');
        }
    }
}


