// TrailDriver.tsx（或你 ExampleScene 裡原本的 TrailDriver）
import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export function TrailDriver({ tex }: { tex: THREE.DataTexture }) {
  const t = useRef(0)
  const N = tex.image.width
  const data = tex.image.data as Float32Array

  // 確保一開始不是全0（可保留你的靜態初始化）
  // ...

  useFrame((_, dt) => {
    // 1) 產生一個「新位置」p（先用參數曲線，之後可換成滑鼠/物件位置）
    t.current += dt * 1.0 // 速度
    const R = 1.2
    const p = new THREE.Vector3(
      Math.cos(t.current) * R,     // x
      0.0,                         // y（固定在 2D 平面）
      Math.sin(t.current * 0.7) * 0.6 // z（想完全2D就設 0）
    )

    // 2) 整體左移一格（維持排序：0..N-1）
    //    這樣末端空出來放最新點
    for (let i = 0; i < N - 1; i++) {
      data[i*4+0] = data[(i+1)*4+0]
      data[i*4+1] = data[(i+1)*4+1]
      data[i*4+2] = data[(i+1)*4+2]
      data[i*4+3] = data[(i+1)*4+3]
    }

    // 3) 把最新點寫到最後一格（index = N-1）
    const j = (N - 1) * 4
    data[j+0] = p.x
    data[j+1] = p.y
    data[j+2] = p.z
    data[j+3] = 1.0 // life=有效

    tex.needsUpdate = true
  })

  return null
}
