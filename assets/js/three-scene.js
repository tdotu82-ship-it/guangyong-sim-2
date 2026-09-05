/**
 * 光泳效应虚拟仿真实验平台 — Three.js 场景
 * 懒加载架构：页面加载时创建当前active tab的场景，tab切换时创建新场景并清理旧场景
 */

// ===== 工具函数 =====
function createTextCanvas(text, color, w, h) {
  w = w || 256; h = h || 128;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, w, h);
  ctx.font = 'bold 32px Microsoft YaHei, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w/2, h/2);
  return canvas;
}

function addLabel3D(scene, text, x, y, z, color) {
  const canvas = createTextCanvas(text, color);
  const geo = new THREE.PlaneGeometry(2, 0.7);
  const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
}

function addStars(scene, count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 60;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x4a6fa5, size: 0.08, transparent: true, opacity: 0.6 })));
}

function addGrid(scene, size) {
  const g = new THREE.GridHelper(size || 20, 20, 0x1e3a5f, 0x0f1d30);
  g.position.y = -3;
  scene.add(g);
}

// 获取容器可见尺寸，若为0则返回默认值（等tab激活后resize会修正）
function getContainerSize(container) {
  const w = Math.max(container.clientWidth, 300);
  const h = Math.max(container.clientHeight, 200);
  return { w, h };
}

// ===== 场景实例缓存 =====
const sceneInstances = {};
let activeSceneName = null;

// 清理旧场景（停止动画，移除canvas）
function disposeScene(name) {
  const inst = sceneInstances[name];
  if (!inst) return;
  if (inst.animId) cancelAnimationFrame(inst.animId);
  if (inst.renderer?.domElement?.parentNode) {
    inst.renderer.domElement.parentNode.removeChild(inst.renderer.domElement);
  }
  inst.renderer?.dispose();
  inst.controls?.dispose();
  sceneInstances[name] = null;
}

// 切换场景（创建新场景，替换旧canvas）
function switchScene(targetName, buildFn) {
  // 如果当前已是目标场景，不做任何操作
  if (activeSceneName === targetName && sceneInstances[targetName]) return;

  // 如果目标场景已缓存，直接切换（不重新创建）
  if (sceneInstances[targetName]) {
    activeSceneName = targetName;
    const container = document.getElementById(targetName === 'module1' ? 'theoryScene1' : targetName === 'module2' ? 'theoryScene2' : 'theoryScene3');
    if (container) {
      // 清理旧canvas
      const oldCanvas = container.querySelector('canvas');
      if (oldCanvas) oldCanvas.remove();
      const inst = sceneInstances[targetName];
      if (inst && inst.renderer && inst.renderer.domElement) {
        container.appendChild(inst.renderer.domElement);
        // 隐藏loading
        const loading = container.querySelector('.three-loading');
        if (loading) loading.remove();
        inst.onResize();
      }
    }
    return;
  }

  // 清理旧场景（停止动画，移除旧canvas）
  if (activeSceneName && activeSceneName !== targetName) {
    disposeScene(activeSceneName);
  }

  // 创建新场景（每次创建新的，确保容器尺寸正确）
  const instance = buildFn();
  if (instance) {
    sceneInstances[targetName] = instance;
    activeSceneName = targetName;
  }
}

