import * as THREE from 'three';

/* Animated portrait. The photograph is never regenerated - outside the mouth
   region its pixels are untouched, so facial identity is structurally
   preserved. Only geometry is warped, plus a synthesised mouth interior. */

/* Viseme -> mouth pose. jaw = how far it opens, wide = corner pull,
   round = lip protrusion, teeth = how much upper teeth show. */
var POSE = {
  sil:{jaw:0.00,wide:0.00,round:0.00,teeth:0.00},
  PP: {jaw:0.00,wide:0.06,round:0.05,teeth:0.00},
  FF: {jaw:0.03,wide:0.18,round:0.00,teeth:0.30},
  TH: {jaw:0.06,wide:0.12,round:0.00,teeth:0.35},
  DD: {jaw:0.07,wide:0.16,round:0.00,teeth:0.30},
  kk: {jaw:0.07,wide:0.12,round:0.00,teeth:0.22},
  CH: {jaw:0.06,wide:0.00,round:0.45,teeth:0.30},
  SS: {jaw:0.03,wide:0.34,round:0.00,teeth:0.45},
  nn: {jaw:0.05,wide:0.12,round:0.00,teeth:0.25},
  RR: {jaw:0.06,wide:0.05,round:0.32,teeth:0.15},
  aa: {jaw:0.15,wide:0.10,round:0.00,teeth:0.00},
  E:  {jaw:0.10,wide:0.16,round:0.00,teeth:0.00},
  I:  {jaw:0.07,wide:0.20,round:0.00,teeth:0.00},
  O:  {jaw:0.11,wide:0.00,round:0.22,teeth:0.00},
  U:  {jaw:0.06,wide:0.00,round:0.26,teeth:0.00}
};

var VERT = `
  uniform vec2  uMouth;      // mouth centre, uv
  uniform float uMouthR;     // mouth influence radius, uv
  uniform vec2  uEyeL;
  uniform vec2  uEyeR;
  uniform float uEyeR2;      // eye influence radius
  uniform float uJaw, uWide, uRound, uBlink;
  uniform float uChinY;      // bottom of the jaw, uv
  varying vec2  vUv;

  void main(){
    vUv = uv;
    vec3 p = position;
    vec2 t = uv;

    // ---- jaw: everything between the mouth line and the chin swings down,
    //      strongest at the chin, fading to nothing at the ears.
    if (t.y < uMouth.y){
      float down  = clamp((uMouth.y - t.y) / max(uMouth.y - uChinY, 0.001), 0.0, 1.0);
      float side  = 1.0 - smoothstep(0.0, 0.42, abs(t.x - uMouth.x));
      p.y -= uJaw * 0.045 * down * side;
    }

    // ---- lips: part around the aperture
    float d    = distance(t, uMouth);
    float fall = 1.0 - smoothstep(0.0, uMouthR, d);
    if (fall > 0.0){
      float above = t.y > uMouth.y ? 1.0 : -1.0;
      p.y += above * uJaw * 0.012 * fall;                 // upper lip up, lower lip down
      p.x += (t.x - uMouth.x) * uWide * 0.55 * fall;      // corner pull
      p.x -= (t.x - uMouth.x) * uRound * 0.42 * fall;     // rounding
      p.y -= uRound * 0.004 * fall;
    }

    // ---- blink: eyelid region compresses toward the eye centre
    float dl = distance(t, uEyeL), dr = distance(t, uEyeR);
    float el = 1.0 - smoothstep(0.0, uEyeR2, dl);
    float er = 1.0 - smoothstep(0.0, uEyeR2, dr);
    p.y -= (t.y - uEyeL.y) * uBlink * 0.92 * el;
    p.y -= (t.y - uEyeR.y) * uBlink * 0.92 * er;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

var FRAG = `
  uniform sampler2D uMap;
  varying vec2 vUv;
  void main(){ gl_FragColor = texture2D(uMap, vUv); }
