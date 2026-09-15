
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ============ CONTENT — resume only ============ */
const STATIONS = [
  { id:'aigenthix', tag:'Station 01 · Current Post', title:'AiGenthix Technologies', meta:'AI Engineer · Bangalore · Jul 2025 – Present', short:'AIGENTHIX', kind:'console',
    body:`<ul>
      <li>Architected and deployed <strong>5+ production-ready LLM systems</strong> — AI chatbots, AI interviewer, AI receptionist, workflow automation — serving enterprise clients end-to-end.</li>
      <li>Designed <strong>RAG architectures</strong> with LangChain, embeddings and vector DBs — retrieval relevance up <strong>~30%</strong> over keyword baseline.</li>
      <li>Built <strong>multi-agent workflows</strong> using A2A patterns and <strong>MCP</strong> for structured tool use — manual effort down <strong>~40%</strong>.</li>
      <li>Developed AI plugins via <strong>Claude Code and Anthropic APIs</strong> so agents autonomously invoke external services.</li>
      <li>Established <strong>LLM evaluation &amp; benchmarking</strong> for retrieval quality, accuracy and latency across model versions.</li>
      <li>Shipped REST endpoints for LLM models; containerised with <strong>Docker + Kubernetes</strong> and CI/CD for high-concurrency load.</li>
    </ul>` },
  { id:'jio', tag:'Station 02 · Prior Post', title:'Reliance Jio Infocom', meta:'ML Engineering Intern · Bangalore · Mar – Jun 2025', short:'RELIANCE JIO', kind:'console',
    body:`<ul>
      <li>Built an <strong>NLP email automation pipeline</strong> with intent detection and classifiers — turnaround down <strong>~50%</strong>.</li>
      <li>Fine-tuned TensorFlow/PyTorch <strong>transformer LLMs</strong> for edge — latency down <strong>~35%</strong>, cloud dependency down <strong>~40%</strong>.</li>
      <li>Applied <strong>GPTQ/AWQ quantization</strong> — <strong>~45% memory reduction</strong> at <strong>&gt;95% baseline accuracy</strong>.</li>
    </ul>` },
  { id:'ieee', tag:'Station 03 · Research', title:'IEEE ICIICS-2026', meta:'Published Conference Paper', short:'IEEE PAPER', kind:'pillar',
    body:`<div class="grp"><h3>Paper</h3><p><em>"Practical Implementation and Assessment of Post-Training Quantization Methods for Large Language Models"</em></p></div>
    <div class="grp"><h3>Venue</h3><p>3rd International Conference on Integrated Intelligence &amp; Communication Systems (ICIICS-2026)</p></div>` },
  { id:'sahayak', tag:'Station 04 · Award', title:'Sahayak AI', meta:'Agentic AI Education Platform · Team Lead · Mar – Apr 2025', short:'SAHAYAK AI', kind:'console',
    body:`<ul>
      <li>Built a <strong>multi-agent AI platform</strong> automating lesson planning, quiz generation and content delivery — teacher prep time down <strong>~60%</strong>.</li>
      <li>Implemented LLM personalisation workflows; awarded <strong>2nd Place, Agentic AI Day 2025</strong> (Google Cloud &amp; Hack2Skill, national level).</li>
    </ul>` },
  { id:'quant', tag:'Station 05 · Lab', title:'Quantization Lab', meta:'LLM Quantization & Inference Optimisation · Feb 2025', short:'QUANT LAB', kind:'rack',
    body:`<ul>
      <li>Benchmarked post-training quantization on <strong>Qwen-3, LLaMA-3.2, GPT-2</strong>.</li>
      <li><strong>~40% memory reduction</strong>, <strong>~30% faster inference</strong>, <strong>&lt;2% accuracy degradation</strong> — underpins the IEEE publication.</li>
      <li>Open-sourced artefacts and results on <strong>Hugging Face</strong>; adopted by practitioners globally.</li>
    </ul>` },
  { id:'skills', tag:'Station 06 · Capability', title:'Skills Array', meta:'Technical stack', short:'SKILLS ARRAY', kind:'rack',
    body:`<div class="grp"><h3>Languages &amp; ML</h3><div class="chips">${['Python','SQL','Machine Learning','Deep Learning','NLP','Transformers','TensorFlow','PyTorch','Prompt Engineering'].map(s=>`<span class="chip">${s}</span>`).join('')}</div></div>
    <div class="grp"><h3>Generative AI &amp; LLM</h3><div class="chips">${['Generative AI','Fine-tuning','RAG','GPTQ / AWQ / GGUF','Inference Optimization','LLM Eval &amp; Benchmarking','Context Engineering','Embeddings','Semantic Search'].map(s=>`<span class="chip">${s}</span>`).join('')}</div></div>
    <div class="grp"><h3>Agentic AI &amp; MCP</h3><div class="chips">${['Agentic AI','MCP','A2A Patterns','Tool Use','Function Calling','Multi-Agent Orchestration','Workflow Orchestration'].map(s=>`<span class="chip">${s}</span>`).join('')}</div></div>
    <div class="grp"><h3>Frameworks &amp; Tools</h3><div class="chips">${['LangChain','Hugging Face','OpenAI API','Anthropic Claude API','Claude Code','AWS Bedrock','Genkit','ADK','FastAPI','REST APIs'].map(s=>`<span class="chip">${s}</span>`).join('')}</div></div>
    <div class="grp"><h3>Cloud, MLOps &amp; LLMOps</h3><div class="chips">${['GCP','AWS','Docker','Kubernetes','CI/CD','LLMOps','Model Deployment','Edge AI','FAISS / Chroma'].map(s=>`<span class="chip">${s}</span>`).join('')}</div></div>
    <div class="grp"><h3>Data &amp; Analytics</h3><div class="chips">${['MySQL','MongoDB','Power BI','Tableau','Feature Engineering','Data Pipelines'].map(s=>`<span class="chip">${s}</span>`).join('')}</div></div>` },
  { id:'creds', tag:'Station 07 · Credentials', title:'Certifications & Education', meta:'Anthropic · IIT Roorkee · IFIM · Sapthagiri', short:'CREDENTIALS', kind:'pillar',
    body:`<div class="grp"><h3>Certifications</h3><ul>
      <li><strong>Claude Certified Architect – Foundations (CCA-F)</strong> — Anthropic · Jun 2026 – Dec 2026 · <em>Cert azqtzxw2k57d</em></li>
      <li><strong>Generative AI Mastery</strong> — OpenAI Academy</li>
      <li><strong>Data Analytics Certification</strong> — IIT Roorkee</li>
      <li><strong>Six Sigma White Belt</strong> — Six Sigma Council</li></ul></div>
    <div class="grp"><h3>Education</h3><ul>
      <li><strong>MBA – Data Analytics &amp; Marketing</strong> — IFIM College, Bangalore · 2023–2025</li>
      <li><strong>B.E. – Electronics &amp; Communication Engineering</strong> — Sapthagiri College of Engineering, Bangalore · 2019–2023</li></ul></div>` },
  { id:'offduty', tag:'Station 08 · Off Duty', title:'Off Duty', meta:'When the terminals are idle', short:'OFF DUTY', kind:'pillar',
    body:`<div class="grp"><h3>Pastimes</h3><div class="chips"><span class="chip">Car Racing</span><span class="chip">PC Games</span></div></div>` },
  { id:'uplink', tag:'Station 09 · Uplink', title:'Open a Channel', meta:'Bangalore, India', short:'UPLINK', kind:'console',
    body:`<div class="grp"><h3>Direct</h3><ul>
      <li><a href="mailto:avi.hm24@gmail.com" style="color:var(--signal);text-decoration:none">avi.hm24@gmail.com</a></li>
      <li>+91 8951228018</li></ul></div>
    <div class="grp"><h3>Networks</h3><ul>
      <li><a href="https://linkedin.com/in/avinash-hm007" target="_blank" rel="noopener" style="color:var(--signal);text-decoration:none">linkedin.com/in/avinash-hm007</a></li>
      <li><a href="https://github.com/Avinashhmavi" target="_blank" rel="noopener" style="color:var(--signal);text-decoration:none">github.com/Avinashhmavi</a></li>
      <li><a href="https://avihm.site" target="_blank" rel="noopener" style="color:var(--signal);text-decoration:none">avihm.site</a></li></ul></div>` },
];

