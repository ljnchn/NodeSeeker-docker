# CI/CD 配置说明

## GitHub Actions 工作流

本项目使用 GitHub Actions 进行自动化构建和部署，配置文件位于 `.github/workflows/docker-build.yml`。

### 🚀 触发条件

工作流在以下情况下自动触发：

- **推送到主分支**: `main`, `develop`
- **创建标签**: `v*` (如 v1.0.0, v2.1.3)
- **Pull Request**: 向 `main` 分支提交 PR

### 🔄 工作流程

1. **代码检出和环境准备**
   - 检出代码
   - 设置 Bun 运行时环境
   - 缓存依赖以加速构建

2. **代码质量检查**
   - 安装项目依赖
   - 运行测试套件
   - 构建应用程序

3. **Docker 镜像构建**
   - 多平台构建 (linux/amd64, linux/arm64)
   - 自动标签管理
   - 推送到 GitHub Container Registry

4. **安全扫描**
   - 使用 Trivy 进行漏洞扫描
   - 结果上传到 GitHub Security 面板

### 🏷️ 镜像标签策略

- `main` 分支 → `latest` 标签
- `develop` 分支 → `develop` 标签
- 版本标签 → 对应版本号 (v1.0.0 → 1.0.0, 1.0, 1)
- Pull Request → `pr-{number}` 标签

### 📦 镜像仓库

镜像推送到 GitHub Container Registry:
```
ghcr.io/{username}/{repository}:latest
```

### 🔧 本地使用

```bash
# 拉取最新镜像
docker pull ghcr.io/{username}/nodeseeker-docker:latest

# 运行容器
docker run -d \
  --name nodeseeker \
  -p 3010:3010 \
  -v ./data:/app/data \
  -e JWT_SECRET=your-secret-key \
  ghcr.io/{username}/nodeseeker-docker:latest
```

### ⚡ 性能优化

- **依赖缓存**: Bun 依赖和 Docker 层缓存
- **多阶段构建**: 优化镜像大小
- **并行构建**: 多平台同时构建

### 🛡️ 安全特性

- **权限控制**: 最小化 GitHub Token 权限
- **漏洞扫描**: 自动检测安全问题
- **非 root 用户**: 容器内使用非特权用户运行

### 📋 环境变量

CI/CD 过程中需要的环境变量：

- `GITHUB_TOKEN`: GitHub 自动提供，用于推送镜像
- `JWT_SECRET`: 运行时需要，在部署时设置

### 🔍 监控和日志

- GitHub Actions 提供详细的构建日志
- 安全扫描结果在 Security 标签页查看
- 镜像信息在 Packages 页面管理