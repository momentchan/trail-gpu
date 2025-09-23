import * as THREE from "three";

export class GPUTrailParticles {
    readonly count: number;
    partA: THREE.WebGLRenderTarget;
    partB: THREE.WebGLRenderTarget;
    matUpdate: THREE.ShaderMaterial;

    scene = new THREE.Scene();
    quad: THREE.Mesh;
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    _flip = true;

    constructor(count: number, updateFrag: string, initPositions?: Float32Array) {
        this.count = count;

        const rtParms = {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            depthBuffer: false,
            stencilBuffer: false,
        } as const;


        this.partA = new THREE.WebGLRenderTarget(count, 1, rtParms);
        this.partB = new THREE.WebGLRenderTarget(count, 1, rtParms);

        // init texture
        const data = initPositions ?? new Float32Array(count * 4);
        if (!initPositions) {
            for (let i = 0; i < count; i++) {
                data[i * 4] = (Math.random() - 0.5) * 1;
                data[i * 4 + 1] = (Math.random() - 0.5) * 1;
                data[i * 4 + 2] = (Math.random() - 0.5) * 1;
                data[i * 4 + 3] = 1;
            }
        }

        const initTex = new THREE.DataTexture(data, count, 1, THREE.RGBAFormat, THREE.FloatType);
        initTex.needsUpdate = true;
        initTex.minFilter = initTex.magFilter = THREE.NearestFilter;
        initTex.wrapS = initTex.wrapT = THREE.ClampToEdgeWrapping;

        this._blit(initTex, this.partA);
        this._blit(initTex, this.partB);
        initTex.dispose();

        this.matUpdate = new THREE.ShaderMaterial({
            uniforms: {
                uParticlesPrev: { value: null },
                uTimeSec: { value: 0 },
                uDeltaTime: { value: 0.016 },
                uSpeed: { value: 0.6 },
                uNoiseScale: { value: 0.8 },
                uTimeScale: { value: 0.3 },
                uParticleCount: { value: count },
            },
            vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
            fragmentShader: updateFrag,
            depthTest: false,
            depthWrite: false,
        })

        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.matUpdate);
        this.scene.add(this.quad);

    }

    attachRenderer(renderer: THREE.WebGLRenderer) { (THREE as any).__renderer = renderer }

    private _blit(src: THREE.Texture, dst: THREE.WebGLRenderTarget) {
        const r = (THREE as any).__renderer as THREE.WebGLRenderer
        const old = r.getRenderTarget()
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2),
            new THREE.MeshBasicMaterial({ map: src }))
        const scene = new THREE.Scene()
        const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        scene.add(quad)
        r.setRenderTarget(dst); r.clear(); r.render(scene, cam)
        r.setRenderTarget(old)
            ; (quad.material as THREE.MeshBasicMaterial).map?.dispose()
        quad.material.dispose(); quad.geometry.dispose()
    }

    get ParticlesTex(): THREE.Texture { return this._flip ? this.partA.texture : this.partB.texture }
    get _WriteRT(): THREE.WebGLRenderTarget { return this._flip ? this.partB : this.partA }
    _swap() { this._flip = !this._flip; }

    stepUpdate(renderer: THREE.WebGLRenderer, timeSec: number, deltaTime: number) {
        this.matUpdate.uniforms.uParticlesPrev.value = this.ParticlesTex;
        this.matUpdate.uniforms.uTimeSec.value = timeSec;
        this.matUpdate.uniforms.uDeltaTime.value = deltaTime;


        const old = renderer.getRenderTarget();
        renderer.setRenderTarget(this._WriteRT);
        renderer.render(this.scene, this.cam);
        renderer.setRenderTarget(old);

        this._swap();
    }
}