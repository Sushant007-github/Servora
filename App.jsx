import { useState, useEffect, useRef, useCallback } from "react"
import * as THREE from "three"

/* ════════════════════════════════════════════
   ⚙️  CONFIG — Replace with your real keys
════════════════════════════════════════════ */
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"

// 🔐 SECRET ADMIN — only these phone numbers get admin access
// Change this to YOUR phone number. No admin link exists in the UI.
const ADMIN_PHONES = ["9999999999"] // ← PUT YOUR PHONE HERE

/* ════════════════════════════════════════════
   🗄️  SUPABASE CLIENT (no npm needed)
════════════════════════════════════════════ */
const sb = {
  headers: {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  },
  async select(table, query = "") {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers: this.headers })
      if (!r.ok) return []
      return await r.json()
    } catch { return [] }
  },
  async insert(table, data) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST", headers: this.headers, body: JSON.stringify(data)
      })
      if (!r.ok) return null
      return await r.json()
    } catch { return null }
  },
  async update(table, match, data) {
    try {
      const query = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join("&")
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        method: "PATCH", headers: this.headers, body: JSON.stringify(data)
      })
      if (!r.ok) return null
      return await r.json()
    } catch { return null }
  },
  async remove(table, match) {
    try {
      const query = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join("&")
      await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        method: "DELETE", headers: this.headers
      })
      return true
    } catch { return false }
  }
}

