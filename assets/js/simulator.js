/**
 * 光泳效应虚拟仿真实验平台 — 物理仿真模型
 * 包含：热传导仿真、光泳力计算、光压力计算
 */

// ===== 实验数据（用于校准和对比） =====
const EXPERIMENT_DATA = {
  pressureForce: {
    pressures: [0.0889, 0.0782, 0.0675, 0.0568, 0.0451, 0.0342, 0.0235, 0.0128, 0.0052, 0.0015],
    forceDensity: [0.0282, 0.0344, 0.0425, 0.0521, 0.0643, 0.0789, 0.0951, 0.1149, 0.1357, 0.1587]
  },
  intensityForce: {
    intensities: [420, 580, 750, 920, 1100, 1280, 1450, 1620],
    forceDensity: [0.0190, 0.0275, 0.0379, 0.0475, 0.0591, 0.0695, 0.0799, 0.0904]
  },
  timeForce: {
    times: [10, 20, 30, 40, 50, 60, 80, 100, 120, 150],
    forceDensity: [0.0124, 0.0216, 0.0299, 0.0368, 0.0425, 0.0475, 0.0551, 0.0596, 0.0628, 0.0657]
  },
  criticalPressure: { min: 0.018, max: 0.024 }
};

// ===== 仿真参数（校准自实验数据） =====
const SIM_PARAMS = {
  // 光强-力线性系数 (μN per W/m²)
  intensityCoeff: 0.000056,
  // 时间常数 (秒)
  timeConstant: 35,
  // 最大光泳力 (μN)
  maxForce: 66,
  // 气压影响系数
  pressureFactor: (p) => 0.5 + 0.5 * (1 - p / 0.1),
  // 光压力系数
  lightPressureCoeff: 0.000028,
  // 临界压强
  criticalPressure: 0.021
};

/**
 * 光泳力仿真模型
 * 基于简化热传导 + 光泳力公式
 * @param {number} intensity - 光强 (W/m²)
 * @param {number} pressure - 气压 (MPa)
 * @param {number} time - 照射时间 (秒)
 * @returns {object} { photophoreticForce, lightPressure, netForce }
 */
function simulatePhotophoresis(intensity, pressure, time) {
  // 1. 光强 → 温差 (简化: 温差正比于光强)
  const tempDiff = intensity * 0.05; // 简化温度差

  // 2. 时间 → 温差趋稳 (指数增长)
  const timeFactor = 1 - Math.exp(-time / SIM_PARAMS.timeConstant);
  const effectiveTempDiff = tempDiff * Math.min(timeFactor, 1.0);

  // 3. 气压 → 光泳力调制
  // 实验范围内(0.0015~0.09 MPa)，光泳力随气压降低而增大
  const pressureMod = SIM_PARAMS.pressureFactor(pressure);

  // 4. 计算光泳力 (μN)
  const photophoreticForce = intensity * SIM_PARAMS.intensityCoeff * timeFactor * pressureMod * 1000;

  // 5. 计算光压力 (μN)
  // 石墨侧: F1 = P/c, 铝箔侧: F2 = 2*P/2/c = P/c (已抵消一半)
  // 净光压力 ≈ 0 (理想抵消), 实际有残余
  const lightPressure = intensity * SIM_PARAMS.lightPressureCoeff * 0.1 * 1000; // 残余光压力

  // 6. 净测量值
  const netForce = photophoreticForce - lightPressure;

  return {
    photophoreticForce: Math.max(0, photophoreticForce),
    lightPressure: Math.max(0, lightPressure),
    netForce: Math.max(0, netForce),
    pressureMod: pressureMod,
    timeFactor: timeFactor
  };
}

/**
 * 气压-光泳力曲线（仿真）
 */
function simulatePressureCurve() {
  const points = [];
  for (let p = 0.001; p <= 0.1; p += 0.005) {
    const result = simulatePhotophoresis(1450, p, 120);
    points.push({ pressure: p, force: result.netForce });
  }
  return points;
}

/**
 * 光强-光泳力曲线（仿真）
 */
function simulateIntensityCurve() {
  const points = [];
  for (let I = 400; I <= 1700; I += 50) {
    const result = simulatePhotophoresis(I, 0.05, 100);
    points.push({ intensity: I, force: result.netForce });
  }
  return points;
}

/**
 * 时间-光泳力曲线（仿真）
 */
function simulateTimeCurve() {
  const points = [];
  for (let t = 0; t <= 150; t += 5) {
    const result = simulatePhotophoresis(1450, 0.05, t);
    points.push({ time: t, force: result.netForce });
  }
  return points;
}

/**
 * 临界点仿真
 */
