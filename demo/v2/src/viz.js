import * as THREE from 'three';

/* Memory rendered as volume: the device's VRAM is a cage, the model is a stack
   of transformer layers inside it, KV cache and overhead slab on top. */
export function createViz(container){
  var canvas = document.createElement('canvas');
  container.appendChild(canvas);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) { return null; }
  if (!renderer) return null;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(6.4, 4.2, 7.6);

  var pivot = new THREE.Group();
  scene.add(pivot);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9098a0, 2.1));
  var key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(5, 9, 6); scene.add(key);
  var fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-6, 3, -4); scene.add(fill);

  var C = {};
  function readVars(){
    var cs = getComputedStyle(document.documentElement);
    var g = function(n){ return new THREE.Color(cs.getPropertyValue(n).trim() || '#888'); };
    C = { accent:g('--accent'), data:g('--data'), line2:g('--line2'), ink:g('--ink'), bad:g('--bad') };
  }
  readVars();

  var WORLD_H = 4.2, BW = 2.05, CW = 2.62;

  var stack = new THREE.Group(); pivot.add(stack);
  var cage  = new THREE.Group(); pivot.add(cage);

  // device limit cage
  var cageBox = new THREE.Mesh(
    new THREE.BoxGeometry(CW, 1, CW),
    new THREE.MeshBasicMaterial({ color:C.ink, transparent:true, opacity:0.035, depthWrite:false })
  );
  var cageLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(CW, 1, CW)),
    new THREE.LineBasicMaterial({ color:C.ink, transparent:true, opacity:0.55 })
  );
  cage.add(cageBox); cage.add(cageLines);

  // ground
  var ring = new THREE.Mesh(
    new THREE.RingGeometry(1.7, 3.2, 48),
    new THREE.MeshBasicMaterial({ color:C.line2, transparent:true, opacity:0.3, side:THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI/2; ring.position.y = -0.005; pivot.add(ring);

  var blocks = [];
  function block(color, opacity){
    var m = new THREE.Mesh(
      new THREE.BoxGeometry(BW, 1, BW),
      new THREE.MeshStandardMaterial({ color:color, roughness:0.55, metalness:0.05,
        transparent: opacity < 1, opacity: opacity })
    );
    var e = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(BW, 1, BW)),
      new THREE.LineBasicMaterial({ color:C.ink, transparent:true, opacity:0.22 })
    );
    m.add(e); stack.add(m); blocks.push(m); return m;
  }

  var dragging = false, lastX = 0, spin = 0.6, velocity = 0;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', function(e){ dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', function(e){
    if(!dragging) return;
    var dx = e.clientX - lastX; lastX = e.clientX;
    spin += dx * 0.01; velocity = dx * 0.01;
  });
  function end(){ dragging = false; }
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  function resize(){
    var w = container.clientWidth, h = container.clientHeight;
    if(!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(container);
  window.addEventListener('resize', resize);
  resize();

  var mqDark = matchMedia('(prefers-color-scheme: dark)');
  if (mqDark.addEventListener) mqDark.addEventListener('change', function(){ readVars(); applyTheme(); });
  function applyTheme(){
    cageBox.material.color.copy(C.ink);
    cageLines.material.color.copy(C.ink);
    ring.material.color.copy(C.line2);
  }

  function clear(){
    blocks.forEach(function(b){
      b.geometry.dispose(); b.material.dispose();
      b.children.forEach(function(c){ c.geometry.dispose(); c.material.dispose(); });
      stack.remove(b);
    });
    blocks = [];
  }

  var current = null;

  function update(d){
    current = d;
    clear();
    readVars(); applyTheme();

    var span = Math.max(d.total, d.cap) * 1.04;
    var u = function(bytes){ return (bytes / span) * WORLD_H; };

    var capH = u(d.cap);
    cageBox.scale.y = capH; cageBox.position.y = capH / 2;
    cageLines.scale.y = capH; cageLines.position.y = capH / 2;

    var y = 0;
    var over = function(centerY){ return centerY > capH; };

    // transformer layers
    var wH = u(d.weights);
    var n = Math.max(3, Math.min(d.layers, 18));
    var gap = Math.min(0.012, wH / (n * 6));
    var segH = (wH - gap * (n - 1)) / n;
    for (var i = 0; i < n; i++){
      var cy = y + segH / 2;
      var b = block(C.accent, 1);
      b.scale.y = Math.max(segH, 0.0015); b.position.y = cy;
      if (over(cy)) b.material.color.copy(C.bad);
      y += segH + gap;
    }

    // KV cache
    var kvH = u(d.kv);
    if (kvH > 0.002){
      var kcy = y + kvH / 2;
      var kb = block(C.data, 0.92);
      kb.scale.y = kvH; kb.position.y = kcy;
      if (over(kcy)) kb.material.color.copy(C.bad);
      y += kvH;
    }

    // activations + overhead
    var ovH = u(d.overhead);
    if (ovH > 0.002){
      var ocy = y + ovH / 2;
      var ob = block(C.line2, 0.75);
      ob.scale.y = ovH; ob.position.y = ocy;
      if (over(ocy)) ob.material.color.copy(C.bad);
      y += ovH;
    }

    camera.lookAt(0, Math.max(capH, y) * 0.46, 0);
  }

  var clock = new THREE.Clock();
  function loop(){
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05);
    if (!dragging){
      if (Math.abs(velocity) > 0.0001){ spin += velocity; velocity *= 0.92; }
      else if (!reduced) spin += dt * 0.19;
    }
    pivot.rotation.y = spin;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);

  return { update: update, redraw: function(){ if(current) update(current); } };
}
