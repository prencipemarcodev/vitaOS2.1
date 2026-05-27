/**
 * ProceduralCar — Modelli 3D generati proceduralmente con Three.js geometry.
 *
 * Nessun file esterno. Ogni categoria ha proporzioni e forma diverse.
 * Colore applicato sul materiale MeshStandardMaterial della carrozzeria.
 *
 * Categorie: city | hatchback | sedan | wagon | suv | suv_large | electric
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Parametri forma per categoria ────────────────────────────────
const CAR_PROFILES = {
  city: {
    bodyL: 2.4, bodyH: 0.72, bodyW: 1.1,
    roofL: 1.4, roofH: 0.58, roofOffX: -0.05, roofY: 0.62,
    wheelR: 0.28, wheelW: 0.2,
    wheelFX: 0.78, wheelRX: -0.78, wheelZ: 0.42,
    groundY: -0.28,
  },
  hatchback: {
    bodyL: 2.9, bodyH: 0.78, bodyW: 1.15,
    roofL: 1.55, roofH: 0.62, roofOffX: -0.05, roofY: 0.65,
    wheelR: 0.3, wheelW: 0.2,
    wheelFX: 0.9, wheelRX: -0.9, wheelZ: 0.44,
    groundY: -0.3,
  },
  sedan: {
    bodyL: 3.4, bodyH: 0.76, bodyW: 1.2,
    roofL: 1.6, roofH: 0.58, roofOffX: -0.1, roofY: 0.65,
    wheelR: 0.32, wheelW: 0.22,
    wheelFX: 1.1, wheelRX: -1.0, wheelZ: 0.46,
    groundY: -0.32,
  },
  wagon: {
    bodyL: 3.6, bodyH: 0.78, bodyW: 1.2,
    roofL: 2.1, roofH: 0.6, roofOffX: -0.2, roofY: 0.65,
    wheelR: 0.32, wheelW: 0.22,
    wheelFX: 1.1, wheelRX: -1.1, wheelZ: 0.46,
    groundY: -0.32,
  },
  suv: {
    bodyL: 3.2, bodyH: 0.95, bodyW: 1.35,
    roofL: 1.8, roofH: 0.7, roofOffX: -0.08, roofY: 0.8,
    wheelR: 0.38, wheelW: 0.26,
    wheelFX: 1.0, wheelRX: -1.0, wheelZ: 0.5,
    groundY: -0.38,
  },
  suv_large: {
    bodyL: 3.8, bodyH: 1.05, bodyW: 1.45,
    roofL: 2.0, roofH: 0.78, roofOffX: -0.1, roofY: 0.9,
    wheelR: 0.42, wheelW: 0.28,
    wheelFX: 1.2, wheelRX: -1.2, wheelZ: 0.54,
    groundY: -0.42,
  },
  electric: {
    bodyL: 3.3, bodyH: 0.74, bodyW: 1.22,
    roofL: 1.9, roofH: 0.55, roofOffX: -0.15, roofY: 0.64,
    wheelR: 0.32, wheelW: 0.2,
    wheelFX: 1.05, wheelRX: -1.05, wheelZ: 0.46,
    groundY: -0.32,
  },
}

// ── Singola ruota ─────────────────────────────────────────────────
function Wheel({ x, z, r, w }) {
  return (
    <group position={[x, r - 0.02, z]}>
      {/* Pneumatico */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[r * 0.72, r * 0.28, 12, 24]} />
        <meshStandardMaterial color="#1a1a24" roughness={0.9} />
      </mesh>
      {/* Cerchio */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.52, r * 0.52, w * 0.5, 10]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Centro mozzo */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.2, r * 0.2, w * 0.55, 6]} />
        <meshStandardMaterial color="#8a8a9a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ── Faro / Stop ───────────────────────────────────────────────────
function Light({ x, y, z, isFront }) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[0.04, 0.1, 0.22]} />
      <meshStandardMaterial
        color={isFront ? '#fffae0' : '#ff3030'}
        emissive={isFront ? '#ffe040' : '#ff1010'}
        emissiveIntensity={0.5}
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  )
}

