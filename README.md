# Personal Blog

[English](README.en.md) | [个人博客示例站点](https://handsomenanblog.cyou/) | [MIT License](LICENSE)

一个全栈个人博客项目，包含公开博客前台、后台管理端和 Django REST API。适合自托管技术博客、项目展示、笔记、友链、播客和摄影内容。

## 技术栈

- 后端：Python 3.13、Django 5、Django REST Framework、Celery
- 数据与队列：MySQL 8、Redis 7、RabbitMQ 3
- 博客前台：Vue 3、Vue Router、Vite、Vite SSG、UnoCSS
- 管理后台：React 18、TypeScript、TanStack Router、TanStack Query、React Hook Form、Zod、Tailwind CSS、Vite
- 内容能力：Markdown、代码高亮、KaTeX 数学公式、HTML 清洗、友链申请与审核、图片/媒体资源管理

## 目录结构

```text
backend/          Django API 与后台业务逻辑
blog-frontend/    面向访客的博客前台
admin-frontend/   博客后台管理端
scripts/dev/      本地开发启动脚本
scripts/ops/      Celery worker 启动脚本
docker-compose.yml
.env.example
```

## 快速启动

### 1. 准备环境

- Python 3.13
- Node.js 20+
- Docker Desktop

### 2. 配置环境变量

```powershell
Copy-Item .env.example .env
```

按需修改 `.env` 中的域名、密码和密钥。首次本地开发时可以将 `DEBUG=True`，并把 `ALLOWED_HOSTS` 保持为 `localhost,127.0.0.1`。

### 3. 启动基础服务

```powershell
docker compose up -d
```

### 4. 启动后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

### 5. 启动博客前台

```powershell
cd blog-frontend
npm install
npm run dev
```

默认访问：`http://127.0.0.1:5174`

### 6. 启动管理后台

```powershell
cd admin-frontend
npm install
npm run dev
```

默认访问：`http://127.0.0.1:5173`

## 一键开发启动

Windows PowerShell 可以使用：

```powershell
.\scripts\dev\start-local-dev-stack.ps1
```

该脚本会启动 Docker 基础服务、Django 后端、Celery worker、博客前台和管理后台。

## 生产构建

```powershell
cd blog-frontend
npm install
npm run build

cd ..\admin-frontend
npm install
npm run build
```

Django 生产部署建议使用 Gunicorn/Uvicorn + Nginx，并将 `.env` 中的 `DEBUG=False`、`DJANGO_SECRET_KEY`、`ALLOWED_HOSTS`、`CSRF_TRUSTED_ORIGINS`、数据库和缓存配置改为实际值。

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。

## 致谢

本项目基于 [antfu/antfu.me](https://github.com/antfu/antfu.me) 的开源代码进行二次改造与扩展。原始代码版权归 Anthony Fu 所有，并遵循 MIT License。
