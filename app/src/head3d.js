import * as THREE from 'three';

/* A real 3D head: parametric skull geometry with an anatomically hinged jaw,
   teeth, tongue and eyeballs inside it, and the photograph projected onto the
   front. Rotatable. Where the photograph has no data - the sides and back -
   the surface blends to skin tones sampled from the photograph itself. */

var SKIN_SIDE = 0xC09087, SKIN_DEEP = 0xA9756C, HAIR = 0x2B2B34;

/* Photograph anchors, measured off a calibration grid, mapped to head space:
   eyes sit at y=+0.18, mouth at y=-0.22, so uv -> head is linear through both. */
var UV = { ex0:0.400, ex1:0.602, ey:0.565, my:0.375 };
var HEAD_EYE_Y = 0.18, HEAD_MOUTH_Y = -0.22, HEAD_EYE_X = 0.30;
var SY = (HEAD_EYE_Y - HEAD_MOUTH_Y) / (UV.ey - UV.my);          // head units per uv
var SX = (HEAD_EYE_X * 2) / (UV.ex1 - UV.ex0);
var CX = (UV.ex0 + UV.ex1) / 2;

/* ---- head surface ---------------------------------------------------- */
function shape(theta, phi){
  // sphere
  var x = Math.sin(phi) * Math.sin(theta);
  var y = Math.cos(phi);
  var z = Math.sin(phi) * Math.cos(theta);

  x *= 0.82; z *= 0.84;                                   // narrower than tall
  if (y < 0){                                             // taper to the chin
    var t = Math.pow(-y, 1.25);
    x *= 1 - 0.46 * t;
    z *= 1 - 0.20 * t;
  }
  if (z < 0) z *= 0.90;                                   // flatter at the back
  if (y > 0.35) { x *= 1 + (y - 0.35) * 0.10; }           // cranium
  // chin comes forward
  if (y < -0.45 && z > 0) z += (-y - 0.45) * 0.30;
  // brow ridge
  if (y > 0.10 && y < 0.34 && z > 0.4) z += 0.022;
  // cheeks
  if (y > -0.30 && y < 0.05) x *= 1.03;
  // a real head is not a sphere: the cranium is tall, the chin stops early
  return new THREE.Vector3(x, y >= 0 ? y * 1.18 : y * 0.80, z);
}

/* the jaw swings about a hinge just in front of the ears */
var HINGE = new THREE.Vector3(0, 0.02, -0.16);
function jawWeight(p){
  if (p.y > HEAD_MOUTH_Y + 0.02) return 0;                // above the lip line: skull
  // the boundary rises toward the hinge at the sides, as a real jaw does
  var lift = Math.min(Math.abs(p.x) / 0.55, 1) * 0.16;
  var edge = HEAD_MOUTH_Y + 0.02 + lift;
  var w = (edge - p.y) / 0.055;                           // narrow band = lips part cleanly
  return Math.max(0, Math.min(1, w));
}

