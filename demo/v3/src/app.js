import * as THREE from 'three';

/* ================= record ================= */
var CAPS = [
  {n:'RAG & retrieval',            t:['rag','nlp'],        d:'LangChain, embeddings, vector databases (FAISS / Chroma), semantic search, context engineering'},
  {n:'Agentic AI & MCP',           t:['agents'],           d:'Model Context Protocol, A2A interaction patterns, tool use, function calling, multi-agent orchestration and pipelines'},
  {n:'Quantization & inference',   t:['quant','edge'],     d:'GPTQ, AWQ, GGUF, inference optimization, edge AI deployment'},
  {n:'Evaluation & benchmarking',  t:['eval'],             d:'Retrieval quality, output accuracy and latency measured across model versions before release'},
  {n:'Fine-tuning & transformers', t:['quant','nlp'],      d:'LLM fine-tuning, transformers, TensorFlow, PyTorch, prompt engineering'},
  {n:'LLMOps & deployment',        t:['llmops'],           d:'Docker, Kubernetes, CI/CD, model deployment and monitoring, FastAPI, REST APIs'},
  {n:'Cloud platforms',            t:['llmops'],           d:'GCP, AWS, AWS Bedrock, Genkit, ADK'},
  {n:'NLP',                        t:['nlp'],              d:'Intent detection, classifiers, embeddings, semantic search'},
  {n:'Languages & ML core',        t:['nlp','data'],       d:'Python, SQL, machine learning, deep learning'},
  {n:'Data & analytics',           t:['data'],             d:'MySQL, MongoDB, Power BI, Tableau, feature engineering, data pipelines'}
];

var INTENTS = [
  {id:'rag',    label:'RAG / retrieval',        w:{rag:1,nlp:.62,eval:.5,llmops:.32,agents:.3,data:.2,quant:.15,edge:.1}},
  {id:'agents', label:'Agentic AI / MCP',       w:{agents:1,rag:.5,eval:.45,llmops:.35,nlp:.3,quant:.15,data:.12,edge:.1}},
  {id:'opt',    label:'LLM optimisation / edge',w:{quant:1,edge:.95,eval:.6,nlp:.35,llmops:.35,rag:.15,data:.1,agents:.1}},
  {id:'llmops', label:'LLMOps / deployment',    w:{llmops:1,eval:.55,quant:.42,rag:.3,agents:.3,data:.25,edge:.3,nlp:.2}},
  {id:'all',    label:'Everything',             w:{rag:.8,agents:.8,quant:.8,eval:.8,llmops:.8,nlp:.8,data:.8,edge:.8}}
];

var EVALS = [
  {b:'Retrieval relevance',   s:'RAG architecture vs keyword baseline',        r:'+30%',  w:'AiGenthix',      t:['rag','eval']},
  {b:'Manual effort',         s:'Multi-agent workflows, A2A + MCP',            r:'−40%',  w:'AiGenthix',      t:['agents']},
  {b:'Systems in production', s:'Chatbots, interviewer, receptionist, automation', r:'5+', w:'AiGenthix',     t:['llmops','agents']},
  {b:'Response turnaround',   s:'NLP email pipeline with intent detection',    r:'−50%',  w:'Reliance Jio',   t:['nlp']},
  {b:'Inference latency',     s:'Transformer LLMs fine-tuned for edge',        r:'−35%',  w:'Reliance Jio',   t:['quant','edge']},
  {b:'Cloud dependency',      s:'Edge deployment',                             r:'−40%',  w:'Reliance Jio',   t:['edge','llmops']},
  {b:'Memory footprint',      s:'GPTQ / AWQ on constrained hardware',          r:'−45%',  w:'Reliance Jio',   t:['quant','edge']},
  {b:'Accuracy retained',     s:'At −45% memory',                              r:'>95%',  w:'Reliance Jio',   t:['quant','eval']},
  {b:'Memory footprint',      s:'PTQ on Qwen-3, LLaMA-3.2, GPT-2',             r:'−40%',  w:'IEEE ICIICS-2026', t:['quant','eval']},
  {b:'Inference speed',       s:'Same study',                                  r:'+30%',  w:'IEEE ICIICS-2026', t:['quant']},
  {b:'Accuracy degradation',  s:'Same study',                                  r:'<2%',   w:'IEEE ICIICS-2026', t:['quant','eval']},
  {b:'Teacher preparation',   s:'Sahayak AI, multi-agent education platform',  r:'−60%',  w:'Agentic AI Day', t:['agents']},
  {b:'Agentic AI Day 2025',   s:'National, Google Cloud × Hack2Skill',         r:'2nd',   w:'Award',          t:['agents']}
];

