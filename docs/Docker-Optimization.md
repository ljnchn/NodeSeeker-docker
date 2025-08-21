# Docker 部署优化指南

## 🔧 优化内容概览

本次优化主要解决了以下问题并提升了 Docker 部署的稳定性和性能：

### ✅ 修复的问题

1. **端口不一致问题**
   - 统一端口配置为 3010
   - 修正 Dockerfile 和 docker-compose.yml 中的端口映射

2. **健康检查缺失**
   - 在 Dockerfile 中添加 curl 工具
   - 配置完整的健康检查机制

3. **权限问题**
   - 优化非 root 用户权限设置
   - 确保数据和日志目录的正确权限

4. **环境变量配置**
   - 更新 .env.example 模板
   - 添加详细的配置说明和安全提示

### 🚀 性能优化

1. **Docker 构建优化**
   - 优化构建层缓存策略
   - 分离源代码复制以提高缓存效率
   - 多阶段构建减少最终镜像大小

2. **简化架构**
   - 移除 Nginx 代理层，直接暴露应用端口
   - 减少组件复杂度，提高部署效率
   - 应用自身处理所有 HTTP 请求

3. **日志管理**
   - 配置日志轮转
   - 统一日志存储策略

## 🛠️ 部署指南

### 快速启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd NodeSeeker-docker

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，特别是 JWT_SECRET

# 3. 启动服务
docker-compose up -d

# 4. 检查服务状态
docker-compose ps
docker-compose logs -f nodeseeker
```

### 生产环境部署

```bash
# 使用生产配置
docker-compose -f docker-compose.prod.yml up -d

# 检查健康状态
curl http://localhost:3010/health
```

### 服务访问

- **应用访问**: http://localhost:3010
- **健康检查**: http://localhost:3010/health
- **API 接口**: http://localhost:3010/api/

## 📋 配置要点

### 必须配置项

1. **JWT_SECRET**: 生产环境必须设置强密码（32字符以上）
2. **CORS_ORIGINS**: 设置为实际域名
3. **Telegram配置**: 通过 Web 界面或环境变量设置

### 推荐配置

1. **资源限制**: 生产环境已配置内存和 CPU 限制
2. **自动更新**: Watchtower 服务可选启用
3. **反向代理**: 如需要，可在外部配置 Nginx/Traefik

## 🔐 安全特性

1. **非 root 用户**: 容器内使用非特权用户运行
2. **应用级安全**: 内置速率限制和安全头设置
3. **健康检查**: 自动检测和重启异常容器
4. **环境变量**: 敏感信息通过环境变量管理

## 📊 监控和维护

### 查看日志
```bash
# 应用日志
docker-compose logs -f nodeseeker

# 实时日志
docker-compose logs -f --tail=100 nodeseeker
```

### 备份数据
```bash
# 备份数据库
docker cp nodeseeker-app:/usr/src/app/data ./backup/

# 使用卷备份
docker run --rm -v nodeseeker_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
```

### 更新应用
```bash
# 重新构建并重启
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 或使用 Watchtower 自动更新（已配置）
```

## 🎯 性能调优建议

1. **数据库优化**: 定期执行数据清理任务
2. **资源监控**: 使用 `docker stats` 监控资源使用
3. **日志管理**: 定期清理旧日志文件
4. **外部代理**: 如需要负载均衡或 SSL，在外部配置反向代理

## 🐛 故障排除

### 常见问题

1. **端口冲突**: 检查端口 3010 是否被占用
2. **权限问题**: 确保数据目录权限正确
3. **健康检查失败**: 检查应用启动状态和日志
4. **环境变量**: 确认 JWT_SECRET 等必需变量已设置

### 诊断命令
```bash
# 检查容器状态
docker-compose ps

# 查看资源使用
docker stats

# 进入容器调试
docker exec -it nodeseeker-app /bin/bash

# 查看应用日志
docker-compose logs nodeseeker

# 测试健康检查
curl http://localhost:3010/health
```

## 🌐 外部代理配置（可选）

如果需要添加反向代理，可以在宿主机或其他容器中配置：

### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Traefik 配置示例
```yaml
version: '3.8'
services:
  nodeseeker:
    # ... 现有配置
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nodeseeker.rule=Host(`your-domain.com`)"
      - "traefik.http.services.nodeseeker.loadbalancer.server.port=3010"
```

优化完成！现在项目采用了更简洁的单容器架构，减少了复杂度的同时保持了生产环境的稳定性。