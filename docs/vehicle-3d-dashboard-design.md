# 🚗 Vehicle 3D Dashboard — Design Exploration Paper
> VitaOS 2.1 · Sezione Veicolo · Design Concept  
> Autore: AI Design Research · Data: Maggio 2026

---

## 📋 Executive Summary

L'idea è trasformare la schermata "Veicolo" da una semplice lista di spese in una **dashboard animata e visivamente immersiva**, dove l'auto dell'utente (o una generica) diventa il centro visivo. Il modello 3D ruota, respira, e rivela pinned hotspot con lo stato delle manutenzioni, consumo, tagliando, assicurazione, ecc.

Questo documento esplora **4 alternative distinte** ordinate per fattibilità tecnica e impatto UX, con pro/contro, tecnologie coinvolte e effort stimato.

---

## 🎯 Obiettivi del Design

| Goal | Dettaglio |
|------|-----------|
| **Engagement** | Rendere la sezione veicolo "wow" al primo colpo d'occhio |
| **Utilità** | Informazioni chiave accessibili visivamente senza scroll |
| **Gamification** | Badge stato manutenzione (verde/giallo/rosso) visibili direttamente sul modello |
| **Performance** | Deve essere fluido su mobile (60fps) senza battery drain |
| **Coerenza** | Rispettare il design system di VitaOS (dark mode, font system, border-radius, var CSS) |

---

## 🏆 Alternativa 1 — Modello 3D Interattivo con Hotspot Pinned
> **⭐ Raccomandato · Alto Impatto · Effort: Alto**

### Concept

Un modello 3D dell'auto (generica berlina o custom per marca) viene renderizzato al centro della schermata. L'utente può **ruotare il modello con drag/touch**. Mentre ruota, compaiono dei pin 3D ancorati a punti specifici della carrozzeria:

- 🔧 **Motore (cofano)** → Cambio olio / Tagliando
- ⛽ **Serbatoio (retro)** → Ultima ricarica / Consumo medio  
- 🛡️ **Targa (posteriore)** → Bollo + Assicurazione
- 📍 **Cruscotto (interno)** → Contachilometri attuale
- 🔴 **Pneumatici** → Pressione / Usura (futura feature)

### Come Funziona Tecnicamente

```
Three.js (WebGL) + @react-three/fiber + @react-three/drei
  ↓
Carico modello .glb/.gltf (berlina generica ~2-5MB, compresso con Draco)
  ↓
Html component di drei → pin HTML sovrapposti a coordinate 3D
  ↓
Anime.js → animazione pin (stagger reveal, pulse, numero counter)
  ↓
Drag → OrbitControls limitato (solo asse Y, niente flip)
```

### Stack Tecnologico

```json
{
  "three": "^0.165",
  "@react-three/fiber": "^8",
  "@react-three/drei": "^9",
  "animejs": "^3.2",
  "gltf-pipeline": "CLI per compressione modello"
}
```

### UX Flow

```
1. Utente entra nella sezione Veicolo
2. [Entrata] Il modello appare con animazione scale 0→1 + rotazione +15° (Anime.js)
3. [Idle] Auto "respira" con leggero bob verticale (float animation loop)
4. [Hotspot] Pin appaiono in sequenza stagger dopo 800ms dall'entrata
5. [Interazione] Drag/touch per ruotare l'auto sull'asse Y
6. [Tap Pin] Apre una mini-card sotto il modello con dettagli/azione
7. [Scroll down] Modello si rimpicciolisce sticky in header, 
    sotto appare il log delle spese tradizionale
```

### Hotspot Data Model

```javascript
const hotspots = [
  {
    id: 'oil_change',
    position: [-0.3, 0.4, 1.2], // coordinate 3D sul modello
    icon: '🔧',
    label: 'Cambio Olio',
    status: 'warning', // ok | warning | danger
    value: '12.400 km fa',
    nextAt: '15.000 km',
    action: 'Prenota officina'
  },
  {
    id: 'fuel',
    position: [0.4, -0.1, -1.0],
    icon: '⛽',
    label: 'Carburante',
    status: 'ok',
    value: '6.4 l/100km',
    action: 'Aggiungi rifornimento'
  },
  // ...
]
```

### Pro e Contro

