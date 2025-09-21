// DebugPoints.tsx
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export function DebugPoints({
  tex,
  N,
  size = 0.07,
  color = 'red',
  ringHeadRef,   // 可選：若改成環形緩衝，傳入 headRef
  ringValidRef,  // 可選：若改成環形緩衝，傳入 validRef
}: {
  tex: THREE.DataTexture
  N: number
  size?: number
  color?: string
  ringHeadRef?: React.MutableRefObject<number>
  ringValidRef?: React.MutableRefObject<number>
}) {
  // 預先配置 positions 緩衝；每點 3 個 float
  const positions = useMemo(() => new Float32Array(N * 3), [N])
  const geomRef = useRef<THREE.BufferGeometry>(null!)

  // 環形索引（若你日後改用 uHead/uValid 時啟用）
  const indexOf = (i: number) => {
    if (!ringHeadRef || !ringValidRef) return i // 線性版本：0..N-1
    const head = ringHeadRef.current
    const valid = Math.min(ringValidRef.current, N)
    // i 是邏輯序（最舊→最新），回傳實際索引
    if (i >= valid) return -1
    return (head + i) % N
  }

  useFrame(() => {
    const data = tex.image.data as Float32Array

    // 線性左移版：直接 0..N-1 讀
    // 若改環形，換成用 indexOf(i) 取像素
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
      positions[w++] = data[j + 0]
      positions[w++] = data[j + 1]
      positions[w++] = data[j + 2]
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