var CKPTS = [
  {s:'2019',        t:'Training begins',      d:'B.E. Electronics & Communication, Sapthagiri College'},
  {s:'2023',        t:'Base complete',        d:'Electronics degree finished; constraint as a first principle'},
  {s:'2023–2025',   t:'Fine-tune',            d:'MBA Data Analytics & Marketing, IFIM College'},
  {s:'Mar 2025',    t:'Reliance Jio',         d:'Edge deployment and GPTQ / AWQ quantization'},
  {s:'Jul 2025',    t:'AiGenthix',            d:'Production LLM systems, RAG and multi-agent workflows'},
  {s:'2026',        t:'Published',            d:'IEEE ICIICS-2026, post-training quantization'}
];

var CHIPS = ['llm','generative-ai','rag','agentic-ai','mcp','quantization','gptq','awq','llmops','pytorch','langchain','ieee'];
var CHIP_TAG = {llm:'nlp','generative-ai':'nlp',rag:'rag','agentic-ai':'agents',mcp:'agents',quantization:'quant',gptq:'quant',awq:'quant',llmops:'llmops',pytorch:'nlp',langchain:'rag',ieee:'quant'};

var $ = function(id){ return document.getElementById(id); };
var state = { intent:'all' };

/* ================= attention ================= */
function scoreOf(tags, w){
  var s = 0;
  for (var i=0;i<tags.length;i++) s = Math.max(s, w[tags[i]] || 0);
  return s;
}

function renderChips(){
  var w = INTENTS.filter(function(x){return x.id===state.intent;})[0].w;
  $('chips').innerHTML = CHIPS.map(function(c){
    var hot = (w[CHIP_TAG[c]] || 0) >= 0.85 && state.intent !== 'all';
    return '<span class="chip'+(hot?' hl':'')+'">'+c+'</span>';
  }).join('');
}

function renderAttention(){
  var intent = INTENTS.filter(function(x){return x.id===state.intent;})[0];
  var rows = CAPS.map(function(c){ return { c:c, s:scoreOf(c.t, intent.w) }; });
  rows.sort(function(a,b){ return b.s - a.s; });

  $('attn').innerHTML = rows.map(function(r){
    var pct = Math.round(r.s*100);
    return '<div class="arow'+(r.s<0.4?' dim':'')+'">'
      + '<span class="n">'+r.c.n+'</span>'
      + '<span class="t"><i style="width:'+pct+'%"></i></span>'
      + '<span class="s">'+ (r.s).toFixed(2) +'</span></div>';
  }).join('');

  var top = rows.slice(0,3).map(function(r){ return r.c.n; }).join(' · ');
  $('attnFt').textContent = state.intent === 'all'
    ? 'No query set — showing the full record, unweighted.'
    : 'Highest attention: ' + top;

  // capabilities table follows the same order
  $('capBody').innerHTML = rows.map(function(r){
    return '<tr'+(r.s>=0.85 && state.intent!=='all' ? ' class="hl"' : '')+'>'
      + '<td style="color:var(--ink);white-space:nowrap">'+r.c.n+'</td><td>'+r.c.d+'</td></tr>';
  }).join('');

  // evaluations reorder and highlight
  var ev = EVALS.map(function(e){ return { e:e, s:scoreOf(e.t, intent.w) }; });
  if (state.intent !== 'all') ev.sort(function(a,b){ return b.s - a.s; });
  $('evalBody').innerHTML = ev.map(function(x){
    var e = x.e, hot = x.s >= 0.85 && state.intent !== 'all';
    return '<tr'+(hot?' class="hl"':'')+'>'
      + '<td style="color:var(--ink)">'+e.b+'</td><td>'+e.s+'</td>'
      + '<td class="num good">'+e.r+'</td><td style="color:var(--faint)">'+e.w+'</td></tr>';
  }).join('');

  renderChips();
}

