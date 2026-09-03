/**
 * 光泳效应虚拟仿真实验平台 — 虚拟操作台控制逻辑
 */

const state = {
  currentStep: 1, freeMode: false, lightOn: false, pumpOn: false,
  venting: false, timerRunning: false,
  separatorEnabled: true, lightIntensityWatts: 0, targetPressure: 0.1,
  experimentMode: 'single', dataPoints: [], completedSteps: new Set()
};

const STEPS = {
  1: { action: '启动光源，调节光强调试至1:2比例' },
  2: { action: '启动真空泵，将腔体压强降至目标值' },
  3: { action: '开始计时，记录力传感器读数' },
  4: { action: '选择实验模式，调节参数记录数据点' },
  5: { action: '移除隔板，缓慢放气寻找临界点' }
};

// 仪器场景是否已创建
let instrumentCreated = false;

function initControls() {
  bindControls();
  bindStepIndicator();
  bindModeButtons();
  updateStepHint();
  updateRecordButton();
  // 延迟创建仪器场景（等待DOM布局完成）
  setTimeout(() => createInstrumentSceneLazy(), 500);
}

function createInstrumentSceneLazy() {
  if (instrumentCreated) return;
  const container = document.getElementById('instrumentContainer');
  if (!container) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w < 200 || h < 200) {
    // 容器还没展开，延迟重试
    setTimeout(() => createInstrumentSceneLazy(), 500);
    return;
  }
  instrumentCreated = true;
  if (typeof buildInstrumentScene === 'function') {
    buildInstrumentScene();
  }
}

function bindControls() {
  document.getElementById('lightOnBtn')?.addEventListener('click', () => {
    lightSim.turnOn(); state.lightOn = true;
    document.getElementById('lightOnBtn').textContent = '光源运行中';
    document.getElementById('lightOnBtn').disabled = true;
    document.getElementById('lightOffBtn').disabled = false;
    updateDisplayPanels();
  });
  document.getElementById('lightOffBtn')?.addEventListener('click', () => {
    lightSim.turnOff(); state.lightOn = false;
    document.getElementById('lightOnBtn').textContent = '启动光源';
    document.getElementById('lightOnBtn').disabled = false;
    document.getElementById('lightOffBtn').disabled = true;
    updateDisplayPanels();
  });
  document.getElementById('lightIntensity')?.addEventListener('input', (e) => {
    const watts = parseInt(e.target.value);
    state.lightIntensityWatts = watts;
    lightSim.setIntensity(watts);
    document.getElementById('lightIntensityVal').textContent = watts + ' W';
    updateDisplayPanels();
  });
  document.getElementById('separatorBtn')?.addEventListener('click', (e) => {
    state.separatorEnabled = !state.separatorEnabled;
    e.target.textContent = state.separatorEnabled ? '插入' : '移除';
    e.target.className = 'toggle-btn ' + (state.separatorEnabled ? 'on' : 'off');
    updateDisplayPanels();
    updateRecordButton();
  });
  document.getElementById('pumpOnBtn')?.addEventListener('click', () => {
    vacuumSim.startPump(); state.pumpOn = true; state.venting = false;
    document.getElementById('pumpOnBtn').disabled = true;
    document.getElementById('ventBtn').disabled = false;
  });
  document.getElementById('pumpOffBtn')?.addEventListener('click', () => {
    vacuumSim.stopPump(); state.pumpOn = false;
    document.getElementById('pumpOnBtn').disabled = false;
  });
  document.getElementById('ventBtn')?.addEventListener('click', () => {
    vacuumSim.startVent(); state.venting = true; state.pumpOn = false;
    document.getElementById('pumpOffBtn').disabled = false;
    document.getElementById('pumpOnBtn').disabled = false;
    document.getElementById('ventBtn').disabled = true;
  });
  document.getElementById('targetPressure')?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.targetPressure = val / 1000;
    document.getElementById('targetPressureVal').textContent = state.targetPressure.toFixed(3) + ' MPa';
    vacuumSim.setTarget(state.targetPressure);
  });
  document.getElementById('timerStartBtn')?.addEventListener('click', () => {
    stopwatch.start(); state.timerRunning = true;
  });
  document.getElementById('timerPauseBtn')?.addEventListener('click', () => {
    stopwatch.pause(); state.timerRunning = false;
  });
  document.getElementById('timerResetBtn')?.addEventListener('click', () => {
    stopwatch.reset(); state.timerRunning = false;
  });
  document.getElementById('recordBtn')?.addEventListener('click', () => recordDataPoint());
  document.getElementById('exportBtn')?.addEventListener('click', () => exportDataCSV());
  // 更新导出按钮状态
  function updateExportButton() {
    const btn = document.getElementById('exportBtn');
    if (btn) btn.disabled = state.dataPoints.length === 0;
  }
  // 在recordDataPoint中调用
  const _origRecord = recordDataPoint;
  recordDataPoint = function() {
    _origRecord();
    updateExportButton();
  };
  updateExportButton();
}

