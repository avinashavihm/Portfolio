/* Browser speech in and out. Deliberately thin, so ElevenLabs (voice clone +
   character timestamps) and AssemblyAI can replace either half later. */

export function createVoice(){
  var synth = window.speechSynthesis;
  var voices = [];
  function load(){ voices = synth ? synth.getVoices() : []; }
  if (synth){ load(); synth.onvoiceschanged = load; }

  function pick(){
    if (!voices.length) load();
    var pref = [/en[-_]IN/i, /India/i, /en[-_]GB/i, /en[-_]US/i];
    for (var p=0;p<pref.length;p++){
      for (var i=0;i<voices.length;i++){
        if (pref[p].test(voices[i].lang) || pref[p].test(voices[i].name)) return voices[i];
      }
    }
    return voices[0] || null;
  }

  return {
    available: !!synth,
    /* onBoundary(charIndex) lets the viseme player re-anchor mid-sentence. */
    speak: function(text, onBoundary, onEnd){
      if (!synth){ onEnd && onEnd(); return null; }
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = pick(); if (v) u.voice = v;
      u.rate = 0.97; u.pitch = 0.95;
      u.onboundary = function(e){ onBoundary && onBoundary(e.charIndex || 0); };
      u.onend = function(){ onEnd && onEnd(); };
      u.onerror = function(){ onEnd && onEnd(); };
      synth.speak(u);
      return u;
    },
    stop: function(){ if (synth) synth.cancel(); },
    rate: 0.97
  };
}

export function createEars(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return { available:false, start:function(){}, stop:function(){} };
  var rec = new SR();
  rec.continuous = false; rec.interimResults = true; rec.lang = 'en-IN';
  var handlers = {};
  rec.onresult = function(e){
    var interim = '', fin = '';
    for (var i=e.resultIndex;i<e.results.length;i++){
      var r = e.results[i];
      if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript;
    }
    if (interim) handlers.interim && handlers.interim(interim);
    if (fin) handlers.final && handlers.final(fin.trim());
  };
  rec.onend = function(){ handlers.end && handlers.end(); };
  rec.onerror = function(e){ handlers.error && handlers.error(e.error); };
  return {
    available: true,
    on: function(k, fn){ handlers[k] = fn; return this; },
    start: function(){ try { rec.start(); } catch(e){} },
    stop:  function(){ try { rec.stop();  } catch(e){} }
  };
}
