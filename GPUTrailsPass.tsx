import * as THREE from 'three';


export class GPUTrailsPass {

    readonly count: number;

    // (1x1) (head, valid, advance, time)
    trailA: THREE.WebGLRenderTarget;
    trailB: THREE.WebGLRenderTarget;

    // (Nx1) (x, y, z, time)
    nodeA: THREE.WebGLRenderTarget;
    nodeB: THREE.WebGLRenderTarget;


    // (1x1) : (x,y,z,1)
    inputRT: THREE.WebGLRenderTarget;

    matCalcInputHead: THREE.ShaderMaterial;
    matCalcInputWriteNode: THREE.ShaderMaterial;

    scene: THREE.Scene;
    quad: THREE.Mesh;
    cam: THREE.OrthographicCamera;
    _flip = true

    constructor(
        count: number,
        initNodeTex: THREE.DataTexture,
        calcInputHeadFrag: string,
        calcInputWriteNodeFrag: string
    ) {

        this.count = count;

        const rtParams = {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            depthBuffer: false,
            stencilBuffer: false,
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter,
        }
        this.trailA = new THREE.WebGLRenderTarget(1, 1, rtParams);
        this.trailB = new THREE.WebGLRenderTarget(1, 1, rtParams);
        this.nodeA = new THREE.WebGLRenderTarget(count, 1, rtParams);
        this.nodeB = new THREE.WebGLRenderTarget(count, 1, rtParams);


        // InputTex (0,0,0,1) -> headA/headB
        {
            this.inputRT = new THREE.WebGLRenderTarget(1, 1, rtParams);
        }

        // initial TrailTex
        {
            const initTrail = new THREE.DataTexture(new Float32Array([-1, 0, 0, 0]), 1, 1, THREE.RGBAFormat, THREE.FloatType);
            initTrail.needsUpdate = true;
            this._blit(initTrail, this.trailA);
            this._blit(initTrail, this.trailB);
            initTrail.dispose();
        }

        // init NodeTex
        {
            this._blit(initNodeTex, this.nodeA);
            this._blit(initNodeTex, this.nodeB);
        }

        // Pass: calcInputHead
        this.matCalcInputHead = new THREE.ShaderMaterial({

            uniforms: {
                uTrailPrev: { value: null },
                uNodePrev: { value: null },
                uInputTex: { value: this.inputRT.texture },
                uTimeSec: { value: 0 },
                uUpdateDistanceMin: { value: 0.05 },
                uCount: { value: this.count },
            },
            vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,

            fragmentShader: calcInputHeadFrag,
            depthTest: false,
            depthWrite: false,
        })



        // Pass: calcInputWriteNode
        this.matCalcInputWriteNode = new THREE.ShaderMaterial({
            uniforms: {
                uNodePrev: { value: null },
                uTrailNext: { value: null },
                uInputTex: { value: this.inputRT.texture },
                uCount: { value: this.count },
            },
            vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
            fragmentShader: calcInputWriteNodeFrag,
            depthTest: false,
            depthWrite: false,
        })


        this.scene = new THREE.Scene();
        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: this.trailA.texture }));
        this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.scene.add(this.quad);
    }

    attachRenderer(renderer: THREE.WebGLRenderer) { (THREE as any).__renderer = renderer }


    private _blit(src: THREE.Texture, dst: THREE.WebGLRenderTarget) {
        const r = (THREE as any).__renderer as THREE.WebGLRenderer;
        if (!r) {
            console.warn('Call attachRenderer(renderer) before blitting.')
            return
        }
        const old = r.getRenderTarget();
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: src }));
        const scene = new THREE.Scene();
        const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        scene.add(quad);
        r.setRenderTarget(dst); r.clear(); r.render(scene, cam);
        r.setRenderTarget(old);
        ; (quad.material as THREE.MeshBasicMaterial).map?.dispose();
        quad.material.dispose();
        quad.geometry.dispose();
    }


    get trailPrevTex(): THREE.Texture { return (this._flip ? this.trailA : this.trailB).texture }
    get trailNextRT(): THREE.WebGLRenderTarget { return (this._flip ? this.trailB : this.trailA) }

    get nodePrevTex(): THREE.Texture { return (this._flip ? this.nodeA : this.nodeB).texture }
    get nodeNextRT(): THREE.WebGLRenderTarget { return (this._flip ? this.nodeB : this.nodeA) }

    swap() { this._flip = !this._flip; }

    // writeInput(pos: THREE.Vector3) {
    //     const d = this.inputRT.image.data as Float32Array;
    //     d[0] = pos.x; d[1] = pos.y; d[2] = pos.z; d[3] = 1;
    //     this.inputRT.needsUpdate = true;
    // }


    writeInputFromTex(srcTex: THREE.Texture) {
        const r = (THREE as any).__renderer as THREE.WebGLRenderer;
        const old = r.getRenderTarget();

        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: srcTex }));
        const scene = new THREE.Scene();
        const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        scene.add(quad);

        r.setRenderTarget(this.inputRT);
        r.render(scene, cam);

        r.setRenderTarget(old);

        ; (quad.material as THREE.MeshBasicMaterial).map?.dispose();
        quad.material.dispose();
        quad.geometry.dispose();
    }

    stepCalcInput(renderer: THREE.WebGLRenderer, timeSec: number, updateDistanceMin: number) {
        // Pass1: CalcInputHead -> TraiTex(next)
        this.matCalcInputHead.uniforms.uTrailPrev.value = this.trailPrevTex;
        this.matCalcInputHead.uniforms.uNodePrev.value = this.nodePrevTex;
        this.matCalcInputHead.uniforms.uTimeSec.value = timeSec;
        this.matCalcInputHead.uniforms.uUpdateDistanceMin.value = updateDistanceMin;

        const old = renderer.getRenderTarget();
        this.quad.material = this.matCalcInputHead;
        renderer.setRenderTarget(this.trailNextRT);
        renderer.render(this.scene, this.cam);


        // Pass2: CalcInputWriteNode -> NodeTex(next)
        this.matCalcInputWriteNode.uniforms.uNodePrev.value = this.nodePrevTex;
        this.matCalcInputWriteNode.uniforms.uTrailNext.value = this.trailNextRT.texture;
        this.quad.material = this.matCalcInputWriteNode;

        renderer.setRenderTarget(this.nodeNextRT);
        renderer.render(this.scene, this.cam);

        renderer.setRenderTarget(old);

        this.swap();
    }

    get NodeTex(): THREE.Texture { return this.nodePrevTex }
    get TrailTex(): THREE.Texture { return this.trailPrevTex }
    get InputTex(): THREE.Texture { return this.inputRT.texture }
}