function renderPicker(){
  $('picker').innerHTML = INTENTS.map(function(i){
    return '<button type="button" data-i="'+i.id+'" aria-pressed="'+(i.id===state.intent)+'">'+i.label+'</button>';
  }).join('');
  Array.prototype.forEach.call($('picker').children, function(b){
    b.addEventListener('click', function(){
      state.intent = b.dataset.i;
      renderPicker(); renderAttention();
    });
  });
}

/* ================= loss landscape ================= */
var VIRIDIS = [
  [0.267,0.005,0.329],[0.229,0.322,0.545],[0.128,0.567,0.551],[0.369,0.789,0.383],[0.993,0.906,0.144]
];
function viridis(t){
  t = Math.min(1, Math.max(0, t));
  var f = t*(VIRIDIS.length-1), i = Math.floor(f), k = f-i;
  var a = VIRIDIS[i], b = VIRIDIS[Math.min(i+1, VIRIDIS.length-1)];
  return [a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k];
}

// the surface: a high plateau falling to a single minimum, with structure on the way
function lossAt(x, z){
  var plateau = 2.5 * Math.exp(-((x+4.6)*(x+4.6) + (z+4.6)*(z+4.6)) / 26);
  var well    = 2.15 * Math.exp(-((x-3.4)*(x-3.4) + (z-3.4)*(z-3.4)) / 7);
  var ridges  = 0.34 * Math.sin(x*0.82) * Math.cos(z*0.78);
  var tilt    = -0.085 * (x + z);
  return 1.75 + plateau + ridges + tilt - well;
}

