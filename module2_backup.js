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

  // 薄板：上半石墨（热，黑色），下半铝箔（冷，银色）
  // 使用两个半板来表示温差
  const plateWidth = 3, plateDepth = 2.5, plateThickness = 0.06;

  // 上半部分：石墨（热）
  const hotPlateGeo = new THREE.BoxGeometry(plateWidth, plateThickness, plateDepth/2);
  const hotPlateMat = new THREE.MeshStandardMaterial({
    color: 0x2d2d2d,
    roughness: 0.9,
    metalness: 0.1,
    emissive: 0xff4400,
    emissiveIntensity: 0.3
  });
  const hotPlate = new THREE.Mesh(hotPlateGeo, hotPlateMat);
  hotPlate.position.set(0, -1.2, plateDepth/4); // 上半部分
  scene.add(hotPlate);

  // 下半部分：铝箔（冷）
  const coldPlateGeo = new THREE.BoxGeometry(plateWidth, plateThickness, plateDepth/2);
  const coldPlateMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0x0044ff,
    emissiveIntensity: 0.1
  });
  const coldPlate = new THREE.Mesh(coldPlateGeo, coldPlateMat);
  coldPlate.position.set(0, -1.8, -plateDepth/4); // 下半部分
  scene.add(coldPlate);

  // 标签
  addLabel3D(scene, '石墨面 (热)', 0, -0.8, plateDepth/2 + 0.3, '#ef4444');
  addLabel3D(scene, '铝箔面 (冷)', 0, -2.2, -(plateDepth/2 + 0.3), '#60a5fa');

  // 光泳力箭头（向上）
  const forceArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1.5, 0),
    1.8, 0x22c55e, 0.3, 0.15
  );
  scene.add(forceArrow);
  addLabel3D(scene, '光泳力 ↑', 0, -0.3, 0, '#22c55e');

  // 公式
  const formulaCanvas = createTextCanvas('F_pp = K · ΔT · (dλ/dT)', '#22c55e', 512, 64);
  const formulaMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 0.5),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(formulaCanvas), transparent: true, side: THREE.DoubleSide })
  );
  formulaMesh.position.set(0, -3.0, 0);
  scene.add(formulaMesh);

  // 气体分子系统
  const molecules = [];
  const MOLECULE_COLORS = { hot: 0xff4444, cold: 0x4488ff };
  const molGeo = new THREE.SphereGeometry(0.06, 6, 6);
  const clock = new THREE.Clock();
  let isPaused = false;

  function createMolecule() {
    const mat = new THREE.MeshBasicMaterial({
      color: MOLECULE_COLORS.cold, // 初始为冷色
      transparent: true, opacity: 0.9
    });
    const mesh = new THREE.Mesh(molGeo, mat);
    // 随机位置（在薄板周围）
    mesh.position.set(
      (Math.random()-0.5)*4,
      (Math.random()-0.5)*3 - 1.5,
      (Math.random()-0.5)*2
    );
    scene.add(mesh);
    return {
      mesh,
      velocity: new THREE.Vector3(
        (Math.random()-0.5)*2,
        (Math.random()-0.5)*2,
        (Math.random()-0.5)*2
      ),
      baseSpeed: 3 + Math.random()*2,
      isHot: false,
      life: 1.0,
      lifeRate: 0.3 + Math.random()*0.2 // 生命周期衰减率
    };
  }

  for (let i = 0; i < 60; i++) molecules.push(createMolecule());

  function animate() {
    const id = requestAnimationFrame(animate);
    if (isPaused) { controls.update(); renderer.render(scene, camera); return; }

    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsedTime();

    lightSphere.scale.setScalar(1 + 0.08*Math.sin(time*3));
    beam.material.opacity = 0.04 + 0.02*Math.sin(time*3);

    // 更新分子
    for (let i = molecules.length-1; i >= 0; i--) {
      const m = molecules[i];

      // 移动
      m.mesh.position.x += m.velocity.x * m.baseSpeed * dt;
      m.mesh.position.y += m.velocity.y * m.baseSpeed * dt;
      m.mesh.position.z += m.velocity.z * m.baseSpeed * dt;

      // 边界反弹
      [2.0, 2.0, 1.5].forEach((b, idx) => {
        const axis = ['x', 'y', 'z'][idx];
        if (Math.abs(m.mesh.position[axis]) > b) {
          m.velocity[axis] = -m.velocity[axis];
          m.mesh.position[axis] = Math.sign(m.mesh.position[axis]) * b;
        }
      });

      // 与薄板碰撞检测
      // 热板（石墨）：y ≈ -1.2, z > 0
      if (Math.abs(m.mesh.position.y - (-1.2)) < 0.08 &&
          Math.abs(m.mesh.position.x) < 1.5 &&
          m.mesh.position.z > 0 && Math.abs(m.mesh.position.z) < plateDepth/2) {
        if (m.velocity.y > 0) { // 从下方撞击热板
          m.velocity.y = Math.abs(m.velocity.y) * 1.5; // 反弹加速
          m.isHot = true;
          m.mesh.material.color.setHex(MOLECULE_COLORS.hot);
          m.life = 1.0; // 重置生命值
        }
      }

      // 冷板（铝箔）：y ≈ -1.8, z < 0
      if (Math.abs(m.mesh.position.y - (-1.8)) < 0.08 &&
          Math.abs(m.mesh.position.x) < 1.5 &&
          m.mesh.position.z < 0 && Math.abs(m.mesh.position.z) < plateDepth/2) {
        if (m.velocity.y < 0) { // 从上方撞击冷板
          m.velocity.y = -Math.abs(m.velocity.y) * 0.6; // 反弹减速
          m.isHot = false;
          m.mesh.material.color.setHex(MOLECULE_COLORS.cold);
          m.life = 0.5; // 冷分子寿命更短
        }
      }

      // 生命周期衰减
      m.life -= m.lifeRate * dt;
      m.mesh.material.opacity = Math.max(0, m.life);

      // 生命耗尽则移除
      if (m.life <= 0) {
        scene.remove(m.mesh);
        molecules.splice(i, 1);
        continue;
      }
    }

    // 补充新分子
    if (molecules.length < 50 && Math.random() < 0.1) {
      molecules.push(createMolecule());
    }

    // 箭头脉冲
    const pulse = 0.85 + 0.15*Math.sin(time*4);
    forceArrow.setLength(1.8*pulse, 0.3, 0.15);

    controls.update();
    renderer.render(scene, camera);
  }
  const animId = animate();

  document.getElementById('m2PauseBtn')?.addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('m2PauseBtn').textContent = isPaused ? '▶ 播放' : '⏸ 暂停';
  });
  document.getElementById('m2ResetBtn')?.addEventListener('click', () => {
    molecules.forEach(m => scene.remove(m.mesh));
    molecules.length = 0;
    for (let i = 0; i < 60; i++) molecules.push(createMolecule());
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

