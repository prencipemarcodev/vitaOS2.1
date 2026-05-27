/**
 * Car3DViewer — viewer WebGL con modello 3D procedurale (sempre attivo)
 * + supporto GLB opzionale se il file è presente in /models/cars/{type}.glb
 *
 * Funziona SUBITO senza file esterni grazie a ProceduralCar.
 * Se viene trovato un .glb, lo usa al posto del modello procedurale (upgrade automatico).
 */
import { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import { Box3, Vector3, PCFShadowMap } from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { motion } from 'framer-motion'
import ProceduralCarRotating from './ProceduralCar'

// ── Lazy: GLB model (solo se il file esiste) ──────────────────────
let useGLTF = null
async function tryLoadGLTF() {
  try {
    const drei = await import('@react-three/drei')
    useGLTF = drei.useGLTF
    if (useGLTF && typeof useGLTF.setDecoderPath === 'function') {
      useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    }
    return true
  } catch { return false }
}


// ── Componente GLB (caricato solo se il file esiste) ──────────────
function GLBModel({ type, color, autoRotate }) {
  const { scene } = useGLTF(`/models/cars/${type}.glb`)
  const [transform, setTransform] = useState({ scale: 1, position: [0, 0, 0] })

  useEffect(() => {
    if (!scene) return

    // Ripristina sempre la scala e posizione originaria del modello cacheato per evitare calcoli ricorsivi
    scene.scale.setScalar(1)
    scene.position.set(0, 0, 0)
    scene.rotation.set(0, 0, 0)

    // 1. Centra e scala il modello dinamicamente per adattarlo alla camera
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())

    // Vogliamo che la dimensione massima (la lunghezza dell'auto) sia uniforme (circa 2.2 unità)
    const maxDim = Math.max(size.x, size.y, size.z)
    const targetScale = 2.2 / maxDim

    // Centra l'auto sugli assi X e Z, ed allinea la base delle ruote al terreno (-0.45)
    const posX = -center.x * targetScale
    const posZ = -center.z * targetScale
    const posY = -box.min.y * targetScale - 0.45

    setTransform({
      scale: targetScale,
      position: [posX, posY, posZ]
    })

    // 2. Applica il colore scelto e abilita ombre
    scene.traverse(child => {
      if (!child.isMesh) return
      const n = child.name.toLowerCase()
      if (['body', 'paint', 'car', 'hull', 'chassis', 'exterior'].some(k => n.includes(k))) {
        child.material = child.material.clone()
        child.material.color.set(color)
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene, color])

  const ref = useRef()
  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += delta * 0.45
    }
  })

  return (
    <group ref={ref} scale={transform.scale} position={transform.position}>
      <primitive object={scene} />
    </group>
  )
}

// ── Scene ─────────────────────────────────────────────────────────
function CarScene({ type, color, autoRotate, useGLB }) {
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-4, 4, -4]} intensity={0.7} />
      <directionalLight position={[0, 2, -6]} intensity={0.4} />

      <Suspense fallback={<ProceduralCarRotating type={type} color={color} autoRotate={autoRotate} />}>
        {useGLB && useGLTF
          ? <GLBModel type={type} color={color} autoRotate={autoRotate} />
          : <ProceduralCarRotating type={type} color={color} autoRotate={autoRotate} />
        }
        <ContactShadows position={[0, -0.72, 0]} opacity={0.35} scale={9} blur={3} />
      </Suspense>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        zoomSpeed={0.6}
        minDistance={2.5}
        maxDistance={8}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 1.9}
        autoRotate={autoRotate && !useGLB}
        autoRotateSpeed={0.8}
        makeDefault
      />
    </>
  )
}

// ── Controlli UI overlay ──────────────────────────────────────────
const PALETTE = [
  '#9aacc8', '#c8a09a', '#a8c8a0', '#1e1e28',
  '#f0ede8', '#b46243', '#4a90d9', '#c8c09a',
]

function ViewerControls({ autoRotate, setAutoRotate, color, onColorChange }) {
  return (
    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
      <div className="flex gap-1.5 pointer-events-auto">
        {PALETTE.map(c => (
          <button key={c} onClick={() => onColorChange(c)}
            className="w-4 h-4 rounded-full border-2 transition-all duration-150"
            style={{
              background: c,
              borderColor: color === c ? 'white' : 'transparent',
              transform: color === c ? 'scale(1.3)' : 'scale(1)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
        ))}
      </div>
      <button onClick={() => setAutoRotate(v => !v)}
        className="pointer-events-auto text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full transition-all"
        style={{
          background: autoRotate ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
        {autoRotate ? '⏸ Fermo' : '▶ Ruota'}
      </button>
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────
function Car3DViewer({
  vehicleType = 'sedan',
  color: externalColor,
  onColorChange,
  height,          // opzionale: se non passato usa altezza responsiva
  className = '',
}) {
  const [autoRotate, setAutoRotate] = useState(true)
  const [internalColor, setInternalColor] = useState(externalColor ?? '#9aacc8')
  const [glbExists, setGlbExists] = useState(false)
  const [gltfReady, setGltfReady] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)

  const color = externalColor ?? internalColor

  const handleColorChange = useCallback((c) => {
    setInternalColor(c)
    onColorChange?.(c)
  }, [onColorChange])

  // Carica Three.js (montaggio iniziale)
  useEffect(() => {
    tryLoadGLTF().then(setGltfReady)
    // Piccolo ritardo per evitare layout shift durante la transizione pagina
    const t = setTimeout(() => setCanvasReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Controlla se esiste il GLB per questo tipo
  useEffect(() => {
    setGlbExists(false)
    fetch(`/models/cars/${vehicleType}.glb`, { method: 'HEAD' })
      .then(r => { if (r.ok) setGlbExists(true) })
      .catch(() => {})
  }, [vehicleType])

  const useGLB = glbExists && gltfReady

  // Altezza responsiva: se non viene passata usa clamp(280px, 42vh, 520px)
  const viewerHeight = height ?? 'clamp(280px, 42vh, 520px)'

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        height: viewerHeight,
        background: `radial-gradient(ellipse 80% 60% at 50% 80%, ${color}22 0%, ${color}08 55%, var(--bg-base) 100%)`,
      }}
    >
      {canvasReady && (
        <Canvas
          camera={{ position: [2.8, 1.4, 2.8], fov: 45 }}
          shadows
          dpr={[1, 2]}
          gl={{ shadowMapType: PCFShadowMap }}
          style={{ width: '100%', height: '100%' }}
        >
          <CarScene type={vehicleType} color={color} autoRotate={autoRotate} useGLB={useGLB} />
        </Canvas>
      )}

      {/* GLB badge (solo se 3D da file) */}
      {useGLB && (
        <div className="absolute top-2.5 left-3 pointer-events-none">
          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)' }}>
            3D
          </span>
        </div>
      )}

      {/* Hint drag */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <motion.span
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 3.5, delay: 1.2, repeat: 0 }}
          className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-1 rounded-full"
          style={{
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(0,0,0,0.18)',
            backdropFilter: 'blur(6px)',
          }}>
          🖱 Trascina · Scorri per zoom
        </motion.span>
      </div>

      {/* Controlli */}
      <ViewerControls
        autoRotate={autoRotate}
        setAutoRotate={setAutoRotate}
        color={color}
        onColorChange={handleColorChange}
      />
    </div>
  )
}

export default Car3DViewer