/* ════════════════════════════════════════════
   🎨  GLOBAL STYLES
════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@600;700;800;900&display=swap');

    *,*::before,*::after { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
    :root {
      --bg:#0B0B0F; --bg2:#0e101a; --bg3:#131525;
      --s1:rgba(255,255,255,0.03); --s2:rgba(255,255,255,0.06); --s3:rgba(255,255,255,0.09);
      --b1:rgba(255,255,255,0.07); --b2:rgba(255,255,255,0.12); --b3:rgba(255,255,255,0.2);
      --c:#22d3ee; --cd:#06b6d4; --v:#818cf8; --vd:#6366f1;
      --amber:#fbbf24; --green:#34d399; --rose:#fb7185; --orange:#fb923c;
      --t1:#f1f5f9; --t2:#94a3b8; --t3:#475569; --t4:#1e293b;
      --tr:all 0.25s cubic-bezier(0.4,0,0.2,1);
      --r:16px;
    }
    html { font-size:16px; scroll-behavior:smooth; }
    body { background:var(--bg); color:var(--t1); font-family:'Inter',sans-serif; overflow-x:hidden; padding-bottom:80px; -webkit-font-smoothing:antialiased; }
    input,textarea,select,button { font-family:'Inter',sans-serif; }
    input,select,textarea { font-size:16px !important; }
    ::-webkit-scrollbar { width:3px; }
    ::-webkit-scrollbar-thumb { background:var(--v); border-radius:2px; }

    @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes slideUp  { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes scaleIn  { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes bounce   { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
    @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes ticker   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes gm       { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes glow     { 0%,100%{box-shadow:0 0 20px rgba(34,211,238,0.3)} 50%{box-shadow:0 0 50px rgba(34,211,238,0.6)} }
    @keyframes scan     { 0%{top:0%} 100%{top:100%} }
    @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes shake    { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

    .a-up  { animation:fadeUp 0.5s ease both; }
    .a-in  { animation:fadeIn 0.4s ease both; }
    .a-sc  { animation:scaleIn 0.3s ease both; }
    .shake { animation:shake 0.5s ease; }

    /* Glass */
    .glass  { background:var(--s1); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid var(--b1); border-radius:var(--r); }
    .glass2 { background:var(--s2); backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px); border:1px solid var(--b2); border-radius:20px; }

    /* Cards */
    .card  { background:var(--s1); border:1px solid var(--b1); border-radius:20px; transition:var(--tr); }
    .card:active { transform:scale(0.985); }
    .ch:hover  { border-color:var(--b2); background:var(--s2); transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.3); }

    /* Buttons */
    .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:600; cursor:pointer; transition:var(--tr); border:none; outline:none; white-space:nowrap; }
    .btn:active { transform:scale(0.96); }
    .bp { background:linear-gradient(135deg,var(--cd),var(--vd)); color:#fff; position:relative; overflow:hidden; }
    .bp::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,var(--vd),var(--cd)); opacity:0; transition:opacity 0.3s; }
    .bp:hover::after { opacity:1; }
    .bp > * { position:relative; z-index:1; }
    .bo { background:transparent; border:1px solid var(--b2) !important; color:var(--t2); }
    .bo:hover { border-color:var(--c) !important; color:var(--c); background:rgba(34,211,238,0.05); }
    .bg-btn { background:transparent; border:none; color:var(--t2); }
    .bg-btn:hover { color:var(--t1); }
    .bs { background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.25); color:var(--green); }
    .bd { background:rgba(251,113,133,0.1); border:1px solid rgba(251,113,133,0.25); color:var(--rose); }
    .bw { background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.25); color:var(--amber); }

    /* Gradient text */
    .gt  { background:linear-gradient(135deg,#22d3ee,#818cf8,#fbbf24); background-size:200% 200%; animation:gm 4s ease infinite; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .gtc { background:linear-gradient(135deg,#22d3ee,#06b6d4); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

    /* Badges */
    .badge { font-size:10px; font-weight:700; padding:3px 8px; border-radius:999px; letter-spacing:0.5px; text-transform:uppercase; }
    .bc { background:rgba(34,211,238,0.12); color:var(--c); border:1px solid rgba(34,211,238,0.25); }
    .ba { background:rgba(251,191,36,0.12); color:var(--amber); border:1px solid rgba(251,191,36,0.25); }
    .bg2{ background:rgba(52,211,153,0.12); color:var(--green); border:1px solid rgba(52,211,153,0.25); }
    .bv { background:rgba(129,140,248,0.12); color:var(--v); border:1px solid rgba(129,140,248,0.25); }
    .br { background:rgba(251,113,133,0.12); color:var(--rose); border:1px solid rgba(251,113,133,0.25); }

    /* Input */
    .field { background:var(--s2); border:1.5px solid var(--b2); border-radius:14px; padding:15px 18px; color:var(--t1); width:100%; outline:none; font-size:15px; transition:all 0.2s; }
    .field:focus { border-color:var(--c); background:var(--s3); box-shadow:0 0 0 4px rgba(34,211,238,0.07); }
    .field::placeholder { color:var(--t3); }
    .field.err { border-color:var(--rose); box-shadow:0 0 0 4px rgba(251,113,133,0.07); }
    .field-wrap { position:relative; margin-bottom:16px; }
    .field-icon { position:absolute; left:16px; top:50%; transform:translateY(-50%); font-size:18px; pointer-events:none; }
    .field.has-icon { padding-left:48px; }
    .field-label { font-size:12px; font-weight:600; color:var(--t3); margin-bottom:7px; display:block; letter-spacing:0.3px; text-transform:uppercase; }

    /* Toggle */
    .toggle { width:42px; height:24px; border-radius:12px; position:relative; cursor:pointer; transition:background 0.3s; flex-shrink:0; }
    .tk { position:absolute; top:4px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left 0.3s; box-shadow:0 1px 4px rgba(0,0,0,0.3); }

    /* Bottom nav */
    .bnav { position:fixed; bottom:0; left:0; right:0; z-index:900; background:rgba(11,11,15,0.97); backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px); border-top:1px solid var(--b1); padding:8px 0 max(10px,env(safe-area-inset-bottom)); display:grid; grid-template-columns:repeat(5,1fr); }
    .nv { display:flex; flex-direction:column; align-items:center; gap:3px; padding:5px 4px; cursor:pointer; background:transparent; border:none; transition:var(--tr); }
    .ni { font-size:22px; transition:transform 0.2s; }
    .nl { font-size:10px; font-weight:600; color:var(--t3); }
    .nv.on .ni { transform:scale(1.15); }
    .nv.on .nl { color:var(--c); }

    /* Chips */
    .chips { display:flex; gap:8px; overflow-x:auto; padding-bottom:2px; }
    .chips::-webkit-scrollbar { display:none; }
    .chip { padding:7px 15px; border-radius:999px; font-size:13px; font-weight:500; cursor:pointer; transition:var(--tr); white-space:nowrap; border:1px solid var(--b1); background:var(--s1); color:var(--t2); }
    .chip.on { background:rgba(34,211,238,0.1); border-color:rgba(34,211,238,0.35); color:var(--c); font-weight:600; }
    .chip:active { transform:scale(0.95); }

    /* Progress */
    .prog { height:5px; background:var(--s3); border-radius:3px; overflow:hidden; }
    .pf { height:100%; background:linear-gradient(90deg,var(--c),var(--v)); border-radius:3px; transition:width 0.7s ease; }

    /* Modal */
    .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); z-index:1000; display:flex; align-items:flex-end; }
    .modal { width:100%; background:var(--bg2); border-radius:24px 24px 0 0; border-top:1px solid var(--b2); max-height:92vh; overflow-y:auto; animation:slideUp 0.3s ease; }

    /* Spinner & dots */
    .spinner { width:18px; height:18px; border:2px solid var(--b2); border-top-color:var(--c); border-radius:50%; animation:spin 0.75s linear infinite; }
    .dots { display:flex; gap:5px; }
    .dot { width:7px; height:7px; border-radius:50%; background:var(--c); animation:bounce 1.4s ease-in-out infinite; }

    /* Skel */
    .skel { background:linear-gradient(90deg,var(--s1) 25%,var(--s3) 50%,var(--s1) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px; }

    /* Notif dot */
    .ndot { width:8px; height:8px; border-radius:50%; background:var(--rose); position:absolute; top:0; right:0; border:2px solid var(--bg); }

    /* Page */
    .page { animation:fadeUp 0.4s ease both; min-height:calc(100vh - 60px); }

    /* Ticker */
    .ticker-wrap { overflow:hidden; padding:11px 0; border-top:1px solid var(--b1); border-bottom:1px solid var(--b1); }
    .ticker-inner { display:flex; gap:56px; white-space:nowrap; animation:ticker 28s linear infinite; }

    /* Auth specific */
    .auth-wrap { display:flex; min-height:100vh; }
    .auth-left { display:none; flex:1; position:relative; overflow:hidden; background:#060810; }
    .auth-right { width:100%; max-width:500px; background:var(--bg2); display:flex; flex-direction:column; justify-content:center; padding:40px 32px; min-height:100vh; overflow-y:auto; }
    @media (min-width:768px) {
      .auth-left { display:flex; flex-direction:column; justify-content:flex-end; padding:48px; }
      .auth-right { padding:60px 56px; }
      body { padding-bottom:0; }
      .bnav { display:none; }
      .mob { display:none !important; }
      .dsk { display:flex !important; }
    }
    @media (max-width:767px) {
      .dsk { display:none !important; }
      .auth-right { max-width:100%; }
    }

    /* Password strength */
    .pw-bar { display:flex; gap:4px; margin-top:6px; }
    .pw-seg { height:3px; border-radius:2px; flex:1; transition:background 0.3s; }

    /* Step indicator */
    .step-dot { width:8px; height:8px; border-radius:50%; transition:all 0.3s; }
    .step-line { flex:1; height:1px; transition:all 0.3s; }

    /* OTP box */
    .otp-box { width:48px; height:56px; text-align:center; font-size:22px; font-weight:700; background:var(--s2); border:1.5px solid var(--b2); border-radius:12px; outline:none; color:var(--t1); transition:all 0.2s; caret-color:var(--c); }
    .otp-box:focus { border-color:var(--c); background:var(--s3); box-shadow:0 0 0 4px rgba(34,211,238,0.08); }
    .otp-box.filled { border-color:var(--c); }

    /* Divider with text */
    .or-line { display:flex; align-items:center; gap:12px; margin:20px 0; }
    .or-line::before,.or-line::after { content:''; flex:1; height:1px; background:var(--b1); }
    .or-text { font-size:12px; color:var(--t3); white-space:nowrap; }

    /* Social button */
    .social-btn { width:100%; padding:13px; border-radius:14px; background:var(--s2); border:1px solid var(--b2); color:var(--t2); cursor:pointer; font-size:14px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:10px; transition:var(--tr); }
    .social-btn:hover { border-color:var(--b3); background:var(--s3); color:var(--t1); }

    /* Tilt */
    .tilt { transform-style:preserve-3d; transition:transform 0.15s ease; }

    /* Error msg */
    .err-msg { font-size:12px; color:var(--rose); margin-top:5px; display:flex; align-items:center; gap:5px; }

    /* Success msg */
    .ok-msg { font-size:12px; color:var(--green); margin-top:5px; display:flex; align-items:center; gap:5px; }

    /* Alert banner */
    .alert { padding:14px 16px; border-radius:14px; font-size:14px; margin-bottom:18px; display:flex; align-items:flex-start; gap:10px; }
    .alert-err { background:rgba(251,113,133,0.08); border:1px solid rgba(251,113,133,0.2); color:var(--rose); }
    .alert-ok  { background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.2); color:var(--green); }
    .alert-info{ background:rgba(34,211,238,0.06); border:1px solid rgba(34,211,238,0.2); color:var(--c); }
  `}</style>
)

/* ════════════════════════════════════════════
   🧩  TINY HELPERS
════════════════════════════════════════════ */
const Stars = ({ r, s = 13 }) => (
  <span style={{ display:"flex", gap:1 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ fontSize:s, color: i <= Math.round(r) ? "#fbbf24" : "#1e293b" }}>★</span>
    ))}
  </span>
)
const Dot  = ({ on }) => <span style={{ width:7, height:7, borderRadius:"50%", background: on ? "#34d399" : "#fb7185", display:"inline-block", flexShrink:0 }} />
const Spin = () => <div className="spinner" />
const BL   = () => <div className="dots">{[0,1,2].map(i => <div key={i} className="dot" style={{ animationDelay:`${i*.15}s` }} />)}</div>
const Sk   = ({ h=18, w="100%", r=8 }) => <div className="skel" style={{ height:h, width, borderRadius:r }} />

function Alert({ type="err", children }) {
  const cls = type==="ok" ? "alert-ok" : type==="info" ? "alert-info" : "alert-err"
  const icon = type==="ok" ? "✅" : type==="info" ? "ℹ️" : "⚠️"
  return <div className={`alert ${cls}`}><span>{icon}</span><span>{children}</span></div>
}

/* ════════════════════════════════════════════
   🤖  AI ENGINE
════════════════════════════════════════════ */
async function callAI(system, msg, history = []) {
  try {
    const messages = [
      ...history.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
      { role: "user", content: msg }
    ]
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600, system, messages })
    })
    const d = await r.json()
    return d.content?.[0]?.text || fallback(msg)
  } catch { return fallback(msg) }
}

function fallback(q = "") {
  const l = q.toLowerCase()
  if (l.includes("clean"))   return "CleanMate Pro (⭐4.8, ₹299/visit) is top-rated for cleaning in Pune — verified, eco-friendly, responds in <5 min. Want their contact?"
  if (l.includes("doctor"))  return "Dr. Priya's Dental (⭐4.9) in Viman Nagar is Pune's most trusted dental clinic. From ₹500, responds in <10 min."
  if (l.includes("tutor"))   return "TutorBridge Academy (⭐4.9) has JEE/NEET tutors at ₹1200/hr. Online & offline. 98% students improved grades."
  if (l.includes("cheap"))   return "Budget picks: FixIt Repairs from ₹149, SpeedoMoto Auto from ₹249. Both verified with 4.5+ ratings."
  return "I can help you find any service in Pune! Try asking about cleaning, doctors, tutors, salons, or electricians. What do you need?"
}

/* ════════════════════════════════════════════
   🎯  VALIDATION HELPERS
════════════════════════════════════════════ */
const validate = {
  name:    v => v.trim().length >= 2,
  email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone:   v => /^[6-9]\d{9}$/.test(v),
  password:v => v.length >= 8,
  pwMatch: (a,b) => a === b,
}

function pwStrength(pw) {
  let score = 0
  if (pw.length >= 8)  score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

/* ════════════════════════════════════════════
   🌌  THREE.JS HERO
════════════════════════════════════════════ */
function Hero3D({ small = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const W = el.clientWidth, H = el.clientHeight
    const scene = new THREE.Scene()
    const cam = new THREE.PerspectiveCamera(65, W / H, 0.1, 500)
    cam.position.z = 30
    const renderer = new THREE.WebGLRenderer({ antialias:false, alpha:true, powerPreference:"low-power" })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0, 0)
    el.appendChild(renderer.domElement)

    const N = small ? 400 : 650
    const pos = new Float32Array(N*3), col = new Float32Array(N*3)
    for (let i=0; i<N; i++) {
      pos[i*3]   = (Math.random()-.5)*110
      pos[i*3+1] = (Math.random()-.5)*70
      pos[i*3+2] = (Math.random()-.5)*55
      const t = Math.random()
      if (t<.45)      { col[i*3]=.13; col[i*3+1]=.83; col[i*3+2]=.93 }
      else if (t<.78) { col[i*3]=.51; col[i*3+1]=.55; col[i*3+2]=.97 }
      else            { col[i*3]=.98; col[i*3+1]=.75; col[i*3+2]=.14 }
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute("position", new THREE.BufferAttribute(pos,3))
    pg.setAttribute("color",    new THREE.BufferAttribute(col,3))
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size:.22, vertexColors:true, transparent:true, opacity:.7 }))
    scene.add(pts)

    const r1 = new THREE.Mesh(new THREE.TorusGeometry(15,.06,6,90),  new THREE.MeshBasicMaterial({ color:0x22d3ee, wireframe:true, transparent:true, opacity:.1 }))
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(22,.05,5,100), new THREE.MeshBasicMaterial({ color:0x818cf8, wireframe:true, transparent:true, opacity:.07 }))
    r2.rotation.x = Math.PI/3
    const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(5,1), new THREE.MeshBasicMaterial({ color:0x22d3ee, wireframe:true, transparent:true, opacity:.12 }))
    ico.position.set(-20, 4, -10)
    const oct = new THREE.Mesh(new THREE.OctahedronGeometry(3), new THREE.MeshBasicMaterial({ color:0xfbbf24, wireframe:true, transparent:true, opacity:.16 }))
    oct.position.set(22, -5, -5)
    scene.add(r1, r2, ico, oct)

    let mx=0, my=0, ti=0, af
    const onM = e => { mx=(e.clientX/W-.5)*2; my=-(e.clientY/H-.5)*2 }
    window.addEventListener("mousemove", onM)

    const loop = () => {
      af = requestAnimationFrame(loop)
      ti += .004
      pts.rotation.y = ti*.04; pts.rotation.x = ti*.015
      r1.rotation.x = ti*.22;  r1.rotation.z = ti*.1
      r2.rotation.z = -ti*.08; r2.rotation.y = ti*.06
      ico.rotation.x = ti*.3;  ico.rotation.y = ti*.25
      oct.rotation.x = -ti*.4; oct.rotation.z = ti*.35
      cam.position.x += (mx*3 - cam.position.x)*.025
      cam.position.y += (my*2 - cam.position.y)*.025
      cam.lookAt(scene.position)
      renderer.render(scene, cam)
    }
    loop()

    const onR = () => {
      const nw = el.clientWidth, nh = el.clientHeight
      cam.aspect = nw/nh; cam.updateProjectionMatrix(); renderer.setSize(nw,nh)
    }
    window.addEventListener("resize", onR)

    return () => {
      cancelAnimationFrame(af)
      window.removeEventListener("mousemove", onM)
      window.removeEventListener("resize", onR)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={ref} style={{ position:"absolute", inset:0, zIndex:0 }} />
}

/* ════════════════════════════════════════════
   🔐  AUTH PAGE — Premium Split Screen
   Steps:
   SIGNUP: name → email → phone → password → email OTP → phone OTP
   LOGIN:  phone → password → phone OTP
════════════════════════════════════════════ */
function Auth({ setUser, go }) {
  const [mode, setMode] = useState("login")  // "login" | "signup"

  return (
    <div className="auth-wrap">
      {/* LEFT — 3D background */}
      <div className="auth-left">
        <Hero3D small />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(6,8,16,0.95) 25%, rgba(6,8,16,0.3))", zIndex:1 }} />
        <div style={{ position:"relative", zIndex:2 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 16px", borderRadius:999, background:"rgba(34,211,238,0.1)", border:"1px solid rgba(34,211,238,0.25)", marginBottom:24 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--c)", display:"inline-block", animation:"glow 2s infinite" }} />
            <span style={{ fontSize:13, color:"var(--c)", fontWeight:600 }}>Pune's #1 Service Platform</span>
          </div>
          <h2 style={{ fontSize:42, fontWeight:900, lineHeight:1.1, marginBottom:14, fontFamily:"Poppins" }}>
            Find Trusted<br /><span className="gt">Services in Pune ⚡</span>
          </h2>
          <p style={{ color:"var(--t2)", fontSize:16, lineHeight:1.7, maxWidth:380, marginBottom:32 }}>
            Fast · Verified · Transparent<br />Join 12,000+ users discovering Pune's best businesses.
          </p>
          <div style={{ display:"flex", gap:28 }}>
            {[["12K+","Users"],["3.2K+","Businesses"],["4.8★","Rating"]].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontSize:22, fontWeight:800, fontFamily:"Poppins" }} className="gtc">{v}</div>
                <div style={{ fontSize:12, color:"var(--t3)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Auth form */}
      <div className="auth-right">
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:36 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,var(--cd),var(--vd))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⚡</div>
          <span style={{ fontWeight:900, fontSize:22, fontFamily:"Poppins" }} className="gtc">Servora</span>
        </div>

        {mode === "signup"
          ? <SignupFlow setUser={setUser} go={go} switchMode={() => setMode("login")} />
          : <LoginFlow  setUser={setUser} go={go} switchMode={() => setMode("signup")} />
        }
      </div>
    </div>
  )
}

/* ── SIGNUP FLOW (5 steps) ── */
function SignupFlow({ setUser, go, switchMode }) {
  const [step, setStep]   = useState(1)  // 1=details, 2=email-otp, 3=phone-otp
  const [role, setRole]   = useState("user")
  const [form, setForm]   = useState({ name:"", email:"", phone:"", password:"", confirm:"" })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [emailOtp, setEmailOtp] = useState(["","","","","",""])
  const [phoneOtp, setPhoneOtp] = useState(["","","","","",""])
  const [timer, setTimer] = useState(0)
  const otpRefs = useRef([])

  useEffect(() => {
    if (timer > 0) { const t = setTimeout(() => setTimer(x=>x-1), 1000); return () => clearTimeout(t) }
  }, [timer])

  const set = (k,v) => { setForm(f => ({...f, [k]:v})); setErrors(e => ({...e, [k]:""})) }

  const validateStep1 = () => {
    const e = {}
    if (!validate.name(form.name))     e.name     = "Name must be at least 2 characters"
    if (!validate.email(form.email))   e.email    = "Enter a valid email address"
    if (!validate.phone(form.phone))   e.phone    = "Enter a valid 10-digit Indian mobile number"
    if (!validate.password(form.password)) e.password = "Password must be at least 8 characters"
    if (!validate.pwMatch(form.password, form.confirm)) e.confirm = "Passwords do not match"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submitStep1 = async () => {
    if (!validateStep1()) return
    setLoading(true); setAlert(null)
    try {
      // Check if email already exists
      const existing = await sb.select("users", `?email=eq.${encodeURIComponent(form.email)}`)
      if (existing?.length > 0) { setErrors({ email:"This email is already registered" }); setLoading(false); return }
      // Check if phone already exists
      const existingPhone = await sb.select("users", `?phone=eq.${form.phone}`)
      if (existingPhone?.length > 0) { setErrors({ phone:"This phone number is already registered" }); setLoading(false); return }
      // Send email OTP (simulate — in production use Supabase Auth)
      await new Promise(r => setTimeout(r, 1000))
      setStep(2); setTimer(60)
      setAlert({ type:"info", msg:`Verification code sent to ${form.email}` })
    } catch { setAlert({ type:"err", msg:"Something went wrong. Please try again." }) }
    setLoading(false)
  }

  const verifyEmailOtp = async () => {
    const code = emailOtp.join("")
    if (code.length !== 6) return
    setLoading(true)
    // In production: verify with Supabase Auth
    await new Promise(r => setTimeout(r, 800))
    setStep(3); setTimer(60)
    setAlert({ type:"info", msg:`SMS code sent to +91 ${form.phone}` })
    setLoading(false)
  }

  const verifyPhoneOtp = async () => {
    const code = phoneOtp.join("")
    if (code.length !== 6) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const isAdmin = ADMIN_PHONES.includes(form.phone)
    const userRole = isAdmin ? "admin" : role

    // Create user in Supabase
    const created = await sb.insert("users", {
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),
      phone: form.phone,
      role: userRole,
      email_verified: true,
      phone_verified: true,
      created_at: new Date().toISOString()
    })
    const userData = created?.[0] || { name:form.name, email:form.email, phone:form.phone, role:userRole }
    setUser(userData)
    go(isAdmin ? "admin" : userRole === "business" ? "bizDash" : "dash")
    setLoading(false)
  }

  const onOtp = (arr, setArr, i, v, refs) => {
    if (!/^\d*$/.test(v)) return
    const n = [...arr]; n[i] = v.slice(-1); setArr(n)
    if (v && i < 5) refs.current[i+1]?.focus()
  }
  const onOtpKey = (arr, i, e, refs) => {
    if (e.key === "Backspace" && !arr[i] && i > 0) refs.current[i-1]?.focus()
  }

  const pw = pwStrength(form.password)
  const pwColors = ["#334155","#fb7185","#fbbf24","#22d3ee","#34d399"]
  const pwLabels = ["","Weak","Fair","Good","Strong"]

  return (
    <div className="a-sc">
      <h2 style={{ fontSize:26, fontWeight:800, fontFamily:"Poppins", marginBottom:6 }}>
        {step===1 ? "Create Account" : step===2 ? "Verify Email" : "Verify Phone"}
      </h2>
      <p style={{ color:"var(--t2)", fontSize:14, lineHeight:1.6, marginBottom:28 }}>
        {step===1 ? "Join Servora — find trusted services in Pune" :
         step===2 ? `Enter the 6-digit code sent to ${form.email}` :
         `Enter the 6-digit SMS code sent to +91 ${form.phone}`}
      </p>

      {/* Step indicator */}
      <div style={{ display:"flex", alignItems:"center", marginBottom:28, gap:0 }}>
        {[1,2,3].map((s,i) => (
          <>
            <div key={s} className="step-dot" style={{ background: step>=s ? "var(--c)":"var(--b2)", width:step===s?10:8, height:step===s?10:8 }} />
            {i<2 && <div key={`l${s}`} className="step-line" style={{ background: step>s ? "var(--c)":"var(--b1)" }} />}
          </>
        ))}
        <span style={{ fontSize:11, color:"var(--t3)", marginLeft:10 }}>Step {step} of 3</span>
      </div>

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      {/* STEP 1 — Details */}
      {step === 1 && (
        <div>
          {/* Role selector */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
            {[["user","👤 Customer"],["business","🏪 Business"]].map(([r,l]) => (
              <button key={r} onClick={() => setRole(r)} className="btn" style={{ padding:"13px 0", borderRadius:12, background:role===r?"rgba(34,211,238,0.1)":"var(--s1)", border:role===r?"1.5px solid rgba(34,211,238,0.4)":"1px solid var(--b2)", color:role===r?"var(--c)":"var(--t2)", fontWeight:role===r?700:400, fontSize:14, transition:"all 0.2s" }}>
                {l}
              </button>
            ))}
          </div>

          {/* Name */}
          <div className="field-wrap">
            <label className="field-label">Full Name</label>
            <div style={{ position:"relative" }}>
              <span className="field-icon">👤</span>
              <input value={form.name} onChange={e=>set("name",e.target.value)} className={`field has-icon ${errors.name?"err":""}`} placeholder="Your full name" />
            </div>
            {errors.name && <div className="err-msg">⚠️ {errors.name}</div>}
          </div>

          {/* Email */}
          <div className="field-wrap">
            <label className="field-label">Email Address</label>
            <div style={{ position:"relative" }}>
              <span className="field-icon">✉️</span>
              <input value={form.email} onChange={e=>set("email",e.target.value)} className={`field has-icon ${errors.email?"err":""}`} placeholder="you@email.com" type="email" />
            </div>
            {errors.email && <div className="err-msg">⚠️ {errors.email}</div>}
          </div>

          {/* Phone */}
          <div className="field-wrap">
            <label className="field-label">Mobile Number</label>
            <div style={{ display:"flex", background:"var(--s2)", border:`1.5px solid ${errors.phone?"var(--rose)":"var(--b2)"}`, borderRadius:14, overflow:"hidden", transition:"border 0.2s" }}>
              <div style={{ padding:"15px 14px", color:"var(--t2)", fontSize:14, borderRight:"1px solid var(--b1)", background:"var(--s3)", flexShrink:0, display:"flex", alignItems:"center", gap:6 }}>🇮🇳 +91</div>
              <input value={form.phone} onChange={e=>set("phone",e.target.value.replace(/\D/,"").slice(0,10))} placeholder="10-digit number" type="tel" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--t1)", padding:"15px 14px", fontSize:16 }} />
            </div>
            {errors.phone && <div className="err-msg">⚠️ {errors.phone}</div>}
          </div>

          {/* Password */}
          <div className="field-wrap">
            <label className="field-label">Password</label>
            <div style={{ position:"relative" }}>
              <span className="field-icon">🔒</span>
              <input value={form.password} onChange={e=>set("password",e.target.value)} className={`field has-icon ${errors.password?"err":""}`} placeholder="Min 8 characters" type="password" />
            </div>
            {form.password && (
              <div>
                <div className="pw-bar">
                  {[1,2,3,4].map(i => <div key={i} className="pw-seg" style={{ background: pw>=i ? pwColors[pw] : "var(--s3)" }} />)}
                </div>
                <div style={{ fontSize:11, color:pwColors[pw], marginTop:3, fontWeight:600 }}>{pwLabels[pw]}</div>
              </div>
            )}
            {errors.password && <div className="err-msg">⚠️ {errors.password}</div>}
          </div>

          {/* Confirm password */}
          <div className="field-wrap">
            <label className="field-label">Confirm Password</label>
            <div style={{ position:"relative" }}>
              <span className="field-icon">🔒</span>
              <input value={form.confirm} onChange={e=>set("confirm",e.target.value)} className={`field has-icon ${errors.confirm?"err":""}`} placeholder="Repeat password" type="password" />
            </div>
            {form.confirm && form.confirm===form.password && <div className="ok-msg">✅ Passwords match</div>}
            {errors.confirm && <div className="err-msg">⚠️ {errors.confirm}</div>}
          </div>

          <button onClick={submitStep1} disabled={loading} className="btn bp" style={{ width:"100%", padding:"16px 0", borderRadius:14, fontSize:16, marginTop:4 }}>
            {loading ? <><Spin /> Checking...</> : "Continue →"}
          </button>

          <div className="or-line"><span className="or-text">Already have an account?</span></div>
          <button onClick={switchMode} className="social-btn">Log In Instead</button>
        </div>
      )}

      {/* STEP 2 — Email OTP */}
      {step === 2 && (
        <div className="a-sc">
          <div style={{ padding:"16px 20px", background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.15)", borderRadius:14, marginBottom:24, fontSize:14, color:"var(--t2)" }}>
            📧 Code sent to <strong style={{ color:"var(--t1)" }}>{form.email}</strong>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:24 }}>
            {emailOtp.map((d,i) => (
              <input key={i} ref={el=>otpRefs.current[i]=el} value={d}
                onChange={e=>onOtp(emailOtp,setEmailOtp,i,e.target.value,otpRefs)}
                onKeyDown={e=>onOtpKey(emailOtp,i,e,otpRefs)}
                className={`otp-box ${d?"filled":""}`} maxLength={1} type="tel" />
            ))}
          </div>
          <button onClick={verifyEmailOtp} disabled={emailOtp.join("").length!==6||loading} className="btn bp" style={{ width:"100%", padding:"16px 0", borderRadius:14, fontSize:16, marginBottom:14, opacity:emailOtp.join("").length!==6?0.5:1 }}>
            {loading ? <><Spin /> Verifying...</> : "Verify Email ✓"}
          </button>
          <div style={{ textAlign:"center", fontSize:13, color:"var(--t3)" }}>
            {timer > 0 ? `Resend code in ${timer}s` :
              <button onClick={()=>setTimer(60)} style={{ background:"none", border:"none", color:"var(--c)", cursor:"pointer", fontSize:13, fontWeight:600 }}>Resend Code</button>
            }
          </div>
        </div>
      )}

      {/* STEP 3 — Phone OTP */}
      {step === 3 && (
        <div className="a-sc">
          <div style={{ padding:"16px 20px", background:"rgba(52,211,153,0.04)", border:"1px solid rgba(52,211,153,0.15)", borderRadius:14, marginBottom:24, fontSize:14, color:"var(--t2)" }}>
            📱 SMS sent to <strong style={{ color:"var(--t1)" }}>+91 {form.phone}</strong>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:24 }}>
            {phoneOtp.map((d,i) => (
              <input key={i} ref={el=>{if(!otpRefs.current[i+10]) otpRefs.current[i+10]=el; otpRefs.current[i+10]=el}} value={d}
                onChange={e=>{
                  if(!/^\d*$/.test(e.target.value)) return
                  const n=[...phoneOtp]; n[i]=e.target.value.slice(-1); setPhoneOtp(n)
                  if(e.target.value && i<5) otpRefs.current[i+10+1]?.focus()
                }}
                onKeyDown={e=>{ if(e.key==="Backspace"&&!d&&i>0) otpRefs.current[i+10-1]?.focus() }}
                className={`otp-box ${d?"filled":""}`} maxLength={1} type="tel" />
            ))}
          </div>
          <button onClick={verifyPhoneOtp} disabled={phoneOtp.join("").length!==6||loading} className="btn bp" style={{ width:"100%", padding:"16px 0", borderRadius:14, fontSize:16, marginBottom:14, opacity:phoneOtp.join("").length!==6?0.5:1 }}>
            {loading ? <><Spin /> Creating Account...</> : "Verify & Create Account 🎉"}
          </button>
          <div style={{ textAlign:"center", fontSize:13, color:"var(--t3)" }}>
            {timer > 0 ? `Resend SMS in ${timer}s` :
              <button onClick={()=>setTimer(60)} style={{ background:"none", border:"none", color:"var(--c)", cursor:"pointer", fontSize:13, fontWeight:600 }}>Resend SMS</button>
            }
          </div>
        </div>
      )}
    </div>
  )
}

/* ── LOGIN FLOW ── */
function LoginFlow({ setUser, go, switchMode }) {
  const [step, setStep] = useState(1) // 1=credentials, 2=phone-otp
  const [form, setForm] = useState({ phone:"", password:"" })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [otp, setOtp] = useState(["","","","","",""])
  const [timer, setTimer] = useState(0)
  const [foundUser, setFoundUser] = useState(null)
  const refs = useRef([])

  useEffect(() => {
    if (timer > 0) { const t = setTimeout(() => setTimer(x=>x-1), 1000); return () => clearTimeout(t) }
  }, [timer])

  const setF = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:""})) }

  const submitLogin = async () => {
    const e = {}
    if (!validate.phone(form.phone)) e.phone = "Enter a valid 10-digit mobile number"
    if (!form.password)              e.password = "Enter your password"
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setLoading(true); setAlert(null)
    const isAdmin = ADMIN_PHONES.includes(form.phone)

    if (isAdmin) {
      // Admin bypass — send OTP directly
      await new Promise(r => setTimeout(r, 800))
      setFoundUser({ phone:form.phone, role:"admin" })
      setStep(2); setTimer(60)
      setAlert({ type:"info", msg:`OTP sent to +91 ${form.phone}` })
    } else {
      // Check user exists in Supabase
      const users = await sb.select("users", `?phone=eq.${form.phone}`)
      if (!users || users.length === 0) {
        setErrors({ phone:"No account found with this number. Please sign up." })
        setLoading(false); return
      }
      const user = users[0]
      // In production: verify password with Supabase Auth
      setFoundUser(user)
      await new Promise(r => setTimeout(r, 800))
      setStep(2); setTimer(60)
      setAlert({ type:"info", msg:`OTP sent to +91 ${form.phone}` })
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    const code = otp.join("")
    if (code.length !== 6) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const user = foundUser || { phone:form.phone, role: ADMIN_PHONES.includes(form.phone) ? "admin" : "user" }
    setUser(user)
    const isAdmin = user.role === "admin"
    go(isAdmin ? "admin" : user.role === "business" ? "bizDash" : "dash")
    setLoading(false)
  }

  const onOtp = (i, v) => {
    if (!/^\d*$/.test(v)) return
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n)
    if (v && i < 5) refs.current[i+1]?.focus()
  }

  return (
    <div className="a-sc">
      <h2 style={{ fontSize:26, fontWeight:800, fontFamily:"Poppins", marginBottom:6 }}>
        {step===1 ? "Welcome Back 👋" : "Verify Your Phone 🔐"}
      </h2>
      <p style={{ color:"var(--t2)", fontSize:14, lineHeight:1.6, marginBottom:28 }}>
        {step===1 ? "Sign in to your Servora account" : `Enter the 6-digit code sent to +91 ${form.phone}`}
      </p>

      {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

      {step === 1 && (
        <div>
          {/* Phone */}
          <div className="field-wrap">
            <label className="field-label">Mobile Number</label>
            <div style={{ display:"flex", background:"var(--s2)", border:`1.5px solid ${errors.phone?"var(--rose)":"var(--b2)"}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"15px 14px", color:"var(--t2)", fontSize:14, borderRight:"1px solid var(--b1)", background:"var(--s3)", flexShrink:0, display:"flex", alignItems:"center", gap:6 }}>🇮🇳 +91</div>
              <input value={form.phone} onChange={e=>setF("phone",e.target.value.replace(/\D/,"").slice(0,10))} placeholder="10-digit number" type="tel" style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--t1)", padding:"15px 14px", fontSize:16 }} />
            </div>
            {errors.phone && <div className="err-msg">⚠️ {errors.phone}</div>}
          </div>

          {/* Password */}
          <div className="field-wrap">
            <label className="field-label">Password</label>
            <div style={{ position:"relative" }}>
              <span className="field-icon">🔒</span>
              <input value={form.password} onChange={e=>setF("password",e.target.value)} className={`field has-icon ${errors.password?"err":""}`} placeholder="Your password" type="password" />
            </div>
            {errors.password && <div className="err-msg">⚠️ {errors.password}</div>}
          </div>

          <div style={{ textAlign:"right", marginBottom:20, marginTop:-8 }}>
            <button style={{ background:"none", border:"none", color:"var(--c)", cursor:"pointer", fontSize:13, fontWeight:500 }}>Forgot password?</button>
          </div>

          <button onClick={submitLogin} disabled={loading} className="btn bp" style={{ width:"100%", padding:"16px 0", borderRadius:14, fontSize:16, marginBottom:16 }}>
            {loading ? <><Spin /> Please wait...</> : "Send OTP & Login →"}
          </button>

          <div className="or-line"><span className="or-text">New to Servora?</span></div>
          <button onClick={switchMode} className="social-btn">Create an Account</button>
        </div>
      )}

      {step === 2 && (
        <div className="a-sc">
          <div style={{ padding:"16px 20px", background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.15)", borderRadius:14, marginBottom:24, fontSize:14, color:"var(--t2)" }}>
            📱 SMS code sent to <strong style={{ color:"var(--t1)" }}>+91 {form.phone}</strong>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:24 }}>
            {otp.map((d,i) => (
              <input key={i} ref={el=>refs.current[i]=el} value={d}
                onChange={e=>onOtp(i,e.target.value)}
                onKeyDown={e=>{ if(e.key==="Backspace"&&!d&&i>0) refs.current[i-1]?.focus() }}
                className={`otp-box ${d?"filled":""}`} maxLength={1} type="tel" />
            ))}
          </div>
          <button onClick={verifyOtp} disabled={otp.join("").length!==6||loading} className="btn bp" style={{ width:"100%", padding:"16px 0", borderRadius:14, fontSize:16, marginBottom:14, opacity:otp.join("").length!==6?0.5:1 }}>
            {loading ? <><Spin /> Signing In...</> : "Verify & Sign In ✓"}
          </button>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--t3)" }}>
            <button onClick={()=>setStep(1)} style={{ background:"none", border:"none", color:"var(--t3)", cursor:"pointer", fontSize:13 }}>← Change number</button>
            {timer > 0 ? <span>Resend in {timer}s</span> :
              <button onClick={()=>{setTimer(60);}} style={{ background:"none", border:"none", color:"var(--c)", cursor:"pointer", fontSize:13, fontWeight:600 }}>Resend OTP</button>
            }
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   STATIC DATA (fallback when Supabase is empty)
════════════════════════════════════════════ */
const BIZ_DATA = [
  { id:"1", name:"CleanMate Pro", cat:"Home Cleaning", rating:4.8, reviews:342, price:299, label:"₹299/visit", badge:"Top Rated", verified:true, avail:true, resp:"< 5 min", loc:"Koregaon Park", icon:"🏠", color:"#22d3ee", about:"Premium home cleaning with eco-friendly products. Trained staff, fully insured. Serving Pune since 2018.", services:["Deep Cleaning ₹499","Regular Cleaning ₹299","Move-In/Out ₹799","Office Cleaning ₹999"], photos:["🛋️","🚿","🍳","🪟"], views:1240, plan:"pro", status:"approved", phone:"9876543210" },
  { id:"2", name:"Dr. Priya's Dental", cat:"Doctor", rating:4.9, reviews:521, price:500, label:"₹500+", badge:"Verified", verified:true, avail:true, resp:"< 10 min", loc:"Viman Nagar", icon:"🦷", color:"#fb7185", about:"Advanced dental care. 15+ years experience. All procedures from cleaning to implants.", services:["Cleaning ₹500","Whitening ₹3000","Braces ₹25000","Root Canal ₹4500"], photos:["🦷","💊","🩺","🏥"], views:2100, plan:"elite", status:"approved", phone:"9765432109" },
  { id:"3", name:"Radiance Beauty Studio", cat:"Salon & Spa", rating:4.7, reviews:289, price:399, label:"₹399+", badge:"Fast Response", verified:true, avail:false, resp:"< 15 min", loc:"Baner", icon:"💅", color:"#f472b6", about:"Premium salon with full beauty & spa services. Hygiene-certified female-only space.", services:["Haircut ₹399","Facial ₹699","Manicure ₹299","Full Wax ₹999"], photos:["💅","💆","✂️","🌸"], views:890, plan:"growth", status:"approved", phone:"9654321098" },
  { id:"4", name:"FixIt Tech Repairs", cat:"Electrician", rating:4.6, reviews:198, price:149, label:"₹149+", badge:"Fast Response", verified:false, avail:true, resp:"< 3 min", loc:"Wakad", icon:"🔧", color:"#34d399", about:"Quick phone, laptop, AC & appliance repair. Doorstep service. Same-day fix guarantee.", services:["Phone Screen ₹299","Laptop ₹499","AC Service ₹399","TV Repair ₹599"], photos:["📱","💻","❄️","📺"], views:670, plan:"growth", status:"approved", phone:"9543210987" },
  { id:"5", name:"TutorBridge Academy", cat:"Tutor", rating:4.9, reviews:412, price:800, label:"₹800/hr", badge:"Top Rated", verified:true, avail:true, resp:"< 30 min", loc:"Kothrud", icon:"📚", color:"#818cf8", about:"Expert tutors Class 8-12 + JEE/NEET. 98% students improved grades. Online & offline.", services:["Maths ₹800/hr","Science ₹800/hr","JEE Prep ₹1200/hr","NEET Prep ₹1200/hr"], photos:["📚","✏️","🔬","🧮"], views:3200, plan:"pro", status:"approved", phone:"9432109876" },
  { id:"6", name:"SpeedoMoto Auto", cat:"Car Service", rating:4.5, reviews:167, price:249, label:"₹249+", badge:"Verified", verified:true, avail:true, resp:"< 20 min", loc:"Hinjewadi", icon:"🚗", color:"#60a5fa", about:"Professional car servicing & detailing at doorstep. All brands, genuine parts.", services:["Car Wash ₹249","Oil Change ₹799","Tyre ₹149","Detailing ₹2499"], photos:["🚗","🛞","🔧","✨"], views:540, plan:"growth", status:"approved", phone:"9321098765" },
]

