# GitHub Pages 部署脚本 (PowerShell)

Write-Host "=== 光泳效应虚拟仿真平台 - GitHub Pages 部署 ===" -ForegroundColor Cyan
Write-Host ""

# 检查参数
if ($args.Count -lt 3) {
    Write-Host "用法: .\deploy-to-github.ps1 <GITHUB_USERNAME> <REPO_NAME> <PAT_TOKEN>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "示例: .\deploy-to-github.ps1 myuser guangyong-sim ghp_xxxxxxxxxxxx" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "如何获取 PAT:" -ForegroundColor Yellow
    Write-Host "  1. 访问 https://github.com/settings/tokens/new" -ForegroundColor White
    Write-Host "  2. Note 填写: gh-pages-deploy" -ForegroundColor White
    Write-Host "  3. Expiration: 2027-09-03" -ForegroundColor White
    Write-Host "  4. 勾选: repo" -ForegroundColor White
    Write-Host "  5. 点击 Generate token" -ForegroundColor White
    exit 1
}

$USERNAME = $args[0]
$REPO = $args[1]
$TOKEN = $args[2]

Write-Host "用户名: $USERNAME" -ForegroundColor Green
Write-Host "仓库名: $REPO" -ForegroundColor Green
Write-Host ""

# 创建仓库
Write-Host "正在创建 GitHub 仓库..." -ForegroundColor Cyan
$headers = @{
    Authorization = "token $TOKEN"
    Accept = "application/vnd.github.v3+json"
}
$body = @{
    name = $REPO
    description = "光泳效应虚拟仿真实验平台"
    private = $false
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method POST -Headers $headers -Body $body -ContentType "application/json" | Out-Null
    Write-Host "✓ 仓库创建成功" -ForegroundColor Green
} catch {
    Write-Host "✗ 仓库创建失败，可能已存在同名仓库" -ForegroundColor Red
}

# 添加远程仓库
Write-Host ""
Write-Host "正在配置 Git 远程仓库..." -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin "https://$TOKEN@github.com/$USERNAME/$REPO.git"

# 重命名分支为 main
git branch -M main

# 推送代码
Write-Host "正在推送到 GitHub..." -ForegroundColor Cyan
git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 代码推送成功" -ForegroundColor Green
} else {
    Write-Host "✗ 代码推送失败" -ForegroundColor Red
    exit 1
}

# 启用 GitHub Pages
Write-Host ""
Write-Host "正在启用 GitHub Pages..." -ForegroundColor Cyan
try {
    $pagesBody = @{
        source = @{
            branch = "main"
            path = "/"
        }
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/repos/$USERNAME/$REPO/pages" -Method POST -Headers $headers -Body $pagesBody -ContentType "application/json" | Out-Null
    Write-Host "✓ GitHub Pages 已启用" -ForegroundColor Green
} catch {
    Write-Host "✗ GitHub Pages 启用失败" -ForegroundColor Red
}

# 显示结果
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "部署成功！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "你的网站地址:" -ForegroundColor Yellow
Write-Host "https://$USERNAME.github.io/$REPO/" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "如何更新内容:" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "每次修改代码后，运行:" -ForegroundColor White
Write-Host "  cd C:/Users/10498/Desktop/website/simulation" -ForegroundColor Gray
Write-Host "  git add ." -ForegroundColor Gray
Write-Host "  git commit -m ""更新内容""" -ForegroundColor Gray
Write-Host "  git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "GitHub 会自动重新部署！" -ForegroundColor Green
Write-Host ""
