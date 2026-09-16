import * as THREE from 'three';

/* Avinash's actual face geometry, measured from his photograph with MediaPipe's
   face landmarker: 481 vertices, 906 triangles. Each vertex's UV is literally
   where that point sits in the photograph, so the texture aligns exactly - no
   anchors to guess, no invented pixels. The photo already carries its own
   lighting, so the material is unlit; re-lighting it is what destroys realism. */

/* Landmark indices from the MediaPipe canonical face mesh. */
var LM = {
  upperLipInner: 13, lowerLipInner: 14, chin: 152,
  mouthL: 61, mouthR: 291,
  eyeLidTopL: 159, eyeLidBotL: 145, eyeLidTopR: 386, eyeLidBotR: 374,
  eyeCentreL: 468, eyeCentreR: 473,
  browL: 105, browR: 334, noseTip: 1
};

var LIP_LOWER = [146,91,181,84,17,314,405,321,375,291,61,
                 95,88,178,87,14,317,402,318,324,308,78];
var LIP_UPPER = [61,185,40,39,37,0,267,269,270,409,291,
                 78,191,80,81,82,13,312,311,310,415,308];
var LIP_LOWER_ALL = [146,91,181,84,17,314,405,321,375,
                     95,88,178,87,14,317,402,318,324];
var MOUTH_CORNERS = [61,291,78,308];

var LID_L = [159,158,157,173,160,161,246,33,7,163,144,145,153,154,155,133];
var LID_R = [386,385,384,398,387,388,466,263,249,390,373,374,380,381,382,362];

