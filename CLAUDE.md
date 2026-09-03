# 光泳效应虚拟仿真实验平台 — 完整方案+进度

> 项目路径：C:\Users\10498\Desktop\website\simulation\
> 创建时间：2026-08-28
> 截止时间：2026年9月17日（3周后全国大学生物理实验竞赛）
> **当前状态：✅ GitHub Pages 已上线（2026-09-03）**

---

## 🌐 网站地址

```
https://tdotu82-ship-it.github.io/guangyong-sim/
```

任何人只要有网络连接，随时随地都可以访问！

---

## 如何更新网站

每次修改代码后，运行：
```bash
cd C:/Users/10498/Desktop/website/simulation
git add .
git commit -m "更新内容"
git push origin main
```

GitHub 会自动重新部署，2-3 分钟后网站更新完成。

---

## 如何继续
输入：`继续做光泳效应仿真平台`

---

## 🔬 文件结构
```
simulation/
├── index.html
├── server.js                 ← 本地服务器（开发用）
├── .github/workflows/deploy.yml  ← GitHub Actions 工作流
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── three-scene.js
│   │   ├── instrument-model.js
│   │   ├── controls.js
│   │   ├── charts.js
│   │   └── simulator.js
│   ├── models/
│   │   ├── experiment-model.stl
│   │   └── model-data.json
│   └── images/
├── deploy-to-github.sh       ← GitHub Pages 部署脚本
├── deploy-to-github.ps1      ← PowerShell 版本
└── CLAUDE.md
```
