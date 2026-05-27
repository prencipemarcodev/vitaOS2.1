/**
 * Car3DViewer — viewer WebGL con OrbitControls, stile Tesla habitacle.
 *
 * Comportamento:
 * - Se il file GLB esiste in /models/cars/{type}.glb → carica e mostra il modello 3D
 * - Se il file non esiste o Three.js ha errori → fallback alla SVG animata
 * - Tinting colore utente applicato alle mesh della carrozzeria (nome include "body" o "paint")
 */
import { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Car } from 'lucide-react'

// ── Lazy import Three.js per non appesantire il bundle principale ──
let threeLoaded = false
let Canvas, useGLTF, OrbitControls, Environment, ContactShadows, useFrame

async function loadThree() {
  if (threeLoaded) return true
  try {
    const fiber = await import('@react-three/fiber')
    const drei = await import('@react-three/drei')
    Canvas = fiber.Canvas
    useGLTF = drei.useGLTF
    OrbitControls = drei.OrbitControls
    Environment = drei.Environment
    ContactShadows = drei.ContactShadows
    useFrame = fiber.useFrame
    threeLoaded = true
    return true
  } catch {
    return false
  }
}

// ── Fallback SVG (usata quando Three.js non è caricato o modello assente) ──
function CarSVGFallback({ color = '#9aacc8' }) {
  const id = color.replace('#', '')
  return (
    <svg viewBox="0 0 320 130" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 280 }} aria-hidden="true">
      <defs>
        <linearGradient id={`f-vb-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="55%" stopColor={color} stopOpacity="0.75" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`f-vr-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="126" rx="130" ry="6" fill="rgba(0,0,0,0.08)" />
      <path d="M32 90 L32 76 Q35 68 50 63 L62 61 L258 61 L272 66 L282 76 L282 90 Z" fill={`url(#f-vb-${id})`} />
      <path d="M88 61 L104 34 Q110 28 118 26 L200 26 Q208 26 214 31 L234 61 Z" fill={`url(#f-vr-${id})`} />
      <path d="M200 26 Q208 26 214 31 L234 61 L212 61 Z" fill="rgba(140,190,240,0.22)" />
      <path d="M88 61 L104 34 Q110 28 118 26 L110 61 Z" fill="rgba(140,190,240,0.18)" />
      <rect x="112" y="30" width="86" height="29" rx="3" fill="rgba(130,185,240,0.16)" />
      <path d="M268 67 L280 73 L277 80 L260 78 Z" fill="rgba(255,245,180,0.92)" />
      <path d="M50 64 L34 71 L35 79 L54 77 Z" fill="rgba(220,60,60,0.82)" />
      {[226, 90].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={97} r="22" fill="#2a2a38" />
          <circle cx={cx} cy={97} r="9" fill="#48485a" />
          <circle cx={cx} cy={97} r="3.5" fill="rgba(255,255,255,0.28)" />
        </g>
      ))}
    </svg>
  )
}

// ── Skeleton durante il caricamento del modello 3D ────────────────
function LoadingCar({ color }) {
  return (
    <group>
      {/* Box placeholder animato */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[2.8, 0.8, 1.4]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} wireframe />
      </mesh>
      <mesh position={[0, 0.85, 0.1]}>
        <boxGeometry args={[1.6, 0.55, 1.3]} />
        <meshStandardMaterial color={color} transparent opacity={0.2} wireframe />
      </mesh>
    </group>
  )
}

// ── Modello 3D (caricato via useGLTF) ────────────────────────────
function CarModel({ type, color }) {
  const { scene } = useGLTF(`/models/cars/${type}.glb`)
  const ref = useRef()

  // Applica colore alle mesh della carrozzeria
  useEffect(() => {
    if (!scene) return
    scene.traverse((child) => {
      if (!child.isMesh) return
      const name = child.name.toLowerCase()
      // Tinta solo mesh body/paint/carrosserie/car_body
      const isBody = ['body', 'paint', 'car', 'hull', 'chassis', 'exterior'].some(k => name.includes(k))
      if (isBody) {
        child.material = child.material.clone()
        child.material.color.set(color)
        child.castShadow = true
        child.receiveShadow = false
      }
    })
  }, [scene, color])

  // Gentle auto-rotate on idle (reset when user interacts)
  useFrame((_, delta) => {
    if (ref.current) {
      // Tiny oscillation for a "alive" feel (no full rotation)
      ref.current.rotation.y += delta * 0.08
    }
  })

  return <primitive ref={ref} object={scene} />
}