function simulateCriticalPoint(intensity) {
  const points = [];
  for (let p = 0.001; p <= 0.1; p += 0.001) {
    const pf = simulatePhotophoresis(intensity, p, 120);
    points.push({ pressure: p, photoForce: pf.photophoreticForce, lightForce: pf.lightPressure + pf.netForce });
  }
  // 找交点
  let criticalIdx = -1;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if ((prev.photoForce - prev.lightForce) * (curr.photoForce - curr.lightForce) < 0) {
      criticalIdx = i;
      break;
    }
  }
  return { points, criticalIdx };
}

// ===== 气压动态仿真 =====
class VacuumSimulator {
  constructor() {
    this.currentPressure = 0.1000; // MPa, 初始常压
    this.targetPressure = 0.1000;
    this.pumpRunning = false;
    this.ventRunning = false;
    this.pumpRate = 0.003; // MPa/s
    this.ventRate = 0.002; // MPa/s
  }

  startPump() {
    this.pumpRunning = true;
    this.ventRunning = false;
  }

  stopPump() {
    this.pumpRunning = false;
  }

  startVent() {
    this.ventRunning = true;
    this.pumpRunning = false;
  }

  setTarget(pressure) {
    this.targetPressure = pressure;
  }

  update(dt) {
    if (this.pumpRunning && this.currentPressure > this.targetPressure) {
      this.currentPressure = Math.max(this.targetPressure, this.currentPressure - this.pumpRate * dt);
    } else if (this.ventRunning && this.currentPressure < 0.1) {
      this.currentPressure = Math.min(0.1, this.currentPressure + this.ventRate * dt);
    }
    // 自然恢复
    if (!this.pumpRunning && !this.ventRunning) {
      this.currentPressure = Math.min(0.1, this.currentPressure + 0.0001 * dt);
    }
    return this.currentPressure;
  }

  reset() {
    this.currentPressure = 0.1000;
    this.targetPressure = 0.1000;
    this.pumpRunning = false;
    this.ventRunning = false;
  }
}

// ===== 光源仿真 =====
class LightSimulator {
  constructor() {
    this.intensity = 0; // W/m²
    this.targetIntensity = 0;
    this.on = false;
    this.separatorEnabled = true;
    this.warmupTime = 5; // 秒
    this.warmupStart = 0;
  }

  turnOn() {
    this.on = true;
    this.warmupStart = performance.now() / 1000;
  }

  turnOff() {
    this.on = false;
    this.targetIntensity = 0;
  }

  setIntensity(watts) {
    this.targetIntensity = watts * 10; // 转换为 W/m² (近似)
  }

  toggleSeparator() {}

  getGraphiteIntensity() {
    if (!this.on) return 0;
    const warmup = Math.min(1, (performance.now() / 1000 - this.warmupStart) / this.warmupTime);
    return this.targetIntensity * warmup;
  }

  getAluminumIntensity() {
    if (!this.on) return 0;
    const warmup = Math.min(1, (performance.now() / 1000 - this.warmupStart) / this.warmupTime);
    return this.targetIntensity * warmup * 0.5;
  }

  update(dt) {
    // 平滑过渡
    const speed = 2.0 * dt;
    if (this.intensity < this.targetIntensity) {
      this.intensity = Math.min(this.targetIntensity, this.intensity + speed);
    } else if (this.intensity > this.targetIntensity) {
      this.intensity = Math.max(this.targetIntensity, this.intensity - speed);
    }
  }

  reset() {
    this.intensity = 0;
    this.targetIntensity = 0;
    this.on = false;
    this.separatorEnabled = true;
  }
}

// ===== 秒表 =====
class Stopwatch {
  constructor() {
    this.elapsed = 0;
    this.running = false;
    this.lastStart = 0;
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.lastStart = performance.now();
    }
  }

  pause() {
    if (this.running) {
      this.elapsed += performance.now() - this.lastStart;
      this.running = false;
    }
  }

  reset() {
    this.elapsed = 0;
    this.running = false;
  }

  get time() {
    if (this.running) {
      return this.elapsed + (performance.now() - this.lastStart);
    }
    return this.elapsed;
  }

  get formatted() {
    const ms = Math.floor(this.time);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
}

// ===== 全局仿真实例 =====
const vacuumSim = new VacuumSimulator();
const lightSim = new LightSimulator();
const stopwatch = new Stopwatch();

// 实时曲线数据
const realtimeData = {
  intensity: [],
  force: [],
  pressure: [],
  forceByPressure: [],
  time: [],
  forceByTime: []
};

// ===== 导出 =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    simulatePhotophoresis, simulatePressureCurve, simulateIntensityCurve,
    simulateTimeCurve, simulateCriticalPoint, EXPERIMENT_DATA,
    VacuumSimulator, LightSimulator, Stopwatch, SIM_PARAMS
  };
}
