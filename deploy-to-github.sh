#!/bin/bash
# GitHub Pages 部署脚本

echo "=== 光泳效应虚拟仿真平台 - GitHub Pages 部署 ==="
echo ""

# 检查参数
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "用法: bash deploy-to-github.sh <GITHUB_USERNAME> <REPO_NAME> <PAT_TOKEN>"
    echo ""
    echo "示例: bash deploy-to-github.sh myuser guangyong-sim ghp_xxxxxxxxxxxx"
    echo ""
    echo "如何获取 PAT:"
    echo "  1. 访问 https://github.com/settings/tokens/new"
    echo "  2. Note 填写: gh-pages-deploy"
    echo "  3. Expiration: 2027-09-03"
    echo "  4. 勾选: repo"
    echo "  5. 点击 Generate token"
    exit 1
fi

USERNAME=$1
REPO=$2
TOKEN=$3

echo "用户名: $USERNAME"
echo "仓库名: $REPO"
echo ""

# 创建仓库
echo "正在创建 GitHub 仓库..."
curl -s -X POST https://api.github.com/user/repos \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{\"name\":\"$REPO\",\"description\":\"光泳效应虚拟仿真实验平台\",\"private\":false}" > /dev/null

if [ $? -eq 0 ]; then
    echo "✓ 仓库创建成功"
else
    echo "✗ 仓库创建失败，可能已存在同名仓库"
fi

# 添加远程仓库
echo ""
echo "正在配置 Git 远程仓库..."
git remote remove origin 2>/dev/null
git remote add origin "https://$TOKEN@github.com/$USERNAME/$REPO.git"

# 重命名分支为 main
git branch -M main

# 推送代码
echo "正在推送到 GitHub..."
git push -u origin main 2>&1

if [ $? -eq 0 ]; then
    echo "✓ 代码推送成功"
else
    echo "✗ 代码推送失败"
    exit 1
fi

# 启用 GitHub Pages
echo ""
echo "正在启用 GitHub Pages..."
curl -s -X POST https://api.github.com/repos/$USERNAME/$REPO/pages \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"source":{"branch":"main","path":"/"}}' > /dev/null

echo "✓ GitHub Pages 已启用"

# 显示结果
echo ""
echo "=========================================="
echo "部署成功！"
echo "=========================================="
echo ""
echo "你的网站地址:"
echo "https://$USERNAME.github.io/$REPO/"
echo ""
echo "=========================================="
echo "如何更新内容:"
echo "=========================================="
echo ""
echo "每次修改代码后，运行:"
echo "  cd C:/Users/10498/Desktop/website/simulation"
echo "  git add ."
echo "  git commit -m \"更新内容\""
echo "  git push origin main"
echo ""
echo "GitHub 会自动重新部署！"
echo ""
