/**
 * 光泳效应虚拟仿真实验平台 — 主逻辑
 * 关键改动：页面加载时立即创建当前active tab的场景（tab1默认active）
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initTheoryTabs();
  window.addEventListener('resize', handleResize);
  initModules();
});

function initNavigation() {
  const nav = document.getElementById('mainNav');
  const toggle = document.getElementById('navToggle');
  const links = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  toggle?.addEventListener('click', () => {
    links?.classList.toggle('open');
  });

  links?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links?.classList.remove('open'));
  });

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active',
            link.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => observer.observe(s));
}

function initScrollAnimations() {
  const fades = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  fades.forEach(el => observer.observe(el));
}

function initTheoryTabs() {
  const tabs = document.querySelectorAll('.theory-tab');
  const panels = document.querySelectorAll('.theory-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => p.classList.remove('active'));
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');

      // 延迟创建场景，确保tab切换后容器尺寸已更新
      setTimeout(() => {
        createTheoryScene(targetId);
        // tab切换后立即调整场景尺寸
        setTimeout(() => handleResize(), 100);
      }, 300);
    });
  });
}

function createTheoryScene(tabId) {
  if (tabId === 'tab1') {
    switchScene('module1', buildModule1Scene);
  } else if (tabId === 'tab2') {
    switchScene('module2', buildModule2Scene);
  } else if (tabId === 'tab3') {
    switchScene('module3', buildModule3Scene);
  }
}

function handleResize() {
  if (typeof onWindowResize === 'function') onWindowResize();
  Object.values(chartInstances || {}).forEach(c => c && c.resize());
  if (typeof realtimeChart !== 'undefined' && realtimeChart) realtimeChart.resize();
}

window.addEventListener('resize', handleResize);

function initModules() {
  // 页面加载时，立即创建当前active tab（tab1）的场景
  const activeTab = document.querySelector('.theory-tab.active');
  if (activeTab) {
    const tabId = activeTab.dataset.tab;
    // 延迟200ms确保容器尺寸已更新
    setTimeout(() => {
      createTheoryScene(tabId);
      setTimeout(() => handleResize(), 100);
    }, 300);
  }

  // 图表：延迟初始化（等待容器尺寸就绪）
  setTimeout(() => {
    if (typeof initChart1 === 'function') initChart1();
    if (typeof initChart2 === 'function') initChart2();
    if (typeof initChart3 === 'function') initChart3();
    if (typeof initChart4 === 'function') initChart4();
    if (typeof initRelationChart === 'function') initRelationChart();
    if (typeof initRealtimeChart === 'function') initRealtimeChart();
  }, 300);

  // 操作台控制
  if (typeof initControls === 'function') {
    initControls();
    requestAnimationFrame(mainLoop);
  }

  // 因果链动画
  initCausalAnimation();
}

function initCausalAnimation() {
  const items = document.querySelectorAll('.chain-item');
  const btn = document.getElementById('causalPlayBtn');
  if (!btn || items.length === 0) return;

  let playing = false;
  let currentIndex = 0;
  let animFrame;

  function playChain() {
    if (!playing) return;
    items.forEach((item, i) => {
      item.classList.toggle('active', i === currentIndex);
    });
    currentIndex = (currentIndex + 1) % items.length;
    animFrame = setTimeout(playChain, 1200);
  }

  btn.addEventListener('click', () => {
    if (playing) {
      playing = false;
      clearTimeout(animFrame);
      items.forEach(item => item.classList.remove('active'));
      btn.textContent = '▶ 播放动画';
    } else {
      playing = true;
      currentIndex = 0;
      playChain();
      btn.textContent = '⏹ 停止动画';
    }
  });
}

window.updateRealtimeChart = function(xData, yData, xLabel, yLabel) {
  if (typeof updateRealtimeChart === 'function') {
    updateRealtimeChart(xData, yData, xLabel, yLabel);
  }
};
