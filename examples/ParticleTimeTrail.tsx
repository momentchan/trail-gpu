import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { TimeShaderPack } from '../shaders/packs/time';
import { useTrails } from '../hooks/useTrails';
import { useRibbonGeometry } from '../hooks/useRibbonGeometry';
import { useRibbonMaterials } from '../hooks/useRibbonMaterials';
import { Ribbon } from '../components/Ribbon';
import { ParticleDebugPoints } from '../components/ParticleDebugPoints';

const PARTICLE_COUNT = 10;
const TRAIL_NODES = 32;
const TIME_STEP = 0.1; // Update trail every 0.1 seconds

export function ParticleTimeTrail() {
    const particleRef = useRef<THREE.InstancedMesh>(null);
    const timeRef = useRef(0);

    // Create particle positions texture
    const particleTexture = useMemo(() => {
        const data = new Float32Array(PARTICLE_COUNT * 4);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
            const radius = 2 + Math.sin(i * 0.1) * 0.5;
            data[i * 4 + 0] = Math.cos(angle) * radius; // x
            data[i * 4 + 1] = Math.sin(i * 0.2) * 0.5;  // y
            data[i * 4 + 2] = Math.sin(angle) * radius; // z
            data[i * 4 + 3] = 1.0; // w
        }
        return new THREE.DataTexture(data, 1, PARTICLE_COUNT, THREE.RGBAFormat, THREE.FloatType);
    }, []);

    // Trail system configuration
    const trailSystem = useTrails({
        nodesPerTrail: TRAIL_NODES,
        trailsNum: PARTICLE_COUNT,
        fixedLength: false,
        advanceMode: 'time',
        updateTimeStep: TIME_STEP,
        shaderPack: TimeShaderPack,
    });

    // Ribbon geometry
    const geometry = useRibbonGeometry({
        geometryType: 'quad',
        geometryConfig: {
            nodes: TRAIL_NODES,
            trails: PARTICLE_COUNT,
            radius: 0.02,
        },
    });

    // Ribbon materials
    const materials = useRibbonMaterials({
        materialType: 'standard',
        materialConfig: {
            nodeTex: trailSystem.nodeTexture!,
            trailTex: trailSystem.trailTexture!,
            baseWidth: 0.02,
            nodes: TRAIL_NODES,
            trails: PARTICLE_COUNT,
            color: '#ff6b6b',
            materialProps: {
                transparent: true,
                opacity: 0.8,
            },
        },
    });

    useFrame((state, delta) => {
        timeRef.current += delta;
        
        // Update particle positions in a circular motion with some variation
        if (particleRef.current) {
            const positions = particleRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + timeRef.current * 0.5;
                const radius = 2 + Math.sin(i * 0.1 + timeRef.current * 0.3) * 0.5;
                const height = Math.sin(i * 0.2 + timeRef.current * 0.4) * 0.5;
                
                positions[i * 3 + 0] = Math.cos(angle) * radius; // x
                positions[i * 3 + 1] = height; // y
                positions[i * 3 + 2] = Math.sin(angle) * radius; // z
            }
            particleRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Update particle texture for trail system
        const data = particleTexture.image.data as Float32Array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + timeRef.current * 0.5;
            const radius = 2 + Math.sin(i * 0.1 + timeRef.current * 0.3) * 0.5;
            const height = Math.sin(i * 0.2 + timeRef.current * 0.4) * 0.5;
            
            data[i * 4 + 0] = Math.cos(angle) * radius; // x
            data[i * 4 + 1] = height; // y
            data[i * 4 + 2] = Math.sin(angle) * radius; // z
            data[i * 4 + 3] = 1.0; // w
        }
        particleTexture.needsUpdate = true;

        // Update trail system
        trailSystem.update(state.clock.elapsedTime, delta, particleTexture);
    });

    return (
        <group>
            {/* Trail ribbons */}
            <Ribbon
                geometry={geometry}
                material={materials.material}
                depthMaterial={materials.depthMaterial}
                trails={PARTICLE_COUNT}
                receiveShadow={true}
                castShadow={true}
                frustumCulled={false}
            />
            
            {/* Debug particle points */}
            <ParticleDebugPoints
                particleTexture={particleTexture}
                count={PARTICLE_COUNT}
                size={0.05}
                color="white"
            />
        </group>
    );
}