// ================================================================
// 模块1: 光压力原理
// ================================================================
function buildModule1Scene() {
  const container = document.getElementById('theoryScene1');
  if (!container) return null;
  const { w, h } = getContainerSize(container);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);
  const camera = new THREE.PerspectiveCamera(50, w/h, 0.1, 100);
  camera.position.set(0, 2, 9);
  camera.lookAt(0, -0.5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const loading = container.querySelector('.three-loading');
  if (loading) loading.remove();
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5; controls.maxDistance = 20;
  controls.target.set(0, -0.5, 0);

  addStars(scene, 400);
  addGrid(scene, 20);
  scene.add(new THREE.AmbientLight(0x1a2a4a, 0.8));
  const pointLight = new THREE.PointLight(0xfbbf24, 4, 30);
  pointLight.position.set(0, 8, 2);
  scene.add(pointLight);

  // 光源
  const lightGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const lightSphere = new THREE.Mesh(lightGeo, lightMat);
  lightSphere.position.set(0, 6, 0);
  scene.add(lightSphere);
  for (let i = 3; i >= 1; i--) {
    lightSphere.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.6 + i*0.25, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.06/i })
    ));
  }

  // 光锥
  const beamGeo = new THREE.ConeGeometry(2.5, 7, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.04, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 2.5, 0);
  beam.rotation.x = Math.PI;
  scene.add(beam);

  // 薄板（水平放置）
  const plateGeo = new THREE.BoxGeometry(3, 0.06, 2.5);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.3 });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.set(0, -1.5, 0);
  scene.add(plate);

  addLabel3D(scene, '薄板', 0, -2.0, 0, '#fbbf24');
  addLabel3D(scene, 'F ↓', 0, -2.6, 0, '#ef4444');

  const forceArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, -1.0, 0),
    1.5, 0xef4444, 0.3, 0.15
  );
  scene.add(forceArrow);

  const formulaCanvas = createTextCanvas('F = P(2ρ+α) / (c·cos²θ)', '#fbbf24', 512, 64);
  const formulaMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 0.5),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(formulaCanvas), transparent: true, side: THREE.DoubleSide })
  );
  formulaMesh.position.set(0, -3.0, 0);
  scene.add(formulaMesh);

  // 光子系统
  const photons = [];
  const sparkParticles = [];
  const photonGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const clock = new THREE.Clock();
  let isPaused = false;
  let showForces = true;
  let lastPhotonTime = 0;

  function createPhoton() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(photonGeo, mat);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.2 })
    );
    mesh.add(glow);
    mesh.position.set((Math.random()-0.5)*2, 5.5, (Math.random()-0.5)*1.5);
    scene.add(mesh);
    return { mesh, speed: 7+Math.random()*3 };
  }

  function createSpark(pos) {
    const geo = new THREE.SphereGeometry(0.05, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return { mesh, life: 1.0, vel: new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2) };
  }

  function createReflectedPhoton(pos) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.6 });
    const mesh = new THREE.Mesh(photonGeo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.1;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3((Math.random()-0.5)*0.3, 2+Math.random()*1.5, (Math.random()-0.5)*0.3), life: 1.0 };
  }

  for (let i = 0; i < 20; i++) photons.push(createPhoton());

  function animate() {
    const id = requestAnimationFrame(animate);
    if (isPaused) { controls.update(); renderer.render(scene, camera); return; }

    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsedTime();

    lightSphere.scale.setScalar(1 + 0.08*Math.sin(time*3));
    beam.material.opacity = 0.04 + 0.02*Math.sin(time*3);

    if (time - lastPhotonTime > 0.18) {
      lastPhotonTime = time;
      photons.push(createPhoton());
    }

    const plateY = -1.5;
    for (let i = photons.length-1; i >= 0; i--) {
      if (photons.length > 35 && i < photons.length-8) continue;
      const p = photons[i];
      p.mesh.position.y -= p.speed * dt;
      if (p.mesh.position.y <= plateY + 0.06) {
        if (Math.random() < 0.85) {
          sparkParticles.push(createReflectedPhoton(p.mesh.position.clone()));
        } else {
          for (let j = 0; j < 2; j++) sparkParticles.push(createSpark(p.mesh.position.clone()));
        }
        scene.remove(p.mesh);
        photons.splice(i, 1);
      }
      if (p.mesh.position.y < -5) { scene.remove(p.mesh); photons.splice(i, 1); }
    }

    for (let i = sparkParticles.length-1; i >= 0; i--) {
      const s = sparkParticles[i];
      s.mesh.position.addScaledVector(s.vel, dt);
      s.life -= dt * 0.6;
      s.mesh.material.opacity = Math.max(0, s.life);
      if (s.life <= 0 || s.mesh.position.y > 10) { scene.remove(s.mesh); sparkParticles.splice(i, 1); }
    }

    const pulse = 0.85 + 0.15*Math.sin(time*4);
    forceArrow.setLength(1.5*pulse, 0.3, 0.15);
    forceArrow.visible = showForces;

    controls.update();
    renderer.render(scene, camera);
  }
  const animId = animate();

  document.getElementById('m1PauseBtn')?.addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('m1PauseBtn').textContent = isPaused ? '▶ 播放' : '⏸ 暂停';
  });
  document.getElementById('m1ResetBtn')?.addEventListener('click', () => {
    photons.forEach(p => scene.remove(p.mesh)); photons.length = 0;
    sparkParticles.forEach(s => scene.remove(s.mesh)); sparkParticles.length = 0;
  });
  document.getElementById('m1ShowForces')?.addEventListener('change', (e) => { showForces = e.target.checked; });

  const instance = {
    animId, renderer, controls,
    onResize: () => {
      const container = document.getElementById('theoryScene1');
      if (!container) return;
      const { w: nw, h: nh } = getContainerSize(container);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
  };
  sceneInstances['module1'] = instance;
  return instance;
}