const CATS_DATA = [
  {id:1,icon:"🏠",name:"Home Cleaning",c:"#22d3ee"},{id:2,icon:"🔧",name:"Plumber",c:"#818cf8"},
  {id:3,icon:"⚡",name:"Electrician",c:"#fbbf24"},{id:4,icon:"🏥",name:"Doctor",c:"#fb7185"},
  {id:5,icon:"💇",name:"Salon & Spa",c:"#f472b6"},{id:6,icon:"📚",name:"Tutor",c:"#34d399"},
  {id:7,icon:"🚗",name:"Car Service",c:"#60a5fa"},{id:8,icon:"🍕",name:"Food",c:"#fb923c"},
  {id:9,icon:"🐾",name:"Pet Care",c:"#a78bfa"},{id:10,icon:"📸",name:"Photography",c:"#f59e0b"},
  {id:11,icon:"🎉",name:"Events",c:"#ec4899"},{id:12,icon:"💼",name:"Finance",c:"#6366f1"},
]

const PLANS_DATA = [
  { id:"free",  name:"Free",   price:0,    color:"#475569", leads:5,    features:["5 leads/month","Basic listing","Standard placement"] },
  { id:"growth",name:"Growth", price:999,  color:"#22d3ee", leads:50,   features:["50 leads/month","Verified badge","Priority listing","Basic analytics"] },
  { id:"pro",   name:"Pro",    price:2499, color:"#818cf8", leads:200,  popular:true, features:["200 leads/month","Featured spotlight","AI Business Coach","Top 3 placement","Full analytics"] },
  { id:"elite", name:"Elite",  price:4999, color:"#fbbf24", leads:9999, features:["Unlimited leads","#1 Position","Dedicated manager","Custom ads","Priority support"] },
]

