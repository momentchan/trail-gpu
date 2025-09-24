import * as THREE from 'three';
import { 
  TrailConfig, 
  TrailUniforms, 
  TrailGPUError,
  DEFAULT_TRAIL_CONFIG 
} from './types';
import { 
  createRenderTarget, 
  createDataTexture, 
  generateInitialTrailData,
  generateInitialNodeData,
  blitTexture,
  createComputationScene,
  disposeRenderTargets,
  validateRenderer,
  FULLSCREEN_VERTEX_SHADER
} from './utils';

export class GPUTrailsPass {
  private readonly _nodes: number;
  private readonly _trails: number;
  private readonly _config: TrailConfig;
  
  // Trail data render targets (1x1 per trail: head, valid, advance, time)
  private readonly _trailA: THREE.WebGLRenderTarget;
  private readonly _trailB: THREE.WebGLRenderTarget;
  
  // Node data render targets (Nx1 per trail: x, y, z, time)
  private readonly _nodeA: THREE.WebGLRenderTarget;
  private readonly _nodeB: THREE.WebGLRenderTarget;
  
  // Input render target (1x1 per trail: x, y, z, 1)
  private readonly _inputRT: THREE.WebGLRenderTarget;
  
  // Shader materials
  private readonly _calcInputHeadMaterial: THREE.ShaderMaterial;
  private readonly _calcInputWriteNodeMaterial: THREE.ShaderMaterial;
  
  // Computation scene
  private readonly _scene: THREE.Scene;
  private readonly _quad: THREE.Mesh;
  private readonly _camera: THREE.OrthographicCamera;
  
  private _flip: boolean = true;
  private _renderer: THREE.WebGLRenderer | null = null;

  constructor(
    nodesPerTrail: number,
    trailsNum: number,
    calcInputHeadFragmentShader: string,
    calcInputWriteNodeFragmentShader: string,
    config: Partial<TrailConfig> = {}
  ) {
    this._nodes = nodesPerTrail;
    this._trails = trailsNum;
    this._config = { ...DEFAULT_TRAIL_CONFIG, ...config, nodesPerTrail, trailsNum };

    // Create render targets
    this._trailA = createRenderTarget(1, trailsNum);
    this._trailB = createRenderTarget(1, trailsNum);
    this._nodeA = createRenderTarget(nodesPerTrail, trailsNum);
    this._nodeB = createRenderTarget(nodesPerTrail, trailsNum);
    this._inputRT = createRenderTarget(1, trailsNum);

    // Data will be initialized when renderer is attached

    // Create shader materials
    this._calcInputHeadMaterial = this._createCalcInputHeadMaterial(calcInputHeadFragmentShader);
    this._calcInputWriteNodeMaterial = this._createCalcInputWriteNodeMaterial(calcInputWriteNodeFragmentShader);

    // Create computation scene
    const { scene, quad, camera } = createComputationScene();
    this._scene = scene;
    this._quad = quad;
    this._camera = camera;
  }

  /**
   * Attaches a renderer to the trails pass
   */
  attachRenderer(renderer: THREE.WebGLRenderer): void {
    validateRenderer(renderer);
    this._renderer = renderer;
    
    // Initialize trail data now that renderer is available
    this._initializeTrailData();
    this._initializeNodeData();
  }

  /**
   * Gets the number of nodes per trail
   */
  get nodes(): number {
    return this._nodes;
  }

  /**
   * Gets the number of trails
   */
  get trails(): number {
    return this._trails;
  }

  /**
   * Gets the current configuration
   */
  get config(): Readonly<TrailConfig> {
    return { ...this._config };
  }

  /**
   * Gets the current node texture
   */
  get nodeTexture(): THREE.Texture {
    return this._flip ? this._nodeA.texture : this._nodeB.texture;
  }

  /**
   * Gets the current trail texture
   */
  get trailTexture(): THREE.Texture {
    return this._flip ? this._trailA.texture : this._trailB.texture;
  }

  /**
   * Gets the input texture
   */
  get inputTexture(): THREE.Texture {
    return this._inputRT.texture;
  }

