// DebugPoints.tsx
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export function DebugPoints({
  tex,
  N,
  size = 0.07,
  color = 'red',
  headRef,   // 可選：若改成環形緩衝，傳入 headRef
  validRef,  // 可選：若改成環形緩衝，傳入 validRef
}: {
  tex: THREE.DataTexture
  N: number
  size?: number
  color?: string
  headRef?: React.RefObject<number>
  validRef?: React.RefObject<number>
}) {
  const positions = useMemo(() => new Float32Array(N * 3), [N])
  const geomRef = useRef<THREE.BufferGeometry>(null!)

  const indexOf = (i: number) => {
    if (!headRef || !validRef) return i // 線性版本：0..N-1
    const head = headRef.current
    const valid = Math.min(validRef.current, N)
    if (i >= valid) return -1
    return (head + i) % N
  }

  useFrame(() => {
    const data = tex.image.data as Float32Array

    let w = 0
    for (let i = 0; i < N; i++) {
      const k = indexOf(i)
      if (k < 0) { // 環形且尚未填滿時，讓點縮到外面或設為同一位置
        positions[w++] = 9999
        positions[w++] = 9999
        positions[w++] = 9999
        continue
      }
      const j = k * 4
      positions[w++] = data[j + 1]
      positions[w++] = data[j + 2]
      positions[w++] = data[j + 3]
    }

    // 把新座標寫回幾何
    const g = geomRef.current
    ;(g.attributes.position as THREE.BufferAttribute).set(positions)
    g.attributes.position.needsUpdate = true
  })

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          itemSize={3}
          count={N}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color={color} size={size} sizeAttenuation />
    </points>
  )
}
