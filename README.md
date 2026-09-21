# Billzhots

## Description:
 A full stack project made with Next.js frontend and Django as backend. Integrated google generative (GENai) LLM model and handled asynchronous tasks with redis and celery for amounts calculation. Integrated Multi factor authentication (MFA) for security and Google charts for visualization. Bills can be downloaded and deleted too from the platform.

## AI Bill Extraction

Every uploaded bill (PDF, PNG or JPEG) is queued on Redis and processed by a
Celery worker, which sends the file to Gemini and extracts:

| Field | Description |
| --- | --- |
| `amount` | Final payable total on the bill |
| `category` | One of a fixed taxonomy (groceries, dining, utilities, ...) |
| `vendor` | Merchant name |
| `bill_date` | Date printed on the bill |

The upload request returns immediately with `processing_status: pending`; the
dashboard polls until each bill reaches `completed` or `failed`. The chart shows
category-wise amount distribution, served by `GET /bill/category_distribution/`.


## 🛠️ Tech Stack

This project uses the following technologies:

### Frontend

- Next.js
- Typescript
- Tailwind CSS

### Backend

- Django
- Postgres

### Development Tools

- Docker & Docker Compose
- Python 12
- Node.js 18+
- Redis
- CElery
- Genai

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

- Start Redis (or `docker compose up redis`)
```bash
redis-server
```

- Start the Celery worker, from the `ecommerce_backend` directory
```bash
celery -A ecommerce_backend worker --loglevel=info
```

Set `GEMINI_API_KEY` in `.env` first - get one at https://aistudio.google.com/apikey.
Without a worker running, uploads stay in `pending`; for local work without Redis
you can set `CELERY_TASK_ALWAYS_EAGER=True` to run extraction inline instead.

If using Docker, then:-

```bash
docker compose up --build
```



## Screenshot

![Screenshot from 2025-06-21 22-49-01](https://github.com/user-attachments/assets/40c55e29-0a0a-445a-965d-2cfbcce156d5)

## License

This project is licensed under the [GNU GENERAL PUBLIC LICENSE](LICENSE).