function buildLandscape(el){
  var renderer;
  try { 
    var cv = document.createElement('canvas');
    el.insertBefore(cv, el.firstChild);
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  } catch(e){ return null; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  var pivot = new THREE.Group(); scene.add(pivot);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9096, 2.0));
  var d1 = new THREE.DirectionalLight(0xffffff, 1.35); d1.position.set(7,12,5); scene.add(d1);
  var d2 = new THREE.DirectionalLight(0xffffff, 0.45); d2.position.set(-8,5,-6); scene.add(d2);

  var SIZE = 12, SEG = 96;
  var geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI/2);
  var pos = geo.attributes.position, colors = new Float32Array(pos.count*3);
  var lo = Infinity, hi = -Infinity, hts = new Float32Array(pos.count);
  for (var i=0;i<pos.count;i++){
    var h = lossAt(pos.getX(i), pos.getZ(i));
    hts[i] = h; if (h<lo) lo=h; if (h>hi) hi=h;
  }
  for (var j=0;j<pos.count;j++){
    pos.setY(j, hts[j]);
    var c = viridis((hts[j]-lo)/(hi-lo));
    colors[j*3]=c[0]; colors[j*3+1]=c[1]; colors[j*3+2]=c[2];
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();
  var surf = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors:true, roughness:0.82, metalness:0.0, flatShading:false
  }));
  pivot.add(surf);

  var wire = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color:0x000000, wireframe:true, transparent:true, opacity:0.055
  }));
  wire.position.y = 0.012; pivot.add(wire);

  // optimisation path
  var P0 = new THREE.Vector2(-4.7,-4.7), P1 = new THREE.Vector2(3.4,3.4);
  function pathPoint(t){
    var x = P0.x + (P1.x-P0.x)*t + Math.sin(t*Math.PI*1.9)*1.5;
    var z = P0.y + (P1.y-P0.y)*t - Math.sin(t*Math.PI*1.35)*1.0;
    return new THREE.Vector3(x, lossAt(x,z)+0.10, z);
  }
  var pts=[]; for (var s=0;s<=160;s++) pts.push(pathPoint(s/160));
  var pathLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:0.95 })
  );
  pivot.add(pathLine);
  var pathLine2 = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts.map(function(p){ return new THREE.Vector3(p.x,p.y-0.035,p.z); })),
    new THREE.LineBasicMaterial({ color:0x000000, transparent:true, opacity:0.35 })
  );
  pivot.add(pathLine2);

  var TS = [0, 0.22, 0.42, 0.64, 0.84, 1.0];
  var markers = TS.map(function(t){
    var p = pathPoint(t);
    var g = new THREE.Group(); g.position.copy(p);
    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16),
      new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.35, emissive:0x223355, emissiveIntensity:0.25 }));
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.33, 28),
      new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0.0, side:THREE.DoubleSide }));
    ring.rotation.x = -Math.PI/2;
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.55,6),
      new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.3 }));
    stem.position.y = -0.3;
    g.add(ball); g.add(ring); g.add(stem); pivot.add(g);
    return { g:g, ball:ball, ring:ring };
  });

  camera.position.set(15.5, 11.2, 17.0);
  camera.lookAt(0, 0.55, 0);

  var spin = -0.55, vel = 0, dragging = false, lastX = 0, active = -1;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv2 = renderer.domElement;
  cv2.addEventListener('pointerdown', function(e){ dragging=true; lastX=e.clientX; cv2.setPointerCapture(e.pointerId); });
  cv2.addEventListener('pointermove', function(e){
    if(!dragging) return;
    var dx = e.clientX-lastX; lastX = e.clientX; spin += dx*0.008; vel = dx*0.008;
  });
  function stop(){ dragging=false; }
  cv2.addEventListener('pointerup', stop); cv2.addEventListener('pointercancel', stop);

  function resize(){
    var w = el.clientWidth, h = el.clientHeight;
    if(!w||!h) return;
    renderer.setSize(w,h,false); camera.aspect=w/h;
    camera.fov = w/h < 1.5 ? 40 : 32;
    camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(el);
  window.addEventListener('resize', resize);
  resize();

  var clock = new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if(!dragging){
      if (Math.abs(vel) > 0.0002){ spin += vel; vel *= 0.93; }
      else if (!reduced) spin += dt*0.085;
    }
    pivot.rotation.y = spin;
    markers.forEach(function(m,i){
      var on = i===active;
      m.ring.material.opacity = on ? 0.55 + Math.sin(t*3.4)*0.3 : 0;
      m.ring.scale.setScalar(on ? 1 + Math.sin(t*3.4)*0.16 : 1);
      m.ball.scale.setScalar(on ? 1.5 : 1);
    });
    renderer.render(scene,camera);
  })();

  return { focus:function(i){ active = i; } };
}

/* ================= boot ================= */
renderPicker();
renderAttention();

var land = null;
try { land = buildLandscape($('landscape')); } catch(e){ land = null; }
if (!land) { $('landscape').hidden = true; }

$('ckpts').innerHTML = CKPTS.map(function(c,i){
  return '<button class="ck" type="button" data-i="'+i+'"><div class="s">'+c.s+'</div>'
    + '<div class="t">'+c.t+'</div><div class="d">'+c.d+'</div></button>';
}).join('');
Array.prototype.forEach.call($('ckpts').children, function(b){
  function pick(){
    var i = +b.dataset.i;
    Array.prototype.forEach.call($('ckpts').children, function(o){ o.classList.toggle('on', o===b); });
    if (land) land.focus(i);
  }
  b.addEventListener('mouseenter', pick);
  b.addEventListener('focus', pick);
  b.addEventListener('click', pick);
});

/* tab spy */
var links = Array.prototype.slice.call(document.querySelectorAll('#tabs a'));
var secs = links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
if ('IntersectionObserver' in window){
  var io = new IntersectionObserver(function(es){
    es.forEach(function(en){
      if(!en.isIntersecting) return;
      var i = secs.indexOf(en.target); if(i<0) return;
      links.forEach(function(l,j){ l.classList.toggle('on', i===j); });
    });
  }, {rootMargin:'-12% 0px -72% 0px'});
  secs.forEach(function(s){ if(s) io.observe(s); });
}
