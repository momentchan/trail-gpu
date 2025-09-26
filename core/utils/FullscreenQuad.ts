import * as THREE from 'three';

export class FullscreenQuad {
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private mesh: THREE.Mesh;

    constructor(private material: THREE.Material) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const geom = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geom, this.material);
        this.scene.add(this.mesh);
    }

    setMaterial(mat: THREE.Material) {
        this.material = mat;
        this.mesh.material = mat;
    }

    render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget | null) {
        const prev = renderer.getRenderTarget();
        renderer.setRenderTarget(target);
        renderer.render(this.scene, this.camera);
        renderer.setRenderTarget(prev);
    }
}