function buildHead(){
  var NT = 128, NP = 112, pos = [], uvs = [], jw = [], idx = [];
  for (var i = 0; i <= NP; i++){
    var phi = (i / NP) * Math.PI;
    for (var j = 0; j <= NT; j++){
      var theta = (j / NT) * Math.PI * 2 - Math.PI;
      var p = shape(theta, phi);
      pos.push(p.x, p.y, p.z);
      uvs.push((p.x / SX) + CX, ((p.y - HEAD_MOUTH_Y) / SY) + UV.my);
      jw.push(jawWeight(p));
    }
  }
  /* Cut a real slit along the lip line. Without an actual aperture the jaw
     rotation only stretches the photograph; with one, the lips part and the
     teeth and tongue behind them become visible. */
  function inSlit(i){
    var x = pos[i*3], y = pos[i*3+1], z = pos[i*3+2];
    if (z < 0.34) return false;                      // front of the face only
    if (Math.abs(x) > 0.255) return false;           // mouth width
    var lip = HEAD_MOUTH_Y + Math.abs(x) * 0.13;     // the lip line curves up at the corners
    var halfW = 0.022 * (1.0 - Math.pow(Math.abs(x) / 0.255, 2.2));   // tapers to the corners
    return Math.abs(y - lip) < halfW;
  }
  for (var a = 0; a < NP; a++){
    for (var b = 0; b < NT; b++){
      var i0 = a * (NT + 1) + b, i1 = i0 + 1, i2 = i0 + NT + 1, i3 = i2 + 1;
      if (inSlit(i0) || inSlit(i1) || inSlit(i2) || inSlit(i3)) continue;
      idx.push(i0, i2, i1, i1, i2, i3);
    }
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('jaw',      new THREE.Float32BufferAttribute(jw, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

var HEAD_VERT = `
  attribute float jaw;
  uniform float uJaw, uWide, uRound, uBlinkL, uBlinkR;
  uniform vec3  uHinge;
  varying vec2  vUv; varying vec3 vN; varying float vJaw; varying vec3 vPos; varying vec3 vRest;

  vec3 rotX(vec3 p, vec3 c, float a){
    vec3 q = p - c;
    return c + vec3(q.x, q.y*cos(a) - q.z*sin(a), q.y*sin(a) + q.z*cos(a));
  }
  void main(){
    vUv = uv; vJaw = jaw; vRest = position;
    vec3 p = position;

    // the jaw rotates about its hinge - real geometry, not a warp
    if (jaw > 0.0) p = mix(p, rotX(p, uHinge, uJaw), jaw);

    // lip shaping around the aperture
    float near = smoothstep(0.34, 0.0, length(vec2(position.x, position.y - (-0.22))));
    p.x += position.x * uWide * 0.16 * near;
    p.x -= position.x * uRound * 0.20 * near;
    p.z += uRound * 0.05 * near;

    vN = normalize(normalMatrix * normal);
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

var HEAD_FRAG = `
  uniform sampler2D uMap;
  uniform vec3 uSide, uDeep, uHair;
  uniform float uHasMap;
  varying vec2 vUv; varying vec3 vN; varying float vJaw; varying vec3 vPos; varying vec3 vRest;

  void main(){
    // the photograph only covers the front; fade to sampled skin at the sides
    float facing = smoothstep(0.02, 0.55, vN.z);
    float inFrame = step(0.0, vUv.x) * step(vUv.x, 1.0) * step(0.0, vUv.y) * step(vUv.y, 1.0);
    vec3 photo = texture2D(uMap, vUv).rgb;
    vec3 side  = mix(uDeep, uSide, clamp(vN.z * 0.5 + 0.6, 0.0, 1.0));
    if (vRest.y > 0.62) side = mix(side, uHair, smoothstep(0.62, 0.86, vRest.y));
    float belowChin = smoothstep(-0.58, -0.47, vRest.y);  // photo chin maps to rest y=-0.47
    vec3 base = mix(side, photo, facing * inFrame * uHasMap * belowChin);

    vec3 L = normalize(vec3(0.35, 0.75, 0.9));
    float d = max(dot(normalize(vN), L), 0.0);
    float amb = 0.74;
    float rim = pow(1.0 - max(dot(normalize(vN), vec3(0.0,0.0,1.0)), 0.0), 3.0) * 0.14;
    gl_FragColor = vec4(base * (amb + d * 0.34) + rim, 1.0);
  }
`;

export function createHead3D(container, cfg){
  cfg = cfg || {};
  var canvas = document.createElement('canvas');
  container.insertBefore(canvas, container.firstChild);
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias:true, alpha:true }); }
  catch(e){ return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0, 5.6);
  var rig = new THREE.Group(); scene.add(rig);          // user rotation
  var head = new THREE.Group(); rig.add(head);          // idle motion

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8e86, 1.6));
  var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(2,3,4); scene.add(key);

  var uni = {
    uMap:{value:null}, uHasMap:{value:0},
    uJaw:{value:0}, uWide:{value:0}, uRound:{value:0},
    uBlinkL:{value:0}, uBlinkR:{value:0},
    uHinge:{value:HINGE.clone()},
    uSide:{value:new THREE.Color(SKIN_SIDE)},
    uDeep:{value:new THREE.Color(SKIN_DEEP)},
    uHair:{value:new THREE.Color(HAIR)}
  };
  var skin = new THREE.Mesh(buildHead(), new THREE.ShaderMaterial({
    uniforms:uni, vertexShader:HEAD_VERT, fragmentShader:HEAD_FRAG, side:THREE.FrontSide
  }));
  head.add(skin);

  /* ---- the mouth, as actual geometry inside the head ---- */
  var mouth = new THREE.Group(); head.add(mouth);
  var cavity = new THREE.Mesh(
    new THREE.SphereGeometry(0.30, 24, 18),
    new THREE.MeshBasicMaterial({ color:0x3A181C })
  );
  cavity.scale.set(1.00, 0.56, 0.68);
  cavity.position.set(0, -0.252, 0.22);
  mouth.add(cavity);

  /* A smooth dental arch reads far better than discrete blocks. */
  function teethArc(flip){
    var g = new THREE.Group();
    // laid flat, the arc sweeps +X -> +Z -> -X, which is the front arch
    var arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.135, 0.017, 10, 30, Math.PI),
      new THREE.MeshStandardMaterial({ color:0xD9CBC0, roughness:0.62, metalness:0.0 })
    );
    arc.rotation.x = Math.PI / 2;
    arc.scale.set(1.0, 1.0, 0.72);
    arc.position.z = 0.30;
    g.add(arc);
    if (flip) g.scale.y = -1;
    return g;
  }

  var upperTeeth = teethArc(false); upperTeeth.position.y = -0.230; mouth.add(upperTeeth);
  var lowerTeeth = teethArc(true);  lowerTeeth.position.y = -0.278; mouth.add(lowerTeeth);

  var tongue = new THREE.Mesh(
    new THREE.SphereGeometry(0.125, 20, 14),
    new THREE.MeshStandardMaterial({ color:0xA85A5A, roughness:0.55 })
  );
  tongue.scale.set(1.0, 0.40, 1.35);
  tongue.position.set(0, -0.290, 0.28);
  mouth.add(tongue);

  /* ---- eyes ---- */
  function eye(x){
    var g = new THREE.Group();
    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.082, 28, 22),
      new THREE.MeshStandardMaterial({ color:0xF7F3EE, roughness:0.28 }));
    var iris = new THREE.Mesh(new THREE.CircleGeometry(0.040, 24),
      new THREE.MeshStandardMaterial({ color:0x3A2418, roughness:0.35 }));
    iris.position.z = 0.079;
    var pupil = new THREE.Mesh(new THREE.CircleGeometry(0.018, 20),
      new THREE.MeshBasicMaterial({ color:0x0A0806 }));
    pupil.position.z = 0.082;
    g.add(ball); g.add(iris); g.add(pupil);
    g.position.set(x, HEAD_EYE_Y, 0.40);
    return g;
  }
  var eyeL = eye(-HEAD_EYE_X), eyeR = eye(HEAD_EYE_X);
  head.add(eyeL); head.add(eyeR);

  function lid(x){
    var m = new THREE.Mesh(new THREE.SphereGeometry(0.090, 24, 16, 0, Math.PI*2, 0, Math.PI*0.5),
      new THREE.MeshStandardMaterial({ color:SKIN_SIDE, roughness:0.8 }));
    m.position.set(x, HEAD_EYE_Y, 0.40);
    return m;
  }
  var lidL = lid(-HEAD_EYE_X), lidR = lid(HEAD_EYE_X);
  head.add(lidL); head.add(lidR);

  /* ---- portrait ---- */
  function setPortrait(url){
    new THREE.TextureLoader().load(url, function(t){
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      uni.uMap.value = t; uni.uHasMap.value = 1;
    });
  }

  /* ---- interaction: genuinely rotatable ---- */
  var yaw = 0, pitch = 0, vYaw = 0, dragging = false, lx = 0, ly = 0, touched = false;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', function(e){
    dragging = true; touched = true; lx = e.clientX; ly = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function(e){
    if (!dragging) return;
    var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    yaw   = Math.max(-0.95, Math.min(0.95, yaw + dx * 0.006));
    pitch = Math.max(-0.40, Math.min(0.40, pitch + dy * 0.004));
    vYaw = dx * 0.006;
  });
  function end(){ dragging = false; }
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('dblclick', function(){ yaw = 0; pitch = 0; vYaw = 0; });

  function fit(){
    var w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(container);
  window.addEventListener('resize', fit);
  fit();

  /* ---- animation ---- */
  var POSE = {
    sil:{j:0.00,w:0.00,r:0.00}, PP:{j:0.00,w:0.05,r:0.06}, FF:{j:0.08,w:0.18,r:0.00},
    TH: {j:0.20,w:0.12,r:0.00}, DD:{j:0.22,w:0.16,r:0.00}, kk:{j:0.26,w:0.10,r:0.00},
    CH: {j:0.18,w:0.00,r:0.46}, SS:{j:0.09,w:0.32,r:0.00}, nn:{j:0.16,w:0.12,r:0.00},
    RR: {j:0.18,w:0.04,r:0.34}, aa:{j:0.86,w:0.14,r:0.00}, E:{j:0.46,w:0.44,r:0.00},
    I:  {j:0.26,w:0.62,r:0.00}, O:{j:0.52,w:0.00,r:0.74}, U:{j:0.22,w:0.00,r:0.88}
  };
  var cur = {j:0,w:0,r:0}, tgt = {j:0,w:0,r:0};
  var MAX_JAW = 0.30;                                   // radians
  var blink = 0, nextBlink = 1.6, blinkT = -1;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setVisemes(weights){
    var acc = {j:0,w:0,r:0}, total = 0;
    for (var v in weights){
      var p = POSE[v]; if (!p) continue;
      var k = weights[v];
      acc.j += p.j*k; acc.w += p.w*k; acc.r += p.r*k; total += k;
    }
    if (total > 1){ acc.j/=total; acc.w/=total; acc.r/=total; }
    tgt = acc;
  }
  function rest(){ tgt = {j:0,w:0,r:0}; }

  var clock = new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;

    var k = 1 - Math.pow(0.0001, dt);
    cur.j += (tgt.j - cur.j) * k; cur.w += (tgt.w - cur.w) * k; cur.r += (tgt.r - cur.r) * k;

    uni.uJaw.value = cur.j * MAX_JAW;
    uni.uWide.value = cur.w; uni.uRound.value = cur.r;

    // teeth and tongue ride the jaw
    var ja = cur.j * MAX_JAW;
    lowerTeeth.position.y = -0.276 - Math.sin(ja) * 0.24;
    lowerTeeth.position.z = Math.cos(ja) * 0.0 - (1 - Math.cos(ja)) * 0.14;
    tongue.position.y = -0.290 - Math.sin(ja) * 0.19;

    if (!reduced){
      if (blinkT < 0 && t > nextBlink){ blinkT = 0; nextBlink = t + 2.8 + Math.random()*4.0; }
      if (blinkT >= 0){
        blinkT += dt; var B = 0.14;
        blink = blinkT < B/2 ? blinkT/(B/2) : 1 - (blinkT - B/2)/(B/2);
        if (blinkT > B){ blinkT = -1; blink = 0; }
      }
      var b = Math.max(0, Math.min(1, blink));
      lidL.rotation.x = lidR.rotation.x = -0.22 + b * 2.0;

      if (!dragging){
        if (Math.abs(vYaw) > 0.0004){ yaw += vYaw; vYaw *= 0.90; }
        else if (!touched) yaw = Math.sin(t * 0.26) * 0.22;      // gentle idle turn
      }
      head.rotation.z = Math.sin(t * 0.21) * 0.012;
      head.position.y = Math.sin(t * 0.63) * 0.006;
      var look = Math.sin(t * 0.4) * 0.05;
      eyeL.rotation.y = eyeR.rotation.y = look - yaw * 0.30;
    }
    rig.rotation.y = yaw; rig.rotation.x = pitch;

    renderer.render(scene, camera);
  })();

  return { setPortrait:setPortrait, setVisemes:setVisemes, rest:rest, uniforms:uni,
           reset:function(){ yaw=0; pitch=0; vYaw=0; } };
}