// ── Modello auto procedurale ──────────────────────────────────────
function ProceduralCarMesh({ type = 'sedan', color = '#9aacc8' }) {
  const p = CAR_PROFILES[type] ?? CAR_PROFILES.sedan
  const groupRef = useRef()

  // Colore carrozzeria memoizzato
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.35,
    metalness: 0.55,
    envMapIntensity: 1.2,
  }), [color])

  // Vetro
  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#7ab8d4',
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
  }), [])

  // Paraurti / plastica
  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a24',
    roughness: 0.8,
    metalness: 0.1,
  }), [])

  const bodyY = p.groundY + p.wheelR + p.bodyH / 2

  return (
    <group ref={groupRef}>
      {/* ── Carrozzeria principale ── */}
      <mesh position={[0, bodyY, 0]} castShadow receiveShadow>
        <boxGeometry args={[p.bodyL, p.bodyH, p.bodyW]} />
        <primitive object={bodyMat} />
      </mesh>

      {/* ── Tetto / abitacolo ── */}
      <mesh
        position={[p.roofOffX, bodyY + p.bodyH / 2 + p.roofH / 2, 0]}
        castShadow
      >
        <boxGeometry args={[p.roofL, p.roofH, p.bodyW * 0.9]} />
        <primitive object={bodyMat} />
      </mesh>

      {/* ── Vetri (trasparenti sopra il tetto) ── */}
      <mesh position={[p.roofOffX, bodyY + p.bodyH / 2 + p.roofH / 2 + 0.01, 0]}>
        <boxGeometry args={[p.roofL - 0.08, p.roofH * 0.65, p.bodyW * 0.85]} />
        <primitive object={glassMat} />
      </mesh>

      {/* ── Paraurti anteriore ── */}
      <mesh position={[p.bodyL / 2 - 0.04, bodyY - p.bodyH * 0.22, 0]} castShadow>
        <boxGeometry args={[0.12, p.bodyH * 0.42, p.bodyW * 0.88]} />
        <primitive object={trimMat} />
      </mesh>

      {/* ── Paraurti posteriore ── */}
      <mesh position={[-p.bodyL / 2 + 0.04, bodyY - p.bodyH * 0.22, 0]} castShadow>
        <boxGeometry args={[0.12, p.bodyH * 0.42, p.bodyW * 0.88]} />
        <primitive object={trimMat} />
      </mesh>

      {/* ── Luci anteriori ── */}
      <Light x={p.bodyL / 2 + 0.02} y={bodyY + 0.05} z={p.bodyW / 2 - 0.18} isFront />
      <Light x={p.bodyL / 2 + 0.02} y={bodyY + 0.05} z={-(p.bodyW / 2 - 0.18)} isFront />

      {/* ── Luci posteriori ── */}
      <Light x={-p.bodyL / 2 - 0.02} y={bodyY + 0.05} z={p.bodyW / 2 - 0.18} isFront={false} />
      <Light x={-p.bodyL / 2 - 0.02} y={bodyY + 0.05} z={-(p.bodyW / 2 - 0.18)} isFront={false} />

      {/* ── Specchietti ── */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[p.roofOffX + 0.2, bodyY + p.bodyH * 0.35, side * (p.bodyW / 2 + 0.06)]}>
          <boxGeometry args={[0.18, 0.08, 0.06]} />
          <primitive object={bodyMat} />
        </mesh>
      ))}

      {/* ── Ruote (4 angoli) ── */}
      <Wheel x={p.wheelFX} z={p.wheelZ} r={p.wheelR} w={p.wheelW} />
      <Wheel x={p.wheelFX} z={-p.wheelZ} r={p.wheelR} w={p.wheelW} />
      <Wheel x={-p.wheelRX} z={p.wheelZ} r={p.wheelR} w={p.wheelW} />
      <Wheel x={-p.wheelRX} z={-p.wheelZ} r={p.wheelR} w={p.wheelW} />

      {/* Dettaglio elettrica: porta di ricarica */}
      {type === 'electric' && (
        <mesh position={[-p.bodyL / 2 + 0.15, bodyY + 0.12, p.bodyW / 2 + 0.01]}>
          <boxGeometry args={[0.12, 0.09, 0.02]} />
          <meshStandardMaterial color="#2a6aad" roughness={0.3} metalness={0.5} />
        </mesh>
      )}

      {/* Dettaglio SUV: barra tetto */}
      {(type === 'suv' || type === 'suv_large') && (
        <>
          <mesh position={[0, bodyY + p.bodyH / 2 + p.roofH + 0.04, p.bodyW * 0.3]}>
            <boxGeometry args={[p.roofL, 0.04, 0.04]} />
            <meshStandardMaterial color="#888" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0, bodyY + p.bodyH / 2 + p.roofH + 0.04, -p.bodyW * 0.3]}>
            <boxGeometry args={[p.roofL, 0.04, 0.04]} />
            <meshStandardMaterial color="#888" roughness={0.4} metalness={0.7} />
          </mesh>
        </>
      )}
    </group>
  )
}

// ── Wrapper con auto-rotate ───────────────────────────────────────
function ProceduralCarRotating({ type, color, autoRotate }) {
  const ref = useRef()

  useFrame((_, delta) => {
    if (ref.current && autoRotate) {
      ref.current.rotation.y += delta * 0.45
    }
  })

  return (
    <group ref={ref}>
      <ProceduralCarMesh type={type} color={color} />
    </group>
  )
}

export { ProceduralCarMesh, ProceduralCarRotating }
export default ProceduralCarRotating