/* ════════════════════════════════════════════
   TILT EFFECT HOOK
════════════════════════════════════════════ */
function useTilt(ref) {
  useEffect(() => {
    const el = ref.current; if (!el) return
    const on = e => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - .5
      const y = (e.clientY - r.top) / r.height - .5
      el.style.transform = `perspective(700px) rotateX(${-y*7}deg) rotateY(${x*7}deg) scale(1.02)`
    }
    const off = () => { el.style.transform = "perspective(700px) rotateX(0) rotateY(0) scale(1)" }
    el.addEventListener("mousemove", on)
    el.addEventListener("mouseleave", off)
    return () => { el.removeEventListener("mousemove", on); el.removeEventListener("mouseleave", off) }
  }, [])
}

/* ════════════════════════════════════════════
   BUSINESS CARD
════════════════════════════════════════════ */
function BizCard({ b, onClick, compact=false }) {
  const ref = useRef(null)
  useTilt(ref)
  return (
    <div ref={ref} onClick={onClick} className="card ch tilt" style={{ padding:compact?"14px":"20px", cursor:"pointer", position:"relative", overflow:"hidden", borderRadius:20 }}>
      <div style={{ position:"absolute", top:0, right:0, width:90, height:90, background:`radial-gradient(circle at top right,${b.color}15,transparent)`, pointerEvents:"none" }} />
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:compact?8:14 }}>
        <div style={{ width:compact?46:54, height:compact?46:54, borderRadius:14, background:`${b.color}15`, border:`1px solid ${b.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:compact?22:27, flexShrink:0 }}>{b.icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
            <span style={{ fontWeight:700, fontSize:compact?14:15, lineHeight:1.2, fontFamily:"Poppins" }}>{b.name}</span>
            {b.verified && <span style={{ fontSize:13 }}>✅</span>}
          </div>
          <div style={{ fontSize:12, color:"var(--t3)", marginBottom:5 }}>{b.cat} · 📍 {b.loc}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Stars r={b.rating} s={12} />
            <span style={{ fontWeight:700, fontSize:13 }}>{b.rating}</span>
            <span style={{ color:"var(--t3)", fontSize:12 }}>({b.reviews})</span>
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontWeight:800, fontSize:15, color:b.color, fontFamily:"Poppins" }}>{b.label}</div>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4, justifyContent:"flex-end" }}>
            <Dot on={b.avail} /><span style={{ fontSize:11, color:b.avail?"#34d399":"#fb7185" }}>{b.avail?"Open":"Busy"}</span>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:compact?0:12 }}>
        <div style={{ display:"flex", gap:6 }}><span className="badge bc">{b.badge}</span><span style={{ fontSize:11, color:"var(--t2)" }}>⚡ {b.resp}</span></div>
        <span style={{ fontSize:11, color:"var(--t3)" }}>{b.views} views</span>
      </div>
      {!compact && (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={e=>{e.stopPropagation();window.open(`https://wa.me/91${b.phone}`,"_blank")}} className="btn bs" style={{ flex:1, padding:"10px 0", borderRadius:10, fontSize:13 }}>💬 WhatsApp</button>
          <button onClick={e=>{e.stopPropagation();window.open(`tel:+91${b.phone}`)}} className="btn bo" style={{ flex:1, padding:"10px 0", borderRadius:10, fontSize:13 }}>📞 Call</button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   HOME PAGE
════════════════════════════════════════════ */
function Home({ go, setBiz }) {
  const [q, setQ] = useState("")
  const [res, setRes] = useState("")
  const [load, setLoad] = useState(false)
  const [bizList, setBizList] = useState(BIZ_DATA)

  useEffect(() => {
    sb.select("businesses", "?status=eq.approved&order=rating.desc").then(data => {
      if (data?.length > 0) setBizList(data)
    })
  }, [])

  const search = async () => {
    if (!q.trim()) return
    setLoad(true); setRes("")
    const r = await callAI("You are Servora AI for Pune, India. Suggest 2-3 local services with ₹ price range. Concise, max 3 sentences.", q)
    setRes(r); setLoad(false)
  }

  const TICKER = ["⚡ 3,241 Verified Businesses","🤖 AI-Powered Search","💬 Instant WhatsApp Connect","🛡️ AI Review Guard","🌟 Pune's #1 Platform","🚀 List Your Business Free"]

  return (
    <div className="page">
      {/* HERO */}
      <div style={{ position:"relative", minHeight:"95vh", display:"flex", flexDirection:"column", justifyContent:"flex-end", overflow:"hidden", paddingBottom:32 }}>
        <Hero3D />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 25% 45%,rgba(34,211,238,0.07) 0%,transparent 55%)", zIndex:1, pointerEvents:"none" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 80% 20%,rgba(129,140,248,0.08) 0%,transparent 55%)", zIndex:1, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"50%", background:"linear-gradient(to top,var(--bg) 35%,transparent)", zIndex:1, pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:2, padding:"0 20px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 16px", borderRadius:999, background:"rgba(34,211,238,0.07)", border:"1px solid rgba(34,211,238,0.2)", marginBottom:20 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--c)", animation:"glow 2s ease infinite", display:"inline-block" }} />
            <span style={{ fontSize:13, color:"var(--c)", fontWeight:600 }}>Live in Pune · {BIZ_DATA.length}+ businesses</span>
          </div>
          <h1 style={{ fontSize:"clamp(30px,8vw,58px)", fontWeight:900, lineHeight:1.08, marginBottom:12, fontFamily:"Poppins" }}>
            Find Trusted<br /><span className="gt">Services in Pune</span><br />
            <span style={{ fontSize:"clamp(16px,4vw,26px)", fontWeight:400, color:"var(--t2)", WebkitTextFillColor:"var(--t2)" }}>Fast · Verified · Transparent ⚡</span>
          </h1>
          <p style={{ color:"var(--t2)", fontSize:15, lineHeight:1.7, maxWidth:400, marginBottom:24 }}>Discover, compare & connect with Pune's best service providers — powered by AI.</p>

          <div className="glass2" style={{ borderRadius:18, overflow:"hidden", marginBottom:14, boxShadow:"0 0 40px rgba(34,211,238,0.1)" }}>
            <div style={{ display:"flex", alignItems:"center", padding:"14px 16px", gap:10 }}>
              <span style={{ fontSize:18, color:"var(--t3)" }}>🔍</span>
              <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder='Try "cheap AC repair" or "doctor near Baner"' style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--t1)", fontSize:15 }} />
            </div>
            <div style={{ display:"flex", borderTop:"1px solid var(--b1)" }}>
              <button onClick={search} className="btn bp" style={{ flex:1, padding:"13px", borderRadius:0, fontSize:14, gap:6 }}><span>🤖</span><span>AI Search</span></button>
              <button onClick={()=>go("listings")} className="btn bg-btn" style={{ flex:1, padding:"13px", fontSize:14, borderLeft:"1px solid var(--b1)" }}>Browse All →</button>
            </div>
          </div>
          <div className="chips" style={{ marginBottom:0 }}>
            {["AC Repair","Plumber","Doctor","Salon","Tutor","Electrician"].map(t => (
              <button key={t} onClick={()=>setQ(t)} className="chip">{t}</button>
            ))}
          </div>
          {load && <div style={{ marginTop:14, padding:16, background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.15)", borderRadius:14 }}><BL /></div>}
          {res  && <div className="a-up" style={{ marginTop:14, padding:16, background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.2)", borderRadius:14, fontSize:14, color:"var(--t2)", lineHeight:1.8 }}><span style={{ color:"var(--c)", fontWeight:700 }}>🤖 AI: </span>{res}</div>}
        </div>
      </div>

      {/* STATS */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, padding:"0 20px 28px" }}>
        {[["12K+","Users","👥","#22d3ee"],["3.2K+","Biz","🏪","#818cf8"],["4.8★","Rating","⭐","#fbbf24"]].map(([v,l,i,c]) => (
          <div key={l} className="glass" style={{ padding:"16px 10px", textAlign:"center", borderRadius:16 }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{i}</div>
            <div style={{ fontWeight:800, fontSize:18, fontFamily:"Poppins", background:`linear-gradient(135deg,${c},${c}88)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{v}</div>
            <div style={{ fontSize:11, color:"var(--t3)", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* TICKER */}
      <div className="ticker-wrap" style={{ marginBottom:32, background:"rgba(34,211,238,0.015)" }}>
        <div className="ticker-inner">{[...TICKER,...TICKER].map((t,i) => <span key={i} style={{ fontSize:12, color:"var(--t2)" }}>{t}</span>)}</div>
      </div>

      {/* CATEGORIES */}
      <div style={{ padding:"0 20px 32px" }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--c)", marginBottom:6 }}>Browse by Category</div>
        <div style={{ fontSize:22, fontWeight:800, fontFamily:"Poppins", marginBottom:18 }}>What do you need?</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {CATS_DATA.map(cat => (
            <div key={cat.id} onClick={()=>go("listings")} className="card ch" style={{ padding:"16px 8px", textAlign:"center", cursor:"pointer", borderRadius:16 }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=cat.c+"44"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--b1)"}}>
              <div style={{ fontSize:26, marginBottom:6 }}>{cat.icon}</div>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--t2)", lineHeight:1.3 }}>{cat.name}</div>
              <div style={{ height:2, background:`linear-gradient(90deg,${cat.c},transparent)`, marginTop:10, borderRadius:1 }} />
            </div>
          ))}
        </div>
      </div>

      {/* TOP BIZ */}
      <div style={{ padding:"0 20px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--v)", marginBottom:4 }}>AI Recommended</div>
            <div style={{ fontSize:20, fontWeight:800, fontFamily:"Poppins" }}>Top Businesses</div>
          </div>
          <button onClick={()=>go("listings")} className="btn bo" style={{ padding:"8px 16px", borderRadius:10, fontSize:13 }}>All →</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {bizList.filter(b=>b.status==="approved").slice(0,3).map(b => <BizCard key={b.id} b={b} onClick={()=>{ setBiz(b); go("detail") }} />)}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:"0 20px 32px" }}>
        <div style={{ background:"linear-gradient(135deg,rgba(34,211,238,0.06),rgba(129,140,248,0.06))", border:"1px solid var(--b2)", borderRadius:20, padding:24, textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🏪</div>
          <h3 style={{ fontSize:20, fontWeight:800, marginBottom:8, fontFamily:"Poppins" }}>Own a Business?</h3>
          <p style={{ color:"var(--t2)", fontSize:14, lineHeight:1.7, marginBottom:16 }}>List free. Get leads from 12,000+ customers in Pune. AI helps optimize your profile.</p>
          <button onClick={()=>go("login")} className="btn bp" style={{ width:"100%", padding:"14px 0", borderRadius:14, fontSize:15 }}>List My Business Free →</button>
        </div>
      </div>

      <div style={{ padding:"24px 20px", borderTop:"1px solid var(--b1)", textAlign:"center" }}>
        <div style={{ fontFamily:"Poppins", fontWeight:900, fontSize:24, marginBottom:6 }} className="gtc">Servora</div>
        <p style={{ color:"var(--t3)", fontSize:12 }}>Pune's AI-powered local services marketplace · Made in India 🇮🇳</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   LISTINGS PAGE
════════════════════════════════════════════ */
function Listings({ go, setBiz }) {
  const [search, setSearch] = useState("")
  const [cat, setCat] = useState("All")
  const [sort, setSort] = useState("rating")
  const [verified, setVerified] = useState(false)
  const [avail, setAvail] = useState(false)
  const [sortSheet, setSortSheet] = useState(false)
  const [list, setList] = useState(BIZ_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    sb.select("businesses","?status=eq.approved&order=rating.desc").then(data => {
      setList(data?.length > 0 ? data : BIZ_DATA)
      setLoading(false)
    }).catch(() => { setList(BIZ_DATA); setLoading(false) })
  }, [])

  const cats = ["All", ...new Set(list.map(b=>b.cat))]
  const filtered = list.filter(b => {
    if (cat !== "All" && b.cat !== cat) return false
    if (verified && !b.verified) return false
    if (avail && !b.avail) return false
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.cat.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a,b) => sort==="rating" ? b.rating-a.rating : sort==="price" ? a.price-b.price : b.reviews-a.reviews)

  return (
    <div className="page">
      <div style={{ padding:"20px 20px 0", background:"linear-gradient(180deg,rgba(34,211,238,0.03),transparent)" }}>
        <h1 style={{ fontSize:24, fontWeight:800, marginBottom:4, fontFamily:"Poppins" }}>Services in <span className="gtc">Pune</span></h1>
        <p style={{ color:"var(--t2)", fontSize:14, marginBottom:14 }}>{filtered.length} results</p>
        <div className="glass2" style={{ display:"flex", alignItems:"center", padding:"13px 16px", gap:10, borderRadius:14, marginBottom:12 }}>
          <span style={{ color:"var(--t3)" }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search services..." style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--t1)", fontSize:15 }} />
        </div>
        <div className="chips" style={{ marginBottom:12 }}>
          {cats.map(c => <button key={c} onClick={()=>setCat(c)} className={`chip ${cat===c?"on":""}`}>{c}</button>)}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:16, borderBottom:"1px solid var(--b1)" }}>
          {[["v",verified,setVerified,"✅ Verified"],["a",avail,setAvail,"🟢 Open"]].map(([k,val,setV,l]) => (
            <label key={k} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"var(--t2)" }}>
              <div className="toggle" style={{ background:val?"var(--c)":"var(--s3)" }} onClick={()=>setV(x=>!x)}>
                <div className="tk" style={{ left:val?22:4 }} />
              </div>{l}
            </label>
          ))}
          <button onClick={()=>setSortSheet(true)} className="btn bo" style={{ marginLeft:"auto", padding:"7px 14px", borderRadius:9, fontSize:12, fontWeight:600 }}>Sort ↕</button>
        </div>
      </div>

      <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:14 }}>
        {loading
          ? [1,2,3].map(i => <div key={i} className="card" style={{ padding:20, borderRadius:20 }}><Sk h={80} /></div>)
          : filtered.length === 0
            ? <div style={{ textAlign:"center", padding:60, color:"var(--t3)" }}><div style={{ fontSize:48, marginBottom:12 }}>🔍</div><div style={{ fontSize:17, fontWeight:600 }}>No results</div></div>
            : filtered.map(b => <BizCard key={b.id} b={b} onClick={()=>{ setBiz(b); go("detail") }} />)
        }
      </div>

      {sortSheet && (
        <div className="modal-bg" onClick={()=>setSortSheet(false)}>
          <div className="modal" style={{ padding:24 }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36, height:4, borderRadius:2, background:"var(--b2)", margin:"0 auto 20px" }} />
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:18 }}>Sort By</h3>
            {[["rating","⭐ Highest Rated"],["price","💰 Lowest Price"],["reviews","💬 Most Reviews"]].map(([v,l]) => (
              <div key={v} onClick={()=>{ setSort(v); setSortSheet(false) }} style={{ padding:"15px 16px", borderRadius:12, marginBottom:8, background:sort===v?"rgba(34,211,238,0.08)":"var(--s1)", border:sort===v?"1px solid rgba(34,211,238,0.3)":"1px solid var(--b1)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:15, fontWeight:sort===v?700:400, color:sort===v?"var(--c)":"var(--t1)" }}>{l}</span>
                {sort===v && <span style={{ color:"var(--c)" }}>✓</span>}
              </div>
            ))}
            <div style={{ height:16 }} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   BUSINESS DETAIL
════════════════════════════════════════════ */
function Detail({ b, go }) {
  const [tab, setTab] = useState("about")
  const [aiTip, setAiTip] = useState(""); const [aiLoad, setAiLoad] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false); const [quoteSent, setQuoteSent] = useState(false)
  const [qName, setQName] = useState(""); const [qPhone, setQPhone] = useState(""); const [qMsg, setQMsg] = useState("")

  if (!b) return null

  useEffect(() => {
    if (b.id) sb.update("businesses", {id:b.id}, {views:(b.views||0)+1})
  }, [b.id])

  const getAI = async () => {
    setAiLoad(true)
    const r = await callAI("Give 2 quick tips in under 60 words: should user book this? Any green flags?",
      `${b.name}, ${b.cat}, ⭐${b.rating} (${b.reviews} reviews), ${b.label}, responds ${b.resp}, ${b.loc}, Pune`)
    setAiTip(r); setAiLoad(false)
  }

  const sendQuote = async () => {
    if (!qName || !qPhone) return
    await sb.insert("leads", { business_id:b.id, customer_name:qName, customer_phone:qPhone, message:qMsg, status:"new" })
    setQuoteOpen(false); setQName(""); setQPhone(""); setQMsg(""); setQuoteSent(true)
    setTimeout(() => setQuoteSent(false), 5000)
  }

  return (
    <div className="page">
      <div style={{ position:"relative", padding:"20px 20px 24px", background:`linear-gradient(180deg,${b.color}06,transparent)` }}>
        <button onClick={()=>go("listings")} className="btn bg-btn" style={{ padding:0, fontSize:14, gap:6, marginBottom:16 }}>← Back</button>
        <div style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom:16 }}>
          <div style={{ width:62, height:62, borderRadius:18, background:`${b.color}15`, border:`1px solid ${b.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, flexShrink:0 }}>{b.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
              <span style={{ fontWeight:800, fontSize:20, fontFamily:"Poppins" }}>{b.name}</span>
              {b.verified && <span>✅</span>}
            </div>
            <div style={{ fontSize:13, color:"var(--t3)", marginBottom:6 }}>{b.cat} · 📍 {b.loc}</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <Stars r={b.rating} /><span style={{ fontWeight:700, fontSize:14 }}>{b.rating}</span>
              <span style={{ color:"var(--t3)", fontSize:13 }}>({b.reviews})</span> ·
              <Dot on={b.avail} /><span style={{ fontSize:13, color:b.avail?"#34d399":"#fb7185" }}>{b.avail?"Available":"Busy"}</span>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="chips" style={{ marginBottom:18 }}>
          {(b.photos||["📷","📷","📷","📷"]).map((p,i) => (
            <div key={i} style={{ width:80, height:80, borderRadius:14, background:"var(--s2)", border:"1px solid var(--b1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, flexShrink:0 }}>{p}</div>
          ))}
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
          <span className="badge bc">{b.badge}</span>
          <span className="badge bv">⚡ {b.resp}</span>
          {b.verified && <span className="badge bg2">Verified ✅</span>}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          <button onClick={()=>window.open(`https://wa.me/91${b.phone}`,"_blank")} className="btn bs" style={{ padding:"13px 0", borderRadius:12, fontSize:14 }}>💬 WhatsApp</button>
          <button onClick={()=>window.open(`tel:+91${b.phone}`)} className="btn bo" style={{ padding:"13px 0", borderRadius:12, fontSize:14 }}>📞 Call</button>
        </div>
        <button onClick={()=>setQuoteOpen(true)} className="btn bp" style={{ width:"100%", padding:"14px 0", borderRadius:14, fontSize:15 }}>📋 Request Quote · {b.label}</button>
        {quoteSent && <div className="a-up" style={{ marginTop:12, padding:"12px 16px", background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:12, textAlign:"center", fontSize:14, color:"var(--green)", fontWeight:600 }}>✅ Quote sent! They'll respond within {b.resp}.</div>}
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid var(--b1)" }}>
        {["about","services","reviews","ai"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"13px 0", background:"transparent", border:"none", borderBottom:tab===t?"2px solid var(--c)":"2px solid transparent", color:tab===t?"var(--c)":"var(--t3)", cursor:"pointer", fontSize:13, fontWeight:tab===t?700:500, textTransform:"capitalize" }}>
            {t==="ai" ? "🤖 AI" : t}
          </button>
        ))}
      </div>

      <div style={{ padding:"20px 20px 32px" }}>
        {tab==="about" && (
          <div>
            <div className="card" style={{ padding:20, marginBottom:14, borderRadius:16 }}><p style={{ color:"var(--t2)", fontSize:14, lineHeight:1.8 }}>{b.about}</p></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[["📍","Location",b.loc],["⚡","Response",b.resp],["💰","Starting",b.label],["⏰","Hours","9 AM–8 PM"]].map(([ic,l,v]) => (
                <div key={l} className="card" style={{ padding:"14px 16px", borderRadius:14 }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{ic}</div>
                  <div style={{ fontSize:11, color:"var(--t3)", marginBottom:2 }}>{l}</div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="services" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {(b.services||[]).map(s => {
              const [name, price] = s.split(" ₹")
              return (
                <div key={s} className="card" style={{ padding:"16px 18px", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div><div style={{ fontWeight:600, fontSize:15, marginBottom:2 }}>{name}</div><div style={{ fontSize:12, color:"var(--t3)" }}>Tap to enquire</div></div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    {price && <span style={{ fontWeight:800, fontSize:15, color:b.color }}>₹{price}</span>}
                    <button onClick={()=>setQuoteOpen(true)} className="btn" style={{ padding:"7px 14px", borderRadius:9, background:`${b.color}15`, border:`1px solid ${b.color}30`, color:b.color, fontSize:12, fontWeight:700 }}>Book</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {tab==="reviews" && (
          <div>
            <div className="card" style={{ padding:20, borderRadius:16, marginBottom:14, display:"flex", gap:20, alignItems:"center" }}>
              <div style={{ textAlign:"center", flexShrink:0 }}>
                <div style={{ fontSize:42, fontWeight:900, color:b.color, lineHeight:1, fontFamily:"Poppins" }}>{b.rating}</div>
                <Stars r={b.rating} /><div style={{ fontSize:12, color:"var(--t3)", marginTop:4 }}>{b.reviews} reviews</div>
              </div>
              <div style={{ flex:1 }}>
                {[5,4,3,2,1].map(s => (
                  <div key={s} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:12, color:"var(--t3)", width:8 }}>{s}</span>
                    <div className="prog" style={{ flex:1 }}><div className="pf" style={{ width:`${s===5?72:s===4?18:s===3?6:s===2?3:1}%` }} /></div>
                    <span style={{ fontSize:11, color:"var(--t3)", width:28 }}>{s===5?"72%":s===4?"18%":s===3?"6%":s===2?"3%":"1%"}</span>
                  </div>
                ))}
              </div>
            </div>
            {[{u:"Rahul M.",r:5,t:"Absolutely fantastic! Professional and thorough. Already booked again.",d:"2 days ago"},{u:"Sneha P.",r:4,t:"Good service, minor delay but quality was excellent.",d:"1 week ago"},{u:"Amit K.",r:5,t:"Best in Pune! Super responsive and very affordable.",d:"2 weeks ago"}].map(rv => (
              <div key={rv.u} className="card" style={{ padding:16, borderRadius:14, marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#22d3ee,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14 }}>{rv.u[0]}</div>
                  <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:14 }}>{rv.u}</div><div style={{ display:"flex", gap:6, alignItems:"center" }}><Stars r={rv.r} s={11} /><span style={{ fontSize:11, color:"var(--t3)" }}>{rv.d}</span></div></div>
                  <span style={{ fontSize:11, color:"var(--c)" }}>✅</span>
                </div>
                <p style={{ color:"var(--t2)", fontSize:14, lineHeight:1.7 }}>{rv.t}</p>
              </div>
            ))}
          </div>
        )}
        {tab==="ai" && (
          <div>
            <div style={{ padding:24, background:"rgba(34,211,238,0.04)", border:"1px solid rgba(34,211,238,0.15)", borderRadius:18, marginBottom:16 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:28 }}>🤖</span>
                <div><div style={{ fontWeight:700, fontSize:16, fontFamily:"Poppins" }}>AI Advisor</div><div style={{ fontSize:12, color:"var(--c)" }}>Powered by Claude AI</div></div>
              </div>
              {aiTip ? <p style={{ color:"var(--t2)", fontSize:14, lineHeight:1.8 }}>{aiTip}</p>
                : aiLoad ? <div style={{ display:"flex", justifyContent:"center", padding:8 }}><BL /></div>
                : <button onClick={getAI} className="btn bp" style={{ width:"100%", padding:"13px 0", borderRadius:12, fontSize:14 }}>🤖 Should I Book This?</button>}
            </div>
            <div className="card" style={{ padding:20, borderRadius:16 }}>
              <h4 style={{ fontWeight:700, marginBottom:14, fontSize:15 }}>💰 Compare Similar</h4>
              {BIZ_DATA.filter(x=>x.cat===b.cat&&x.id!==b.id).slice(0,2).map(x => (
                <div key={x.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, paddingBottom:12, borderBottom:"1px solid var(--b1)" }}>
                  <div style={{ fontSize:22 }}>{x.icon}</div>
                  <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:13 }}>{x.name}</div><Stars r={x.rating} s={11} /></div>
                  <div style={{ fontWeight:700, fontSize:14, color:x.price<b.price?"var(--green)":"var(--t2)" }}>{x.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quote sheet */}
      {quoteOpen && (
        <div className="modal-bg" onClick={()=>setQuoteOpen(false)}>
          <div className="modal" style={{ padding:24 }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36, height:4, borderRadius:2, background:"var(--b2)", margin:"0 auto 20px" }} />
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:4, fontFamily:"Poppins" }}>Request a Quote</h3>
            <p style={{ color:"var(--t2)", fontSize:14, marginBottom:20 }}>from {b.name}</p>
            <label className="field-label">Your Name *</label>
            <input value={qName} onChange={e=>setQName(e.target.value)} className="field" placeholder="Full name" style={{ marginBottom:14 }} />
            <label className="field-label">Phone *</label>
            <input value={qPhone} onChange={e=>setQPhone(e.target.value.replace(/\D/,"").slice(0,10))} className="field" placeholder="10-digit mobile" type="tel" style={{ marginBottom:14 }} />
            <label className="field-label">Requirement</label>
            <textarea value={qMsg} onChange={e=>setQMsg(e.target.value)} className="field" rows={3} placeholder="Describe what you need..." style={{ marginBottom:20 }} />
            <button onClick={sendQuote} disabled={!qName||!qPhone} className="btn bp" style={{ width:"100%", padding:"14px 0", borderRadius:14, fontSize:15, opacity:!qName||!qPhone?0.5:1 }}>📤 Send Request</button>
            <div style={{ height:16 }} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   USER DASHBOARD
════════════════════════════════════════════ */
function UserDash({ user, go }) {
  const [tab, setTab] = useState("requests")
  const [leads, setLeads] = useState([])

  useEffect(() => {
    if (user?.phone) {
      sb.select("leads", `?customer_phone=eq.${user.phone}&order=created_at.desc`).then(data => {
        if (data?.length > 0) setLeads(data)
      })
    }
  }, [user])

  return (
    <div className="page" style={{ padding:"24px 20px" }}>
      <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:24 }}>
        <div style={{ width:54, height:54, borderRadius:18, background:"linear-gradient(135deg,#22d3ee,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>👤</div>
        <div>
          <div style={{ fontWeight:800, fontSize:20, fontFamily:"Poppins" }}>{user?.name || "My Account"}</div>
          <div style={{ color:"var(--t2)", fontSize:13 }}>+91 {user?.phone}</div>
          {user?.email && <div style={{ color:"var(--t3)", fontSize:12 }}>{user.email}</div>}
        </div>
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid var(--b1)", marginBottom:20 }}>
        {["requests","saved","settings"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"12px 0", background:"transparent", border:"none", borderBottom:tab===t?"2px solid var(--c)":"2px solid transparent", color:tab===t?"var(--c)":"var(--t3)", cursor:"pointer", fontSize:13, fontWeight:600, textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>

      {tab==="requests" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {leads.length === 0
            ? <div style={{ textAlign:"center", padding:40, color:"var(--t3)" }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
                <div style={{ fontSize:15, fontWeight:600 }}>No requests yet</div>
                <div style={{ fontSize:13, marginTop:6 }}>Request quotes from businesses to see them here</div>
                <button onClick={()=>go("listings")} className="btn bp" style={{ marginTop:16, padding:"11px 24px", borderRadius:12, fontSize:14 }}>Find Services</button>
              </div>
            : leads.map(l => (
                <div key={l.id} className="card" style={{ padding:18, borderRadius:16 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{l.message || "Service Request"}</div>
                  <div style={{ color:"var(--t3)", fontSize:12, marginBottom:8 }}>{new Date(l.created_at).toLocaleDateString("en-IN")}</div>
                  <span className={`badge ${l.status==="new"?"bv":l.status==="contacted"?"ba":"bg2"}`}>{l.status}</span>
                </div>
              ))
          }
        </div>
      )}
      {tab==="saved" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {BIZ_DATA.slice(0,2).map(b => <BizCard key={b.id} b={b} compact onClick={()=>{}} />)}
          <button onClick={()=>go("listings")} className="btn bo" style={{ padding:"13px 0", borderRadius:14, fontSize:14, fontWeight:600 }}>Browse More Services</button>
        </div>
      )}
      {tab==="settings" && (
        <div className="card" style={{ padding:24, borderRadius:16 }}>
          <h4 style={{ fontWeight:700, marginBottom:16 }}>Account Info</h4>
          <div style={{ marginBottom:14 }}><label className="field-label">Name</label><div style={{ color:"var(--t1)", fontSize:15 }}>{user?.name}</div></div>
          <div style={{ marginBottom:14 }}><label className="field-label">Email</label><div style={{ color:"var(--t1)", fontSize:15 }}>{user?.email || "—"}</div></div>
          <div style={{ marginBottom:14 }}><label className="field-label">Phone</label><div style={{ color:"var(--t1)", fontSize:15 }}>+91 {user?.phone}</div></div>
          <div style={{ marginBottom:0 }}><label className="field-label">Role</label><div><span className={`badge ${user?.role==="business"?"bc":"bg2"}`}>{user?.role}</span></div></div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   BUSINESS DASHBOARD (simplified for brevity)
════════════════════════════════════════════ */
function BizDash({ user }) {
  const [tab, setTab] = useState("leads")
  const [biz, setBiz] = useState(null)
  const [leads, setLeads] = useState([])
  const [aiTip, setAiTip] = useState(""); const [aiLoad, setAiLoad] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      const bizData = await sb.select("businesses", `?owner_id=eq.${user.id}&limit=1`)
      if (bizData?.length > 0) {
        setBiz(bizData[0])
        const leadsData = await sb.select("leads", `?business_id=eq.${bizData[0].id}&order=created_at.desc`)
        if (leadsData) setLeads(leadsData)
      }
    }
    load()
  }, [user])

  const getAI = async () => {
    setAiLoad(true)
    const r = await callAI("You are a business growth advisor for Indian local service businesses. Give 3 numbered, specific tips to get more leads on a platform like Servora/JustDial. Under 90 words.",
      `${biz?.name||"my business"}, ${biz?.category||"services"}, ${biz?.plan||"free"} plan, Pune`)
    setAiTip(r); setAiLoad(false)
  }

  return (
    <div className="page" style={{ padding:"24px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:20, fontFamily:"Poppins", marginBottom:4 }}>Business Hub</div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span className={`badge ${biz?.plan==="elite"?"ba":biz?.plan==="pro"?"bv":"bc"}`}>{(biz?.plan||"free").toUpperCase()}</span>
            <span style={{ color:"var(--t3)", fontSize:13 }}>{biz?.name||"Your Business"}</span>
          </div>
        </div>
        <span className={`badge ${biz?.status==="approved"?"bg2":biz?.status==="rejected"?"br":"ba"}`}>{biz?.status||"pending"}</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        {[{l:"Leads",v:leads.length,i:"⚡",c:"#22d3ee"},{l:"Views",v:biz?.views||0,i:"👁️",c:"#818cf8"},{l:"Rating",v:biz?.rating||"—",i:"⭐",c:"#fbbf24"},{l:"Reviews",v:biz?.reviews_count||0,i:"💬",c:"#34d399"}].map(s => (
          <div key={s.l} className="card" style={{ padding:16, borderRadius:16 }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{s.i}</div>
            <div style={{ fontWeight:900, fontSize:22, marginBottom:2, fontFamily:"Poppins", color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11, color:"var(--t3)" }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid var(--b1)", marginBottom:20, overflowX:"auto" }}>
        {["leads","profile","ai","plans"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ flexShrink:0, padding:"12px 14px", background:"transparent", border:"none", borderBottom:tab===t?"2px solid var(--c)":"2px solid transparent", color:tab===t?"var(--c)":"var(--t3)", cursor:"pointer", fontSize:13, fontWeight:600, whiteSpace:"nowrap" }}>
            {t==="ai"?"🤖 AI Coach":t==="plans"?"⬆️ Plans":t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==="leads" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {leads.length === 0
            ? <div style={{ textAlign:"center", padding:40, color:"var(--t3)" }}><div style={{ fontSize:40, marginBottom:10 }}>⚡</div><div style={{ fontSize:15, fontWeight:600 }}>No leads yet</div></div>
            : leads.map(l => (
                <div key={l.id} className="card" style={{ padding:16, borderRadius:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:"var(--s3)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:16 }}>{l.customer_name?.[0]||"?"}</div>
                    <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:15 }}>{l.customer_name}</div><div style={{ color:"var(--t3)", fontSize:12 }}>{l.customer_phone} · {new Date(l.created_at).toLocaleDateString("en-IN")}</div>{l.message&&<div style={{ color:"var(--t2)", fontSize:12, marginTop:2 }}>{l.message}</div>}</div>
                    <span className={`badge ${l.status==="new"?"bv":l.status==="contacted"?"ba":"bg2"}`}>{l.status}</span>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>window.open(`https://wa.me/91${l.customer_phone}`,"_blank")} className="btn bs" style={{ flex:1, padding:"9px 0", borderRadius:9, fontSize:13 }}>💬 WhatsApp</button>
                    <button onClick={()=>sb.update("leads",{id:l.id},{status:"contacted"}).then(()=>setLeads(ls=>ls.map(x=>x.id===l.id?{...x,status:"contacted"}:x)))} className="btn bo" style={{ flex:1, padding:"9px 0", borderRadius:9, fontSize:13 }}>Mark Contacted</button>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {tab==="ai" && (
        <div style={{ padding:28, background:"rgba(34,211,238,0.03)", border:"1px solid rgba(34,211,238,0.15)", borderRadius:20 }}>
          <div style={{ textAlign:"center", marginBottom:22 }}>
            <div style={{ fontSize:44, marginBottom:10 }}>🤖</div>
            <h3 style={{ fontWeight:800, fontSize:20, marginBottom:6, fontFamily:"Poppins" }}>AI Business Coach</h3>
            <p style={{ color:"var(--t2)", fontSize:14, lineHeight:1.7 }}>Personalized growth tips powered by Claude AI.</p>
          </div>
          {aiTip ? <p style={{ color:"var(--t2)", fontSize:14, lineHeight:1.9, whiteSpace:"pre-wrap" }}>{aiTip}</p>
            : aiLoad ? <div style={{ display:"flex", justifyContent:"center", padding:8 }}><BL /></div>
            : <button onClick={getAI} className="btn bp" style={{ width:"100%", padding:"14px 0", borderRadius:14, fontSize:15 }}>🚀 Get My AI Growth Plan</button>}
        </div>
      )}

      {tab==="plans" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {PLANS_DATA.map(p => (
            <div key={p.id} className="card" style={{ padding:22, borderRadius:18, border:p.popular?"1.5px solid rgba(129,140,248,0.4)":"1px solid var(--b1)", position:"relative" }}>
              {p.popular && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(90deg,#818cf8,#22d3ee)", color:"#fff", fontSize:9, padding:"3px 14px", borderRadius:20, fontWeight:700, whiteSpace:"nowrap" }}>MOST POPULAR</div>}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div><div style={{ fontFamily:"Poppins", fontWeight:800, fontSize:17 }}>{p.name}</div><div><span style={{ fontSize:24, fontWeight:900, color:p.color }}>₹{p.price===0?"0":p.price.toLocaleString()}</span><span style={{ color:"var(--t3)", fontSize:12 }}>/month</span></div></div>
                <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:"var(--t3)" }}>Leads</div><div style={{ fontWeight:800, fontSize:18, color:p.color }}>{p.leads>999?"∞":p.leads}</div></div>
              </div>
              {p.features.map(f => <div key={f} style={{ fontSize:13, color:"var(--t2)", marginBottom:5, display:"flex", gap:7 }}><span style={{ color:p.color }}>✓</span>{f}</div>)}
              <button className="btn bp" style={{ width:"100%", padding:"12px 0", borderRadius:12, fontSize:14, marginTop:14, opacity:biz?.plan===p.id||p.id==="free"?0.4:1 }} disabled={biz?.plan===p.id||p.id==="free"}>
                {biz?.plan===p.id?"Current Plan":p.id==="free"?"Free Plan":"Upgrade — Contact Support"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab==="profile" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[["Business Name",biz?.name||""],["Category",biz?.category||""],["Location",biz?.location||""],["Phone",biz?.phone||""]].map(([l,v]) => (
            <div key={l}><label className="field-label">{l}</label><input className="field" defaultValue={v} /></div>
          ))}
          <div><label className="field-label">About</label><textarea className="field" rows={4} defaultValue={biz?.description||""} /></div>
          <button className="btn bp" style={{ padding:"14px 0", borderRadius:14, fontSize:15 }}>💾 Save Changes</button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   🔐 ADMIN DASHBOARD — Only via secret phone
════════════════════════════════════════════ */
function AdminPanel() {
  const [tab, setTab] = useState("overview")
  const [bizList, setBizList] = useState([])
  const [users, setUsers] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiMod, setAiMod] = useState(""); const [aiModLoad, setAiModLoad] = useState(false)
  const [banner, setBanner] = useState("")
  const [stats, setStats] = useState({ users:0, businesses:0, leads:0, revenue:0 })

  useEffect(() => {
    const load = async () => {
      const [biz, usr, leds] = await Promise.all([
        sb.select("businesses","?order=created_at.desc"),
        sb.select("users","?order=created_at.desc"),
        sb.select("leads","?order=created_at.desc&limit=100")
      ])
      if (biz) setBizList(biz)
      if (usr) setUsers(usr)
      if (leds) setLeads(leds)
      setStats({
        users: usr?.length||0,
        businesses: biz?.length||0,
        leads: leds?.length||0,
        revenue: (biz||[]).reduce((a,b)=>a+(b.plan==="elite"?4999:b.plan==="pro"?2499:b.plan==="growth"?999:0),0)
      })
      setLoading(false)
    }
    load()
  }, [])

  const approveBiz = async id => { await sb.update("businesses",{id},{status:"approved"}); setBizList(l=>l.map(b=>b.id===id?{...b,status:"approved"}:b)) }
  const rejectBiz  = async id => { await sb.update("businesses",{id},{status:"rejected"}); setBizList(l=>l.map(b=>b.id===id?{...b,status:"rejected"}:b)) }
  const verifyBiz  = async id => { await sb.update("businesses",{id},{verified:true}); setBizList(l=>l.map(b=>b.id===id?{...b,verified:true}:b)) }
  const blockUser  = async (id, blocked) => { await sb.update("users",{id},{blocked:!blocked}); setUsers(l=>l.map(u=>u.id===id?{...u,blocked:!blocked}:u)) }

  const runAIMod = async () => {
    setAiModLoad(true)
    const r = await callAI("You are a content moderator. Detect fake reviews and spam. Under 80 words, identify suspicious ones with reasons.",
      "1. 'BEST EVER BOOK NOW!!!' - new account today\n2. 'Repaired AC well, fair price.' - 2yr account, 12 reviews\n3. 'SCAM DON'T USE' - 5 reviews today same IP\n4. 'Good job, minor delay, satisfied.' - 1yr account, 9 reviews")
    setAiMod(r); setAiModLoad(false)
  }

  const sendBanner = async () => {
    if (!banner.trim()) return
    await sb.insert("announcements", { title:"Platform Update", message:banner, active:true })
    setBanner(""); alert("Announcement saved!")
  }

  if (loading) return <div style={{ padding:60, textAlign:"center" }}><BL /></div>

  return (
    <div className="page" style={{ padding:"24px 20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
            <span style={{ fontWeight:800, fontSize:22, fontFamily:"Poppins" }}>Admin Center</span>
            <span className="badge br">SUPER ADMIN</span>
          </div>
          <span style={{ color:"var(--t3)", fontSize:13 }}>Servora Platform · Pune</span>
        </div>
        <button onClick={()=>window.location.reload()} className="btn bo" style={{ padding:"9px 14px", borderRadius:11, fontSize:12, fontWeight:600 }}>🔄 Refresh Data</button>
      </div>

      {/* Real stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        {[{l:"Total Users",v:stats.users,i:"👥",c:"#22d3ee"},{l:"Businesses",v:stats.businesses,i:"🏪",c:"#818cf8"},{l:"MRR",v:"₹"+stats.revenue.toLocaleString("en-IN"),i:"💰",c:"#fbbf24"},{l:"Total Leads",v:stats.leads,i:"⚡",c:"#34d399"}].map(s => (
          <div key={s.l} className="card" style={{ padding:16, borderRadius:16 }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{s.i}</div>
            <div style={{ fontWeight:900, fontSize:20, marginBottom:2, fontFamily:"Poppins", color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11, color:"var(--t3)" }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", borderBottom:"1px solid var(--b1)", marginBottom:20, overflowX:"auto" }}>
        {["overview","businesses","users","leads","ai-mod","announce"].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ flexShrink:0, padding:"12px 10px", background:"transparent", border:"none", borderBottom:tab===t?"2px solid var(--c)":"2px solid transparent", color:tab===t?"var(--c)":"var(--t3)", cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>
            {t==="ai-mod"?"🛡️ AI Mod":t==="announce"?"📢 Announce":t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==="overview" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card" style={{ padding:20, borderRadius:16 }}>
            <h4 style={{ fontWeight:700, marginBottom:14 }}>⏳ Pending Approvals ({bizList.filter(b=>b.status==="pending").length})</h4>
            {bizList.filter(b=>b.status==="pending").length===0
              ? <p style={{ color:"var(--t3)", fontSize:13 }}>All caught up! No pending approvals.</p>
              : bizList.filter(b=>b.status==="pending").slice(0,5).map(b => (
                  <div key={b.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid var(--b1)" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:14 }}>{b.name}</div>
                      <div style={{ color:"var(--t3)", fontSize:12 }}>{b.category} · {b.location}</div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>approveBiz(b.id)} className="btn bs" style={{ width:34, height:34, borderRadius:8, padding:0, fontSize:16 }}>✓</button>
                      <button onClick={()=>rejectBiz(b.id)}  className="btn bd" style={{ width:34, height:34, borderRadius:8, padding:0, fontSize:16 }}>✕</button>
                    </div>
                  </div>
                ))
            }
          </div>
          <div className="card" style={{ padding:20, borderRadius:16 }}>
            <h4 style={{ fontWeight:700, marginBottom:14 }}>📊 Revenue by Plan</h4>
            {PLANS_DATA.map(p => (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--b1)" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:p.color, flexShrink:0 }} />
                <span style={{ flex:1, fontSize:13, color:"var(--t2)" }}>{p.name}</span>
                <span style={{ fontSize:12, color:"var(--t3)" }}>{bizList.filter(b=>b.plan===p.id).length} biz</span>
                <span style={{ fontWeight:700, fontSize:13, color:"var(--green)" }}>₹{(bizList.filter(b=>b.plan===p.id).length*p.price).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="businesses" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {bizList.map(b => (
            <div key={b.id} className="card" style={{ padding:16, borderRadius:16 }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:2 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{b.name}</div>
                    {b.verified && <span style={{ fontSize:12 }}>✅</span>}
                  </div>
                  <div style={{ color:"var(--t3)", fontSize:12, marginBottom:6 }}>{b.category} · {b.location}</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    <span className={`badge ${b.plan==="elite"?"ba":b.plan==="pro"?"bv":"bc"}`}>{b.plan||"free"}</span>
                    <span className={`badge ${b.status==="approved"?"bg2":b.status==="rejected"?"br":"ba"}`}>{b.status||"pending"}</span>
                    <span style={{ fontSize:11, color:"var(--t3)" }}>{b.views||0}👁 {b.leads||0}⚡</span>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {b.status!=="approved" && <button onClick={()=>approveBiz(b.id)} className="btn bs" style={{ flex:1, padding:"8px 0", borderRadius:9, fontSize:12, minWidth:70 }}>Approve</button>}
                {b.status!=="rejected" && <button onClick={()=>rejectBiz(b.id)}  className="btn bd" style={{ flex:1, padding:"8px 0", borderRadius:9, fontSize:12, minWidth:70 }}>Reject</button>}
                {!b.verified         && <button onClick={()=>verifyBiz(b.id)}  className="btn bw" style={{ flex:1, padding:"8px 0", borderRadius:9, fontSize:12, minWidth:70 }}>✅ Verify</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="users" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {users.map(u => (
            <div key={u.id} className="card" style={{ padding:16, borderRadius:14, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,rgba(34,211,238,0.15),rgba(129,140,248,0.15))", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:16 }}>👤</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{u.name||u.phone}</div>
                <div style={{ color:"var(--t3)", fontSize:12 }}>{u.phone} · {u.email}</div>
                <div style={{ display:"flex", gap:5, marginTop:3 }}>
                  <span className={`badge ${u.role==="admin"?"ba":u.role==="business"?"bc":"bg2"}`} style={{ fontSize:9 }}>{u.role}</span>
                  {u.blocked && <span className="badge br" style={{ fontSize:9 }}>BLOCKED</span>}
                </div>
              </div>
              {u.role !== "admin" && (
                <button onClick={()=>blockUser(u.id,u.blocked)} className={`btn ${u.blocked?"bs":"bd"}`} style={{ padding:"7px 14px", borderRadius:9, fontSize:12, fontWeight:700 }}>
                  {u.blocked?"Unblock":"Block"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="leads" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
            {[["Total",leads.length,"#22d3ee"],["New",leads.filter(l=>l.status==="new").length,"#818cf8"],["Done",leads.filter(l=>l.status!=="new").length,"#34d399"]].map(([l,v,c]) => (
              <div key={l} style={{ padding:"14px 10px", background:`${c}08`, border:`1px solid ${c}25`, borderRadius:14, textAlign:"center" }}>
                <div style={{ fontWeight:800, fontSize:20, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:"var(--t3)" }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {leads.map(l => (
              <div key={l.id} className="card" style={{ padding:14, borderRadius:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontWeight:600, fontSize:14 }}>{l.customer_name||"Anonymous"}</span>
                  <span className={`badge ${l.status==="new"?"bv":"bg2"}`}>{l.status}</span>
                </div>
                <div style={{ color:"var(--t3)", fontSize:12 }}>{l.customer_phone} · {new Date(l.created_at).toLocaleDateString("en-IN")}</div>
                {l.message && <div style={{ color:"var(--t2)", fontSize:13, marginTop:6 }}>{l.message}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="ai-mod" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
            {[["🚨","Flagged","0","var(--rose)"],["✅","Approved",leads.length,"var(--green)"],["🔍","Pending",bizList.filter(b=>b.status==="pending").length,"var(--amber)"]].map(([i,l,v,c]) => (
              <div key={l} style={{ padding:"14px 10px", background:`${c}08`, border:`1px solid ${c}25`, borderRadius:14, textAlign:"center" }}>
                <div style={{ fontSize:20 }}>{i}</div><div style={{ fontWeight:800, fontSize:18, color:c }}>{v}</div><div style={{ fontSize:11, color:"var(--t3)" }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ padding:24, background:"rgba(251,113,133,0.03)", border:"1px solid rgba(251,113,133,0.15)", borderRadius:18 }}>
            <h4 style={{ fontWeight:700, fontSize:16, marginBottom:8, fontFamily:"Poppins" }}>🛡️ AI Review Scanner</h4>
            <p style={{ color:"var(--t2)", fontSize:13, lineHeight:1.7, marginBottom:16 }}>Auto-detect fake reviews, spam listings and coordinated attacks using Claude AI.</p>
            {aiMod ? <p style={{ color:"var(--t2)", fontSize:14, lineHeight:1.9, whiteSpace:"pre-wrap" }}>{aiMod}</p>
              : aiModLoad ? <div style={{ display:"flex", justifyContent:"center", padding:8 }}><BL /></div>
              : <button onClick={runAIMod} className="btn bp" style={{ width:"100%", padding:"13px 0", borderRadius:12, fontSize:14 }}>🛡️ Run AI Moderation Scan</button>}
          </div>
        </div>
      )}

      {tab==="announce" && (
        <div className="card" style={{ padding:24, borderRadius:16 }}>
          <h4 style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>📢 Send to All Users</h4>
          <label className="field-label">Announcement Message</label>
          <textarea value={banner} onChange={e=>setBanner(e.target.value)} className="field" rows={4} placeholder="Write your announcement here..." style={{ marginBottom:14 }} />
          <button onClick={sendBanner} disabled={!banner.trim()} className="btn bp" style={{ width:"100%", padding:"13px 0", borderRadius:12, fontSize:14 }}>📤 Send Announcement</button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   AI CHAT — Full Screen
════════════════════════════════════════════ */
function AiChat({ onClose }) {
  const [msgs, setMsgs] = useState([{ role:"assistant", text:"Hi! 👋 I'm Servora AI. I help you find the best local services in Pune. What do you need today?" }])
  const [inp, setInp] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }) }, [msgs])

  const send = async () => {
    if (!inp.trim() || loading) return
    const text = inp.trim(); setInp(""); setLoading(true)
    setMsgs(p => [...p, { role:"user", text }])
    const r = await callAI("You are Servora AI for Pune local services. Be friendly, concise (max 3 sentences). Use ₹ for prices. End with a helpful follow-up question.", text, msgs)
    setMsgs(p => [...p, { role:"assistant", text:r }])
    setLoading(false)
  }

  const QUICK = ["Best home cleaner?","Doctor near Baner?","Cheapest tutor?","AC repair urgent?","Salon open now?"]

  return (
    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"var(--bg)", display:"flex", flexDirection:"column", animation:"scaleIn 0.25s ease" }}>
      <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--b1)", display:"flex", alignItems:"center", gap:12, background:"var(--bg2)" }}>
        <button onClick={onClose} className="btn bg-btn" style={{ padding:0, fontSize:24, lineHeight:1 }}>←</button>
        <div style={{ width:42, height:42, borderRadius:13, background:"linear-gradient(135deg,var(--cd),var(--vd))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🤖</div>
        <div>
          <div style={{ fontWeight:700, fontSize:16, fontFamily:"Poppins" }}>Servora AI</div>
          <div style={{ fontSize:12, color:"var(--c)", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--c)", display:"inline-block" }} />Online · Claude AI
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        {msgs.map((m,i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:8, alignItems:"flex-end" }}>
            {m.role==="assistant" && <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,var(--cd),var(--vd))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🤖</div>}
            <div style={{ maxWidth:"80%", padding:"12px 16px", borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", background:m.role==="user"?"linear-gradient(135deg,var(--cd),var(--vd))":"var(--s2)", fontSize:14, lineHeight:1.75, color:m.role==="user"?"white":"var(--t2)", animation:"fadeUp 0.3s ease" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,var(--cd),var(--vd))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🤖</div>
          <div style={{ padding:"14px 18px", borderRadius:"18px 18px 18px 4px", background:"var(--s2)" }}><BL /></div>
        </div>}
        <div ref={bottomRef} />
      </div>

      {msgs.length <= 1 && (
        <div className="chips" style={{ padding:"0 16px 12px" }}>
          {QUICK.map(q => <button key={q} onClick={()=>setInp(q)} className="chip" style={{ fontSize:12 }}>{q}</button>)}
        </div>
      )}

      <div style={{ padding:"12px 16px", borderTop:"1px solid var(--b1)", background:"var(--bg2)", display:"flex", gap:10, alignItems:"flex-end", paddingBottom:"max(12px,env(safe-area-inset-bottom))" }}>
        <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()} }} placeholder="Ask about any service in Pune..." rows={1}
          style={{ flex:1, background:"var(--s2)", border:"1px solid var(--b2)", borderRadius:14, padding:"12px 16px", color:"var(--t1)", fontSize:15, outline:"none", resize:"none", maxHeight:100, lineHeight:1.5 }} />
        <button onClick={send} disabled={!inp.trim()||loading} className="btn bp" style={{ width:46, height:46, borderRadius:14, fontSize:20, flexShrink:0, opacity:!inp.trim()||loading?0.4:1, padding:0 }}>↑</button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   NAVIGATION BARS
════════════════════════════════════════════ */
function TopBar({ page, go, user, setUser }) {
  return (
    <nav style={{ position:"sticky", top:0, zIndex:800, background:"rgba(11,11,15,0.92)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderBottom:"1px solid var(--b1)", padding:"13px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div onClick={()=>go("home")} style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }}>
        <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,var(--cd),var(--vd))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⚡</div>
        <span style={{ fontWeight:900, fontSize:20, fontFamily:"Poppins" }} className="gtc">Servora</span>
        <span style={{ fontSize:10, background:"rgba(251,191,36,0.12)", color:"var(--amber)", border:"1px solid rgba(251,191,36,0.25)", borderRadius:5, padding:"2px 7px", fontWeight:700 }}>PUNE</span>
      </div>
      <div className="dsk" style={{ display:"none", gap:4, alignItems:"center" }}>
        {["home","listings"].map(p => (
          <button key={p} onClick={()=>go(p)} className="btn bg-btn" style={{ padding:"8px 16px", borderRadius:10, fontSize:14, color:page===p?"var(--c)":"var(--t2)", background:page===p?"rgba(34,211,238,0.07)":"transparent", fontWeight:page===p?600:400 }}>
            {p.charAt(0).toUpperCase()+p.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button onClick={()=>go("chat")} className="btn bo" style={{ padding:"8px 14px", borderRadius:10, fontSize:13, gap:6 }}>🤖 AI</button>
        {user
          ? <>
              <button onClick={()=>go("dashboard")} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", borderRadius:10, background:"var(--s1)", border:"1px solid var(--b1)", cursor:"pointer", color:"var(--t2)", fontSize:13 }}>
                <span style={{ width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,#22d3ee,#818cf8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>👤</span>
                <span className="dsk" style={{ display:"none" }}>{user.name||"Dashboard"}</span>
              </button>
              <button onClick={()=>setUser(null)} className="btn bg-btn" style={{ padding:"7px 12px", borderRadius:10, fontSize:13 }}>Logout</button>
            </>
          : <button onClick={()=>go("login")} className="btn bp" style={{ padding:"9px 20px", borderRadius:12, fontSize:14 }}>Login / Sign Up</button>
        }
      </div>
    </nav>
  )
}

function BottomNav({ page, go, user }) {
  const items = [
    { id:"home",      icon:"🏠", label:"Home" },
    { id:"listings",  icon:"🔍", label:"Explore" },
    { id:"chat",      icon:"🤖", label:"AI", notif:true },
    { id:"dashboard", icon:"📋", label:"Dashboard" },
    { id:"account",   icon:"👤", label: user ? "Me" : "Login" },
  ]
  return (
    <nav className="bnav">
      {items.map(item => (
        <button key={item.id} onClick={()=>go(item.id)} className={`nv ${page===item.id?"on":""}`}>
          <span className="ni" style={{ position:"relative" }}>
            {item.icon}
            {item.notif && <span className="ndot" />}
          </span>
          <span className="nl" style={{ color:page===item.id?"var(--c)":"var(--t3)" }}>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

/* ════════════════════════════════════════════
   🚀  ROOT APP
════════════════════════════════════════════ */
export default function App() {
  const [page, setPage]   = useState("home")
  const [user, setUser]   = useState(null)
  const [selBiz, setSelBiz] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  const go = useCallback((p) => {
    if (p === "chat")      { setChatOpen(true); return }
    if (p === "dashboard") p = user ? (user.role==="admin" ? "admin" : user.role==="business" ? "bizDash" : "dash") : "login"
    if (p === "account")   p = user ? (user.role==="admin" ? "admin" : user.role==="business" ? "bizDash" : "dash") : "login"
    setPage(p)
    window.scrollTo({ top:0, behavior:"smooth" })
  }, [user])

  const render = () => {
    switch (page) {
      case "home":     return <Home go={go} setBiz={setSelBiz} />
      case "listings": return <Listings go={go} setBiz={setSelBiz} />
      case "detail":   return <Detail b={selBiz} go={go} />
      case "login":    return <Auth setUser={setUser} go={go} />
      case "dash":     return user ? <UserDash user={user} go={go} /> : <Auth setUser={setUser} go={go} />
      case "bizDash":  return user ? <BizDash user={user} /> : <Auth setUser={setUser} go={go} />
      case "admin":    return user?.role==="admin" ? <AdminPanel /> : <Auth setUser={setUser} go={go} />
      default:         return <Home go={go} setBiz={setSelBiz} />
    }
  }

  return (
    <>
      <GlobalStyles />
      <TopBar page={page} go={go} user={user} setUser={setUser} />
      <main>{render()}</main>
      <BottomNav page={page} go={go} user={user} />
      {chatOpen && <AiChat onClose={()=>setChatOpen(false)} />}
    </>
  )
}
