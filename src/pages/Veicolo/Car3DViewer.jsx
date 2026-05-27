/**
 * Car3DViewer — viewer WebGL con modello 3D procedurale (sempre attivo)
 * + supporto GLB opzionale se il file è presente in /models/cars/{type}.glb
 *
 * DEBUG=true → pannello floating con slider live per cam position/target/fov
 */
import { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import { Box3, Vector3, PCFShadowMap } from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
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

// ── Componente GLB ────────────────────────────────────────────────
function GLBModel({ type, color, autoRotate }) {
  const { scene } = useGLTF(`/models/cars/${type}.glb`)
  const [transform, setTransform] = useState({ scale: 1, position: [0, 0, 0] })

  useEffect(() => {
    if (!scene) return
    scene.scale.setScalar(1)
    scene.position.set(0, 0, 0)
    scene.rotation.set(0, 0, 0)
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const targetScale = 2.2 / maxDim
    setTransform({
      scale: targetScale,
      position: [-center.x * targetScale, -box.min.y * targetScale - 0.45, -center.z * targetScale]
    })
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
    if (autoRotate && ref.current) ref.current.rotation.y += delta * 0.45
  })

  return (
    <group ref={ref} scale={transform.scale} position={transform.position}>
      <primitive object={scene} />
    </group>
  )
}

// ── Config camera (valori di default) ────────────────────────────
// Modificabili live tramite il pannello debug (DEBUG=true)
const DEFAULT_CAM_TARGET   = [0, 0.6, 0]
const DEFAULT_CAM_POSITION = [3.2, 1.1, 3.2]
const DEFAULT_FOV          = 42

// ── DEBUG MODE ────────────────────────────────────────────────────
const DEBUG = false

// ── CameraRig: setup imperativo camera + controls ─────────────────
// Usa RAF per garantire che OrbitControls sia montato prima di agire.
// Accetta position e target come prop (aggiornabili dal pannello debug).
function CameraRig({ controlsRef, position, target, fov, applySignal }) {
  const { camera } = useThree()
  const initialized = useRef(false)

  // Init al mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const raf = requestAnimationFrame(() => {
      camera.position.set(...position)
      camera.fov = fov
      camera.lookAt(...target)
      camera.updateProjectionMatrix()
      if (controlsRef.current) {
        controlsRef.current.target.set(...target)
        controlsRef.current.update()
      }
    })
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Aggiornamento live (debug panel)
  useEffect(() => {
    if (!initialized.current) return
    camera.position.set(...position)
    camera.fov = fov
    camera.updateProjectionMatrix()
    if (controlsRef.current) {
      controlsRef.current.target.set(...target)
      controlsRef.current.update()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applySignal])

  return null
}

