import * as THREE from 'three';
import { FullscreenQuad } from '../utils/FullscreenQuad';
import { SHADER_CONSTANTS } from '../../shaders';
import { ParticleConfig } from '../../types';

export interface ParticleVelocityPassConfig {
    gravity?: THREE.Vector3;
    damping?: number;
    maxSpeed?: number;
}

export class ParticleVelocityPass {
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
            
            // Default physics uniforms
            uGravity: { value: cfg.gravity || new THREE.Vector3(0, -9.81, 0) },
            uDamping: { value: cfg.damping || 0.01 },
            uMaxSpeed: { value: cfg.maxSpeed || 10.0 },
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
            fragmentShader: customShader || this._createDefaultVelocityShader(),
            depthTest: false,
            depthWrite: false,
            blending: THREE.NoBlending,
        });

        this.fsq = new FullscreenQuad(this.material);
    }

    run({
        positionsTex,
        velocitiesTex,
        outRT,
        timeSec,
        deltaTime,
        customUniforms
    }: {
        positionsTex: THREE.Texture;
        velocitiesTex: THREE.Texture;
        outRT: THREE.WebGLRenderTarget;
        timeSec: number;
        deltaTime: number;
        customUniforms?: { [key: string]: any };
    }) {
        // Update uniforms
        this.uniforms.uPositionsPrev.value = positionsTex;
        this.uniforms.uVelocitiesPrev.value = velocitiesTex;
        this.uniforms.uTimeSec.value = timeSec;
        this.uniforms.uDeltaTime.value = deltaTime;

        // Update custom uniforms
        if (customUniforms) {
            for (const [key, value] of Object.entries(customUniforms)) {
                if (this.uniforms[key]) {
                    this.uniforms[key].value = value;
                }
            }
        }

        // Render
        this.fsq.render(this.gl, outRT);
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

    private _createDefaultVelocityShader(): string {
        return /* glsl */ `
            precision highp float;
            uniform sampler2D uPositionsPrev;
            uniform sampler2D uVelocitiesPrev;
            uniform float uTimeSec;
            uniform float uDeltaTime;
            uniform float uParticleCount;
            uniform vec3 uGravity;
            uniform float uDamping;
            uniform float uMaxSpeed;
            
            varying vec2 vUv;
            
            void main() {
                vec4 currentPos = texture2D(uPositionsPrev, vUv);
                vec4 currentVel = texture2D(uVelocitiesPrev, vUv);
                
                vec3 pos = currentPos.xyz;
                vec3 vel = currentVel.xyz;
                
                // Apply gravity
                vel += uGravity * uDeltaTime * 0.1;
                
                // Apply damping
                vel *= (1.0 - uDamping * uDeltaTime);
                
                // Limit maximum speed
                float speed = length(vel);
                if (speed > uMaxSpeed) {
                    vel = normalize(vel) * uMaxSpeed;
                }
                
                gl_FragColor = vec4(vel, currentVel.w);
            }
        `;
    }
}
