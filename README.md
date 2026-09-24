# Billzhots

## Description:
Built a full-stack expense tracker with Next.js and Django REST Framework, secured with JWT auth. Users upload PDF or image receipts and see total spend and category breakdowns on a dashboard. Integrated google generative GEMINI LLM model and handled asynchronous tasks with redis and celery for amounts calculation. Integrated Multi factor authentication (MFA) for security and Google charts for visualization.

## AI Bill Extraction

Every uploaded bill (PDF, PNG or JPEG) is queued on Redis and processed by a
Celery worker, which sends the file to Gemini and extracts.

## 🛠️ Tech Stack

This project uses the following technologies:

### Frontend

- Next.js
- Typescript
- Tailwind CSS

### Backend

- Django
- Django REST Framework
- Postgres

### Development Tools

- Docker & Docker Compose
- Python 12
- Node.js 18+
- Redis
- Celery
- Gemini Model

## Setup to run this project:-

### Environment Configuration

- Create a .env file in frontend repository with following content
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

- The default environment variables are defined in `.env.template`. For enhanced security:
  1. Copy `.env.template` to `.env`:
     ```bash
     cp .env.template .env
     ```
  2. Update sensitive information like API keys, secrets, and database credentials in `.env`.

## Frontend

- Install all packages from node with:-
```bash
npm install
 ```

- Run the server with:-
```bash
npm run dev
```

## Backend
- Create a virtual environment with:-
```bash
python -m venv virtual_env
```

- Activate using:-
```bash
source virtual_env\bin\activate
```

- Install dependencies
```bash
pip install -r requirements.txt
```

- Apply migrations
```bash
python manage.py migrate
```

- Run server
```bash
python manage.py runserver
```

### Redis & Celery

Bill extraction runs off the request cycle, so Redis and a Celery worker must be
running for amounts to be filled in.

- Start Redis, either natively:
```bash
redis-server
```
  or just the Redis container, from the `backend` directory:
```bash
cd backend
docker compose up -d redis
```
  Both listen on `localhost:6379`, which matches `REDIS_URL` in `.env.template`.

- Start the Celery worker, from the `backend` directory
```bash
cd backend
celery -A ecommerce_backend worker --loglevel=info
```

Set `GEMINI_API_KEY` in `.env` first - get one at https://aistudio.google.com/apikey.
Without a worker running, uploads stay in `pending`; for local work without Redis
you can set `CELERY_TASK_ALWAYS_EAGER=True` to run extraction inline instead.

## Docker

Set `GEMINI_API_KEY` in the root `.env` first, then:

```bash
cd backend
docker compose up --build
```

Run the test suite inside the container:

```bash
docker compose exec web python manage.py test
```

Other useful commands:

```bash
docker compose logs -f celery_worker      # watch extraction jobs
docker compose exec redis redis-cli ping  # check Redis is up
```

## Screenshots
<img width="658" height="435" alt="login" src="https://github.com/user-attachments/assets/447ae418-9a72-4e82-aac4-8dcf037f4431" />
<img width="656" height="470" alt="mfa" src="https://github.com/user-attachments/assets/cdba9cfd-9466-40a3-b29e-0eb52075fdd8" />

<img width="659" height="437" alt="dash" src="https://github.com/user-attachments/assets/fb3270d9-9fda-4842-9a50-469e22c7aa2d" />
<img width="661" height="470" alt="chart" src="https://github.com/user-attachments/assets/ba636502-cbf7-48ab-afc0-198bff548409" />
<img width="658" height="475" alt="amount" src="https://github.com/user-attachments/assets/116591b1-1ad5-4401-a16e-ec90312ea1e2" />


## License

This project is licensed under the [GNU GENERAL PUBLIC LICENSE](LICENSE).
