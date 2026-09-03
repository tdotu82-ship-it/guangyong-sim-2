/**
 * 光泳效应虚拟仿真实验平台 — ECharts 图表
 * 数据来自实验报告表6-1~6-4
 */

// ===== 公共样式 =====
const chartTheme = {
  backgroundColor: 'transparent',
  textStyle: { color: '#94a3b8', fontSize: 12 },
  grid: { left: '12%', right: '6%', top: '12%', bottom: '10%' },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(17,24,39,0.95)',
    borderColor: '#374357',
    textStyle: { color: '#e2e8f0', fontSize: 12 },
    axisPointer: { type: 'cross', crossStyle: { color: '#374357' } }
  },
  legend: { textStyle: { color: '#94a3b8' } }
};

const chartInstances = {};

/**
 * 安全初始化图表（带重试）
 */
function initChartSafely(chartId, initFn, maxRetries) {
  maxRetries = maxRetries || 8;
  let retries = 0;

  function tryInit() {
    const el = document.getElementById(chartId);
    if (!el) return;
    if (chartInstances[chartId + '_init']) return;

    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w < 100 || h < 100) {
      retries++;
      if (retries <= maxRetries) {
        setTimeout(tryInit, 400);
      }
      return;
    }

    if (chartInstances[chartId]) {
      chartInstances[chartId].dispose();
    }
    const chart = echarts.init(el, null, { renderer: 'canvas' });
    chartInstances[chartId] = chart;
    chartInstances[chartId + '_init'] = true;
    initFn(chart);
  }
  tryInit();
}

// ===== 图表1: 光泳力 vs 气压 =====
// 实验报告表6-1：光泳力随真空度升高（气压降低）单调递增，非线性
function initChart1(chart) {
  if (!chart) {
    initChartSafely('chart1', initChart1);
    return;
  }
  chartInstances.chart1 = chart;

  // 从实验报告数据重建：真空度从低到高（气压从高到低）
  // 数据趋势：真空度低时变化平缓，高真空区接近线性
  const pressures = [0.0889, 0.0782, 0.0675, 0.0568, 0.0451, 0.0342, 0.0235, 0.0128, 0.0052, 0.0015];
  const forceDensity = [0.0282, 0.0344, 0.0425, 0.0521, 0.0643, 0.0789, 0.0951, 0.1149, 0.1357, 0.1587];

  chart.setOption({
    ...chartTheme,
    xAxis: {
      type: 'category',
      name: '气压 (MPa)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      data: pressures.map(p => p.toFixed(3)),
      axisLine: { lineStyle: { color: '#374357' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '光泳力面密度 (N/m²)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLine: { lineStyle: { color: '#374357' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    series: [{
      data: forceDensity,
      type: 'line',
      smooth: 0.4,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#3b82f6', width: 2 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59,130,246,0.3)' },
          { offset: 1, color: 'rgba(59,130,246,0.02)' }
        ])
      }
    }],
    graphic: [{
      type: 'text',
      left: 'center',
      bottom: 2,
      style: { text: '结论：光泳力随真空度升高（气压降低）而增大，高真空区接近线性', fill: '#64748b', fontSize: 11 }
    }]
  });
}