  /**
   * Writes input data from a source texture
   */
  writeInputFromTexture(sourceTexture: THREE.Texture): void {
    if (!this._renderer) {
      throw new TrailGPUError('Renderer not attached. Call attachRenderer() first.');
    }

    const oldRenderTarget = this._renderer.getRenderTarget();
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: sourceTexture })
    );
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    scene.add(quad);

    this._renderer.setRenderTarget(this._inputRT);
    this._renderer.render(scene, camera);
    this._renderer.setRenderTarget(oldRenderTarget);

    // Cleanup
    (quad.material as THREE.MeshBasicMaterial).map?.dispose();
    quad.material.dispose();
    quad.geometry.dispose();
  }

  /**
   * Performs one step of trail calculation
   */
  stepCalcInput(timeSec: number, updateDistanceMin?: number): void {
    if (!this._renderer) {
      throw new TrailGPUError('Renderer not attached. Call attachRenderer() first.');
    }

    const distance = updateDistanceMin ?? this._config.updateDistanceMin;
    const oldRenderTarget = this._renderer.getRenderTarget();

    // Pass 1: Calculate input head -> Trail texture (next)
    this._updateCalcInputHeadUniforms(timeSec, distance);
    this._quad.material = this._calcInputHeadMaterial;
    this._renderer.setRenderTarget(this._trailNextRenderTarget);
    this._renderer.render(this._scene, this._camera);

    // Pass 2: Calculate input write node -> Node texture (next)
    this._updateCalcInputWriteNodeUniforms();
    this._quad.material = this._calcInputWriteNodeMaterial;
    this._renderer.setRenderTarget(this._nodeNextRenderTarget);
    this._renderer.render(this._scene, this._camera);

    this._renderer.setRenderTarget(oldRenderTarget);
    this._flip = !this._flip;
  }

  /**
   * Updates trail configuration
   */
  updateConfig(newConfig: Partial<TrailConfig>): void {
    Object.assign(this._config, newConfig);
  }

  /**
   * Disposes of all resources
   */
  dispose(): void {
    this._calcInputHeadMaterial.dispose();
    this._calcInputWriteNodeMaterial.dispose();
    disposeRenderTargets([
      this._trailA, 
      this._trailB, 
      this._nodeA, 
      this._nodeB, 
      this._inputRT
    ]);
    this._scene.clear();
  }

  private _initializeTrailData(): void {
    const trailData = generateInitialTrailData(this._trails);
    const initTrailTexture = createDataTexture(trailData, 1, this._trails);
    
    if (this._renderer) {
      blitTexture(this._renderer, initTrailTexture, this._trailA);
      blitTexture(this._renderer, initTrailTexture, this._trailB);
    }
    
    initTrailTexture.dispose();
  }

  private _initializeNodeData(): void {
    const nodeData = generateInitialNodeData(this._nodes, this._trails);
    const initNodeTexture = createDataTexture(nodeData, this._nodes, this._trails);
    
    if (this._renderer) {
      blitTexture(this._renderer, initNodeTexture, this._nodeA);
      blitTexture(this._renderer, initNodeTexture, this._nodeB);
    }
    
    initNodeTexture.dispose();
  }

  private _createCalcInputHeadMaterial(fragmentShader: string): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTrailPrev: { value: null },
        uNodePrev: { value: null },
        uInputTex: { value: this._inputRT.texture },
        uTimeSec: { value: 0 },
        uUpdateDistanceMin: { value: this._config.updateDistanceMin },
        uNodes: { value: this._nodes },
        uTrails: { value: this._trails },
      },
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
  }

  private _createCalcInputWriteNodeMaterial(fragmentShader: string): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uNodePrev: { value: null },
        uTrailNext: { value: null },
        uInputTex: { value: this._inputRT.texture },
        uNodes: { value: this._nodes },
        uTrails: { value: this._trails },
      },
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
  }

  private _updateCalcInputHeadUniforms(timeSec: number, updateDistanceMin: number): void {
    const uniforms = this._calcInputHeadMaterial.uniforms;
    uniforms.uTrailPrev.value = this._trailPrevTexture;
    uniforms.uNodePrev.value = this._nodePrevTexture;
    uniforms.uTimeSec.value = timeSec;
    uniforms.uUpdateDistanceMin.value = updateDistanceMin;
  }

  private _updateCalcInputWriteNodeUniforms(): void {
    const uniforms = this._calcInputWriteNodeMaterial.uniforms;
    uniforms.uNodePrev.value = this._nodePrevTexture;
    uniforms.uTrailNext.value = this._trailNextRenderTarget.texture;
  }

  private get _trailPrevTexture(): THREE.Texture {
    return this._flip ? this._trailA.texture : this._trailB.texture;
  }

  private get _trailNextRenderTarget(): THREE.WebGLRenderTarget {
    return this._flip ? this._trailB : this._trailA;
  }

  private get _nodePrevTexture(): THREE.Texture {
    return this._flip ? this._nodeA.texture : this._nodeB.texture;
  }

  private get _nodeNextRenderTarget(): THREE.WebGLRenderTarget {
    return this._flip ? this._nodeB : this._nodeA;
  }
}