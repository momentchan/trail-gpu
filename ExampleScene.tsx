import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTrailHistory } from "./useTrailHistory";
import { Ribbon } from "./Ribbon";
import { TrailDriver } from "./TrailDriver";
import { DebugPoints } from "./DebugPoints";

export function ExampleScene() {
    const { texture, capacity, head } = useTrailHistory(128);


    const points = useMemo(()=>{
        const arr = new Float32Array(capacity * 3);
        for (let i = 0; i < capacity; i++) {
            arr[i * 3] = i * 0.1;
            arr[i * 3 + 1] = 0;
            arr[i * 3 + 2] = 0;
        }
        return arr;
    }, [texture, capacity]);

    useLayoutEffect(() => {
        const data = texture.image.data as Float32Array;
        for (let i = 0; i < capacity; i++) {
            data[i * 4] = points[i * 3];
            data[i * 4 + 1] = points[i * 3 + 1];
            data[i * 4 + 2] = points[i * 3 + 2];
            data[i * 4 + 3] = 1;
        }
        
        texture.needsUpdate = true;
    }, [texture, capacity]);
    

    return <>
        <Ribbon tex={texture} N={capacity} baseWidth={0.08} />
        <TrailDriver tex={texture} />
        <DebugPoints tex={texture} N={capacity} size={0.01} />
        {/* <points>
            <bufferGeometry>
                <bufferAttribute 
                attach="attributes-position" 
                count={capacity}
                array={points}
                itemSize={3}
                args={[points, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#ffffff" size={0.01} />
        </points> */}
        {/* <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#ffffff" />
        </mesh> */}
    </>;
}