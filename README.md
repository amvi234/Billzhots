# Billzhots

## Description:
 A full stack project made with Next.js frontend and Django as backend. Integrated google generative (GENai) LLM model and handled asynchronous tasks with redis and celery for amounts calculation. Integrated Multi factor authentication (MFA) for security and Google charts for visualization. Bills can be downloaded and deleted too from the platform.


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

- Run sever
```bash
python manage.py runserver
```

If using Docker, then:-

```bash
docker compose up --build
```



## Screenshot

![Screenshot from 2025-06-21 22-49-01](https://github.com/user-attachments/assets/40c55e29-0a0a-445a-965d-2cfbcce156d5)

## License

This project is licensed under the [GNU GENERAL PUBLIC LICENSE](LICENSE).