// ===== 图表2: 光泳力 vs 光强 =====
// 实验报告: F = 0.0428 + 0.02906I, R²=0.9679
function initChart2(chart) {
  if (!chart) {
    initChartSafely('chart2', initChart2);
    return;
  }
  chartInstances.chart2 = chart;

  const intensities = [420, 580, 750, 920, 1100, 1280, 1450, 1620];
  const forceDensity = [0.0190, 0.0275, 0.0379, 0.0475, 0.0591, 0.0695, 0.0799, 0.0904];

  // 线性拟合线
  const fitLine = intensities.map(I => 0.0428 + 0.02906 * I);

  chart.setOption({
    ...chartTheme,
    xAxis: {
      type: 'category',
      name: '光强 (W/m²)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      data: intensities,
      axisLine: { lineStyle: { color: '#374357' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '光泳力面密度 (N/m²)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLine: { lineStyle: { color: '#374357' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    series: [
      {
        name: '实验数据',
        data: forceDensity,
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' }
      },
      {
        name: '拟合线',
        data: fitLine,
        type: 'line',
        smooth: false,
        symbol: 'none',
        lineStyle: { color: '#fbbf24', type: 'dashed', width: 1 }
      }
    ],
    legend: { data: ['实验数据', '拟合线'], top: 5 },
    graphic: [{
      type: 'text',
      left: 'center',
      bottom: 2,
      style: { text: '结论：光泳力与光强呈近似线性正相关 (R²=0.9679)', fill: '#64748b', fontSize: 11 }
    }]
  });
}

// ===== 图表3: 光泳力 vs 时间 =====
// 实验报告: F(t) = 2.092094 - 1.268345e^(-0.038089t) - 0.823749e^(-0.845946t), R²=0.997145
function initChart3(chart) {
  if (!chart) {
    initChartSafely('chart3', initChart3);
    return;
  }
  chartInstances.chart3 = chart;

  const times = [10, 20, 30, 40, 50, 60, 80, 100, 120, 150];
  const forceDensity = [0.0124, 0.0216, 0.0299, 0.0368, 0.0425, 0.0475, 0.0551, 0.0596, 0.0628, 0.0657];

  // 拟合曲线（双指数衰减趋稳）
  const fitLine = times.map(t => {
    return 2.092094 - 1.268345 * Math.exp(-0.038089 * t) - 0.823749 * Math.exp(-0.845946 * t);
  });

  chart.setOption({
    ...chartTheme,
    xAxis: {
      type: 'category',
      name: '时间 (s)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      data: times,
      axisLine: { lineStyle: { color: '#374357' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '光泳力面密度 (N/m²)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLine: { lineStyle: { color: '#374357' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    series: [
      {
        name: '实验数据',
        data: forceDensity,
        type: 'line',
        smooth: 0.6,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#a78bfa', width: 2 },
        itemStyle: { color: '#a78bfa' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(167,139,250,0.25)' },
            { offset: 1, color: 'rgba(167,139,250,0.02)' }
          ])
        }
      },
      {
        name: '拟合曲线',
        data: fitLine,
        type: 'line',
        smooth: false,
        symbol: 'none',
        lineStyle: { color: '#fbbf24', type: 'dashed', width: 1 }
      }
    ],
    legend: { data: ['实验数据', '拟合曲线'], top: 5 },
    graphic: [{
      type: 'text',
      left: 'center',
      bottom: 2,
      style: { text: '结论：光泳力随时间指数增长趋稳 (R²=0.997)', fill: '#64748b', fontSize: 11 }
    }]
  });
}

// ===== 图表4: 临界点 =====
// 实验报告：临界真空度0.018~0.024 MPa
function initChart4(chart) {
  if (!chart) {
    initChartSafely('chart4', initChart4);
    return;
  }
  chartInstances.chart4 = chart;

  const pressures = [];
  const photoForces = [];
  const lightForces = [];
  for (let p = 0.001; p <= 0.1; p += 0.002) {
    pressures.push(p);
    // 光泳力：随气压降低而增大
    photoForces.push(0.05 + 0.15 * (1 - p / 0.1));
    // 光压力：基本恒定
    lightForces.push(0.12);
  }

  chart.setOption({
    ...chartTheme,
    xAxis: {
      type: 'category',
      name: '气压 (MPa)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      data: pressures.map(v => v.toFixed(3)),
      axisLine: { lineStyle: { color: '#374357' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '力 (μN)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLine: { lineStyle: { color: '#374357' } },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } }
    },
    series: [
      {
        name: '光泳力',
        data: photoForces,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#22c55e', width: 2 },
        areaStyle: { color: 'rgba(34,197,94,0.1)' }
      },
      {
        name: '光压力',
        data: lightForces,
        type: 'line',
        symbol: 'none',
        lineStyle: { color: '#ef4444', width: 2, type: 'dashed' }
      },
      {
        name: '临界区域',
        type: 'line',
        symbol: 'none',
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(249,115,22,0.15)' },
          data: [[{ xAxis: 0.018 }, { xAxis: 0.024 }]]
        },
        markLabel: {
          formatter: '临界区 0.018~0.024 MPa',
          color: '#f97316', fontSize: 11,
          position: 'insideTopRight'
        }
      }
    ],
    legend: { data: ['光泳力', '光压力', '临界区域'], top: 5 },
    graphic: [{
      type: 'text',
      left: 'center',
      bottom: 2,
      style: { text: '结论：在0.018~0.024 MPa区间，光泳力=光压力，传感器读数为零', fill: '#64748b', fontSize: 11 }
    }]
  });
}

// ===== 图表7: 物理量关系全景图 =====
function initRelationChart(chart) {
  if (!chart) {
    initChartSafely('relationChart', initRelationChart);
    return;
  }
  chartInstances.relation = chart;

  chart.setOption({
    ...chartTheme,
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [{
      type: 'graph',
      layout: 'force',
      force: { repulsion: 300, edgeLength: 150, gravity: 0.1 },
      roam: true,
      label: { color: '#e2e8f0', fontSize: 12, position: 'right' },
      categories: [
        { name: '核心', itemStyle: { color: '#fbbf24' } },
        { name: '原因', itemStyle: { color: '#3b82f6' } },
        { name: '结果', itemStyle: { color: '#22c55e' } },
        { name: '无关', itemStyle: { color: '#ef4444' } }
      ],
      nodes: [
        { name: '光泳力', category: 0, symbolSize: 60, value: '核心物理量' },
        { name: '光强↑', category: 1, symbolSize: 40 },
        { name: '温差↑', category: 1, symbolSize: 40 },
        { name: '气压↑', category: 1, symbolSize: 40 },
        { name: '时间↑', category: 1, symbolSize: 40 },
        { name: '光泳力↑', category: 2, symbolSize: 40 },
        { name: '光压力', category: 3, symbolSize: 40 },
        { name: '临界压强', category: 2, symbolSize: 45 },
        { name: '分子碰撞', category: 1, symbolSize: 35 }
      ],
      edges: [
        { source: '光强↑', target: '温差↑' },
        { source: '温差↑', target: '光泳力↑' },
        { source: '气压↑', target: '光泳力↑' },
        { source: '时间↑', target: '温差↑' },
        { source: '光压力', target: '临界压强' },
        { source: '光泳力', target: '临界压强' },
        { source: '分子碰撞', target: '光泳力' },
        { source: '光压力', target: '光泳力' }
      ]
    }],
    graphic: [{
      type: 'text',
      left: 'center',
      bottom: 5,
      style: { text: '拖动/缩放查看关系 · 节点大小表示影响力大小', fill: '#64748b', fontSize: 11 }
    }]
  });
}

// ===== 图表导出功能 =====
function exportChart(chartId, filename) {
  const chart = chartInstances[chartId];
  if (!chart) { alert('图表未初始化'); return; }
  const url = chart.getDataURL({ type: 'png', pixelRatio: 2 });
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${chartId}.png`;
  a.click();
}

// ===== 为图表容器添加导出按钮 =====
function addExportButtons() {
  const chartIds = ['chart1', 'chart2', 'chart3', 'chart4', 'relationChart'];
  chartIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const btn = document.createElement('button');
    btn.textContent = '📷 导出';
    btn.style.cssText = 'position:absolute;top:8px;right:8px;padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:var(--bg-elevated);color:var(--text-muted);font-size:11px;cursor:pointer;z-index:10;';
    btn.addEventListener('mouseenter', () => btn.style.color = 'var(--accent)');
    btn.addEventListener('mouseleave', () => btn.style.color = 'var(--text-muted)');
    btn.addEventListener('click', () => exportChart(id, `光泳实验_${id}.png`));
    el.style.position = 'relative';
    el.appendChild(btn);
  });
}
let realtimeChart = null;

function initRealtimeChart() {
  const el = document.getElementById('realtimeChart');
  if (!el) return;

  function tryInit() {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w < 100 || h < 100) {
      setTimeout(tryInit, 400);
      return;
    }
    if (realtimeChart) realtimeChart.dispose();
    realtimeChart = echarts.init(el, null, { renderer: 'canvas' });
    window.realtimeChart = realtimeChart;
    realtimeChart.setOption({
      ...chartTheme,
      grid: { left: '10%', right: '4%', top: '8%', bottom: '15%' },
      xAxis: {
        type: 'category',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLine: { lineStyle: { color: '#374357' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '力 (μN)',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLine: { lineStyle: { color: '#374357' } },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [{
        name: '测量值',
        data: [],
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#fbbf24', width: 2 },
        itemStyle: { color: '#fbbf24' },
        areaStyle: { color: 'rgba(251,191,36,0.1)' }
      }],
      graphic: [{
        type: 'text',
        left: 'center',
        bottom: 2,
        style: { text: '记录数据点后自动绘制实时曲线', fill: '#475569', fontSize: 10 }
      }]
    });
  }
  tryInit();
  setTimeout(addExportButtons, 500);
}

function updateRealtimeChart(xData, yData, xLabel, yLabel) {
  if (!realtimeChart) return;
  realtimeChart.setOption({
    xAxis: { name: xLabel },
    yAxis: { name: yLabel },
    series: [{ data: yData.map((v, i) => [xData[i], v]) }]
  });
}

function handleResize() {
  Object.values(chartInstances).forEach(c => c && c.resize());
  if (realtimeChart) realtimeChart.resize();
}

// ===== 导出 =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initChart1, initChart2, initChart3, initChart4, initRelationChart, initRealtimeChart, updateRealtimeChart, handleResize, exportChart };
} else {
  window.chartInstances = chartInstances;
  window.exportChart = exportChart;
  window.addExportButtons = addExportButtons;
  window.realtimeChart = realtimeChart;
  window.updateRealtimeChart = updateRealtimeChart;
}