// ================================================================
// 模块2: 光泳效应原理
// ================================================================
function buildModule2Scene() {
  const container = document.getElementById('theoryScene2');
  if (!container) return null;
  const { w, h } = getContainerSize(container);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);
  const camera = new THREE.PerspectiveCamera(50, w/h, 0.1, 100);
  camera.position.set(0, 2, 9);
  camera.lookAt(0, -0.5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const loading = container.querySelector('.three-loading');
  if (loading) loading.remove();
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5; controls.maxDistance = 20;
  controls.target.set(0, -0.5, 0);

  addStars(scene, 400);
  addGrid(scene, 20);
  scene.add(new THREE.AmbientLight(0x1a2a4a, 0.8));
  const pointLight = new THREE.PointLight(0xfbbf24, 4, 30);
  pointLight.position.set(0, 8, 2);
  scene.add(pointLight);

  // 光源
  const lightGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const lightSphere = new THREE.Mesh(lightGeo, lightMat);
  lightSphere.position.set(0, 6, 0);
  scene.add(lightSphere);
  for (let i = 3; i >= 1; i--) {
    lightSphere.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.6 + i*0.25, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.06/i })
    ));
  }

  // 光锥
  const beamGeo = new THREE.ConeGeometry(2.5, 7, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.04, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 2.5, 0);
  beam.rotation.x = Math.PI;
  scene.add(beam);

  // 薄板（上半截红色高温侧，下半截蓝色低温侧）
  const plateW = 3, plateH = 0.06, plateD = 2.5;
  const plateMatTop = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0xff0000,
    emissiveIntensity: 0.3,
    roughness: 0.5
  });
  const plateMatBottom = new THREE.MeshStandardMaterial({
    color: 0x3366ff,
    emissive: 0x0044ff,
    emissiveIntensity: 0.2,
    roughness: 0.5
  });
  // 上半板（红色）
  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(plateW, plateH, plateD), plateMatTop);
  topPlate.position.set(0, -1.47, 0);
  scene.add(topPlate);
  // 下半板（蓝色）
  const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(plateW, plateH, plateD), plateMatBottom);
  bottomPlate.position.set(0, -1.53, 0);
  scene.add(bottomPlate);
  // 合并为一个引用用于后续操作
  const plate = topPlate;

  addLabel3D(scene, '薄板', 0, -2.0, 0, '#fbbf24');
  addLabel3D(scene, '高温侧', 0, -0.5, 1.8, '#ff3333');
  addLabel3D(scene, '低温侧', 0, -2.5, 1.8, '#3366ff');
  addLabel3D(scene, 'F ↓', 0, -2.6, 0, '#ef4444');

  const forceArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, -1.0, 0),
    1.5, 0xef4444, 0.3, 0.15
  );
  scene.add(forceArrow);

  // 光子系统
  const photons = [];
  const sparkParticles = [];
  const photonGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const clock = new THREE.Clock();
  let isPaused = false;
  let lastPhotonTime = 0;

  function createPhoton() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(photonGeo, mat);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.2 })
    );
    mesh.add(glow);
    mesh.position.set((Math.random()-0.5)*2, 5.5, (Math.random()-0.5)*1.5);
    scene.add(mesh);
    return { mesh, speed: 7+Math.random()*3 };
  }

  function createSpark(pos) {
    const geo = new THREE.SphereGeometry(0.05, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return { mesh, life: 1.0, vel: new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2) };
  }

  function createReflectedPhoton(pos) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.6 });
    const mesh = new THREE.Mesh(photonGeo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.1;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3((Math.random()-0.5)*0.3, 2+Math.random()*1.5, (Math.random()-0.5)*0.3), life: 1.0 };
  }

  function createBottomPhoton() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(photonGeo, mat);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.2 })
    );
    mesh.add(glow);
    mesh.position.set((Math.random()-0.5)*2, -5.5, (Math.random()-0.5)*1.5);
    scene.add(mesh);
    return { mesh, speed: 7+Math.random()*3, fromBottom: true };
  }

  function createReflectedBottomPhoton(pos) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.6 });
    const mesh = new THREE.Mesh(photonGeo, mat);
    mesh.position.copy(pos);
    mesh.position.y -= 0.1;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3((Math.random()-0.5)*0.3, -(2+Math.random()*1.5), (Math.random()-0.5)*0.3), life: 1.0 };
  }

  for (let i = 0; i < 20; i++) photons.push(createPhoton());
  for (let i = 0; i < 20; i++) photons.push(createBottomPhoton());

  function animate() {
    const id = requestAnimationFrame(animate);
    if (isPaused) { controls.update(); renderer.render(scene, camera); return; }

    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsedTime();

    lightSphere.scale.setScalar(1 + 0.08*Math.sin(time*3));
    beam.material.opacity = 0.04 + 0.02*Math.sin(time*3);

    if (time - lastPhotonTime > 0.18) {
      lastPhotonTime = time;
      photons.push(createPhoton());
      photons.push(createBottomPhoton());
    }

    const plateY = -1.5;
    for (let i = photons.length-1; i >= 0; i--) {
      if (photons.length > 35 && i < photons.length-8) continue;
      const p = photons[i];
      // 判断是从上方还是下方来的
      if (p.fromBottom) {
        p.mesh.position.y += p.speed * dt; // 向上移动
        // 碰撞检测：打到板（y≈-1.5）
        if (p.mesh.position.y >= plateY - 0.02) {
          if (Math.random() < 0.85) {
            sparkParticles.push(createReflectedBottomPhoton(p.mesh.position.clone()));
          } else {
            for (let j = 0; j < 2; j++) sparkParticles.push(createSpark(p.mesh.position.clone()));
          }
          scene.remove(p.mesh);
          photons.splice(i, 1);
        }
        if (p.mesh.position.y > 5) { scene.remove(p.mesh); photons.splice(i, 1); }
      } else {
        p.mesh.position.y -= p.speed * dt; // 向下移动
        // 碰撞检测：打到板（y≈-1.5）
        if (p.mesh.position.y <= plateY + 0.02) {
          if (Math.random() < 0.85) {
            sparkParticles.push(createReflectedPhoton(p.mesh.position.clone()));
          } else {
            for (let j = 0; j < 2; j++) sparkParticles.push(createSpark(p.mesh.position.clone()));
          }
          scene.remove(p.mesh);
          photons.splice(i, 1);
        }
        if (p.mesh.position.y < -5) { scene.remove(p.mesh); photons.splice(i, 1); }
      }
    }

    for (let i = sparkParticles.length-1; i >= 0; i--) {
      const s = sparkParticles[i];
      s.mesh.position.addScaledVector(s.vel, dt);
      s.life -= dt * 0.6;
      s.mesh.material.opacity = Math.max(0, s.life);
      if (s.life <= 0 || s.mesh.position.y > 10) { scene.remove(s.mesh); sparkParticles.splice(i, 1); }
    }

    const pulse = 0.85 + 0.15*Math.sin(time*4);
    forceArrow.setLength(1.5*pulse, 0.3, 0.15);

    controls.update();
    renderer.render(scene, camera);
  }
  const animId = animate();

  document.getElementById('m2PauseBtn')?.addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('m2PauseBtn').textContent = isPaused ? '▶ 播放' : '⏸ 暂停';
  });
  document.getElementById('m2ResetBtn')?.addEventListener('click', () => {
    photons.forEach(p => scene.remove(p.mesh)); photons.length = 0;
    sparkParticles.forEach(s => scene.remove(s.mesh)); sparkParticles.length = 0;
  });

  const instance = {
    animId, renderer, controls,
    onResize: () => {
      const container = document.getElementById('theoryScene2');
      if (!container) return;
      const { w: nw, h: nh } = getContainerSize(container);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
  };
  sceneInstances['module2'] = instance;
  return instance;
}