`;

/* The mouth interior, drawn over the portrait: a dark cavity with an upper
   teeth band, feathered so it sits inside the lips rather than on top. */
var MOUTH_FRAG = `
  uniform float uJaw, uWide, uRound, uTeeth;
  uniform vec3  uDark, uTeethCol;
  varying vec2 vUv;

  void main(){
    vec2 p = vUv - 0.5;
    float h = 0.055 + uJaw * 0.33;
    // anchor the top of the aperture at the upper lip; the jaw takes it down
    p.y += (h - 0.055) * 0.82;
    float w = mix(0.30, 0.44, uWide) * mix(1.0, 0.62, uRound);
    if (h < 0.062){ discard; }

    float e = length(vec2(p.x / w, p.y / h));
    float a = 1.0 - smoothstep(0.34, 1.05, e);
    if (a <= 0.004) discard;
    a = pow(a, 0.78);

    vec3 col = uDark;
    // upper teeth sit just under the top lip
    float band = smoothstep(0.34, 0.74, p.y / h) * (1.0 - smoothstep(0.72, 0.98, e));
    col = mix(col, uTeethCol, clamp(band * uTeeth * 1.9, 0.0, 0.94));
    // throat falls away into shadow
    col *= mix(1.0, 0.42, smoothstep(0.15, -0.95, p.y / h));

    gl_FragColor = vec4(col, a * 0.88);
  }
