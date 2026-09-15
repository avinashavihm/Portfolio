import { createFace } from './face.js';
import { schedule, createPlayer } from './visemes.js';
import { createVoice, createEars } from './speech.js';
import { ask } from './brain.js';
import { PROFILE, SUGGESTIONS } from './corpus.js';

var $ = function(s){ return document.querySelector(s); };
var stage = $('#stage');

var face = createFace(stage, { anchors: window.FACE_ANCHORS || undefined });
if (!face) { $('#nowebgl').hidden = false; }
else face.setPortrait(window.PORTRAIT_URL || 'assets/portrait-placeholder.jpg');

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
  var n = $('#status');
  n.dataset.state = s;
  n.textContent = s === 'speaking' ? 'speaking' : s === 'listening' ? 'listening' : 'ready';
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

/* calibration: drag anchors to fit a real photograph exactly (press C) */
window.addEventListener('keydown', function(e){
  if (e.key !== 'c' && e.key !== 'C') return;
  if (!face) return;
  var panel = $('#calib');
  panel.hidden = !panel.hidden;
  if (!panel.hidden) buildCalib();
});
function buildCalib(){
  var u = face.uniforms, rows = [
    ['mouth x','uMouth','x',0,1],['mouth y','uMouth','y',0,1],
    ['mouth radius','uMouthR',null,0.02,0.3],['chin y','uChinY',null,0,1],
    ['eye L x','uEyeL','x',0,1],['eye L y','uEyeL','y',0,1],
    ['eye R x','uEyeR','x',0,1],['eye R y','uEyeR','y',0,1],
    ['eye radius','uEyeR2',null,0.01,0.2]
  ];
  var box = $('#calibBody'); box.innerHTML = '';
  rows.forEach(function(r){
    var val = r[2] ? u[r[1]].value[r[2]] : u[r[1]].value;
    var w = document.createElement('label');
    w.innerHTML = '<span>' + r[0] + '</span><input type="range" min="'+r[3]+'" max="'+r[4]+
      '" step="0.002" value="'+val+'"><b>'+(+val).toFixed(3)+'</b>';
    var input = w.querySelector('input'), out = w.querySelector('b');
    input.addEventListener('input', function(){
      var v = +input.value; out.textContent = v.toFixed(3);
      if (r[2]) u[r[1]].value[r[2]] = v; else u[r[1]].value = v;
      dumpCalib();
    });
    box.appendChild(w);
  });
  dumpCalib();
}
function dumpCalib(){
  var u = face.uniforms;
  $('#calibOut').textContent = JSON.stringify({
    mouth:[+u.uMouth.value.x.toFixed(3), +u.uMouth.value.y.toFixed(3)],
    mouthR:+u.uMouthR.value.toFixed(3), chinY:+u.uChinY.value.toFixed(3),
    eyeL:[+u.uEyeL.value.x.toFixed(3), +u.uEyeL.value.y.toFixed(3)],
    eyeR:[+u.uEyeR.value.x.toFixed(3), +u.uEyeR.value.y.toFixed(3)],
    eyeR2:+u.uEyeR2.value.toFixed(3)
  });
}

/* expose for scripted verification */
window.__avatar = { answer:answer, face:face, schedule:schedule };
