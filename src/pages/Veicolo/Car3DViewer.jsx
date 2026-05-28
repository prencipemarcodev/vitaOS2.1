/**
 * Car3DViewer — viewer WebGL con modello 3D procedurale (sempre attivo)
 * + supporto GLB opzionale se il file è presente in /models/cars/{type}.glb
 *
 * DEBUG=true → pannello floating con slider live per cam position/target/fov
 */
import { Suspense, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Box3, Vector3, PCFShadowMap } from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Html, useProgress } from '@react-three/drei'
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

    // Se abbiamo già calcolato la trasformazione per questo modello (che viene caricato ed è cacheato),
    // usiamo quella calcolata all'inizio, evitando di ricalcolare il Box3 sul modello già scalato/posizionato
    // dal parent group.
    if (scene.userData.carTransform) {
      setTransform(scene.userData.carTransform)
      scene.traverse(child => {
        if (!child.isMesh) return
        const n = child.name.toLowerCase()
        if (['body', 'paint', 'car', 'hull', 'chassis', 'exterior'].some(k => n.includes(k))) {
          if (!child.userData.materialCloned) {
            child.material = child.material.clone()
            child.userData.materialCloned = true
          }
          child.material.color.set(color)
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      return
    }

    // Reset local transforms prima del calcolo iniziale del box
    scene.scale.setScalar(1)
    scene.position.set(0, 0, 0)
    scene.rotation.set(0, 0, 0)
    scene.updateMatrixWorld(true)

    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const targetScale = 2.2 / maxDim
    const computedTransform = {
      scale: targetScale,
      position: [-center.x * targetScale, -box.min.y * targetScale - 0.45, -center.z * targetScale]
    }

    scene.userData.carTransform = computedTransform
    setTransform(computedTransform)

    scene.traverse(child => {
      if (!child.isMesh) return
      const n = child.name.toLowerCase()
      if (['body', 'paint', 'car', 'hull', 'chassis', 'exterior'].some(k => n.includes(k))) {
        child.material = child.material.clone()
        child.userData.materialCloned = true
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

// ── Config camera (valori di default) ─────────────────────────
// Valori trovati con il pannello debug e poi dimezzati in distanza (zoom ×2)
// POS originale [6.20, 4.20, 6.20] → /2 = [3.10, 2.10, 3.10]
const DEFAULT_CAM_TARGET = [0, 0, 0]   // centro visivo (quasi all'origine)
const DEFAULT_CAM_POSITION = [2.30, 1.60, 2.30] // telecamera più vicina (zoom del 25% maggiore)
const DEFAULT_FOV = 42

// ── DEBUG MODE ─────────────────────────────────────────────────
const DEBUG = false

// ── CameraRig: setup imperativo camera + controls ─────────────────
// Usa RAF per garantire che OrbitControls sia montato prima di agire.
// Accetta position e target come prop (aggiornabili dal pannello debug).
function CameraRig({ controlsRef, vehicleId, position, target, fov, applySignal }) {
  const { camera } = useThree()

  const resetCamera = useCallback(() => {
    camera.position.set(...position)
    camera.fov = fov
    camera.lookAt(...target)
    camera.updateProjectionMatrix()
    if (controlsRef.current) {
      controlsRef.current.target.set(...target)
      controlsRef.current.update()
    }
  }, [camera, controlsRef, position, target, fov])

  // Reset al cambio di auto (ascolta vehicleId anziché type per resettare anche se la categoria 3D è identica)
  useEffect(() => {
    const raf = requestAnimationFrame(resetCamera)
    return () => cancelAnimationFrame(raf)
  }, [vehicleId, resetCamera])

  // Aggiornamento live (debug panel)
  useEffect(() => {
    resetCamera()
  }, [applySignal, resetCamera])

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

// ── Loading Bar Overlay inside Canvas ─────────────────────────────
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div 
        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)] min-w-[200px]"
        style={{
          background: 'rgba(26, 26, 36, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}
      >
        <div className="w-full bg-[rgba(255,255,255,0.08)] h-1.5 rounded-full overflow-hidden relative mb-2.5">
          <div 
            className="bg-[var(--color-primary)] h-full transition-all duration-300 rounded-full" 
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--color-primary) 0%, #4af 100%)'
            }} 
          />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#9aacc8]">
          Caricamento... {progress.toFixed(0)}%
        </span>
      </div>
    </Html>
  )
}

// ── ModelReadySignal: fires callback on mount (inside Suspense = after model loaded) ──
function ModelReadySignal({ onReady }) {
  useEffect(() => {
    const t = setTimeout(onReady, 120)
    return () => clearTimeout(t)
  }, [onReady])
  return null
}

// ── DiagnosticHotspot: sistema-native HUD callout, nessuna emoji ───
function DiagnosticHotspot({ position, label, abbr, value, status, side = 'right', delay = 0, visible: parentVisible = false }) {
  const [visible, setVisible] = useState(false)
  const rootRef = useRef()    // ref al DOM — aggiornato direttamente da useFrame (zero re-render)

  useEffect(() => {
    if (!parentVisible) { setVisible(false); return }
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [parentVisible, delay])

  // ── Depth/facing — ogni frame, manipolazione DOM diretta ──────────
  useFrame(({ camera }) => {
    if (!rootRef.current) return
    const posVec = new Vector3(position[0], position[1], position[2])
    // Vettore dalla hotspot verso la camera
    const toCamera = new Vector3().subVectors(camera.position, posVec).normalize()
    // Normale di superficie approssimata: per un'auto centrata all'origine
    // il vettore posizione → fuori è una buona approssimazione della normale
    const normal = posVec.clone().normalize()
    const dot = normal.dot(toCamera)
    // dot = 1: punto frontale → opacità piena
    // dot = 0: punto laterale → transizione
    // dot = -1: punto sul retro → quasi invisibile
    const opacity = Math.max(0.06, Math.min(1, dot * 1.9 + 0.22))
    rootRef.current.style.opacity = opacity.toString()
    // Disabilita pointer-events quando in secondo piano
    rootRef.current.style.pointerEvents = opacity < 0.4 ? 'none' : 'none' // sempre none, le card interne gestiscono
  })

  const isLeft = side === 'left'
  const lineW = 52

  const c = {
    danger:  { dot: '#ef4444', badge: 'rgba(239,68,68,0.12)', badgeText: '#ef4444', label: 'ALERT' },
    warning: { dot: '#f59e0b', badge: 'rgba(245,158,11,0.10)', badgeText: '#ca8a04', label: 'VERIFICA' },
    success: { dot: '#16a34a', badge: 'rgba(22,163,74,0.10)',  badgeText: '#16a34a', label: 'OK' },
  }[status] ?? { dot: '#16a34a', badge: 'rgba(22,163,74,0.10)', badgeText: '#16a34a', label: 'OK' }

  const anim = {
    transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
    opacity: visible ? 1 : 0,
    transform: visible
      ? 'translateY(0) scale(1)'
      : `translateY(${isLeft ? '-6px' : '6px'}) scale(0.88)`,
  }

  return (
    <Html position={position} center zIndexRange={[10, 20]} style={{ pointerEvents: 'none' }}>
      <div ref={rootRef} style={{
        position: 'relative', width: 0, height: 0,
        pointerEvents: 'none', userSelect: 'none',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        transition: 'opacity 0.18s ease',   // smooth fade in/out durante la rotazione
      }}>

        {/* ── Anchor dot on car ── */}
        <div style={{
          ...anim,
          position: 'absolute', left: -5, top: -5,
          width: 10, height: 10, borderRadius: '50%',
          background: c.dot,
          boxShadow: `0 0 0 3px ${c.dot}28, 0 0 10px ${c.dot}55`,
        }}>
          <div style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: `1px solid ${c.dot}`,
            opacity: visible ? 0.55 : 0,
            animation: visible ? 'ping 2s cubic-bezier(0,0,0.2,1) infinite' : 'none',
          }} />
        </div>

        {/* ── Horizontal leader line ── */}
        <svg style={{
          ...anim,
          position: 'absolute', top: -1,
          left: isLeft ? -lineW : 0,
          overflow: 'visible', pointerEvents: 'none',
        }} width={lineW} height={2}>
          <line
            x1={isLeft ? lineW : 0} y1={1}
            x2={isLeft ? 0 : lineW} y2={1}
            stroke={c.dot} strokeWidth={1.2} strokeOpacity={0.5}
          />
          <rect
            x={isLeft ? -3 : lineW - 2} y={-2}
            width={5} height={5}
            fill={c.dot} rx={1} opacity={0.8}
          />
        </svg>

        {/* ── Callout Card ── */}
        <div style={{
          ...anim,
          position: 'absolute', top: -19,
          left: isLeft ? -(lineW + 148) : lineW + 6,
          width: 144, pointerEvents: 'auto',
        }}>
          <div style={{
            padding: '5px 8px 7px',
            borderRadius: 9,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
          }}>
            {/* Header: abbr pill + label (troncato) — senza badge per evitare overflow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 5,
                background: c.badge,
                border: `1px solid ${c.dot}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 8, fontWeight: 900, color: c.badgeText,
                  letterSpacing: '0.02em', lineHeight: 1,
                }}>{abbr}</span>
              </div>
              <span style={{
                fontSize: 8, fontWeight: 800, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                flex: 1, lineHeight: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {/* Value row: testo valore + badge stato affiancati */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, paddingLeft: 25 }}>
              <p style={{
                margin: 0,
                fontSize: 12, fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.25, letterSpacing: '-0.015em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{value}</p>
              <span style={{
                fontSize: 7, fontWeight: 900, letterSpacing: '0.04em',
                textTransform: 'uppercase', flexShrink: 0,
                padding: '2px 4px', borderRadius: 4,
                background: c.badge, color: c.badgeText,
              }}>{c.label}</span>
            </div>
          </div>
        </div>

      </div>
    </Html>
  )
}

// ── Scene ─────────────────────────────────────────────────────────
function CarScene({ vehicleId, type, color, autoRotate, useGLB, glbExists, position, target, fov, applySignal, diagnosticData }) {
  const controlsRef = useRef()
  const [modelReady, setModelReady] = useState(false)

  // Reset quando cambia veicolo (così gli hotspot rifanno l'animazione di entrata)
  useEffect(() => { setModelReady(false) }, [vehicleId])

  const onModelReady = useCallback(() => setModelReady(true), [])

  return (
    <>
      <CameraRig controlsRef={controlsRef} vehicleId={vehicleId} position={position} target={target} fov={fov} applySignal={applySignal} />
      {DEBUG && <DebugHelpers3D controlsRef={controlsRef} position={position} target={target} />}

      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-4, 4, -4]} intensity={0.7} />
      <directionalLight position={[0, 2, -6]} intensity={0.4} />

      <Suspense fallback={<Loader />}>
        {useGLB && useGLTF ? (
          <GLBModel key={`${vehicleId}_${type}`} type={type} color={color} autoRotate={autoRotate} />
        ) : glbExists ? (
          <Loader />
        ) : (
          <ProceduralCarRotating key={`${vehicleId}_${type}`} type={type} color={color} autoRotate={autoRotate} />
        )}
        <ContactShadows position={[0, -0.01, 0]} opacity={0.3} scale={9} blur={2.5} />
        {/* Segnale di avvenuto caricamento modello */}
        <ModelReadySignal onReady={onModelReady} />
      </Suspense>

      {/* HUD Diagnostic Hotspots — appaiono solo dopo il caricamento */}
      {diagnosticData && (
        <>
          {/* 1. Olio — centro cofano anteriore */}
          <DiagnosticHotspot
            position={[-0.15, 0.42, 0.62]}
            label="Stato Olio"
            abbr="OL"
            value={diagnosticData.oil?.label || 'Monitorato'}
            status={diagnosticData.oil?.status || 'success'}
            side="left"
            delay={0}
            visible={modelReady}
          />
          {/* 2. Rifornimento — vano carburante posteriore destra */}
          <DiagnosticHotspot
            position={[0.68, 0.20, -0.52]}
            label={type === 'electric' ? 'Ricarica' : 'Rifornimento'}
            abbr={type === 'electric' ? 'EL' : 'RF'}
            value={diagnosticData.fuel?.label || 'Nessun dato'}
            status={diagnosticData.fuel?.status || 'warning'}
            side="right"
            delay={120}
            visible={modelReady}
          />
          {/* 3. Tergicristalli — base parabrezza anteriore */}
          <DiagnosticHotspot
            position={[0.08, 0.50, 0.48]}
            label="Tergicristalli"
            abbr="TC"
            value={diagnosticData.wipers?.label || 'Livello OK'}
            status={diagnosticData.wipers?.status || 'success'}
            side="right"
            delay={240}
            visible={modelReady}
          />
          {/* 4. Pneumatici — centro mozzo ruota anteriore destra */}
          <DiagnosticHotspot
            position={[0.78, -0.30, 0.55]}
            label="Pneumatici"
            abbr="PN"
            value={diagnosticData.tires?.label || 'Stato Buono'}
            status={diagnosticData.tires?.status || 'success'}
            side="right"
            delay={360}
            visible={modelReady}
          />
        </>
      )}

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
  vehicleId,
  vehicleType = 'sedan',
  color: externalColor,
  onColorChange,
  height,
  className = '',
  diagnosticData,
}) {
  // Modello sempre statico — l'utente interagisce manualmente
  const autoRotate = false

  const [internalColor, setInternalColor] = useState(externalColor ?? '#9aacc8')
  const [glbExists, setGlbExists] = useState(false)
  const [gltfReady, setGltfReady] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)

  // ── Debug camera state ──────────────────────────────────────────
  const [dbPos, setDbPos] = useState([...DEFAULT_CAM_POSITION])
  const [dbTgt, setDbTgt] = useState([...DEFAULT_CAM_TARGET])
  const [dbFov, setDbFov] = useState(DEFAULT_FOV)
  // applySignal: incrementato ogni volta che il pannello debug
  // chiede un aggiornamento live della camera
  const [applySignal, setApplySignal] = useState(0)

  const camPosition = DEBUG ? dbPos : DEFAULT_CAM_POSITION
  const camTarget = DEBUG ? dbTgt : DEFAULT_CAM_TARGET
  const camFov = DEBUG ? dbFov : DEFAULT_FOV

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
    const VEHICLE_GLB_TYPES = ['city', 'hatchback', 'sedan', 'wagon', 'suv', 'suv_large', 'electric']
    setGlbExists(VEHICLE_GLB_TYPES.includes(vehicleType))
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
            vehicleId={vehicleId}
            type={vehicleType}
            color={color}
            autoRotate={autoRotate}
            useGLB={useGLB}
            glbExists={glbExists}
            position={camPosition}
            target={camTarget}
            fov={camFov}
            applySignal={applySignal}
            diagnosticData={diagnosticData}
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