`;

export function createFace(container, cfg){
  cfg = cfg || {};
  var anchors = Object.assign({
    mouth:[0.500, 0.418], mouthR:0.115, chinY:0.300,
    eyeL:[0.408, 0.610], eyeR:[0.592, 0.610], eyeR2:0.062
  }, cfg.anchors || {});

  var canvas = document.createElement('canvas');
  container.insertBefore(canvas, container.firstChild);

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias:true, alpha:true }); }
  catch(e){ return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.z = 4.2;
  var head = new THREE.Group(); scene.add(head);

  var uni = {
    uMap:{value:null},
    uMouth:{value:new THREE.Vector2(anchors.mouth[0], anchors.mouth[1])},
    uMouthR:{value:anchors.mouthR},
    uEyeL:{value:new THREE.Vector2(anchors.eyeL[0], anchors.eyeL[1])},
    uEyeR:{value:new THREE.Vector2(anchors.eyeR[0], anchors.eyeR[1])},
    uEyeR2:{value:anchors.eyeR2},
    uChinY:{value:anchors.chinY},
    uJaw:{value:0}, uWide:{value:0}, uRound:{value:0}, uBlink:{value:0}
  };

  var aspect = cfg.aspect || 0.78;
  var planeW = 2.0, planeH = planeW / aspect;
  var faceMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, planeH, 110, 130),
    new THREE.ShaderMaterial({ uniforms:uni, vertexShader:VERT, fragmentShader:FRAG, transparent:true })
  );
  head.add(faceMesh);

  var mUni = {
    uJaw:{value:0}, uWide:{value:0}, uRound:{value:0}, uTeeth:{value:0},
    uDark:{value:new THREE.Color(0x7C4E4E)}, uTeethCol:{value:new THREE.Color(0xF0CFC6)}
  };
  var mouthMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW * 0.26, planeH * 0.115),
    new THREE.ShaderMaterial({ uniforms:mUni, vertexShader:
      'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:MOUTH_FRAG, transparent:true, depthWrite:false })
  );
  mouthMesh.position.set(
    (anchors.mouth[0] - 0.5) * planeW,
    (anchors.mouth[1] - 0.5) * planeH,
    0.01
  );
  mouthMesh.visible = false;   // synthetic interiors read as a sticker; no invented pixels
  head.add(mouthMesh);

  var tex = null;
  function setPortrait(url, onReady){
    new THREE.TextureLoader().load(url, function(t){
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      tex = t; uni.uMap.value = t;
      if (t.image && t.image.width){
        var a = t.image.width / t.image.height;
        faceMesh.geometry.dispose();
        planeH = planeW / a;
        faceMesh.geometry = new THREE.PlaneGeometry(planeW, planeH, 110, 130);
        mouthMesh.position.y = (anchors.mouth[1] - 0.5) * planeH;
        mouthMesh.geometry.dispose();
        mouthMesh.geometry = new THREE.PlaneGeometry(planeW * 0.26, planeH * 0.115);
        fit();
      }
      onReady && onReady();
    });
  }

  /* ---- live state ---- */
  var cur = { jaw:0, wide:0, round:0, teeth:0 }, tgt = Object.assign({}, cur);
  var blink = 0, nextBlink = 1.4, blinkT = -1;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setVisemes(weights){
    var acc = { jaw:0, wide:0, round:0, teeth:0 }, total = 0;
    for (var v in weights){
      var p = POSE[v]; if (!p) continue;
      var w = weights[v];
      acc.jaw += p.jaw*w; acc.wide += p.wide*w; acc.round += p.round*w; acc.teeth += p.teeth*w;
      total += w;
    }
    if (total > 1){ acc.jaw/=total; acc.wide/=total; acc.round/=total; acc.teeth/=total; }
    tgt = acc;
  }
  function rest(){ tgt = { jaw:0, wide:0, round:0, teeth:0 }; }

  function fit(){
    var w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w/h;
    // frame the portrait so it always fills without cropping the face
    var distW = (planeW/2) / (Math.tan(THREE.MathUtils.degToRad(26)/2) * camera.aspect);
    var distH = (planeH/2) / Math.tan(THREE.MathUtils.degToRad(26)/2);
    camera.position.z = Math.max(distW, distH) * 1.02;
    camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(container);
  window.addEventListener('resize', fit);
  fit();

  var clock = new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;

    // ease toward the target pose - this is the coarticulation that stops
    // the mouth looking like it is chewing
    var k = 1 - Math.pow(0.0001, dt);
    cur.jaw   += (tgt.jaw   - cur.jaw)   * k;
    cur.wide  += (tgt.wide  - cur.wide)  * k;
    cur.round += (tgt.round - cur.round) * k;
    cur.teeth += (tgt.teeth - cur.teeth) * k;

    uni.uJaw.value = cur.jaw; uni.uWide.value = cur.wide; uni.uRound.value = cur.round;
    mUni.uJaw.value = cur.jaw; mUni.uWide.value = cur.wide;
    mUni.uRound.value = cur.round; mUni.uTeeth.value = cur.teeth;

    // blink
    if (!reduced){
      if (blinkT < 0 && t > nextBlink){ blinkT = 0; nextBlink = t + 2.6 + Math.random()*4.2; }
      if (blinkT >= 0){
        blinkT += dt;
        var B = 0.13;
        blink = blinkT < B/2 ? blinkT/(B/2) : 1 - (blinkT - B/2)/(B/2);
        if (blinkT > B){ blinkT = -1; blink = 0; }
      }
      uni.uBlink.value = Math.max(0, Math.min(1, blink));

      // breathing + micro head motion, so the face is never dead
      var br = Math.sin(t * 0.72) * 0.0035;
      head.scale.set(1 + br, 1 + br, 1);
      head.rotation.y = Math.sin(t * 0.31) * 0.021 + Math.sin(t * 0.13) * 0.012;
      head.rotation.x = Math.sin(t * 0.24 + 1.3) * 0.013;
      head.position.x = Math.sin(t * 0.19) * 0.012;
      head.position.y = Math.sin(t * 0.27 + 0.6) * 0.008 + cur.jaw * 0.004;
    }

    renderer.render(scene, camera);
  })();

  return { setPortrait:setPortrait, setVisemes:setVisemes, rest:rest, anchors:anchors, uniforms:uni };
}