// ── Debug 3D helpers ──────────────────────────────────────────────
function DebugHelpers3D({ controlsRef, position, target }) {
  const { camera } = useThree()
  const camMarkerRef = useRef()

  useFrame(() => {
    if (camMarkerRef.current) camMarkerRef.current.position.copy(camera.position)
  })

  return (
    <>
      <axesHelper args={[3]} />
      <gridHelper args={[10, 10, '#666', '#333']} position={[0, -0.01, 0]} />
      {/* Sfera rossa = camera */}
      <mesh ref={camMarkerRef}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="red" />
      </mesh>
      {/* Sfera gialla = target */}
      <mesh position={target}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
      {/* Sfera cyan = origine mondo */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="cyan" />
      </mesh>
    </>
  )
}

// ── Scene ─────────────────────────────────────────────────────────
function CarScene({ type, color, autoRotate, useGLB, position, target, fov, applySignal }) {
  const controlsRef = useRef()

  return (
    <>
      <CameraRig controlsRef={controlsRef} position={position} target={target} fov={fov} applySignal={applySignal} />
      {DEBUG && <DebugHelpers3D controlsRef={controlsRef} position={position} target={target} />}

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

// ── Pannello Debug Camera (fuori dal Canvas) ──────────────────────
function DebugCameraPanel({ pos, setPos, tgt, setTgt, fov, setFov, onApply }) {
  const angle = (() => {
    const dx = pos[0] - tgt[0], dy = pos[1] - tgt[1], dz = pos[2] - tgt[2]
    const horizDist = Math.sqrt(dx * dx + dz * dz)
    return horizDist > 0 ? Math.atan2(dy, horizDist) * (180 / Math.PI) : 0
  })()

  const handleCopy = () => {
    const code = `const CAM_TARGET   = [${tgt.map(v => v.toFixed(2)).join(', ')}]\nconst CAM_POSITION = [${pos.map(v => v.toFixed(2)).join(', ')}]\nconst DEFAULT_FOV  = ${fov}`
    navigator.clipboard.writeText(code).then(() => alert('📋 Copiato negli appunti!'))
  }

  const slider = (label, value, min, max, step, onChange) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ color: '#aaa', fontSize: 9, letterSpacing: 1 }}>{label}</span>
        <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 36, textAlign: 'right' }}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', height: 3, accentColor: '#4af', cursor: 'pointer' }}
      />
    </div>
  )

  const makeAxis = (arrState, setArr, idx, label, min, max) =>
    slider(`${label} ${['X', 'Y', 'Z'][idx]}`, arrState[idx], min, max, 0.05, v => {
      const n = [...arrState]; n[idx] = v; setArr(n); onApply(idx === 0 ? n : pos, idx === 0 ? tgt : n, fov)
    })

  // Workaround: build proper handlers per array
  const camSlider = (idx, min, max) => {
    const axes = ['X', 'Y', 'Z']
    return slider(`POS ${axes[idx]}`, pos[idx], min, max, 0.05, v => {
      const n = [...pos]; n[idx] = v; setPos(n); onApply(n, tgt, fov)
    })
  }
  const tgtSlider = (idx, min, max) => {
    const axes = ['X', 'Y', 'Z']
    return slider(`TGT ${axes[idx]}`, tgt[idx], min, max, 0.05, v => {
      const n = [...tgt]; n[idx] = v; setTgt(n); onApply(pos, n, fov)
    })
  }

  return (
    <div style={{
      position: 'absolute', top: 8, left: 8, zIndex: 50,
      width: 220, fontFamily: 'monospace',
      background: 'rgba(10,10,18,0.92)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(80,140,255,0.3)',
      borderRadius: 10, padding: '10px 12px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      <div style={{ color: '#4af', fontWeight: 900, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>
        ◉ CAMERA DEBUG
      </div>

      <div style={{ color: '#4af', fontSize: 9, letterSpacing: 1, marginBottom: 4 }}>POSITION</div>
      {camSlider(0, -8, 8)}
      {camSlider(1, -2, 6)}
      {camSlider(2, -8, 8)}

      <div style={{ color: '#fa4', fontSize: 9, letterSpacing: 1, marginTop: 8, marginBottom: 4 }}>TARGET</div>
      {tgtSlider(0, -3, 3)}
      {tgtSlider(1, -1, 3)}
      {tgtSlider(2, -3, 3)}

      <div style={{ color: '#af4', fontSize: 9, letterSpacing: 1, marginTop: 8, marginBottom: 4 }}>FOV</div>
      {slider('FOV', fov, 20, 90, 1, v => { setFov(v); onApply(pos, tgt, v) })}

      <div style={{
        marginTop: 8, padding: '5px 8px', borderRadius: 6,
        background: 'rgba(80,140,255,0.1)', border: '1px solid rgba(80,140,255,0.2)',
        fontSize: 9, color: '#aaa', lineHeight: 1.6,
      }}>
        <span style={{ color: '#ff4', fontWeight: 700 }}>angolo: {angle.toFixed(1)}°</span>
        {' '}sopra orizzonte<br />
        <span style={{ color: '#0ff' }}>dist: {Math.sqrt(
          (pos[0] - tgt[0]) ** 2 + (pos[1] - tgt[1]) ** 2 + (pos[2] - tgt[2]) ** 2
        ).toFixed(2)}</span>
      </div>

      <button
        onClick={handleCopy}
        style={{
          marginTop: 8, width: '100%', padding: '5px 0',
          background: 'rgba(80,140,255,0.2)',
          border: '1px solid rgba(80,140,255,0.4)',
          borderRadius: 6, color: '#4af',
          fontSize: 10, fontWeight: 900, cursor: 'pointer',
          letterSpacing: 1,
        }}
      >
        📋 COPIA VALORI
      </button>
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────
function Car3DViewer({
  vehicleType = 'sedan',
  color: externalColor,
  onColorChange,
  height,
  className = '',
}) {
  // Modello sempre statico — l'utente interagisce manualmente
  const autoRotate = false

  const [internalColor, setInternalColor] = useState(externalColor ?? '#9aacc8')
  const [glbExists, setGlbExists] = useState(false)
  const [gltfReady, setGltfReady] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)

  // ── Debug camera state ──────────────────────────────────────────
  const [dbPos, setDbPos]       = useState([...DEFAULT_CAM_POSITION])
  const [dbTgt, setDbTgt]       = useState([...DEFAULT_CAM_TARGET])
  const [dbFov, setDbFov]       = useState(DEFAULT_FOV)
  // applySignal: incrementato ogni volta che il pannello debug
  // chiede un aggiornamento live della camera
  const [applySignal, setApplySignal] = useState(0)

  const camPosition = DEBUG ? dbPos : DEFAULT_CAM_POSITION
  const camTarget   = DEBUG ? dbTgt : DEFAULT_CAM_TARGET
  const camFov      = DEBUG ? dbFov : DEFAULT_FOV

  const handleDebugApply = useCallback((pos, tgt, fov) => {
    setDbPos([...pos])
    setDbTgt([...tgt])
    setDbFov(fov)
    setApplySignal(s => s + 1)
  }, [])

  const color = externalColor ?? internalColor

  const handleColorChange = useCallback((c) => {
    setInternalColor(c)
    onColorChange?.(c)
  }, [onColorChange])

  useEffect(() => {
    tryLoadGLTF().then(setGltfReady)
    const t = setTimeout(() => setCanvasReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setGlbExists(false)
    fetch(`/models/cars/${vehicleType}.glb`, { method: 'HEAD' })
      .then(r => { if (r.ok) setGlbExists(true) })
      .catch(() => { })
  }, [vehicleType])

  const useGLB = glbExists && gltfReady
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
          camera={{ position: camPosition, fov: camFov }}
          shadows
          dpr={[1, 2]}
          gl={{ shadowMapType: PCFShadowMap }}
          style={{ width: '100%', height: '100%' }}
        >
          <CarScene
            type={vehicleType}
            color={color}
            autoRotate={autoRotate}
            useGLB={useGLB}
            position={camPosition}
            target={camTarget}
            fov={camFov}
            applySignal={applySignal}
          />
        </Canvas>
      )}

      {/* GLB badge */}
      {useGLB && (
        <div className="absolute top-2.5 left-3 pointer-events-none">
          <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)' }}>
            3D
          </span>
        </div>
      )}

      {/* Debug panel floating (solo DEBUG=true) */}
      {DEBUG && canvasReady && (
        <DebugCameraPanel
          pos={dbPos} setPos={setDbPos}
          tgt={dbTgt} setTgt={setDbTgt}
          fov={dbFov} setFov={setDbFov}
          onApply={handleDebugApply}
        />
      )}
    </div>
  )
}

export default Car3DViewer
