/* Grounded answer engine. Retrieval over a closed corpus - it can only ever
   say sentences that were written by hand from the resume, so hallucination
   is structurally impossible on this path. */
import { FACTS, GAPS, FALLBACK } from './corpus.js';

var STOP = {the:1,a:1,an:1,is:1,are:1,was:1,were:1,do:1,does:1,did:1,you:1,your:1,
  me:1,my:1,i:1,yours:1,to:1,of:1,in:1,on:1,for:1,and:1,or:1,what:1,how:1,can:1,could:1,
  would:1,tell:1,about:1,with:1,that:1,this:1,have:1,has:1,any:1,at:1,it:1,so:1};

function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean); }

/* "certifications" must match the tag "certification". */
function sing(w){
  if (w.length > 4 && w.slice(-3) === 'ies') return w.slice(0,-3) + 'y';
  if (w.length > 4 && w.slice(-2) === 'es' && 'sxz'.indexOf(w.slice(-3,-2)) >= 0) return w.slice(0,-2);
  if (w.length > 3 && w.slice(-1) === 's' && w.slice(-2) !== 'ss') return w.slice(0,-1);
  return w;
}

function scoreFact(words, raw, tags){
  var s = 0;
  for (var i=0;i<tags.length;i++){
    var t = tags[i];
    // multi-word tags are phrases: substring match is safe and strong
    if (t.indexOf(' ') >= 0){ if (raw.indexOf(t) >= 0) s += 6; continue; }
    // single-word tags match WHOLE WORDS only. Substring matching here made
    // "your" hit the tag "you", which pulled every question to the summary.
    for (var j=0;j<words.length;j++){
      var w = words[j];
      if (STOP[w] || w.length < 3) continue;
      var ws = sing(w), ts = sing(t);
      if (w === t || ws === ts) s += 3 + Math.min(t.length, 12) * 0.25;   // longer tag = more specific
      else if (w.length >= 5 && t.length >= 5 &&
               (ws.indexOf(ts) === 0 || ts.indexOf(ws) === 0)) s += 2.5;   // shared stem
    }
  }
  return s;
}

export function ask(question){
  var raw = String(question||'').toLowerCase();
  var words = norm(question);
  if (!words.length) return { text: FALLBACK.say, src: FALLBACK.src, id:'fallback' };

  // Questions the resume cannot answer are refused before anything else.
  if (scoreFact(words, raw, GAPS.tags) >= 3.5){
    return { text: GAPS.say, src: GAPS.src, id:'gap' };
  }

  var best = null, bestScore = 0;
  for (var i=0;i<FACTS.length;i++){
    var sc = scoreFact(words, raw, FACTS[i].tags);
    if (sc > bestScore){ bestScore = sc; best = FACTS[i]; }
  }
  if (!best || bestScore < 3.5) return { text: FALLBACK.say, src: FALLBACK.src, id:'fallback' };
  return { text: best.say, src: best.src, id: best.id };
}
