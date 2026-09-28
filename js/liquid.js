import * as THREE from './vendor/three.module.js';

// A procedural sculpture: closed, tapered metal surfaces, not an animated image.
const hero = document.querySelector('.hero');
const canvas = document.querySelector('.liquid-canvas');

function createLiquid() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
  camera.position.set(0, 0, 11);
  const sculpture = new THREE.Group();
  scene.add(sculpture);
  const time = { value: 0 };

  // Locally generated studio illumination: narrow bright strips and aurora panels
  // reflect across the moving surfaces. No HDRI downloads or external requests.
  const studio = document.createElement('canvas');
  studio.width = 2048;
  studio.height = 1024;
  const ctx = studio.getContext('2d');
  ctx.fillStyle = '#0c1117';
  ctx.fillRect(0, 0, 2048, 1024);
  const panels = [
    [30, 160, 250, 680, '#edfaff'], [390, 40, 45, 900, '#ffffff'],
    [480, 100, 230, 820, '#bea5ff'], [730, 90, 95, 780, '#fbfff2'],
    [940, 120, 330, 740, '#d9fff0'], [1295, 50, 35, 920, '#ffffff'],
    [1450, 80, 200, 800, '#fff1e9'], [1720, 190, 90, 620, '#e4ff83'],
    [1900, 50, 26, 910, '#ffffff']
  ];
  for (const [x, y, w, h, color] of panels) {
    const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
    gradient.addColorStop(0, '#10151e');
    gradient.addColorStop(.18, color);
    gradient.addColorStop(.8, color);
    gradient.addColorStop(1, '#10151e');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
  }
  ctx.fillStyle = '#f6f9ff';
  ctx.fillRect(0, 30, 2048, 55);
  ctx.fillStyle = '#939cb0';
  ctx.fillRect(0, 890, 2048, 60);
  const environment = new THREE.CanvasTexture(studio);
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  let environmentTarget = pmrem.fromEquirectangular(environment);
  scene.environment = environmentTarget.texture;
  pmrem.dispose();

  const metal = new THREE.MeshPhysicalMaterial({
    color: 0xe3e7ec, metalness: 1, roughness: .11,
    iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessRange: [180, 480],
    clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1.8
  });
  // Deform in object space; use the deformation's local tangent derivatives to
  // update normals too. Highlights follow the actual bending, not the old mesh.
  metal.onBeforeCompile = shader => {
    shader.uniforms.uLife = time;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `
      #include <common>
      uniform float uLife;
      varying vec3 vFilmPosition;
      vec3 alive(vec3 p) {
        float t = uLife;
        float reach = smoothstep(0.0, 3.8, length(p));
        p.x += .18 * sin(p.y * 1.65 + t * .79) + .08 * sin(p.z * 2.4 - t * .51);
        p.y += .19 * sin(p.x * 1.28 - t * .67) + .07 * cos(p.z * 2.7 + t * .8);
        p.z += (.14 + .17 * reach) * sin(p.x * 1.5 + p.y * .85 + t * .61);
        float twist = .12 * sin(t * .47 + p.y * .72);
        p.xz = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * p.xz;
        return p * (1.0 + .025 * sin(t * .91 + p.y));
      }
    `).replace('#include <beginnormal_vertex>', `
      vec3 n = normalize(normal);
      vec3 axis = abs(n.y) < .9 ? vec3(0., 1., 0.) : vec3(1., 0., 0.);
      vec3 tangentA = normalize(cross(axis, n));
      vec3 tangentB = cross(n, tangentA);
      vec3 deformedA = alive(position + tangentA * .005) - alive(position - tangentA * .005);
      vec3 deformedB = alive(position + tangentB * .005) - alive(position - tangentB * .005);
      vec3 objectNormal = normalize(cross(deformedA, deformedB));
    `).replace('#include <begin_vertex>', 'vec3 transformed = alive(position); vFilmPosition = transformed;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
      #include <common>
      varying vec3 vFilmPosition;
    `).replace('#include <lights_physical_fragment>', `
      #include <lights_physical_fragment>
      material.iridescenceThickness = 210.0 + 240.0 * (.5 + .5 * sin(vFilmPosition.x * 2.4 + vFilmPosition.y * 1.8 + vFilmPosition.z));
    `);
  };

  // A ribbed elliptical section twists along a curved spine and tapers to a
  // needle at each end. A handful of intersecting spines forms one organism.
  function blade(points, radius, flatten, twist, segments = 100) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const frames = curve.computeFrenetFrames(segments, false);
    const sides = 24;
    const positions = [], indices = [];
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const center = curve.getPointAt(u);
      const taper = Math.pow(Math.sin(Math.PI * u), 1.4);
      const width = radius * taper + .0006;
      for (let j = 0; j <= sides; j++) {
        const angle = j / sides * Math.PI * 2;
        const a = angle + u * twist;
        const ridge = 1 + .13 * Math.cos(angle * 3 + u * 9);
        const v = center.clone()
          .addScaledVector(frames.normals[i], Math.cos(a) * width * ridge)
          .addScaledVector(frames.binormals[i], Math.sin(a) * width * flatten * ridge);
        positions.push(v.x, v.y, v.z);
        if (i < segments && j < sides) {
          const k = i * (sides + 1) + j;
          indices.push(k, k + sides + 1, k + 1, k + 1, k + sides + 1, k + sides + 2);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    // Weld the section seam normals to keep mirror reflections continuous.
    const normals = geometry.attributes.normal;
    for (let i = 0; i <= segments; i++) {
      const first = i * (sides + 1), last = first + sides;
      const n = new THREE.Vector3().fromBufferAttribute(normals, first)
        .add(new THREE.Vector3().fromBufferAttribute(normals, last)).normalize();
      normals.setXYZ(first, n.x, n.y, n.z);
      normals.setXYZ(last, n.x, n.y, n.z);
    }
    const mesh = new THREE.Mesh(geometry, metal);
    // Vertex deformation exceeds the original static bounding sphere.
    mesh.frustumCulled = false;
    sculpture.add(mesh);
  }

  // Long diagonal gesture, hooked fins and open negative spaces.
  blade([[-5,-2.8,-.2],[-2,-1.1,.1],[0,.15,0],[1.5,1.3,.1],[3.1,4.3,-.4]], .48,.43,3.2,150);
  blade([[-3.6,2,.1],[-1.1,.5,.2],[.6,-.2,.1],[2.3,.6,0],[5,2.8,-.3]], .48,.36,-3.5,140);
  blade([[-1.9,3.8,-.6],[-.1,1.3,0],[.5,-.3,.3],[1.4,-1.5,0],[3.7,-3.2,-.4]], .43,.48,4.5,130);
  blade([[-3,-2.2,.1],[-.8,-.7,.6],[1.7,.7,.3],[1.7,1.8,-.2],[3.8,3.1,-.3]], .27,.55,5,130);
  blade([[-2.7,1.8,-.3],[-.9,1.1,.5],[1.4,.3,.7],[1.9,-.9,0],[3.1,-2.6,-.3]], .29,.4,-3.8,120);
  blade([[-2.7,-.6,-.2],[-.5,-1.1,-.2],[1.9,-.3,.4],[2.8,1.1,.1],[4.4,1.6,-.3]], .3,.42,4.1,120);
  blade([[-.9,-3.7,-.3],[-.7,-1.2,.1],[0,.1,.6],[-.5,1.8,.3],[.4,4,-.4]], .3,.42,3.7,120);
  blade([[-4.2,.4,-.7],[-1.3,-.1,-.2],[.7,.9,-.1],[1.3,2.5,0],[2.5,4.8,-.4]], .24,.38,-4,110);
  blade([[-1.8,-3,-.6],[-.5,-1,.2],[1.1,.1,.4],[3.2,-.4,-.4],[5.2,-1.2,-.7]], .2,.45,3,100);

  let paused = hero.dataset.motionPaused === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true, lost = false, frame = 0, previous = 0, lastRender = 0;
  let elapsed = 0, compact = false;
  const pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  const finePointer = matchMedia('(pointer: fine)');

  function render() {
    time.value = elapsed;
    sculpture.rotation.set(.08 + Math.sin(elapsed * .25) * .09 + pointer.y * .06,
      -.18 + Math.sin(elapsed * .21) * .16 + pointer.x * .1,
      -.13 + Math.sin(elapsed * .19) * .04);
    renderer.render(scene, camera);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
  }
  function animate(now) {
    frame = 0;
    if (paused || !visible || lost || document.hidden) return;
    frame = requestAnimationFrame(animate);
    // Cap touch rendering at 30 fps and avoid catch-up jumps after hidden tabs.
    if (now - lastRender < (compact ? 32 : 16)) return;
    const delta = previous ? Math.min((now - previous) / 1000, .05) : 0;
    previous = now;
    lastRender = now;
    elapsed += delta;
    const ease = 1 - Math.exp(-delta * 5);
    pointer.x += (target.x - pointer.x) * ease;
    pointer.y += (target.y - pointer.y) * ease;
    render();
  }
  function wake() {
    if (!frame && !paused && visible && !lost && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function resize() {
    if (lost) return;
    const w = hero.clientWidth, h = hero.clientHeight;
    compact = w <= 600;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const span = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    sculpture.position.set(span * camera.aspect * (compact ? .21 : .19), span * (compact ? .11 : .01), 0);
    sculpture.scale.setScalar(compact ? .65 : 1);
    render();
  }

  // Keep the original artwork visible until the first real WebGL frame exists.
  resize();
  hero.dataset.liquidReady = '';
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake(); else stop();
  }).observe(hero);
  hero.addEventListener('hero-motion', event => {
    paused = event.detail.paused;
    if (paused) stop(); else wake();
  });
  hero.addEventListener('pointermove', event => {
    if (paused || !finePointer.matches || event.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect();
    target.x = (event.clientX - r.left) / r.width - .5;
    target.y = (event.clientY - r.top) / r.height - .5;
  });
  hero.addEventListener('pointerleave', () => { target.x = target.y = 0; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else wake(); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    stop();
    delete hero.dataset.liquidReady;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    // Render targets are empty after context restoration; rebuild reflections.
    environmentTarget.dispose();
    const generator = new THREE.PMREMGenerator(renderer);
    environmentTarget = generator.fromEquirectangular(environment);
    scene.environment = environmentTarget.texture;
    generator.dispose();
    resize();
    hero.dataset.liquidReady = '';
    wake();
  });
  wake();
}

try {
  createLiquid();
} catch (error) {
  // WebGL-disabled devices retain the approved static composition and all UI.
  delete hero.dataset.liquidReady;
  console.warn('3D artwork unavailable; using the static artwork.', error);
}
