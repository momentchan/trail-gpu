import * as THREE from 'three';
import {
    ParticleConfig,
    ParticleShaderParams,
    TrailGPUError
} from './types';
import {
    createRenderTarget,
    createDataTexture,
    generateRandomParticlePositions,
    blitTexture,
    createComputationScene,
    disposeRenderTargets,
    validateRenderer,
    FULLSCREEN_VERTEX_SHADER
} from './utils';

export class GPUTrailParticles {
    private readonly _count: number;
    private readonly _config: ParticleConfig;
    private _uniforms: ParticleShaderParams;
    private readonly _partA: THREE.WebGLRenderTarget;
    private readonly _partB: THREE.WebGLRenderTarget;
    private readonly _material: THREE.ShaderMaterial;
    private readonly _scene: THREE.Scene;
    private readonly _quad: THREE.Mesh;
    private readonly _camera: THREE.OrthographicCamera;
    private _flip: boolean = true;
    private _renderer: THREE.WebGLRenderer | null = null;
    private _initialPositions?: Float32Array;

    constructor(
        count: number,
        updateFragmentShader: string,
        config: Partial<ParticleConfig> = {},
        initialPositions?: Float32Array,
        uniforms: Partial<ParticleShaderParams> = {},
        customUniforms = {},
    ) {
        this._count = count;
        this._config = { count, ...config };
        
        // Default uniform values
        this._uniforms = {
            speed: 0.1,
            noiseScale: 0.5,
            timeScale: 0.3,
            ...uniforms
        };

        // Create render targets
        this._partA = createRenderTarget(1, count);
        this._partB = createRenderTarget(1, count);

        // Store initial positions for later initialization
        this._initialPositions = initialPositions;

        // Create update material
        this._material = this._createUpdateMaterial(updateFragmentShader, customUniforms);

        // Create computation scene
        const { scene, quad, camera } = createComputationScene();
        this._scene = scene;
        this._quad = quad;
        this._camera = camera;

        this._quad.material = this._material;
    }

    /**
     * Attaches a renderer to the particle system
     */
    attachRenderer(renderer: THREE.WebGLRenderer): void {
        validateRenderer(renderer);
        this._renderer = renderer;

        // Initialize particle data now that renderer is available
        this._initializeParticleData();
    }

    /**
     * Gets the current particles texture
     */
    get particlesTexture(): THREE.Texture {
        return this._flip ? this._partA.texture : this._partB.texture;
    }

    /**
     * Gets the particle count
     */
    get count(): number {
        return this._count;
    }

    /**
     * Gets the current configuration
     */
    get config(): Readonly<ParticleConfig> {
        return { ...this._config };
    }

    /**
     * Gets the current uniforms
     */
    get uniforms(): Readonly<ParticleShaderParams> {
        return { ...this._uniforms };
    }

    /**
     * Updates particle positions using GPU computation
     */
    stepUpdate(timeSec: number, deltaTime: number): void {
        if (!this._renderer) {
            throw new TrailGPUError('Renderer not attached. Call attachRenderer() first.');
        }

        // Update uniforms
        this._updateUniforms(timeSec, deltaTime);

        // Perform GPU computation
        const oldRenderTarget = this._renderer.getRenderTarget();
        this._renderer.setRenderTarget(this._writeRenderTarget);
        this._renderer.render(this._scene, this._camera);
        this._renderer.setRenderTarget(oldRenderTarget);

        // Swap buffers
        this._flip = !this._flip;
    }

    /**
     * Updates particle configuration
     */
    updateConfig(newConfig: Partial<ParticleConfig>): void {
        Object.assign(this._config, newConfig);
    }

    /**
     * Updates particle uniforms
     */
    updateUniforms(newUniforms: Partial<ParticleShaderParams>): void {
        Object.assign(this._uniforms, newUniforms);
        this._updateShaderUniforms();
    }

    /**
     * Adds or updates a single custom uniform
     */
    setUniform(name: string, value: any): void {
        this._uniforms[name] = value;
        this._updateSingleShaderUniform(name, value);
    }

    /**
     * Removes a custom uniform
     */
    removeUniform(name: string): void {
        delete this._uniforms[name];
        // Note: We can't remove uniforms from the shader material once created
        // But we can set them to a default value
        if (this._material.uniforms[name]) {
            this._material.uniforms[name].value = 0;
        }
    }

    /**
     * Disposes of all resources
     */
    dispose(): void {
        this._material.dispose();
        disposeRenderTargets([this._partA, this._partB]);
        this._scene.clear();
    }

    private _initializeParticleData(): void {
        const data = this._initialPositions ?? generateRandomParticlePositions(this._count);
        const initTexture = createDataTexture(data, 1, this._count);

        // Initialize both render targets
        if (this._renderer) {
            blitTexture(this._renderer, initTexture, this._partA);
            blitTexture(this._renderer, initTexture, this._partB);
        }

        initTexture.dispose();
    }

    private _createUpdateMaterial(fragmentShader: string, customUniforms: { [key: string]: { value: any } }): THREE.ShaderMaterial {
        const uniforms = {
            uParticlesPrev: { value: null },
            uTimeSec: { value: 0 },
            uDeltaTime: { value: 0.016 },
            uSpeed: { value: this._uniforms.speed },
            uNoiseScale: { value: this._uniforms.noiseScale },
            uTimeScale: { value: this._uniforms.timeScale },
            uParticleCount: { value: this._count },
            ...customUniforms,
        };

        return new THREE.ShaderMaterial({
            uniforms,
            vertexShader: FULLSCREEN_VERTEX_SHADER,
            fragmentShader,
            depthTest: false,
            depthWrite: false,
        });
    }

    private _updateUniforms(timeSec: number, deltaTime: number): void {
        const uniforms = this._material.uniforms;
        uniforms.uParticlesPrev.value = this.particlesTexture;
        uniforms.uTimeSec.value = timeSec;
        uniforms.uDeltaTime.value = deltaTime;
        uniforms.uSpeed.value = this._uniforms.speed;
        uniforms.uNoiseScale.value = this._uniforms.noiseScale;
        uniforms.uTimeScale.value = this._uniforms.timeScale;
    }

    private _updateShaderUniforms(): void {
        const uniforms = this._material.uniforms;
        uniforms.uSpeed.value = this._uniforms.speed;
        uniforms.uNoiseScale.value = this._uniforms.noiseScale;
        uniforms.uTimeScale.value = this._uniforms.timeScale;
        
        // Update any custom uniforms
        for (const [key, value] of Object.entries(this._uniforms)) {
            if (key !== 'speed' && key !== 'noiseScale' && key !== 'timeScale') {
                const uniformName = `u${key.charAt(0).toUpperCase() + key.slice(1)}`;
                if (uniforms[uniformName]) {
                    uniforms[uniformName].value = value;
                }
            }
        }
    }

    private _updateSingleShaderUniform(name: string, value: any): void {
        const uniforms = this._material.uniforms;
        const uniformName = `u${name.charAt(0).toUpperCase() + name.slice(1)}`;
        
        if (uniforms[uniformName]) {
            uniforms[uniformName].value = value;
        } else {
            // Add new uniform to the material if it doesn't exist
            uniforms[uniformName] = { value };
        }
    }

    private get _writeRenderTarget(): THREE.WebGLRenderTarget {
        return this._flip ? this._partB : this._partA;
    }
}