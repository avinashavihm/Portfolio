/* Text -> viseme schedule. Oculus/Preston-Blair 15-viseme set.
   The browser's SpeechSynthesis gives only word-level `boundary` events, so we
   estimate a per-character schedule and RE-ANCHOR it on every boundary to stop
   drift. Swapping in ElevenLabs character timestamps replaces `schedule()` only. */

export var VISEMES = ['sil','PP','FF','TH','DD','kk','CH','SS','nn','RR','aa','E','I','O','U'];

var MAP = {
  a:'aa', e:'E', i:'I', o:'O', u:'U',
  p:'PP', b:'PP', m:'PP',
  f:'FF', v:'FF',
  t:'DD', d:'DD',
  k:'kk', g:'kk', c:'kk', q:'kk', x:'kk',
  j:'CH',
  s:'SS', z:'SS',
  n:'nn', l:'nn',
  r:'RR',
  w:'U', y:'I', h:'aa'
};

var VOWEL = { aa:1, E:1, I:1, O:1, U:1 };

/* Rough English grapheme rules applied before the single-letter map. */
function digraph(text, i){
  var two = text.substr(i,2);
  if (two === 'th') return ['TH',2];
  if (two === 'ch' || two === 'sh') return ['CH',2];
  if (two === 'ph') return ['FF',2];
  if (two === 'ck' || two === 'gh') return ['kk',2];
  if (two === 'qu') return ['kk',2];
  if (two === 'oo') return ['U',2];
  if (two === 'ee' || two === 'ea') return ['I',2];
  if (two === 'ou' || two === 'ow') return ['O',2];
  if (two === 'ai' || two === 'ay') return ['E',2];
  return null;
}

/* Build a schedule of {t, dur, v, charIndex} in seconds from t=0. */
export function schedule(text, opts){
  opts = opts || {};
  var rate = opts.rate || 1;
  var cps  = (opts.charsPerSecond || 14) * rate;   // speaking speed
  var s = String(text).toLowerCase();
  var out = [], t = 0, i = 0;

  while (i < s.length){
    var ch = s[i], v = null, len = 1;
    if (/[a-z]/.test(ch)){
      var dg = digraph(s, i);
      if (dg){ v = dg[0]; len = dg[1]; }
      else v = MAP[ch] || 'DD';
    } else if (/\s/.test(ch)) {
      v = 'sil';
    } else if (/[.,;:!?]/.test(ch)) {
      v = 'sil'; len = 1;
    } else { i++; continue; }

    // vowels hold longer than consonants; punctuation pauses
    var base = 1 / cps;
    var dur = VOWEL[v] ? base * 1.45 : base * 0.85;
    if (v === 'sil') dur = /[.!?]/.test(ch) ? base * 4 : base * 1.6;

    // a doubled letter is one longer shape, not two
    var last = out[out.length-1];
    if (last && last.v === v && v !== 'sil'){ last.dur += dur * 0.5; }
    else out.push({ t: t, dur: dur, v: v, charIndex: i });

    t += dur;
    i += len;
  }
  return { items: out, total: t };
}

/* Player: converts a schedule into a live weight per viseme, with
   coarticulation (shapes ease in and out and overlap). */
export function createPlayer(onFrame){
  var sched = null, startAt = 0, playing = false, raf = 0;
  var BLEND = 0.055;   // seconds of ease between shapes

  function weightsAt(time){
    var w = {}, items = sched.items;
    // find the active item and its neighbours
    for (var i=0;i<items.length;i++){
      var it = items[i];
      if (time < it.t - BLEND) break;
      if (time > it.t + it.dur + BLEND) continue;
      var a;
      if (time < it.t) a = (time - (it.t - BLEND)) / BLEND;
      else if (time > it.t + it.dur) a = 1 - (time - (it.t + it.dur)) / BLEND;
      else a = 1;
      a = Math.max(0, Math.min(1, a));
      w[it.v] = Math.max(w[it.v] || 0, a * a * (3 - 2*a));   // smoothstep
    }
    return w;
  }

  function tick(){
    if (!playing) return;
    var time = (performance.now() - startAt) / 1000;
    if (time > sched.total + 0.25){ stop(); onFrame({}, true); return; }
    onFrame(weightsAt(time), false);
    raf = requestAnimationFrame(tick);
  }

  function start(s){
    sched = s; startAt = performance.now(); playing = true;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  /* Correct drift when the TTS engine reports where it actually is. */
  function anchor(charIndex){
    if (!sched) return;
    var items = sched.items;
    for (var i=0;i<items.length;i++){
      if (items[i].charIndex >= charIndex){
        startAt = performance.now() - items[i].t * 1000;
        return;
      }
    }
  }
  function stop(){ playing = false; cancelAnimationFrame(raf); }

  return { start:start, anchor:anchor, stop:stop, isPlaying:function(){ return playing; } };
}
