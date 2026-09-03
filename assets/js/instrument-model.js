// 实验模型加载器
let instrumentModelData = null;
let instrumentModelScale = 1/700;
let instrumentModelOffset = {x: -1.44, y: 0, z: -1.22};

async function loadInstrumentModel() {
  try {
    const response = await fetch('assets/models/model-data.json');
    instrumentModelData = await response.json();
    console.log('模型加载完成:', instrumentModelData.triangleCount, '个三角形');
    return instrumentModelData;
  } catch (e) {
    console.error('模型加载失败:', e);
    return null;
  }
}
