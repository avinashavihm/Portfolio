import { createHead3D } from './head3d.js';
import { schedule, createPlayer } from './visemes.js';
import { createVoice, createEars } from './speech.js';
import { ask } from './brain.js';
import { PROFILE, SUGGESTIONS } from './corpus.js';

var $ = function(s){ return document.querySelector(s); };
var stage = $('#stage');

var face = createHead3D(stage);
if (!face) { $('#nowebgl').hidden = false; }
else face.setPortrait(window.PORTRAIT_URL || 'assets/portrait.jpg');

var voice  = createVoice();
var ears   = createEars();
var player = createPlayer(function(weights, done){
  if (!face) return;
  if (done) face.rest(); else face.setVisemes(weights);
});

var transcript = $('#transcript');
var busy = false;

function bubble(who, text, src){
  var el = document.createElement('div');
  el.className = 'turn ' + who;
  el.innerHTML = '<div class="say"></div>' + (src ? '<div class="src"></div>' : '');
  el.querySelector('.say').textContent = text;
  if (src) el.querySelector('.src').textContent = src;
  transcript.appendChild(el);
  transcript.scrollTop = transcript.scrollHeight;
  return el;
}

function answer(question){
  if (busy) return;
  busy = true;
  $('#mic').setAttribute('aria-pressed','false');
  bubble('them', question);

  var res = ask(question);
  setStatus('speaking');
  var el = bubble('him', res.text, res.src);

  var sched = schedule(res.text, { rate: voice.rate });
  player.start(sched);

  voice.speak(res.text,
    function(ci){ player.anchor(ci); },
    function(){ player.stop(); if (face) face.rest(); busy = false; setStatus('idle'); });

  // if speech synthesis is unavailable the visemes still play out
  if (!voice.available){
    setTimeout(function(){ player.stop(); if(face) face.rest(); busy=false; setStatus('idle'); },
      sched.total*1000 + 200);
  }
  el.scrollIntoView({ block:'nearest' });
}

function setStatus(s){
  $('#status').textContent = s === 'speaking' ? 'speaking' : s === 'listening' ? 'listening' : 'ready';
  var dot = $('#dot');
  if (dot) dot.className = s === 'speaking' ? 'on' : s === 'listening' ? 'hot' : '';
}

/* suggestions */
SUGGESTIONS.forEach(function(q){
  var b = document.createElement('button');
  b.className = 'chip'; b.type = 'button'; b.textContent = q;
  b.addEventListener('click', function(){ answer(q); });
  $('#suggest').appendChild(b);
});

/* typed input is a first-class path, not a fallback */
$('#form').addEventListener('submit', function(e){
  e.preventDefault();
  var v = $('#q').value.trim();
  if (!v) return;
  $('#q').value = '';
  answer(v);
});

/* mic */
var micOn = false;
if (!ears.available){ $('#mic').disabled = true; $('#mic').title = 'Speech recognition needs Chrome or Edge'; }
else {
  ears.on('interim', function(t){ $('#q').value = t; })
      .on('final', function(t){ $('#q').value = ''; answer(t); })
      .on('end', function(){ micOn = false; $('#mic').setAttribute('aria-pressed','false');
        if (!busy) setStatus('idle'); })
      .on('error', function(){ micOn = false; $('#mic').setAttribute('aria-pressed','false'); setStatus('idle'); });
  $('#mic').addEventListener('click', function(){
    if (micOn){ ears.stop(); return; }
    voice.stop(); player.stop(); if (face) face.rest();
    micOn = true; $('#mic').setAttribute('aria-pressed','true'); setStatus('listening');
    ears.start();
  });
}

$('#stop').addEventListener('click', function(){
  voice.stop(); player.stop(); if (face) face.rest(); busy = false; setStatus('idle');
});

/* identity block */
$('#who').textContent = PROFILE.name;
$('#role').textContent = PROFILE.title + ' · ' + PROFILE.location;
setStatus('idle');

window.addEventListener('keydown', function(e){
  if ((e.key === 'r' || e.key === 'R') && face) face.reset();
});

/* expose for scripted verification */
window.__avatar = { answer:answer, face:face, schedule:schedule };
