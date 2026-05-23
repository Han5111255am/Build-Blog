# Personal Blog

[中文](README.md) | [Demo Personal Blog](https://handsomenanblog.cyou/) | [MIT License](LICENSE)

A full-stack personal blog project with a public blog frontend, an admin dashboard, and a Django REST API. It is suitable for self-hosted technical writing, project showcases, notes, podcasts, and photography.

## Tech Stack

- Backend: Python 3.13, Django 5, Django REST Framework, Celery
- Data and queues: MySQL 8, Redis 7, RabbitMQ 3
- Blog frontend: Vue 3, Vue Router, Vite, Vite SSG, UnoCSS
- Admin dashboard: React 18, TypeScript, TanStack Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, Vite
- Content features: Markdown, code highlighting, KaTeX math rendering, HTML sanitization, image and media asset management

## Project Structure

```text
backend/          Django API and backend business logic
blog-frontend/    Public blog frontend
admin-frontend/   Blog admin dashboard
scripts/dev/      Local development scripts
scripts/ops/      Celery worker scripts
docker-compose.yml
.env.example
```

## Quick Start

### 1. Requirements

- Python 3.13
- Node.js 20+
- Docker Desktop

### 2. Configure Environment Variables

```powershell
Copy-Item .env.example .env
```

Update the domain, passwords, and secrets in `.env` as needed. For first-time local development, you can set `DEBUG=True` and keep `ALLOWED_HOSTS` as `localhost,127.0.0.1`.

### 3. Start Infrastructure Services

```powershell
docker compose up -d
```

### 4. Start the Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

### 5. Start the Blog Frontend

```powershell
cd blog-frontend
npm install
npm run dev
```

Default URL: `http://127.0.0.1:5174`

### 6. Start the Admin Dashboard

```powershell
cd admin-frontend
npm install
npm run dev
```

Default URL: `http://127.0.0.1:5173`

## One-Command Development Startup

On Windows PowerShell:

```powershell
.\scripts\dev\start-local-dev-stack.ps1
```

This script starts Docker infrastructure services, the Django backend, Celery workers, the blog frontend, and the admin dashboard.

## Production Build

```powershell
cd blog-frontend
npm install
npm run build

cd ..\admin-frontend
npm install
npm run build
```

For Django production deployment, use Gunicorn/Uvicorn with Nginx, and update `.env` with `DEBUG=False`, `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, database settings, and cache settings.

## License

This project is open-sourced under the [MIT License](LICENSE).
