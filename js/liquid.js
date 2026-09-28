import * as THREE from './vendor/three.module.js';

// Closed image-derived sculpture with a coherent, breathing 3D surface.
const hero = document.querySelector('.hero');
const canvas = document.querySelector('.liquid-canvas');

async function createLiquid() {
  const response = await fetch(new URL("../assets/models/liquid-sculpture.bin?v=reference-2", import.meta.url), { cache: "no-cache" });
  if (!response.ok) throw new Error("Unable to load liquid mesh");
  const meshData = await response.arrayBuffer();
  const header = new DataView(meshData);
  if (header.getUint32(0, true) !== 0x3444514c) throw new Error("Invalid liquid mesh");
  const vertexCount = header.getUint32(4, true), indexCount = header.getUint32(8, true);
  const reference = await new THREE.TextureLoader().loadAsync(new URL('../assets/chrome-sculpture.png',import.meta.url).href);
  reference.colorSpace = THREE.SRGBColorSpace;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const key = new THREE.PointLight(0xffffff, 38);
  key.position.set(-3,4,5);
  scene.add(key);
  const rim = new THREE.PointLight(0xffffff, 24);
  rim.position.set(3,-2,4);
  scene.add(rim);
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
  ctx.fillStyle = '#383c43';
  ctx.fillRect(0, 0, 2048, 1024);
  const panels = [
    [30, 160, 250, 680, '#edfaff'], [390, 40, 45, 900, '#ffffff'],
    [480, 100, 150, 820, '#ee86ff'], [730, 90, 95, 780, '#fbfff2'],
    [940, 120, 240, 740, '#9bffff'], [1295, 50, 35, 920, '#ffffff'],
    [1450, 80, 200, 800, '#fff1e9'], [1720, 190, 90, 620, '#eaff36'],
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
  // Narrow saturated strips catch the curved folds like spectral reflections.
  for (const [left,width] of [[250,95],[650,85],[1190,100],[1590,75],[1800,65]]) {
    const spectral=ctx.createLinearGradient(left,0,left+width,0);
    for (const [stop,color] of [[0,'#ffffff'],[.15,'#49eaff'],[.35,'#7881ff'],[.5,'#ff56e9'],[.68,'#ffad3a'],[.84,'#eeff52'],[1,'#ffffff']]) spectral.addColorStop(stop,color);
    ctx.fillStyle=spectral;
    ctx.fillRect(left,160,width,700);
  }
  const pixels = ctx.getImageData(0,0,studio.width,studio.height).data;
  const hdr = new Float32Array(pixels.length);
  for (let i=0;i<pixels.length;i+=4) {
    const luminance = Math.max(pixels[i],pixels[i+1],pixels[i+2])/255;
    const intensity = .3 + 5.0*Math.pow(luminance,4);
    for (let channel=0;channel<3;channel++) {
      const c = pixels[i+channel]/255;
      hdr[i+channel] = (c <= .04045 ? c/12.92 : Math.pow((c+.055)/1.055,2.4))*intensity;
    }
    hdr[i+3]=1;
  }
  const environment = new THREE.DataTexture(hdr,studio.width,studio.height,THREE.RGBAFormat,THREE.FloatType);
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.LinearSRGBColorSpace;
  environment.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  let environmentTarget = pmrem.fromEquirectangular(environment);
  scene.environment = environmentTarget.texture;
  pmrem.dispose();

  const metal = new THREE.MeshPhysicalMaterial({
    color: 0xe3e7ec, metalness: 1, roughness: .085,
    iridescence: .92, iridescenceIOR: 1.8, iridescenceThicknessRange: [180, 480],
    clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.0
  });
  // One watertight surface reconstructed from the approved artwork's outline.
  // Its thickness and folded profile are generated offline; animation is a radial
  // deformation field, so the roots and openings stretch with the same body.
  metal.onBeforeCompile = shader => {
    shader.uniforms.uLife = time;
    shader.uniforms.uReference = { value: reference };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `
      #include <common>
      uniform float uLife;
      varying vec3 vFilmPosition;
      varying vec2 vReferenceUv;
      vec3 alive(vec3 p) {
        float angle = atan(p.y, p.x);
        float reach = smoothstep(.3, 3.5, length(p.xy));
        float pulse = .16 * sin(uLife*1.35 + angle*3.0) + .06 * sin(uLife*2.1 - angle*5.0);
        float stretch = 1.0 + .035*sin(uLife*1.35) + reach*pulse;
        p.xy *= stretch;
        p.z *= 1.0 + .055*reach*sin(uLife*1.1 + angle*2.0);
        return p;
      }
    `).replace('#include <beginnormal_vertex>', `
      vec3 n = normalize(normal);
      vec3 axis = abs(n.y) < .9 ? vec3(0.,1.,0.) : vec3(1.,0.,0.);
      vec3 ta = normalize(cross(axis,n));
      vec3 tb = cross(n,ta);
      vec3 da = alive(position+ta*.003)-alive(position-ta*.003);
      vec3 db = alive(position+tb*.003)-alive(position-tb*.003);
      vec3 objectNormal = normalize(cross(da,db));
    `).replace('#include <begin_vertex>', 'vec3 transformed = alive(position); vFilmPosition = transformed; vReferenceUv = uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
      #include <common>
      uniform sampler2D uReference;
      varying vec3 vFilmPosition;
      varying vec2 vReferenceUv;
    `).replace('#include <lights_physical_fragment>', `
      #include <lights_physical_fragment>
      material.iridescenceThickness = 180.0 + 380.0 * (.5 + .5 * sin(vFilmPosition.x * 2.8 + vFilmPosition.y * 2.0 + sin(vFilmPosition.z*5.0)));
    `).replace('#include <opaque_fragment>', `
      float filmAngle = dot(normalize(normal), normalize(vViewPosition));
      float spectralPhase = filmAngle * 15.0 + vFilmPosition.x * 2.2 + vFilmPosition.y * 1.4;
      vec3 spectral = .52 + .48 * cos(spectralPhase + vec3(0.0, 2.094, 4.189));
      float spectralBand = pow(.5 + .5 * sin(spectralPhase * .71), 5.0) * .88;
      outgoingLight *= mix(vec3(1.0), spectral, spectralBand);
      #include <opaque_fragment>
    `).replace('#include <tonemapping_fragment>', `
      #include <tonemapping_fragment>
      // Baked reflection detail preserves the artwork's character; live lighting
      // supplies changing highlights on the reconstructed, deforming 3D surface.
      vec3 referenceColor = texture2D(uReference, vReferenceUv).rgb;
      float facing = abs(dot(normalize(normal),normalize(vViewPosition)));
      float preserve = mix(.28,.86,smoothstep(.08,.55,facing));
      gl_FragColor.rgb = mix(gl_FragColor.rgb, referenceColor, preserve);
    `);
  };

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(meshData,12,vertexCount*3),3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(meshData,12+vertexCount*22,indexCount),1));
  geometry.setAttribute('normal',new THREE.BufferAttribute(new Int16Array(meshData,12+vertexCount*12,vertexCount*3),3,true));
  geometry.setAttribute('uv',new THREE.BufferAttribute(new Uint16Array(meshData,12+vertexCount*18,vertexCount*2),2,true));
  const mesh = new THREE.Mesh(geometry,metal);
  mesh.frustumCulled = false;
  sculpture.add(mesh);

  let paused = hero.dataset.motionPaused === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true, lost = false, frame = 0, previous = 0, lastRender = 0;
  let elapsed = 0, compact = false;
  const pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  const finePointer = matchMedia('(pointer: fine)');

  function render() {
    time.value = elapsed;
    sculpture.rotation.set(.04 + Math.sin(elapsed * .23) * .035 + pointer.y * .04,
      -.06 + Math.sin(elapsed * .18) * .065 + pointer.x * .06,
      .03 + Math.sin(elapsed * .16) * .025);
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
    sculpture.scale.setScalar(compact ? .72 : 1.0);
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

createLiquid().catch(error => {
  // WebGL-disabled devices retain the approved static composition and all UI.
  delete hero.dataset.liquidReady;
  console.warn('3D artwork unavailable; using the static artwork.', error);
});