const AMBER = 0xF0A93B, SIGNAL = 0x5FB4E8, VOID = 0x080C11;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = navigator.maxTouchPoints > 0 && matchMedia('(hover: none)').matches;
if (isTouch) document.body.classList.add('touch');

/* ============ renderer ============ */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:!isTouch, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(VOID);
scene.fog = new THREE.FogExp2(VOID, 0.020);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 220);
camera.position.set(0, 5.6, 15);

/* ============ floor ============ */
const floorMat = new THREE.ShaderMaterial({
  transparent:true,
  uniforms:{ uAmber:{value:new THREE.Color(AMBER)}, uSignal:{value:new THREE.Color(SIGNAL)}, uTime:{value:0}, uPlayer:{value:new THREE.Vector2()} },
  vertexShader:`varying vec3 vW; void main(){ vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`
    varying vec3 vW; uniform vec3 uAmber, uSignal; uniform float uTime; uniform vec2 uPlayer;
    float grid(vec2 p, float s, float w){ vec2 g=abs(fract(p/s-0.5)-0.5)/fwidth(p/s); return 1.0-min(min(g.x,g.y)/w,1.0); }
    void main(){
      vec2 p=vW.xz;
      float fine=grid(p,2.0,1.6)*0.16;
      float major=grid(p,10.0,1.2)*0.34;
      float d=length(p);
      float rings=smoothstep(0.06,0.0,abs(fract(d*0.1 - uTime*0.05)-0.5)-0.46)*0.10;
      float halo=exp(-length(p-uPlayer)*0.34)*0.42;
      float fade=1.0-smoothstep(12.0,44.0,d);
      vec3 col=uSignal*(fine+rings) + uAmber*(major*0.8+halo);
      float a=(fine+major+rings+halo)*fade;
      if(a<0.004) discard;
      gl_FragColor=vec4(col,a);
    }`
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200), floorMat);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

/* ============ lighting ============ */
scene.add(new THREE.AmbientLight(0x2A3E52, 1.5));
const key = new THREE.DirectionalLight(0x9fc4e0, 0.75); key.position.set(6,14,7); scene.add(key);
const core = new THREE.PointLight(AMBER, 90, 40, 2); core.position.set(0,6.2,0); scene.add(core);

/* ============ holo core ============ */
const coreGroup = new THREE.Group(); coreGroup.position.y = 6.2; scene.add(coreGroup);
const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45,2), new THREE.MeshBasicMaterial({ color:AMBER, wireframe:true, transparent:true, opacity:.42 }));
coreGroup.add(globe);
const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85,1), new THREE.MeshBasicMaterial({ color:SIGNAL, wireframe:true, transparent:true, opacity:.5 }));
coreGroup.add(shell);
const rings = [];
for (let i=0;i<3;i++){
  const r = new THREE.Mesh(new THREE.TorusGeometry(1.95+i*0.42, 0.012, 8, 128), new THREE.MeshBasicMaterial({ color: i===1?SIGNAL:AMBER, transparent:true, opacity:.55 }));
  r.rotation.set(Math.PI/2 + i*0.5, i*0.7, 0); coreGroup.add(r); rings.push(r);
}
// particle shell
{
  const N=300, pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){ const t=Math.acos(2*Math.random()-1), ph=Math.random()*Math.PI*2, r=2.6+Math.random()*1.1;
    pos[i*3]=r*Math.sin(t)*Math.cos(ph); pos[i*3+1]=r*Math.cos(t)*0.55; pos[i*3+2]=r*Math.sin(t)*Math.sin(ph); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(g,new THREE.PointsMaterial({ color:SIGNAL, size:.038, transparent:true, opacity:.6 }));
  coreGroup.add(pts); coreGroup.userData.pts=pts;
}

/* ============ label textures ============ */
function labelTexture(top, main){
  const c=document.createElement('canvas'); c.width=512; c.height=256;
  const x=c.getContext('2d');
  x.fillStyle='#0B1219'; x.fillRect(0,0,512,256);
  x.strokeStyle='#1C2C38'; x.lineWidth=4; x.strokeRect(8,8,496,240);
  for(let y=0;y<256;y+=4){ x.fillStyle='rgba(95,180,232,0.045)'; x.fillRect(0,y,512,2); }
  x.fillStyle='#F0A93B'; x.font='700 26px "JetBrains Mono", monospace'; x.textAlign='center';
  x.fillText(top, 256, 92);
  x.fillStyle='#8FA6B6'; x.font='400 20px "JetBrains Mono", monospace';
  x.fillText(main, 256, 142);
  x.fillStyle='#F0A93B'; x.fillRect(200,176,112,3);
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t;
}

/* ============ stations ============ */
const RADIUS = 17;
const stations = [];
const baseGeo = new THREE.BoxGeometry(2.9,0.55,1.7);
const bodyGeo = new THREE.BoxGeometry(2.6,1.5,1.2);

STATIONS.forEach((data, i) => {
  const a = (i / STATIONS.length) * Math.PI*2 - Math.PI/2;
  const g = new THREE.Group();
  g.position.set(Math.cos(a)*RADIUS, 0, Math.sin(a)*RADIUS);
  g.lookAt(0, 0, 0);

  const dark = new THREE.MeshStandardMaterial({ color:0x1A2733, roughness:.62, metalness:.42, emissive:new THREE.Color(0x0A1620), emissiveIntensity:.55 });
  const base = new THREE.Mesh(baseGeo, dark); base.position.y=.27; g.add(base);

  const screenMat = new THREE.MeshBasicMaterial({ map: labelTexture(String(i+1).padStart(2,'0'), data.short), transparent:true, opacity:.5 });
  let screen;

  if (data.kind === 'rack'){
    const rack = new THREE.Mesh(new THREE.BoxGeometry(2.4,4.2,1.1), dark); rack.position.y=2.1; g.add(rack);
    screen = new THREE.Mesh(new THREE.PlaneGeometry(2.0,1.0), screenMat);
    screen.position.set(0,2.9,.57); g.add(screen);
    for(let k=0;k<7;k++){
      const led=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.04), new THREE.MeshBasicMaterial({color: k%3?SIGNAL:AMBER, transparent:true, opacity:.8}));
      led.position.set(-.85+ (k%4)*.5, .7+Math.floor(k/4)*.3, .57); g.add(led);
    }
  } else if (data.kind === 'pillar'){
    const col = new THREE.Mesh(new THREE.CylinderGeometry(.85,1.05,3.4,12), dark); col.position.y=1.7; g.add(col);
    screen = new THREE.Mesh(new THREE.PlaneGeometry(1.7,.85), screenMat);
    screen.position.set(0,2.5,.9); g.add(screen);
  } else {
    const bod = new THREE.Mesh(bodyGeo, dark); bod.position.y=1.05; g.add(bod);
    screen = new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.05), screenMat);
    screen.position.set(0,1.75,.35); screen.rotation.x=-0.28; g.add(screen);
  }

  // glow edge + light cone
  const edge = new THREE.Mesh(new THREE.BoxGeometry(3.0,.05,1.8), new THREE.MeshBasicMaterial({ color:AMBER, transparent:true, opacity:.14 }));
  edge.position.y=.56; g.add(edge);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.9,5.2,16,1,true),
    new THREE.MeshBasicMaterial({ color:AMBER, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
  cone.position.y=4.6; g.add(cone);
  const lamp = new THREE.PointLight(AMBER, 0, 12, 2); lamp.position.set(0,3,1); g.add(lamp);

  scene.add(g);
  stations.push({ data, group:g, screenMat, edge, cone, lamp, active:0, pos:new THREE.Vector3(g.position.x,0,g.position.z), visited:false });
});

/* ============ avatar ============ */
const avatar = new THREE.Group(); scene.add(avatar);
{
  const bodyM = new THREE.MeshStandardMaterial({ color:0x1B2A36, roughness:.4, metalness:.6, emissive:new THREE.Color(AMBER), emissiveIntensity:.32 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.36,.62,4,12), bodyM); torso.position.y=.86; avatar.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.23,16,12), new THREE.MeshBasicMaterial({color:AMBER})); head.position.y=1.56; avatar.add(head);
  const visor = new THREE.Mesh(new THREE.TorusGeometry(.34,.035,8,24), new THREE.MeshBasicMaterial({color:SIGNAL,transparent:true,opacity:.9}));
  visor.rotation.x=Math.PI/2; visor.position.y=1.56; avatar.add(visor);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.55,.72,32), new THREE.MeshBasicMaterial({color:AMBER,transparent:true,opacity:.34,side:THREE.DoubleSide}));
  halo.rotation.x=-Math.PI/2; halo.position.y=.03; avatar.add(halo);
  avatar.userData = { halo, head };
  const l = new THREE.PointLight(AMBER, 14, 9, 2); l.position.y=1.3; avatar.add(l);
}
avatar.position.set(0,0,3.8); avatar.rotation.y=Math.PI;

/* ============ composer ============ */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1,1), isTouch?0.55:0.85, 0.75, 0.2);
if (!isTouch) composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize(){
  const w=innerWidth, h=innerHeight;
  renderer.setSize(w,h,false); composer.setSize(w,h);
  camera.aspect=w/h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

/* ============ input ============ */
const keysDown = Object.create(null);
const move = new THREE.Vector2();
addEventListener('keydown', e=>{
  const k=e.key.toLowerCase();
  if (k==='r'){ e.preventDefault(); toggleRec(true); return; }
  if (k==='escape'){ toggleRec(false); closeDossier(); return; }
  if (k==='t'){ e.preventDefault(); startTour(); return; }
  if (k==='e'||k===' '){ if(nearest){ e.preventDefault(); openDossier(nearest); } return; }
  keysDown[k]=true;
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
});
addEventListener('keyup', e=>{ keysDown[e.key.toLowerCase()]=false; });

// joystick
const stick=document.getElementById('stick'), nub=document.getElementById('stickNub');
let stickId=null;
stick.addEventListener('pointerdown', e=>{ stickId=e.pointerId; stick.setPointerCapture(stickId); });
stick.addEventListener('pointermove', e=>{
  if(e.pointerId!==stickId) return;
  const r=stick.getBoundingClientRect();
  let dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
  const d=Math.hypot(dx,dy), max=r.width/2-22;
  if(d>max){ dx=dx/d*max; dy=dy/d*max; }
  nub.style.transform=`translate(${dx}px,${dy}px)`;
  move.set(dx/max, dy/max);
});
const endStick=()=>{ stickId=null; move.set(0,0); nub.style.transform=''; };
stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);

/* ============ UI ============ */
const idx=document.getElementById('index');
STATIONS.forEach((s,i)=>{
  const b=document.createElement('button');
  b.className='inode'; b.dataset.id=s.id;
  b.innerHTML=`<i></i>${String(i+1).padStart(2,'0')} ${s.short}`;
  b.addEventListener('click',()=>{ travelTo(i); });
  idx.appendChild(b);
});
const inodes=[...idx.querySelectorAll('.inode')];
document.getElementById('tTotal').textContent=STATIONS.length;

const dossier=document.getElementById('dossier'), promptEl=document.getElementById('prompt');
let openStation=null;
function openDossier(st){
  openStation=st;
  document.getElementById('dTag').textContent=st.data.tag;
  document.getElementById('dTitle').textContent=st.data.title;
  document.getElementById('dMeta').textContent=st.data.meta;
  document.getElementById('dBody').innerHTML=st.data.body;
  dossier.classList.add('open'); dossier.setAttribute('aria-hidden','false');
  if(!st.visited){ st.visited=true; document.getElementById('tVisit').textContent=stations.filter(s=>s.visited).length; }
}
function closeDossier(){ openStation=null; dossier.classList.remove('open'); dossier.setAttribute('aria-hidden','true'); }
document.getElementById('dClose').addEventListener('click',closeDossier);

const rec=document.getElementById('rec');
function toggleRec(on){
  rec.classList.toggle('open',on); rec.setAttribute('aria-hidden',String(!on));
  document.body.classList.toggle('reading',on);
  document.body.style.overflow = on ? 'auto' : 'hidden';
  if(on) rec.scrollTop=0;
}
document.getElementById('recOpen').addEventListener('click',()=>toggleRec(true));
document.getElementById('recClose').addEventListener('click',()=>toggleRec(false));

/* travel / tour */
let travelTarget=null, tourIdx=-1, tourTimer=0;
function travelTo(i){
  const st=stations[i];
  travelTarget=st.pos.clone().multiplyScalar(0.80);
  closeDossier();
}
document.getElementById('tourBtn').addEventListener('click',startTour);
function startTour(){ tourIdx=0; tourTimer=0; travelTo(0); }

/* ============ loop ============ */
const clock=new THREE.Clock();
let nearest=null, fpsAcc=0, fpsN=0, fpsT=0;
const camGoal=new THREE.Vector3(), tmp=new THREE.Vector3();
const heading=new THREE.Vector3(0,0,-1);

function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),0.05), t=clock.elapsedTime;

  // --- movement
  let ix=0, iz=0;
  if(keysDown['w']||keysDown['arrowup']) iz-=1;
  if(keysDown['s']||keysDown['arrowdown']) iz+=1;
  if(keysDown['a']||keysDown['arrowleft']) ix-=1;
  if(keysDown['d']||keysDown['arrowright']) ix+=1;
  if(move.lengthSq()>0.02){ ix+=move.x; iz+=move.y; }

  const manual = ix!==0||iz!==0;
  if(manual) travelTarget=null;

  if(travelTarget){
    tmp.subVectors(travelTarget, avatar.position);
    if(tmp.length()<0.6) travelTarget=null; else { tmp.normalize(); ix=tmp.x; iz=tmp.z; }
  }

  const speed=7.4;
  if(ix||iz){
    const len=Math.hypot(ix,iz)||1;
    avatar.position.x+=(ix/len)*speed*dt;
    avatar.position.z+=(iz/len)*speed*dt;
    heading.set(ix/len,0,iz/len);
    const bound=RADIUS+3.5;
    const d=Math.hypot(avatar.position.x,avatar.position.z);
    if(d>bound){ avatar.position.x*=bound/d; avatar.position.z*=bound/d; }
  }
  const want=Math.atan2(heading.x,heading.z);
  let diff=want-avatar.rotation.y;
  while(diff>Math.PI) diff-=Math.PI*2; while(diff<-Math.PI) diff+=Math.PI*2;
  avatar.rotation.y+=diff*Math.min(1,dt*9);
  avatar.userData.halo.rotation.z+=dt*0.8;
  avatar.userData.head.position.y=1.56+Math.sin(t*2.2)*0.022;

  // --- tour
  if(tourIdx>=0 && !travelTarget){
    tourTimer+=dt;
    if(tourTimer>0.35 && !dossier.classList.contains('open')) openDossier(stations[tourIdx]);
    if(tourTimer>3.6){
      tourIdx++; tourTimer=0; closeDossier();
      if(tourIdx>=stations.length){ tourIdx=-1; } else travelTo(tourIdx);
    }
  }

  // --- proximity
  nearest=null; let best=5.6;
  for(const st of stations){
    const d=st.pos.distanceTo(avatar.position);
    const target=d<6.0?1:0;
    st.active+=(target-st.active)*Math.min(1,dt*5);
    st.screenMat.opacity=0.5+st.active*0.5;
    st.edge.material.opacity=0.14+st.active*0.55;
    st.cone.material.opacity=st.active*0.055;
    st.lamp.intensity=st.active*26;
    st.group.position.y=Math.sin(t*1.4+st.pos.x)*0.03*st.active;
    if(d<best){ best=d; nearest=st; }
  }
  inodes.forEach((n,i)=>n.classList.toggle('on', stations[i].active>0.5));

  if(nearest && !dossier.classList.contains('open') && tourIdx<0){
    promptEl.textContent=`${nearest.data.short} — press E to access`;
    promptEl.classList.add('show');
  } else promptEl.classList.remove('show');

  // --- core
  if(!reduced){
    coreGroup.rotation.y+=dt*0.16;
    globe.rotation.y-=dt*0.22; globe.rotation.x+=dt*0.05;
    shell.rotation.y+=dt*0.5; shell.rotation.z-=dt*0.3;
    rings[0].rotation.z+=dt*0.28; rings[1].rotation.x+=dt*0.2; rings[2].rotation.y+=dt*0.34;
    coreGroup.userData.pts.rotation.y-=dt*0.08;
    coreGroup.position.y=6.2+Math.sin(t*0.8)*0.12;
  }
  core.intensity=90+Math.sin(t*2.1)*14;
  floorMat.uniforms.uTime.value=t;
  floorMat.uniforms.uPlayer.value.set(avatar.position.x, avatar.position.z);

  // --- camera
  camGoal.set(
    avatar.position.x - Math.sin(avatar.rotation.y)*11.5,
    5.6,
    avatar.position.z - Math.cos(avatar.rotation.y)*11.5
  );
  camera.position.lerp(camGoal, Math.min(1,dt*2.4));
  tmp.set(
    avatar.position.x + Math.sin(avatar.rotation.y)*4.0,
    2.9,
    avatar.position.z + Math.cos(avatar.rotation.y)*4.0
  );
  camera.lookAt(tmp);

  composer.render();

  // --- fps
  fpsAcc+=1; fpsT+=dt;
  if(fpsT>=0.5){ document.getElementById('tFps').textContent=Math.round(fpsAcc/fpsT); fpsAcc=0; fpsT=0; }
  fpsN++;
}
requestAnimationFrame(frame);

/* ============ boot ============ */
const bootLines=['init renderer ......... <b>ok</b>','load station graph .... <b>9 nodes</b>','link telemetry ........ <b>ok</b>','agent online .......... <b>ready</b>'];
const bootIn=document.getElementById('bootIn');
bootLines.forEach((l,i)=>{
  const d=document.createElement('div'); d.className='ln'; d.innerHTML=l;
  d.style.animationDelay=(i*0.3)+'s'; bootIn.insertBefore(d, bootIn.firstChild);
});
setTimeout(()=>document.getElementById('boot').classList.add('done'), reduced?300:2000);
if(isTouch) document.getElementById('tHint').textContent='Drag the pad to move · tap a station to access';