| ✅ Pro | ❌ Contro |
|--------|----------|
| WOW factor massimo | Bundle aumenta ~400KB (three.js) |
| Altamente differenziante | Modello 3D da trovare/creare (licenza!) |
| Interazione fisica soddisfacente | Complesso da implementare (2-3 settimane) |
| Scalabile (aggiungi pin futuri) | Performance mobile da testare attentamente |
| Perfetto per dark mode con HDRI | Accessibility limitata (screen reader) |

### Effort Stimato

| Task | Ore |
|------|-----|
| Setup Three.js + R3F in Vite | 4h |
| Trovare/ottimizzare modello .glb | 8h |
| Sistema hotspot + HTML overlay | 10h |
| Animazioni Anime.js | 6h |
| Responsive mobile | 8h |
| **Totale** | **~36h** |

---

## 🥈 Alternativa 2 — CSS 3D + SVG Car Blueprint con Anime.js
> **Buon compromesso · Effort: Medio · Performance: Eccellente**

### Concept

Invece di un vero modello 3D WebGL, si usa una **illustrazione SVG top-down o laterale dell'auto** con trasformazioni CSS 3D. L'auto è disegnata come un blueprint tecnico (linee sottili, stile schematico). I pin sono elementi SVG/HTML posizionati su coordinate precise dell'illustrazione.

Al **scroll** la pagina si anima:
- Da `0%` scroll → vista laterale dell'auto
- Da `30%` scroll → zoom su cofano con pin manutenzione
- Da `60%` scroll → zoom su cruscotto con contachilometri animato
- Da `100%` scroll → log spese normale

### Come Funziona Tecnicamente

```
SVG inline dell'auto (blueprint style, disegnato custom o da Figma)
  ↓
GSAP ScrollTrigger o Anime.js timeline basata su scroll %
  ↓
CSS transform: perspective() + rotateY() per pseudo-3D
  ↓
SVG <path> highlight per evidenziare parti specifiche
  ↓
Counter animato per km/costo
```

### Animazioni Chiave

```javascript
// Timeline Anime.js basata su scroll
const timeline = anime.timeline({ autoplay: false })

timeline
  .add({ targets: '.car-svg', rotateY: [0, 15], duration: 500 })
  .add({ targets: '.pin-oil', opacity: [0, 1], translateY: [-10, 0], duration: 300 })
  .add({ targets: '.odometer-counter', innerHTML: [0, 125000], 
         round: 1, easing: 'easeOutExpo', duration: 1200 })

// Collegato allo scroll
window.addEventListener('scroll', () => {
  const progress = window.scrollY / document.body.scrollHeight
  timeline.seek(progress * timeline.duration)
})
```

### Scroll Sections Layout

```
┌─────────────────────┐
│  🚗 Car Blueprint   │  ← sticky, si trasforma sullo scroll
│  [ruota laterale]   │
├─────────────────────┤
│  📍 Pin: Motore     │  ← sezione 1: manutenzione
│  Cambio Olio ⚠️     │
├─────────────────────┤
│  📍 Pin: Cruscotto  │  ← sezione 2: km + consumi
│  125.400 km ✅      │
├─────────────────────┤
│  📍 Pin: Targa      │  ← sezione 3: scadenze
│  Bollo: 15 gg 🔴    │
├─────────────────────┤
│  📋 Log Spese       │  ← sezione finale classica
└─────────────────────┘
```

### Pro e Contro

| ✅ Pro | ❌ Contro |
|--------|----------|
| Zero dipendenze pesanti | Non è "vero" 3D |
| Performante su qualsiasi device | SVG custom richiede design effort |
| Accessibile (SVG + aria-label) | Meno wow factor del 3D reale |
| Totale controllo su animazioni | Scroll hijacking può irritare |
| Dimensioni bundle minime | Il blueprint deve essere preciso |

### Effort Stimato

| Task | Ore |
|------|-----|
| Design SVG blueprint auto | 8h |
| Sistema scroll + Anime.js | 6h |
| Pin e mini-card animati | 6h |
| Responsive + mobile touch | 4h |
| **Totale** | **~24h** |

---

## 🥉 Alternativa 3 — Modello 3D Isometrico Stilizzato (Spline/Lottie)
> **Design premium senza sforzo 3D · Effort: Basso-Medio**

### Concept

Utilizzare **Spline.design** (tool online) per creare una scena 3D isometrica minimalista dell'auto, esportarla come componente React o iframe embed. In alternativa, un'animazione **Lottie** (JSON, After Effects) di un'auto isometrica pre-animata.

