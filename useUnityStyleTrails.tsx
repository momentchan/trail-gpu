import { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";

export interface UnityStyleTrail {
    // Textures
    trailTex: THREE.DataTexture;   // 1x1, R = head (currentNodeIdx)
    nodeTex: THREE.DataTexture;    // nodeNum x 1, RGBA = (time, x, y, z)
    inputTex: THREE.DataTexture;   // 1x1, RGBA = (x, y, z, 1)

    // Parameters
    life: number;
    nodeNumPerTrail: number;
    updateDistanceMin: number;

    // Methods
    writeInput: (position: THREE.Vector3) => void;
    stepCalcInputCPU: (time: number) => void;
    reset: () => void;

    // State references
    headRef: React.RefObject<number>;
    validRef: React.RefObject<number>;
    lastPosRef: React.RefObject<THREE.Vector3 | null>;
}

interface UnityStyleTrailOptions {
    life?: number;
    updateDistanceMin?: number;
}

export function useUnityStyleTrails(opts: UnityStyleTrailOptions = {}): UnityStyleTrail {
    const life = opts.life ?? 10.0;
    const nodeNumPerTrail = Math.ceil(life * 60);
    const updateDistanceMin = opts.updateDistanceMin ?? 0.01;

    // Create texture with common settings
    const createDataTexture = useCallback((
        data: Float32Array, 
        width: number, 
        height: number
    ): THREE.DataTexture => {
        const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
        texture.needsUpdate = true;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        return texture;
    }, []);

    // Trail texture: 1x1, stores head index
    const trailTex = useMemo(() => {
        const data = new Float32Array(4);
        data[0] = -1; // R: head = -1 (uninitialized)
        return createDataTexture(data, 1, 1);
    }, [createDataTexture]);

    // Node texture: nodeNumPerTrail x 1, stores (time, x, y, z) for each node
    const nodeTex = useMemo(() => {
        const data = new Float32Array(nodeNumPerTrail * 4);
        // Initialize all nodes as invalid (time = -1)
        for (let i = 0; i < nodeNumPerTrail; i++) {
            data[i * 4] = -1;     // time
            data[i * 4 + 1] = 0;  // x
            data[i * 4 + 2] = 0;  // y
            data[i * 4 + 3] = 0;  // z
        }
        return createDataTexture(data, nodeNumPerTrail, 1);
    }, [nodeNumPerTrail, createDataTexture]);

    // Input texture: 1x1, stores current input position
    const inputTex = useMemo(() => {
        const data = new Float32Array(4);
        data[0] = 0; // x
        data[1] = 0; // y
        data[2] = 0; // z
        data[3] = 1; // valid flag
        return createDataTexture(data, 1, 1);
    }, [createDataTexture]);

    // State references
    const headRef = useRef(-1);
    const validRef = useRef(0);
    const lastPosRef = useRef<THREE.Vector3 | null>(null);


    // Write input position to input texture
    const writeInput = useCallback((position: THREE.Vector3) => {
        const data = inputTex.image.data as Float32Array;
        data[0] = position.x;
        data[1] = position.y;
        data[2] = position.z;
        data[3] = 1; // valid flag
        inputTex.needsUpdate = true;
    }, [inputTex]);

    // Reset trail to initial state
    const reset = useCallback(() => {
        headRef.current = -1;
        validRef.current = 0;
        lastPosRef.current = null;
        
        // Reset trail texture
        const trailData = trailTex.image.data as Float32Array;
        trailData[0] = -1;
        trailTex.needsUpdate = true;
        
        // Reset node texture
        const nodeData = nodeTex.image.data as Float32Array;
        for (let i = 0; i < nodeNumPerTrail; i++) {
            nodeData[i * 4] = 0;     // x
            nodeData[i * 4 + 1] = 0;  // y
            nodeData[i * 4 + 2] = 0;  // z
            nodeData[i * 4 + 3] = -1;  // time
        }
        nodeTex.needsUpdate = true;
    }, [trailTex, nodeTex, nodeNumPerTrail]);

    // Add new node to trail
    const addNode = useCallback((position: THREE.Vector3, time: number) => {
        const nodeData = nodeTex.image.data as Float32Array;
        const index = headRef.current * 4;
        
        nodeData[index] = position.x;
        nodeData[index + 1] = position.y;
        nodeData[index + 2] = position.z;
        nodeData[index + 3] = time;
        
        nodeTex.needsUpdate = true;
        
        // Update trail texture with head index
        const trailData = trailTex.image.data as Float32Array;
        trailData[0] = headRef.current;
        trailTex.needsUpdate = true;
        
        lastPosRef.current = position.clone();
    }, [nodeTex, trailTex]);

    // Main step calculation function
    const stepCalcInputCPU = useCallback((time: number) => {
        const inputData = inputTex.image.data as Float32Array;
        const currentPosition = new THREE.Vector3(inputData[0], inputData[1], inputData[2]);

        // First time initialization
        if (headRef.current < 0) {
            headRef.current = 0;
            validRef.current = Math.min(validRef.current + 1, nodeNumPerTrail);
            addNode(currentPosition, time);
            return;
        }

        // Check distance threshold
        const lastPosition = lastPosRef.current ?? currentPosition;
        const distance = lastPosition.distanceTo(currentPosition);

        if (distance >= updateDistanceMin) {
            headRef.current = (headRef.current + 1) % nodeNumPerTrail;
            validRef.current = Math.min(validRef.current + 1, nodeNumPerTrail);
            addNode(currentPosition, time);
        }
    }, [inputTex, nodeNumPerTrail, updateDistanceMin, addNode]);

    return {
        trailTex,
        nodeTex,
        inputTex,
        life,
        nodeNumPerTrail,
        updateDistanceMin,
        writeInput,
        stepCalcInputCPU,
        reset,
        headRef,
        validRef,
        lastPosRef
    };
}