function bindStepIndicator() {
  document.querySelectorAll('.step').forEach(el => {
    el.addEventListener('click', () => {
      const step = parseInt(el.dataset.step);
      goToStep(step);
    });
  });
  document.getElementById('freeModeBtn')?.addEventListener('click', () => {
    state.freeMode = !state.freeMode;
    const btn = document.getElementById('freeModeBtn');
    btn.textContent = state.freeMode ? '返回向导' : '自由模式';
    btn.style.borderColor = state.freeMode ? 'var(--accent)' : '';
    btn.style.color = state.freeMode ? 'var(--accent)' : '';
  });
}

function goToStep(step) {
  if (step < 1 || step > 5) return;
  state.currentStep = step;
  state.completedSteps.add(step);
  updateStepIndicator();
  updateStepHint();
  // 高亮完成步骤的容器
  document.querySelectorAll('.step').forEach(el => {
    const s = parseInt(el.dataset.step);
    if (state.completedSteps.has(s)) {
      el.style.boxShadow = '0 0 12px rgba(34,197,94,0.3)';
    } else {
      el.style.boxShadow = '';
    }
  });
}

function updateStepIndicator() {
  document.querySelectorAll('.step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'completed');
    if (state.completedSteps.has(s)) el.classList.add('completed');
    if (s === state.currentStep) el.classList.add('active');
  });
}

function updateStepHint() {
  const info = STEPS[state.currentStep];
  const el = document.getElementById('stepHintText');
  if (el && info) el.textContent = info.action;
}

function bindModeButtons() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.experimentMode = btn.dataset.mode;
      updateRecordButton();
      clearRealtimeChart();
    });
  });
}

function updateRecordButton() {
  const btn = document.getElementById('recordBtn');
  if (!btn) return;
  const ready = state.lightOn;
  btn.disabled = !ready;
  if (ready) {
    btn.textContent = '📌 记录数据点';
  } else {
    btn.textContent = '请先完成光强调试 (1:2比例)';
  }
}

function recordDataPoint() {
  const I = lightSim.getGraphiteIntensity();
  const P = vacuumSim.currentPressure;
  const t = stopwatch.time / 1000;
  const result = simulatePhotophoresis(I, P, t);
  state.dataPoints.push({ time: t, intensity: I, pressure: P, photoForce: result.photophoreticForce, lightForce: result.lightPressure, netForce: result.netForce });
  updateRealtimeFromData(result);
  const btn = document.getElementById('recordBtn');
  const orig = btn.textContent;
  btn.textContent = '✓ 已记录!';
  btn.style.borderColor = 'var(--green)';
  setTimeout(() => { btn.textContent = orig; btn.style.borderColor = ''; }, 1000);
}

function updateDisplayPanels() {
  const P = vacuumSim.currentPressure;
  document.getElementById('pressureReadout').textContent = P.toFixed(4);
  document.getElementById('currentPressure').textContent = P.toFixed(4);
  const I_g = lightSim.getGraphiteIntensity();
  const I_a = lightSim.getAluminumIntensity();
  document.getElementById('graphiteLight').textContent = Math.round(I_g);
  document.getElementById('aluminumLight').textContent = Math.round(I_a);
  const ratio = I_g > 0 ? (I_a / I_g).toFixed(2) : '—';
  document.getElementById('lightRatio').textContent = ratio;
  const display = stopwatch.formatted;
  document.getElementById('timerDisplay').textContent = display;
  document.getElementById('timerDisplay2').textContent = display;
  const t = stopwatch.time / 1000;
  const result = simulatePhotophoresis(I_g, P, Math.max(t, 0.1));
  document.getElementById('netForceReadout').textContent = result.netForce.toFixed(1);
}

