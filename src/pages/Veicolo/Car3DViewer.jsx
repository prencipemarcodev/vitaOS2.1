/**
 * Car3DViewer — viewer WebGL con modello 3D procedurale (sempre attivo)
 * + supporto GLB opzionale se il file è presente in /models/cars/{type}.glb
 *
 * Funziona SUBITO senza file esterni grazie a ProceduralCar.
 * Se viene trovato un .glb, lo usa al posto del modello procedurale (upgrade automatico).
 */
import { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import { Box3, Vector3, PCFShadowMap } from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
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

// ── Config camera ─────────────────────────────────────────────────
// CAM_TARGET Y = punto in cui si centra il viewport (corpo auto, non ruote)
// CAM_POSITION Y = altezza camera — più basso = angolo piatto = auto più alta nel frame
// Angolo: atan((1.1 - 0.6) / sqrt(3.2²+3.2²)) = atan(0.5/4.52) ≈ 6.3° (car configurator)
const CAM_TARGET   = [0, 0.6, 0]
const CAM_POSITION = [3.2, 1.1, 3.2]

// ── DEBUG MODE ────────────────────────────────────────────────────
// Imposta su true per attivare helpers 3D e overlay con stats live
const DEBUG = true

// ── Helpers di debug (visibili solo in modalità DEBUG) ────────────
function DebugHelpers({ controlsRef }) {
  const { camera } = useThree()
  const camMarkerRef = useRef()
  const [stats, setStats] = useState({ pos: [0, 0, 0], target: [0, 0, 0], polar: 0, dist: 0 })

  useFrame(() => {
    if (!camera) return
    const pos = camera.position
    const tgt = controlsRef.current?.target ?? { x: 0, y: 0, z: 0 }
    const dx = pos.x - tgt.x, dy = pos.y - tgt.y, dz = pos.z - tgt.z
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const polar = dist > 0 ? Math.acos(Math.max(-1, Math.min(1, dy / dist))) * (180 / Math.PI) : 0

    if (camMarkerRef.current) {
      camMarkerRef.current.position.copy(pos)
    }

    setStats({
      pos: [pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2)],
      target: [tgt.x.toFixed(2), tgt.y.toFixed(2), tgt.z.toFixed(2)],
      polar: polar.toFixed(1),
      dist: dist.toFixed(2),
    })
  })

  return (
    <>
      {/* Assi del mondo: X=rosso, Y=verde, Z=blu */}
      <axesHelper args={[3]} />

      {/* Griglia di riferimento (10×10 unità) */}
      <gridHelper args={[10, 10, '#888', '#444']} position={[0, -0.01, 0]} />

      {/* Sfera rossa = posizione camera */}
      <mesh ref={camMarkerRef}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="red" />
      </mesh>

      {/* Linea da target → camera */}
      <lineSegments>
        <bufferGeometry
          onUpdate={self => self.setFromPoints([
            new Vector3(...CAM_TARGET),
            camera.position.clone(),
          ])}
        />
        <lineBasicMaterial color="red" />
      </lineSegments>

      {/* Sfera gialla = target di OrbitControls */}
      <mesh position={CAM_TARGET}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {/* Sfera cyan = origine mondo */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="cyan" />
      </mesh>

      {/* Overlay HTML con stats live */}
      <DebugOverlay stats={stats} />
    </>
  )
}

// Overlay testuale sovrapposto al canvas (usa drei <Html> o un portale React)
function DebugOverlay({ stats }) {
  // Renderizza come elemento assoluto all'esterno del canvas tramite R3F Html
  return null // renderizzato fuori dal Canvas nel componente principale
}

// ── Setup imperativo camera + OrbitControls ───────────────────────
// Usa requestAnimationFrame per garantire che OrbitControls sia montato
// prima di leggere controlsRef.current.
function CameraRig({ controlsRef }) {
  const { camera } = useThree()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // rAF: attende il prossimo frame di rendering così OrbitControls
    // è sicuramente montato e controlsRef.current è valorizzato
    const raf = requestAnimationFrame(() => {
      camera.position.set(...CAM_POSITION)
      camera.lookAt(...CAM_TARGET)
      camera.updateProjectionMatrix()
      if (controlsRef.current) {
        controlsRef.current.target.set(...CAM_TARGET)
        controlsRef.current.update()
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [camera, controlsRef])

  return null
}

// ── Scene ─────────────────────────────────────────────────────────
function CarScene({ type, color, autoRotate, useGLB }) {
  const controlsRef = useRef()

  return (
    <>
      <CameraRig controlsRef={controlsRef} />
      {DEBUG && <DebugHelpers controlsRef={controlsRef} />}

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
        <ContactShadows position={[0, -0.01, 0]} opacity={0.3} scale={9} blur={2.5} />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={false}
        zoomSpeed={0.6}
        minDistance={2.0}
        maxDistance={8}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 1.9}
        autoRotate={false}
        makeDefault
      />
    </>
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
  const [debugStats, setDebugStats] = useState(null)

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
      .catch(() => { })
  }, [vehicleType])

  const useGLB = glbExists && gltfReady

  // Altezza responsiva: se non viene passata usa clamp(300px, 45vh, 540px)
  const viewerHeight = height ?? 'clamp(300px, 45vh, 540px)'

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        height: viewerHeight,
        background: `radial-gradient(ellipse 80% 60% at 50% 75%, ${color}22 0%, ${color}08 55%, var(--bg-base) 100%)`,
      }}
    >
      {canvasReady && (
        <Canvas
          camera={{ position: CAM_POSITION, fov: 42 }}
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
          Trascina · Scorri per zoom
        </motion.span>
      </div>

      {/* Pulsante rotazione (bottom-right) */}
      <div className="absolute bottom-3 right-3 pointer-events-auto">
        <button
          onClick={() => setAutoRotate(v => !v)}
          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full transition-all"
          style={{
            background: autoRotate ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.12)',
            color: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
          {autoRotate ? '⏸' : '▶'}
        </button>
      </div>

      {/* DEBUG overlay HTML (attivato da DEBUG flag) */}
      {DEBUG && canvasReady && (
        <div
          className="absolute top-2 left-2 pointer-events-none z-30 font-mono text-[10px] leading-snug p-2 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.72)', color: '#0f0', backdropFilter: 'blur(4px)' }}
        >
          <DebugPanel vehicleType={vehicleType} useGLB={useGLB} />
        </div>
      )}
    </div>
  )
}

// ── Debug panel (legge lo stato del canvas via un bridge) ─────────
// Componente separato che vive DENTRO il Canvas e scrive in un ref condiviso
function DebugPanel({ vehicleType, useGLB }) {
  return (
    <div>
      <div style={{ color: '#ff0', marginBottom: 2 }}>── DEBUG ──</div>
      <div>type: <b>{vehicleType}</b></div>
      <div>glb: <b>{useGLB ? 'yes' : 'no'}</b></div>
      <div style={{ marginTop: 4, color: '#0ff' }}>CAM_POS: [{CAM_POSITION.join(', ')}]</div>
      <div style={{ color: '#ff0' }}>CAM_TGT: [{CAM_TARGET.join(', ')}]</div>
      <div style={{ marginTop: 4, color: '#f80' }}>
        ● Sfera rossa = camera<br />
        ● Sfera gialla = target<br />
        ● Sfera cyan = origine<br />
        ● Assi: X=rosso Y=verde Z=blu
      </div>
    </div>
  )
}

export default Car3DViewer