Spline permette di:
- Creare auto stilizzate low-poly in ore
- Aggiungere animazioni hover/click direttamente nell'editor
- Esportare come `<spline-viewer>` web component o `@splinetool/react-spline`

### Come Funziona Tecnicamente

```
Spline.design (editor online) → crea scena auto + animazioni
  ↓
Export come React component con @splinetool/react-spline
  ↓
Events Spline → trigger Anime.js per UI esterna
  ↓
onMouseDown, onMouseUp, onClick su named objects
```

```jsx
import Spline from '@splinetool/react-spline'

<Spline
  scene="https://prod.spline.design/YOUR-SCENE-ID/scene.splinecode"
  onMouseDown={(e) => {
    if (e.target.name === 'Engine') showOilChangePanel()
    if (e.target.name === 'Fuel_Tank') showFuelPanel()
  }}
/>
```

### Pro e Contro

| ✅ Pro | ❌ Contro |
|--------|----------|
| Bellissimo senza expertise 3D | Dipendenza da Spline cloud (latency) |
| Animazioni fluide built-in | Customizzazione limitata |
| Esportabile come component | ~1MB di bundle aggiuntivo |
| Pronto in 1-2 giorni | Non offline-first |
| Design premium garantito | Licenza Spline (gratis con watermark) |

### Effort Stimato

| Task | Ore |
|------|-----|
| Creare scena in Spline | 6h |
| Integrazione React | 3h |
| Events + UI panels | 5h |
| **Totale** | **~14h** |

---

## 🔋 Alternativa 4 — Dashboard Cards Animate (Approccio Incrementale)
> **Safe · Zero rischi · Effort: Basso · Implementabile subito**

### Concept

Evoluzione dell'attuale design senza 3D. Si mantiene la struttura flat ma si aggiunge:
- **Header visivo** con silhouette SVG dell'auto (solo contorno) + gradient dinamico basato sullo stato salute
- **Cards animate** con Anime.js: counter numerico per km, barre di avanzamento per manutenzioni
- **Health Ring** circolare (come Apple Watch) che mostra lo stato complessivo del veicolo
- **Timeline verticale** per le prossime scadenze

### Animazioni Specifiche

```javascript
// Counter km animato all'entrata
anime({
  targets: '.km-counter',
  innerHTML: [0, 125400],
  round: 1,
  duration: 1800,
  easing: 'easeOutExpo',
  delay: 300
})

// Barra manutenzione
anime({
  targets: '.maintenance-bar',
  width: ['0%', '78%'], // 78% del ciclo di manutenzione consumato
  duration: 1200,
  easing: 'easeOutCubic',
  delay: 600
})

// Health ring (stroke-dashoffset)
anime({
  targets: '.health-ring',
  strokeDashoffset: [circumference, circumference * 0.3], // 70% salute
  duration: 1500,
  easing: 'easeOutQuint'
})
```

### Pro e Contro

| ✅ Pro | ❌ Contro |
|--------|----------|
| Implementabile in 1 settimana | Meno impatto visivo |
| Nessuna dipendenza nuova | Non differenziante |
| Performante ovunque | Non sfrutta il potenziale 3D |
| Evolutivo: si aggiunge 3D dopo | |

### Effort Stimato

| Task | Ore |
|------|-----|
| Redesign cards + header SVG | 5h |
| Animazioni Anime.js | 4h |
| Health ring + progress bars | 3h |
| **Totale** | **~12h** |

---

## 📊 Matrice di Confronto

| | Alt. 1 (3D WebGL) | Alt. 2 (SVG+Scroll) | Alt. 3 (Spline) | Alt. 4 (Cards) |
|---|---|---|---|---|
| **Wow Factor** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Fattibilità** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Bundle Size** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Effort** | 36h | 24h | 14h | 12h |
| **Unicità** | Altissima | Alta | Alta | Media |
| **Mobile UX** | Medio | Ottimo | Ottimo | Ottimo |

---

## 🛣️ Roadmap Consigliata

### Fase 1 — "Quick Win" (Subito, ~1 settimana)
Implementa **Alt. 4** (Cards animate) come upgrade immediato. Questo:
- Aggiunge animazioni e counters alla schermata attuale
- Introduce health indicators visivi
- Non rompe nulla dell'esistente