// ================================================================
// 模块3: 光压抵消原理
// ================================================================
function buildModule3Scene() {
  const container = document.getElementById('theoryScene3');
  if (!container) return null;
  const { w, h } = getContainerSize(container);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);
  const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100);
  camera.position.set(0, 3, 12);
  camera.lookAt(0, -0.5, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const loading = container.querySelector('.three-loading');
  if (loading) loading.remove();
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5; controls.maxDistance = 20;
  controls.target.set(0, -0.5, 0);

  addStars(scene, 300);
  scene.add(new THREE.AmbientLight(0x1a2a4a, 0.6));
  const pointLight = new THREE.PointLight(0xfbbf24, 3, 30);
  pointLight.position.set(0, 8, 2);
  scene.add(pointLight);

  // 光源
  const lightGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const lightSphere = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
  lightSphere.position.set(0, 5.5, 0);
  scene.add(lightSphere);
  for (let i = 2; i >= 1; i--) {
    lightSphere.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.5+i*0.15, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.06/i })
    ));
  }

  // 光锥
  const beamGeo = new THREE.ConeGeometry(2.5, 5, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.04, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 3, 0);
  beam.rotation.x = Math.PI;
  scene.add(beam);

  // 前板：石墨（吸收）— 在 z=1.2，板范围 z∈[0.4, 2.0], x∈[-1, 1]
  const plateGeo = new THREE.BoxGeometry(2, 0.06, 1.6);
  const graphiteMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.9, metalness: 0.1 });
  const graphitePlate = new THREE.Mesh(plateGeo, graphiteMat);
  graphitePlate.position.set(0, -1, 1.2);
  scene.add(graphitePlate);
  addLabel3D(scene, '石墨(吸收)', 0, -1.8, 1.8, '#ef4444');

  // 后板：铝箔（反射）— 在 z=-1.2，板范围 z∈[-2.0, -0.4], x∈[-1, 1]
  const aluminumMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.2, metalness: 0.9 });
  const aluminumPlate = new THREE.Mesh(plateGeo.clone(), aluminumMat);
  aluminumPlate.position.set(0, -1, -1.2);
  scene.add(aluminumPlate);
  addLabel3D(scene, '铝箔(反射)', 0, -1.8, -1.8, '#60a5fa');

  // 隔板（z=0）
  const sepGeo = new THREE.BoxGeometry(0.04, 2.5, 0.04);
  const sepMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.5 });
  const separator = new THREE.Mesh(sepGeo, sepMat);
  separator.position.set(0, 0.2, 0);
  scene.add(separator);

  // 力箭头
  const grLightArrow = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(0,-0.5,1.2), 1.0, 0x3b82f6, 0.2, 0.1);
  scene.add(grLightArrow);
  const grPhotoArrow = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(-1.5,-1.5,1.2), 0.6, 0x22c55e, 0.2, 0.1);
  scene.add(grPhotoArrow);
  addLabel3D(scene, '光泳力↑', -1.5, -0.8, 1.2, '#22c55e');
  const alLightArrow = new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(0,-0.5,-1.2), 1.5, 0x3b82f6, 0.2, 0.1);
  scene.add(alLightArrow);
  addLabel3D(scene, '光压力↓', 0, -0.8, -1.8, '#3b82f6');
  const netForceArrow = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(1.5,-1.5,0), 0.5, 0xf97316, 0.25, 0.12);
  scene.add(netForceArrow);
  addLabel3D(scene, '合力', 1.5, -0.8, 0, '#f97316');

  addGrid(scene, 20);

  // 光子系统
  const photons = [];
  const absorbedSparks = [];
  const reflectedPhotons = [];
  const photonGeo = new THREE.SphereGeometry(0.12, 8, 8);

  // 左光子→石墨侧(z>0)，右光子→铝箔侧(z<0)
  function createPhoton(side) {
    const mat = new THREE.MeshBasicMaterial({
      color: side === 'left' ? 0xfbbf24 : 0x60a5fa,
      transparent: true, opacity: 0.9
    });
    const mesh = new THREE.Mesh(photonGeo, mat);
    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: side === 'left' ? 0xfbbf24 : 0x60a5fa, transparent: true, opacity: 0.25 })
    );
    mesh.add(glowMesh);
    // 光子从板上方 x∈[-0.8,0.8], z根据side偏移到板范围内
    const startZ = side === 'left' ? 1.2 : -1.2;
    mesh.position.set(
      (Math.random()-0.5)*1.4,  // x范围约±0.7
      5.5,
      startZ + (Math.random()-0.5)*0.4  // z在板范围内
    );
    scene.add(mesh);
    return { mesh, side, speed: 8+Math.random()*4 };
  }

  for (let i = 0; i < 24; i++) {
    photons.push(createPhoton(i < 12 ? 'left' : 'right'));
  }

  function createAbsorbSpark(pos) {
    const geo = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return { mesh, life: 1.0, velocity: new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2) };
  }

  function createReflectedPhoton(pos) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.7 });
    const mesh = new THREE.Mesh(photonGeo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.1;
    scene.add(mesh);
    return { mesh, velocity: new THREE.Vector3((Math.random()-0.5)*0.5, 3+Math.random()*2, (Math.random()-0.5)*0.5), life: 1.0 };
  }

  let isPaused = false, lastPhotonTime = 0;
  const clock = new THREE.Clock();

  function updateForces() {
    const ratio = parseInt(document.getElementById('ratioSlider')?.value || 50) / 100;
    const alLight = 2 * ratio;
    const grLight = 1.0;
    const photoForce = 0.5;
    const netForce = photoForce - (alLight - grLight);

    grLightArrow.setLength(Math.max(0.2, grLight * 0.7), 0.2, 0.1);
    alLightArrow.setLength(Math.max(0.2, alLight * 0.7), 0.2, 0.1);
    grPhotoArrow.setLength(photoForce * 0.8, 0.2, 0.1);

    if (netForce > 0) {
      netForceArrow.setDirection(new THREE.Vector3(0, 1, 0));
      netForceArrow.setLength(Math.min(1.5, netForce * 2.5), 0.25, 0.12);
      netForceArrow.color.setHex(0x22c55e);
    } else {
      netForceArrow.setDirection(new THREE.Vector3(0, -1, 0));
      netForceArrow.setLength(Math.min(1.5, Math.abs(netForce) * 2.5), 0.25, 0.12);
      netForceArrow.color.setHex(0xef4444);
    }

    const ratioVal = document.getElementById('ratioValue');
    if (ratioVal) ratioVal.textContent = '1 : ' + (1 / ratio).toFixed(1);

    const imbalance = Math.abs(alLight - grLight);
    const cancelPct = Math.round(Math.max(0, (1 - imbalance)) * 100);
    const cancelEl = document.getElementById('cancelPercent');
    if (cancelEl) cancelEl.textContent = cancelPct + '%';
    const meterEl = document.getElementById('cancelMeterBar');
    if (meterEl) meterEl.style.width = cancelPct + '%';

    const alEl = document.getElementById('alLightForce');
    if (alEl) alEl.textContent = (alLight * 0.5).toFixed(2) + ' μN';
    const grEl = document.getElementById('grLightForce');
    if (grEl) grEl.textContent = (grLight * 0.5).toFixed(2) + ' μN';
    const pfEl = document.getElementById('photoForce');
    if (pfEl) pfEl.textContent = photoForce.toFixed(2) + ' μN';
    const nfEl = document.getElementById('netForce3');
    if (nfEl) nfEl.textContent = Math.abs(netForce).toFixed(2) + ' μN ' + (netForce > 0 ? '↑' : '↓');
  }

  document.getElementById('ratioSlider')?.addEventListener('input', updateForces);

  function animate() {
    const id = requestAnimationFrame(animate);
    if (isPaused) { controls.update(); renderer.render(scene, camera); return; }

    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsedTime();

    lightSphere.scale.setScalar(1 + 0.06*Math.sin(time*3));
    if (time - lastPhotonTime > 0.2) {
      lastPhotonTime = time;
      photons.push(createPhoton(Math.floor(time*5)%2 === 0 ? 'left' : 'right'));
    }

    const plateY = -1;
    for (let i = photons.length-1; i >= 0; i--) {
      if (photons.length > 40 && i < photons.length-10) continue;
      const p = photons[i];
      p.mesh.position.y -= p.speed * dt;

      // 检查是否撞击薄板（y坐标 + x/z范围）
      // 石墨板：z∈[0.4, 2.0], x∈[-1, 1]；铝箔板：z∈[-2.0, -0.4], x∈[-1, 1]
      const hitY = p.mesh.position.y <= plateY + 0.06 + 0.12;
      if (hitY) {
        if (p.side === 'right') {
          // 右光子→铝箔侧(z<0)
          if (p.mesh.position.z < -0.3 && Math.abs(p.mesh.position.x) < 1.1) {
            reflectedPhotons.push(createReflectedPhoton(p.mesh.position.clone()));
          }
          // 无论是否打中，都移除光子
          scene.remove(p.mesh);
          photons.splice(i, 1);
        } else {
          // 左光子→石墨侧(z>0)
          if (p.mesh.position.z > 0.3 && Math.abs(p.mesh.position.x) < 1.1) {
            for (let j = 0; j < 3; j++) absorbedSparks.push(createAbsorbSpark(p.mesh.position.clone()));
          }
          // 无论是否打中，都移除光子
          scene.remove(p.mesh);
          photons.splice(i, 1);
        }
      }
      // 超出边界移除
      else if (p.mesh.position.y < -5) {
        scene.remove(p.mesh);
        photons.splice(i, 1);
      }
    }

    for (let i = reflectedPhotons.length-1; i >= 0; i--) {
      const r = reflectedPhotons[i];
      r.mesh.position.addScaledVector(r.velocity, dt);
      r.life -= dt*0.8;
      r.mesh.material.opacity = Math.max(0, r.life);
      if (r.life <= 0 || r.mesh.position.y > 10) { scene.remove(r.mesh); reflectedPhotons.splice(i, 1); }
    }

    for (let i = absorbedSparks.length-1; i >= 0; i--) {
      const s = absorbedSparks[i];
      s.mesh.position.addScaledVector(s.velocity, dt);
      s.life -= dt*2;
      s.mesh.material.opacity = Math.max(0, s.life);
      s.mesh.scale.setScalar(s.life);
      if (s.life <= 0) { scene.remove(s.mesh); absorbedSparks.splice(i, 1); }
    }

    controls.update();
    renderer.render(scene, camera);
  }
  const animId = animate();
  updateForces();

  document.getElementById('m3PauseBtn')?.addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('m3PauseBtn').textContent = isPaused ? '▶ 播放' : '⏸ 暂停';
  });
  document.getElementById('m3ResetBtn')?.addEventListener('click', () => {
    photons.forEach(p => scene.remove(p.mesh)); photons.length = 0;
    reflectedPhotons.forEach(r => scene.remove(r.mesh)); reflectedPhotons.length = 0;
    absorbedSparks.forEach(s => scene.remove(s.mesh)); absorbedSparks.length = 0;
    updateForces();
  });

  const instance = {
    animId, renderer, controls,
    onResize: () => {
      const container = document.getElementById('theoryScene3');
      if (!container) return;
      const { w: nw, h: nh } = getContainerSize(container);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
  };
  sceneInstances['module3'] = instance;
  return instance;
}