export async function createFaceMesh(container, opts){
  opts = opts || {};
  var canvas = document.createElement('canvas');
  container.insertBefore(canvas, container.firstChild);

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias:true, alpha:true }); }
  catch(e){ return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.z = 3.05;
  var rig = new THREE.Group(); scene.add(rig);     // user rotation
  var head = new THREE.Group(); rig.add(head);     // idle motion

  var data = await (await fetch(opts.mesh || 'assets/face_mesh.json')).json();
  var pts = data.pts, tris = data.tris, N = pts.length;

  var SCALE = 2.0, DEPTH = 2.2;
  var rest = new Float32Array(N * 3), uv = new Float32Array(N * 2);
  for (var i = 0; i < N; i++){
    rest[i*3]   =  (pts[i][0] - 0.5) * SCALE;
    rest[i*3+1] = -(pts[i][1] - 0.5) * SCALE;
    rest[i*3+2] = -pts[i][2] * DEPTH;
    uv[i*2] = pts[i][0]; uv[i*2+1] = 1 - pts[i][1];
  }
  var pos = new Float32Array(rest);

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  var idx = new Uint16Array(tris.length * 3);
  for (var t = 0; t < tris.length; t++){ idx[t*3]=tris[t][0]; idx[t*3+1]=tris[t][1]; idx[t*3+2]=tris[t][2]; }
  geo.setIndex(new THREE.BufferAttribute(idx, 1));

  var tex = await new THREE.TextureLoader().loadAsync(opts.portrait || 'assets/portrait.jpg');
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;

  var faceMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  head.add(faceMesh);

  /* The photograph behind, so hair, ears and shoulders exist. The 3D face sits
     in front of it and carries the parallax; rotation is kept modest so the
     backdrop's flatness never becomes the subject. */
  var img = tex.image, aspect = img.width / img.height;
  var bw = SCALE / 1.0, bh = bw / aspect;
  var backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(bw, bh),
    new THREE.MeshBasicMaterial({ map: tex, transparent:true, opacity:1 })
  );
  backdrop.position.set(0, 0, -0.42);
  backdrop.scale.setScalar(1.02);
  head.add(backdrop);

  /* Dark interior so parted lips do not show the page through the head. */
  var interior = new THREE.Mesh(
    new THREE.SphereGeometry(0.30, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0x3A181C })
  );
  interior.scale.set(0.52, 0.16, 0.26);
  head.add(interior);

  /* ---- rig weights, derived from the real landmarks ---- */
  var lipY  = rest[LM.upperLipInner*3+1];
  var chinY = rest[LM.chin*3+1];
  var span  = Math.max(lipY - chinY, 0.001);
  /* In a closed-mouth photograph the upper and lower lip landmarks sit at
     almost the same height, so no rule based on position can tell them apart.
     The split has to come from landmark identity. */
  var jawW = new Float32Array(N);
  var edge0 = lipY - 0.010, edge1 = lipY - 0.090;
  for (var v = 0; v < N; v++){
    var y = rest[v*3+1];
    var w = (edge0 - y) / (edge0 - edge1);
    jawW[v] = Math.max(0, Math.min(1, w));
  }
  LIP_UPPER.forEach(function(k){ jawW[k] = 0; });            // upper lip holds still
  LIP_LOWER_ALL.forEach(function(k){ jawW[k] = 1; });        // lower lip rides the mandible
  MOUTH_CORNERS.forEach(function(k){ jawW[k] = 0.42; });     // corners stretch between them
  var isLip = new Uint8Array(N); LIP_LOWER.forEach(function(k){ isLip[k] = 1; });
  var lidL = new Uint8Array(N); LID_L.forEach(function(k){ lidL[k] = 1; });
  var lidR = new Uint8Array(N); LID_R.forEach(function(k){ lidR[k] = 1; });

  var hingeY = rest[LM.upperLipInner*3+1] + 0.22, hingeZ = -0.30;
  var mouthCX = (rest[LM.mouthL*3] + rest[LM.mouthR*3]) / 2;
  // sit it behind the lip line, not down on the chin where it showed through
  // must be tall enough to cover the full opening, or the flat backdrop
  // photo shows through the gap and reads as a tongue
  interior.position.set(mouthCX, lipY - 0.022, rest[LM.upperLipInner*3+2] - 0.14);
  interior.visible = false;   // only revealed once the jaw actually opens

  var cur = { jaw:0, wide:0, round:0 }, tgt = { jaw:0, wide:0, round:0 };
  var POSE = {
    sil:{j:0,w:0,r:0}, PP:{j:0.00,w:0.05,r:0.05}, FF:{j:0.10,w:0.16,r:0},
    TH:{j:0.22,w:0.10,r:0}, DD:{j:0.24,w:0.14,r:0}, kk:{j:0.28,w:0.10,r:0},
    CH:{j:0.20,w:0,r:0.42}, SS:{j:0.10,w:0.30,r:0}, nn:{j:0.18,w:0.10,r:0},
    RR:{j:0.20,w:0.04,r:0.30}, aa:{j:0.92,w:0.12,r:0}, E:{j:0.50,w:0.40,r:0},
    I:{j:0.30,w:0.58,r:0}, O:{j:0.56,w:0,r:0.68}, U:{j:0.26,w:0,r:0.82}
  };
  var MAX_JAW = 0.58;   // radians; measured: 0.26 moved the chin only 4% of face height

  var blink = 0, nextBlink = 1.5, blinkT = -1;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function apply(){
    var drop = cur.jaw * 0.038, back = cur.jaw * 0.012;
    for (var i = 0; i < N; i++){
      var x = rest[i*3], y = rest[i*3+1], z = rest[i*3+2], w = jawW[i];
      if (w > 0.0005){
        y -= drop * w;
        z -= back * w;
      }
      var dx = x - mouthCX, near = Math.max(0, 1 - Math.abs(dx) / 0.30);
      x += dx * cur.wide * 0.22 * near * (w > 0.15 ? 1 : 0.35);
      x -= dx * cur.round * 0.26 * near * (w > 0.15 ? 1 : 0.35);
      if (blink > 0.001 && (lidL[i] || lidR[i])){
        var cy = lidL[i] ? (rest[LM.eyeLidTopL*3+1] + rest[LM.eyeLidBotL*3+1]) / 2
                         : (rest[LM.eyeLidTopR*3+1] + rest[LM.eyeLidBotR*3+1]) / 2;
        y += (cy - y) * blink * 0.92;
      }
      pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
    }
    geo.attributes.position.needsUpdate = true;
  }

  function setVisemes(weights){
    var acc = { jaw:0, wide:0, round:0 }, total = 0;
    for (var v in weights){
      var p = POSE[v]; if (!p) continue;
      var k = weights[v];
      acc.jaw += p.j*k; acc.wide += p.w*k; acc.round += p.r*k; total += k;
    }
    if (total > 1){ acc.jaw/=total; acc.wide/=total; acc.round/=total; }
    tgt = acc;
  }
  function rest_(){ tgt = { jaw:0, wide:0, round:0 }; }

  /* ---- rotation ---- */
  var yaw = 0, pitch = 0, vYaw = 0, dragging = false, lx = 0, ly = 0, touched = false;
  var YAW_MAX = 0.32, PITCH_MAX = 0.16;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', function(e){
    dragging = true; touched = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function(e){
    if (!dragging) return;
    var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    yaw = Math.max(-YAW_MAX, Math.min(YAW_MAX, yaw + dx * 0.004));
    pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch + dy * 0.003));
    vYaw = dx * 0.004;
  });
  function endDrag(){ dragging = false; }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('dblclick', function(){ yaw = 0; pitch = 0; vYaw = 0; touched = false; });

  function fit(){
    var w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(container);
  window.addEventListener('resize', fit);
  fit();

  var clock = new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    var k = 1 - Math.pow(0.0001, dt);
    cur.jaw += (tgt.jaw - cur.jaw) * k;
    cur.wide += (tgt.wide - cur.wide) * k;
    cur.round += (tgt.round - cur.round) * k;

    if (!reduced){
      if (blinkT < 0 && t > nextBlink){ blinkT = 0; nextBlink = t + 2.7 + Math.random()*4.1; }
      if (blinkT >= 0){
        blinkT += dt; var B = 0.13;
        blink = blinkT < B/2 ? blinkT/(B/2) : 1 - (blinkT - B/2)/(B/2);
        if (blinkT > B){ blinkT = -1; blink = 0; }
      }
      if (!dragging){
        if (Math.abs(vYaw) > 0.0003){ yaw += vYaw; vYaw *= 0.90;
          yaw = Math.max(-YAW_MAX, Math.min(YAW_MAX, yaw)); }
        else if (!touched) yaw = Math.sin(t * 0.23) * 0.10;
      }
      head.rotation.z = Math.sin(t * 0.19) * 0.010;
      head.position.y = Math.sin(t * 0.61) * 0.005;
    }
    interior.visible = cur.jaw > 0.10;
    apply();
    rig.rotation.y = yaw; rig.rotation.x = pitch;
    renderer.render(scene, camera);
  })();

  function debug(){
    var c = LM.chin;
    return { jaw:+cur.jaw.toFixed(3), lipY:+lipY.toFixed(3), chinY:+chinY.toFixed(3),
             span:+span.toFixed(3), hingeY:+hingeY.toFixed(3), hingeZ:+hingeZ.toFixed(3),
             chinRestY:+rest[c*3+1].toFixed(3), chinNowY:+pos[c*3+1].toFixed(3),
             chinRestZ:+rest[c*3+2].toFixed(3), chinNowZ:+pos[c*3+2].toFixed(3),
             chinW:+jawW[c].toFixed(3), lipW:+jawW[LM.lowerLipInner].toFixed(3) };
  }
  return { setVisemes:setVisemes, rest:rest_, debug:debug,
           reset:function(){ yaw=0;pitch=0;vYaw=0;touched=false; } };
}