### Fase 2 — "Spline Experiment" (~2 settimane)
Sperimenta **Alt. 3** (Spline) in un branch separato. Se l'esperienza è fluida su mobile, vai avanti. Costo zero per prototipo.

### Fase 3 — "Full 3D" (Futuro, quando necessario)
Valuta **Alt. 1** quando:
- Hai un modello 3D dell'auto dell'utente (via API auto o selezione modello)
- L'app ha una userbase consolidata che giustifica l'investimento
- Hai ottimizzato il bundle con code splitting

---

## 🔑 Considerazioni Tecniche Chiave

### Modello 3D — Dove trovarlo?
1. **Sketchfab** → Cerca "car low poly" con licenza CC (free/commerciale)
2. **Poly.pizza** → Modelli low-poly gratuiti, perfetti per questo use case  
3. **Three.js examples** → `examples/models/gltf/` ha una berlina
4. **Generato con Spline** → Design custom direttamente nell'editor
5. **Auto-generato** → AI generativa (Meshy.ai, Tripo3D) per berlina generica

### Draco Compression (Three.js)
Il modello `.glb` va sempre compresso con Draco:
```bash
npx gltf-pipeline -i car.glb -o car-draco.glb --draco.compressionLevel 10
# Riduce da ~5MB a ~800KB
```

### Code Splitting per Three.js
```javascript
// Carica Three.js solo nella route Veicolo
const VehicleDashboard3D = lazy(() => import('./VehicleDashboard3D'))

// Con Suspense + fallback skeleton
<Suspense fallback={<CarSkeleton />}>
  <VehicleDashboard3D />
</Suspense>
```

### Anime.js Integration Pattern
```javascript
// Pattern consigliato per React + Anime.js
import { useEffect, useRef } from 'react'
import anime from 'animejs'

function AnimatedCard({ value, delay = 0 }) {
  const ref = useRef(null)
  
  useEffect(() => {
    anime({
      targets: ref.current,
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 600,
      delay,
      easing: 'easeOutExpo'
    })
  }, [])
  
  return <div ref={ref} style={{ opacity: 0 }}>{value}</div>
}
```

---

## 🎨 Visual Direction

Lo stile visivo consigliato per qualsiasi alternativa scelta:

- **Sfondo del viewer**: `#0a0a0f` con vignette radiale (dark mode native)
- **Colore auto default**: Argento metallico `#b0b8c8` con riflessioni
- **Pin colori**: 
  - 🟢 OK: `hsl(142, 71%, 45%)`
  - 🟡 Warning: `hsl(43, 96%, 56%)`  
  - 🔴 Danger: `hsl(0, 84%, 60%)`
- **Tipografia pin**: Outfit 700, 10px uppercase tracking-wide
- **Glassmorphism card**: `backdrop-filter: blur(16px)` + `bg: rgba(255,255,255,0.05)`
- **Accent glow**: Box shadow colorato in base allo stato (verde/giallo/rosso)

---

## 💡 Feature Aggiuntive da Considerare

Indipendentemente dall'alternativa scelta, queste feature arricchiscono il valore:

1. **Odometro animato** → Counter che "scorre" da 0 al valore attuale all'entrata
2. **Fuel gauge** → Indicatore carburante stile cruscotto (se l'utente inserisce rifornimenti)
3. **Maintenance timeline** → Barra progresso da ultimo tagliando a prossimo
4. **Cost heatmap** → Mini chart mensile dei costi in basso
5. **Car health score** → Punteggio 0-100 derivato dallo stato delle manutenzioni
6. **Notifiche proattive** → "Cambio olio previsto tra 500km" come banner animato
7. **Marca/modello** → Input nel settings per personalizzare il modello 3D visualizzato

---

## 📝 Conclusione

La **combinazione ideale** per VitaOS è:

> **Alt. 4 (subito) → Alt. 3 (breve termine) → Alt. 1 (lungo termine)**

Il percorso progressivo permette di avere miglioramenti visibili rapidamente, sperimentare con Spline senza rischi, e lasciare aperta la porta al full 3D WebGL quando il prodotto lo giustifica.

**La priorità immediata**: aggiungere Anime.js alle card esistenti + health indicators visivi. Questo porta un upgrade percettibile in pochi giorni senza stravolgere l'architettura attuale.

---

*Documento generato da VitaOS Design Research · Maggio 2026*