function updateRealtimeFromData(point) {
  if (!realtimeChart) return;
  const mode = state.experimentMode;
  let xData, yData, xLabel, yLabel;
  switch (mode) {
    case 'intensity': xData = state.dataPoints.map(p => p.intensity); yData = state.dataPoints.map(p => p.netForce); xLabel = '光强 (W/m²)'; yLabel = '净力 (μN)'; break;
    case 'pressure': xData = state.dataPoints.map(p => p.pressure); yData = state.dataPoints.map(p => p.netForce); xLabel = '气压 (MPa)'; yLabel = '净力 (μN)'; break;
    case 'time': xData = state.dataPoints.map(p => p.time); yData = state.dataPoints.map(p => p.netForce); xLabel = '时间 (s)'; yLabel = '净力 (μN)'; break;
    default: xData = state.dataPoints.map(p => p.time); yData = state.dataPoints.map(p => p.netForce); xLabel = '时间 (s)'; yLabel = '净力 (μN)';
  }
  updateRealtimeChart(xData, yData, xLabel, yLabel);
}

function clearRealtimeChart() {
  state.dataPoints = [];
  if (realtimeChart) realtimeChart.setOption({ series: [{ data: [] }] });
}

let lastFrameTime = -1;
function mainLoop(timestamp) {
  if (lastFrameTime < 0) {
    lastFrameTime = timestamp;
    requestAnimationFrame(mainLoop);
    return;
  }
  const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
  lastFrameTime = timestamp;
  vacuumSim.update(dt);
  lightSim.update(dt);
  updateDisplayPanels();
  checkStepAutoProgress();
  requestAnimationFrame(mainLoop);
}

// ===== 步骤自动推进检测 =====
function checkStepAutoProgress() {
  if (state.freeMode) return;

  const P = vacuumSim.currentPressure;
  const I_g = lightSim.getGraphiteIntensity();
  const I_a = lightSim.getAluminumIntensity();
  const ratio = I_g > 0 ? I_a / I_g : Infinity;
  const ratioOK = Math.abs(ratio - 0.5) < 0.05;

  // 步骤1 → 步骤2：光强调试完成
  if (state.currentStep === 1 && state.completedSteps.has(1) && ratioOK) {
    goToStep(2);
  }
  // 步骤2 → 步骤3：真空度达标（< 0.05 MPa）
  if (state.currentStep === 2 && state.completedSteps.has(2) && P < 0.05) {
    goToStep(3);
  }
  // 步骤3 → 步骤4：记录至少1个数据点
  if (state.currentStep === 3 && state.dataPoints.length >= 1 && state.completedSteps.has(3)) {
    goToStep(4);
  }
  // 步骤4 → 步骤5：记录至少5个数据点
  if (state.currentStep === 4 && state.dataPoints.length >= 5 && state.completedSteps.has(4)) {
    goToStep(5);
  }
}

// ===== 数据导出 =====
function exportDataCSV() {
  if (state.dataPoints.length === 0) {
    alert('暂无数据可导出！请先记录实验数据。');
    return;
  }
  const header = '时间(s),光强(石墨侧,W/m²),光强(铝箔侧,W/m²),气压(MPa),光泳力(μN),光压力(μN),净力(μN)';
  const rows = state.dataPoints.map(p =>
    `${p.time.toFixed(1)},${p.intensity.toFixed(0)},${(p.intensity * 0.5).toFixed(0)},${p.pressure.toFixed(4)},${p.photoForce.toFixed(3)},${p.lightForce.toFixed(3)},${p.netForce.toFixed(3)}`
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `光泳实验数据_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initControls, mainLoop, state, goToStep, exportDataCSV };
} else {
  window.initControls = initControls;
  window.mainLoop = mainLoop;
  window.state = state;
  window.exportDataCSV = exportDataCSV;
}