// ================================================================
// 仪器3D场景 - 基于参考图片重建（圆形真空腔+竖直薄片+水平光源）
// ================================================================
let instrumentInstance = null;

function buildInstrumentScene() {
  const container = document.getElementById('instrumentContainer');
  if (!container) return null;
  const { w, h } = getContainerSize(container);

  // 场景：浅色实验桌背景
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e8e8);

  // 相机：中等俯角，能同时看到正面和侧面
  const camera = new THREE.PerspectiveCamera(40, w/h, 0.1, 100);
  camera.position.set(3.5, 2.8, 4.0);
  camera.lookAt(0, 0.8, 0);

  // 渲染器
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const loading = container.querySelector('.three-loading');
  if (loading) loading.remove();
  container.appendChild(renderer.domElement);

  // 控制器
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2; controls.maxDistance = 12;
  controls.target.set(0, 0.8, 0);

  // 灯光
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(4, 8, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-3, 4, -2);
  scene.add(fillLight);

  // ===== 0. 实验桌台面 =====
  const tableGeo = new THREE.BoxGeometry(8, 0.08, 5);
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.8 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, 0.04, 0);
  table.receiveShadow = true;
  scene.add(table);

  // ===== 1. 圆形真空腔体（水平横放，透明玻璃）=====
  // 从正视图和左视图看都是圆形 → 圆柱体横放
  const chamberRadius = 0.8, chamberLength = 2.0;
  const chamberGeo = new THREE.CylinderGeometry(chamberRadius, chamberRadius, chamberLength, 32, 1, true);
  const chamberMat = new THREE.MeshPhysicalMaterial({
    color: 0xcceeff,
    transparent: true,
    opacity: 0.22,
    roughness: 0.02,
    metalness: 0.0,
    side: THREE.DoubleSide,
    transmission: 0.8,
    thickness: 0.1
  });
  const chamber = new THREE.Mesh(chamberGeo, chamberMat);
  chamber.rotation.z = Math.PI / 2; // 横放
  chamber.position.set(0, 1.0, 0);
  scene.add(chamber);

  // 腔体边框线
  const chamberEdges = new THREE.EdgesGeometry(chamberGeo);
  const chamberLines = new THREE.LineSegments(
    chamberEdges,
    new THREE.LineBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5 })
  );
  chamberLines.rotation.z = Math.PI / 2;
  chamberLines.position.copy(chamber.position);
  scene.add(chamberLines);

  // 腔体前后端面圆环（金属框架）
  const rimGeo = new THREE.RingGeometry(chamberRadius - 0.03, chamberRadius + 0.03, 32);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide });
  const frontRim = new THREE.Mesh(rimGeo, rimMat);
  frontRim.position.set(chamberLength / 2, 1.0, 0);
  frontRim.rotation.y = Math.PI / 2;
  scene.add(frontRim);
  const backRim = new THREE.Mesh(rimGeo.clone(), rimMat.clone());
  backRim.position.set(-chamberLength / 2, 1.0, 0);
  backRim.rotation.y = Math.PI / 2;
  scene.add(backRim);

  // ===== 2. 两片竖直薄片：石墨（左）和铝箔（右），背对背放置 =====
  // 石墨片：正面朝左，面向光源（吸收光）
  // 铝箔片：正面朝右，背面朝左（反射光）
  // 两片背对背并排，中间有小间隙让光线通过
  const plateW = 0.5, plateH = 0.6, plateD = 0.04; // W=宽度(水平), H=高度(竖直), D=厚度
  const plateGeo = new THREE.BoxGeometry(plateW, plateH, plateD);

  // 石墨片（黑色吸光）— 在腔体左侧，正面朝左（面向光源）
  const graphiteMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.95,
    metalness: 0.05
  });
  const graphitePlate = new THREE.Mesh(plateGeo, graphiteMat);
  graphitePlate.position.set(-0.28, 1.0, 0);
  graphitePlate.rotation.y = Math.PI; // 正面朝左（面向光源），吸收光
  scene.add(graphitePlate);

  // 铝箔片（银色反光）— 在腔体右侧，正面朝右（背向光源）
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    roughness: 0.15,
    metalness: 0.95
  });
  const aluminumPlate = new THREE.Mesh(plateGeo.clone(), aluminumMat);
  aluminumPlate.position.set(0.28, 1.0, 0);
  aluminumPlate.rotation.y = 0; // 正面朝右（背向光源），背面朝左
  scene.add(aluminumPlate);

  // 薄片标签
  const grLabel = createTextSprite('石墨片', '#ef4444');
  grLabel.position.set(-0.3, 1.65, 0);
  scene.add(grLabel);

  const alLabel = createTextSprite('铝箔', '#60a5fa');
  alLabel.position.set(0.3, 1.65, 0);
  scene.add(alLabel);

  // ===== 3. 光源（仪器正前方，水平向右照射）=====
  const lightGroup = new THREE.Group();
  // 灯体（圆柱形，横放）
  const lampGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 16);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffdd44, roughness: 0.3, metalness: 0.5 });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.rotation.x = Math.PI / 2;
  lightGroup.add(lamp);

  // 发光部分（灯泡）
  const bulbGeo = new THREE.SphereGeometry(0.1, 16, 16);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(0, 0, 0.3);
  lightGroup.add(bulb);

  // 光源支架（放在桌面上，从前方伸向腔体）
  const standGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8);
  const standMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
  const stand = new THREE.Mesh(standGeo, standMat);
  stand.position.set(0, 0.48, -1.5);
  stand.castShadow = true;
  scene.add(stand);

  // 支架横臂（连接灯和支架柱）
  const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
  const arm = new THREE.Mesh(armGeo, standMat.clone());
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0, 0.9, -1.15);
  arm.castShadow = true;
  scene.add(arm);

  // 光源整体位置（正前方对准腔体中心）
  lightGroup.position.set(0, 1.0, -1.3);
  scene.add(lightGroup);

  // 光锥（水平向右射入腔体）
  const beamGeo = new THREE.ConeGeometry(0.5, 1.5, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.rotation.z = -Math.PI / 2;
  beam.position.set(0, 1.0, -0.45);
  scene.add(beam);

  // 光源标签
  const lightLabel = createTextSprite('光源', '#fbbf24');
  lightLabel.position.set(0, 1.6, -1.5);
  scene.add(lightLabel);

  // ===== 3.5 偏振片已删除 =====

  // ===== 3.6 光强计（腔体右侧，测量透射光强）=====
  const meterGeo = new THREE.BoxGeometry(0.15, 0.25, 0.1);
  const meterMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3, metalness: 0.5 });
  const meter = new THREE.Mesh(meterGeo, meterMat);
  meter.position.set(0.5, 1.0, 0.6);
  scene.add(meter);

  const meterLabel = createTextSprite('光强计', '#22c55e');
  meterLabel.position.set(0.5, 1.25, 0.6);
  scene.add(meterLabel);

  // ===== 4. 力传感器（腔体正下方，测量薄片重量变化）=====
  const sensorGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 16);
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.6 });
  const sensor = new THREE.Mesh(sensorGeo, sensorMat);
  sensor.position.set(0, 0.35, 0);
  scene.add(sensor);

  // 连接杆（传感器到薄片中心）
  const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8);
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.position.set(0, 0.7, 0);
  scene.add(rod);

  const sensorLabel = createTextSprite('力传感器', '#ef4444');
  sensorLabel.position.set(0.55, 0.25, 0);
  scene.add(sensorLabel);

  // ===== 5. 压强传感器/阀门（腔体顶部）=====
  const valveGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16);
  const valveMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.5 });
  const valve = new THREE.Mesh(valveGeo, valveMat);
  valve.position.set(0, 1.85, 0);
  scene.add(valve);

  // 阀门旋钮
  const knobGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 16);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.7 });
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.position.set(0, 2.0, 0);
  scene.add(knob);

  const valveLabel = createTextSprite('压强传感器/阀门', '#3b82f6');
  valveLabel.position.set(0, 2.2, 0);
  scene.add(valveLabel);

  // ===== 6. 真空泵（腔体右后方）=====
  const pumpGeo = new THREE.BoxGeometry(0.5, 0.6, 0.4);
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.5, metalness: 0.3 });
  const pump = new THREE.Mesh(pumpGeo, pumpMat);
  pump.position.set(1.2, 0.38, -0.8);
  pump.castShadow = true;
  scene.add(pump);

  // 泵的连接管
  const pumpTubeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
  const pumpTube = new THREE.Mesh(pumpTubeGeo, rodMat.clone());
  pumpTube.rotation.z = Math.PI / 4;
  pumpTube.position.set(0.9, 1.0, -0.55);
  scene.add(pumpTube);

  const pumpLabel = createTextSprite('真空泵', '#f97316');
  pumpLabel.position.set(1.2, 0.85, -0.8);
  scene.add(pumpLabel);

  // ===== 7. 电子控制单元（腔体右侧）=====
  const controlBoxGeo = new THREE.BoxGeometry(0.7, 0.5, 0.4);
  const controlBoxMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.3 });
  const controlBox = new THREE.Mesh(controlBoxGeo, controlBoxMat);
  controlBox.position.set(1.5, 0.33, 0.5);
  controlBox.castShadow = true;
  scene.add(controlBox);

  // 控制面板屏幕
  const screenGeo = new THREE.PlaneGeometry(0.35, 0.2);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(1.5, 0.4, 0.71);
  scene.add(screen);

  const controlLabel = createTextSprite('控制单元', '#ffffff');
  controlLabel.position.set(1.5, 0.75, 0.5);
  scene.add(controlLabel);

  // ===== 8. 标注线（指向各部件）=====
  addAnnotationLine(scene, new THREE.Vector3(-0.3, 1.0, 0.35), new THREE.Vector3(-0.8, 1.5, 0.5), '#ef4444');
  addAnnotationLine(scene, new THREE.Vector3(0.3, 1.0, 0.35), new THREE.Vector3(0.8, 1.5, 0.5), '#60a5fa');
  addAnnotationLine(scene, new THREE.Vector3(0.9, 1.0, 0.0), new THREE.Vector3(1.3, 1.5, 0.0), '#88aacc');

  // ===== 9. 网格地面 =====
  const grid = new THREE.GridHelper(10, 10, 0xbbbbbb, 0xdddddd);
  grid.position.y = 0.001;
  scene.add(grid);

  let isPaused = false;
  const clock = new THREE.Clock();

  function animate() {
    const id = requestAnimationFrame(animate);
    if (isPaused) { controls.update(); renderer.render(scene, camera); return; }
    const time = clock.getElapsedTime();

    // 光源脉冲
    bulb.scale.setScalar(1 + 0.08 * Math.sin(time * 3));
    beam.material.opacity = 0.06 + 0.03 * Math.sin(time * 3);

    controls.update();
    renderer.render(scene, camera);
  }
  const animId = animate();

  instrumentInstance = {
    animId, renderer, controls,
    onResize: () => {
      const container = document.getElementById('instrumentContainer');
      if (!container) return;
      const { w: nw, h: nh } = getContainerSize(container);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
  };
  return instrumentInstance;
}

// 添加标注线（从3D点指向标签位置）
function addAnnotationLine(scene, start, end, color) {
  const points = [start, end];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.6 });
  scene.add(new THREE.Line(geo, mat));
}

// 创建文字精灵（始终面向相机）
function createTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = 'bold 32px Microsoft YaHei, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.6, 0.15, 1);
  return sprite;
}

// ===== 导出 =====
window.buildModule1Scene = buildModule1Scene;
window.buildModule2Scene = buildModule2Scene;
window.buildModule3Scene = buildModule3Scene;
window.buildInstrumentScene = buildInstrumentScene;

// 全局 resize 处理器
function onWindowResize() {
  Object.values(sceneInstances).forEach(inst => {
    if (inst && inst.onResize) inst.onResize();
  });
}
window.onWindowResize = onWindowResize;