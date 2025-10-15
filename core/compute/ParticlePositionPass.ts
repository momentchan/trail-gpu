import * as THREE from 'three';
import { FullscreenQuad } from '../utils/FullscreenQuad';
import { SHADER_CONSTANTS } from '../../shaders';
import { ParticleConfig } from '../../types';
import { Blitter } from '../utils/Blit';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ParticlePositionPassConfig {
    // Position pass typically doesn't need additional config
    // It just integrates position using velocity
}

export class ParticlePositionPass {
    private material: THREE.ShaderMaterial;
    private fsq: FullscreenQuad;
    private uniforms: { [k: string]: THREE.IUniform };

    constructor(
        private gl: THREE.WebGLRenderer,
        private cfg: ParticleConfig,
        customShader?: string,
        customUniforms?: { [key: string]: any }
    ) {
        this.uniforms = {
            uPositionsPrev: { value: null },
            uVelocitiesPrev: { value: null },
            uTimeSec: { value: 0 },
            uDeltaTime: { value: 0.016 },
            uParticleCount: { value: cfg.count },
        };

        // Add custom uniforms
        if (customUniforms) {
            for (const [key, value] of Object.entries(customUniforms)) {
                this.uniforms[key] = { value };
            }
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: SHADER_CONSTANTS.FULLSCREEN_VERTEX,
            fragmentShader: customShader || this._createDefaultPositionShader(),
            depthTest: false,
            depthWrite: false,
            blending: THREE.NoBlending,
        });

        this.fsq = new FullscreenQuad(this.material);
    }

    run(io:{
        positionsTex: THREE.Texture,
        velocitiesTex: THREE.Texture,
        outRT: THREE.WebGLRenderTarget,
        timeSec: number,
        deltaTime: number,
        customUniforms?: { [key: string]: any },
    }) {
        // Update uniforms
        this.uniforms.uPositionsPrev.value = io.positionsTex;
        this.uniforms.uVelocitiesPrev.value = io.velocitiesTex;
        this.uniforms.uTimeSec.value = io.timeSec;
        this.uniforms.uDeltaTime.value = io.deltaTime;

        // Update custom uniforms
        if (io.customUniforms) {
            for (const [key, value] of Object.entries(io.customUniforms)) {
                if (this.uniforms[key]) {
                    this.uniforms[key].value = value;
                }
            }
        }
        this.fsq.render(this.gl, io.outRT);
    }

    setUniform(name: string, value: any) {
        if (this.uniforms[name]) {
            this.uniforms[name].value = value;
        }
    }

    getUniform(name: string) {
        return this.uniforms[name]?.value;
    }

    dispose() {
        this.material.dispose();
    }

    private _createDefaultPositionShader(): string {
        return /* glsl */ `
            precision highp float;
            uniform sampler2D uPositionsPrev;
            uniform sampler2D uVelocitiesPrev;
            uniform float uTimeSec;
            uniform float uDeltaTime;
            uniform float uParticleCount;
            
            varying vec2 vUv;
            
            void main() {
                vec4 currentPos = texture2D(uPositionsPrev, vUv);
                vec4 currentVel = texture2D(uVelocitiesPrev, vUv);
                
                vec3 pos = currentPos.xyz;
                vec3 vel = currentVel.xyz;
                
                // Update position using velocity
                pos += vel * uDeltaTime;
                
                // Make each particle have a different position for debugging
                gl_FragColor = vec4(pos, currentPos.w);
            }
        `;
    }
}
