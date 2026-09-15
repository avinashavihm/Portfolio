import { createViz } from './viz.js';

(function(){

  "use strict";
  // ---- model configs (public architecture specs) ----
  var MODELS = [
    {id:'qwen3-8b',   name:'Qwen3-8B',        P:8.2e9,  L:36, KV:8,  D:128, note:'GQA 32→8'},
    {id:'qwen3-4b',   name:'Qwen3-4B',        P:4.02e9, L:36, KV:8,  D:128, note:'GQA 32→8'},
    {id:'llama32-3b', name:'Llama-3.2-3B',    P:3.21e9, L:28, KV:8,  D:128, note:'GQA 24→8'},
    {id:'llama32-1b', name:'Llama-3.2-1B',    P:1.24e9, L:16, KV:8,  D:64,  note:'GQA 32→8'},
    {id:'llama31-8b', name:'Llama-3.1-8B',    P:8.03e9, L:32, KV:8,  D:128, note:'GQA 32→8'},
    {id:'mistral-7b', name:'Mistral-7B-v0.3', P:7.25e9, L:32, KV:8,  D:128, note:'GQA 32→8'},
    {id:'gpt2',       name:'GPT-2 (124M)',    P:0.124e9,L:12, KV:12, D:64,  note:'MHA, no GQA'}
  ];
  // bits/param incl. group scales+zeros at g=128; acc delta and decode speedup are planning estimates
  var QUANTS = [
    {id:'fp16', name:'FP16',  bits:16,    kvb:2, acc:0,    spd:1.00},
    {id:'int8', name:'INT8',  bits:8.13,  kvb:1, acc:-0.3, spd:1.12},
    {id:'gptq', name:'GPTQ4', bits:4.25,  kvb:1, acc:-1.8, spd:1.30},
    {id:'awq',  name:'AWQ4',  bits:4.25,  kvb:1, acc:-1.5, spd:1.32},
    {id:'gguf', name:'Q4_K_M',bits:4.83,  kvb:1, acc:-1.2, spd:1.24}
  ];
  var GPUS = [
    {id:'t4',    name:'NVIDIA T4 · 16 GB',           vram:16},
    {id:'l4',    name:'NVIDIA L4 · 24 GB',           vram:24},
    {id:'4090',  name:'RTX 4090 · 24 GB',            vram:24},
    {id:'4060',  name:'RTX 4060 Ti · 16 GB',         vram:16},
    {id:'a100',  name:'A100 · 40 GB',                vram:40},
    {id:'a100-80',name:'A100 · 80 GB',               vram:80},
    {id:'orin',  name:'Jetson AGX Orin · 32 GB',     vram:32},
    {id:'orin16',name:'Jetson Orin NX · 16 GB',      vram:16},
    {id:'m3',    name:'Apple M3 Pro · 18 GB unified',vram:18}
  ];
  var CTX = [1024, 2048, 4096, 8192, 16384, 32768, 131072];
  var GB = 1024*1024*1024;
  var OVERHEAD = 0.12;

  var state = {model:'qwen3-8b', quant:'gptq', ctxIdx:2, batch:1, gpu:'4090'};

  var $ = function(id){ return document.getElementById(id); };

  var viz = null;
  try {
    var vizEl = document.getElementById('viz');
    if (vizEl) viz = createViz(vizEl);
  } catch (e) { viz = null; }
  if (viz) {
    document.getElementById('flatbar').hidden = true;
  } else {
    var ve = document.getElementById('viz');
    if (ve) ve.hidden = true;
  }
  function fmtGB(b){ var g=b/GB; return g<0.1 ? (b/(1024*1024)).toFixed(0)+' MB' : g.toFixed(g<10?2:1)+' GB'; }
  function commas(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  // build controls
  var msel=$('model');
  MODELS.forEach(function(m){ var o=document.createElement('option'); o.value=m.id; o.textContent=m.name; msel.appendChild(o); });
  msel.value=state.model;
  var gsel=$('gpu');
  GPUS.forEach(function(g){ var o=document.createElement('option'); o.value=g.id; o.textContent=g.name; gsel.appendChild(o); });
  gsel.value=state.gpu;
  var qwrap=$('quant');
  QUANTS.forEach(function(q){
    var b=document.createElement('button'); b.type='button'; b.textContent=q.name;
    b.setAttribute('aria-pressed', String(q.id===state.quant)); b.dataset.q=q.id;
    b.addEventListener('click', function(){ state.quant=q.id; syncQuant(); compute(); });
    qwrap.appendChild(b);
  });
  function syncQuant(){
    Array.prototype.forEach.call(qwrap.children, function(b){
      b.setAttribute('aria-pressed', String(b.dataset.q===state.quant));
    });
  }

  msel.addEventListener('change', function(){ state.model=msel.value; compute(); });
  gsel.addEventListener('change', function(){ state.gpu=gsel.value; compute(); });
  $('ctx').addEventListener('input', function(e){ state.ctxIdx=+e.target.value; compute(); });
  $('batch').addEventListener('input', function(e){ state.batch=+e.target.value; compute(); });

  function compute(){
    var m = MODELS.filter(function(x){return x.id===state.model;})[0];
    var q = QUANTS.filter(function(x){return x.id===state.quant;})[0];
    var g = GPUS.filter(function(x){return x.id===state.gpu;})[0];
    var ctx = CTX[state.ctxIdx], batch = state.batch;

    var wBytes  = m.P * (q.bits/8);
    var kvBytes = 2 * m.L * m.KV * m.D * ctx * batch * q.kvb;
    var base    = wBytes + kvBytes;
    var ovBytes = base * OVERHEAD;
    var total   = base + ovBytes;

    var fp16 = QUANTS[0];
    var fp16Total = (m.P*(fp16.bits/8) + 2*m.L*m.KV*m.D*ctx*batch*fp16.kvb) * (1+OVERHEAD);
    var saved = (1 - total/fp16Total) * 100;

    var cap = g.vram * GB;
    var scale = Math.max(total, cap) * 1.02;

    $('bW').style.width  = (wBytes/scale*100) + '%';
    $('bKv').style.width = ((wBytes+kvBytes)/scale*100) + '%';
    $('bOv').style.width = (total/scale*100) + '%';
    $('capLine').style.left = Math.min(100, cap/scale*100) + '%';

    $('totalTxt').textContent = fmtGB(total);
    var t2=$('totalTxt2'); if(t2) t2.textContent = fmtGB(total) + ' of ' + g.vram + ' GB';
    $('mW').textContent   = fmtGB(wBytes);
    $('nW').textContent   = (q.bits).toFixed(2) + ' bits/param';
    $('mKv').textContent  = fmtGB(kvBytes);
    $('nKv').textContent  = commas(ctx) + ' tok × ' + batch;
    $('mTot').textContent = fmtGB(total);
    $('nTot').textContent = 'incl. 12% overhead';
    $('mSave').textContent= (saved<=0.05 ? '—' : '−' + saved.toFixed(0) + '%');
    $('mAcc').textContent = (q.acc===0 ? 'baseline' : q.acc.toFixed(1) + '%');
    $('mSpd').textContent = q.spd.toFixed(2) + '×';

    $('ctxv').textContent  = commas(ctx);
    $('batchv').textContent= batch;
    $('cfgline').textContent = m.name + ' · ' + q.name + ' · ' + m.note;

    if (viz) viz.update({
      weights: wBytes, kv: kvBytes, overhead: ovBytes,
      total: total, cap: cap, layers: m.L
    });

    var v = $('verdict'), head = g.name.split(' · ')[0];
    if (total <= cap){
      var free = cap - total;
      v.className = 'verdict';
      v.innerHTML = '<b>Fits.</b> ' + fmtGB(free) + ' headroom on ' + head +
        ' — room for about ' + Math.max(0, Math.floor(free / (kvBytes/batch))) + ' more concurrent requests at this context.';
    } else {
      v.className = 'verdict no';
      v.innerHTML = '<b>Does not fit.</b> Over by ' + fmtGB(total - cap) + ' on ' + head +
        '. Drop to a lower precision, shorten the context, or reduce concurrency.';
    }
  }

  // scroll-spy
  var links = Array.prototype.slice.call(document.querySelectorAll('#nav a'));
  var secs  = links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        var i = secs.indexOf(en.target);
        if(i<0) return;
        links.forEach(function(l,j){ l.classList.toggle('on', i===j); });
      });
    }, {rootMargin:'-15% 0px -70% 0px'});
    secs.forEach(function(s){ if(s) io.observe(s); });
  }

  compute();
})();