// ── Scene wrapper ─────────────────────────────────────────────────
function CarScene({ type, color, autoRotate }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow
        shadow-mapSize-width={512} shadow-mapSize-height={512} />
      <directionalLight position={[-4, 3, -4]} intensity={0.4} />
      <Environment preset="city" />
      <Suspense fallback={<LoadingCar color={color} />}>
        <CarModel type={type} color={color} />
        <ContactShadows position={[0, -0.85, 0]} opacity={0.25} scale={6} blur={2} />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        makeDefault
      />
    </>
  )
}

// ── Controlli UI overlay ─────────────────────────────────────────
function ViewerControls({ autoRotate, setAutoRotate, color, onColorChange, label }) {
  const PALETTE = [
    '#9aacc8', '#c8a09a', '#a8c8a0', '#1e1e28',
    '#f0ede8', '#b46243', '#4a90d9', '#c8c09a',
  ]
  return (
    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
      {/* Color dots */}
      <div className="flex gap-1.5 pointer-events-auto">
        {PALETTE.map(c => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className="w-4 h-4 rounded-full border-2 transition-all duration-150"
            style={{
              background: c,
              borderColor: color === c ? 'white' : 'transparent',
              transform: color === c ? 'scale(1.3)' : 'scale(1)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          />
        ))}
      </div>

      {/* Auto-rotate toggle */}
      <button
        onClick={() => setAutoRotate(v => !v)}
        className="pointer-events-auto text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full transition-all duration-200"
        style={{
          background: autoRotate ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {autoRotate ? '⏸ Fermo' : '▶ Ruota'}
      </button>
    </div>
  )
}

// ── Componente principale esportato ────────────────────────────────
function Car3DViewer({
  vehicleType = 'sedan',
  color: externalColor,
  onColorChange,
  label,
  height = 220,
  className = '',
}) {
  const [threeReady, setThreeReady] = useState(false)
  const [modelExists, setModelExists] = useState(null) // null = checking, true/false
  const [autoRotate, setAutoRotate] = useState(true)
  const [internalColor, setInternalColor] = useState(externalColor ?? '#9aacc8')

  const color = externalColor ?? internalColor
  const handleColorChange = useCallback((c) => {
    setInternalColor(c)
    onColorChange?.(c)
  }, [onColorChange])

  // Carica Three.js in modo asincrono
  useEffect(() => {
    loadThree().then(ok => setThreeReady(ok))
  }, [])

  // Verifica se il modello GLB esiste (fetch HEAD)
  useEffect(() => {
    setModelExists(null)
    fetch(`/models/cars/${vehicleType}.glb`, { method: 'HEAD' })
      .then(r => setModelExists(r.ok))
      .catch(() => setModelExists(false))
  }, [vehicleType])

  const showViewer = threeReady && modelExists === true

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-xl)] ${className}`}
      style={{
        height,
        background: `radial-gradient(ellipse 90% 70% at 50% 75%, ${color}18 0%, ${color}06 50%, var(--bg-base) 100%)`,
      }}
    >
      {/* ── 3D Canvas ── */}
      {showViewer && Canvas && (
        <Canvas
          camera={{ position: [3.5, 1.6, 3.5], fov: 42 }}
          shadows
          dpr={[1, 1.5]}
          style={{ width: '100%', height: '100%' }}
        >
          <CarScene type={vehicleType} color={color} autoRotate={autoRotate} />
        </Canvas>
      )}

      {/* ── SVG Fallback ── */}
      {!showViewer && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div style={{ width: '75%', maxWidth: 260 }}>
            <CarSVGFallback color={color} />
          </div>
        </motion.div>
      )}

      {/* ── Loading indicator (verifica in corso) ── */}
      {modelExists === null && !showViewer && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin opacity-40" />
        </div>
      )}

      {/* ── "3D non disponibile" badge discreto ── */}
      {modelExists === false && (
        <div className="absolute top-3 right-3">
          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full opacity-30"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            SVG preview
          </span>
        </div>
      )}

      {/* ── Controlli (visibili solo quando 3D attivo) ── */}
      {showViewer && (
        <ViewerControls
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
          color={color}
          onColorChange={handleColorChange}
          label={label}
        />
      )}

      {/* ── Hint drag (solo quando 3D attivo) ── */}
      {showViewer && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <motion.span
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-[8px] font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            Trascina per ruotare
          </motion.span>
        </div>
      )}
    </div>
  )
}

// Pre-carica il modello successivo nel background (ottimizzazione UX)
export function preloadCarModel(type) {
  if (typeof useGLTF !== 'undefined') {
    useGLTF.preload(`/models/cars/${type}.glb`)
  }
}

export default Car3DViewer
