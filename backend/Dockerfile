FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt /app/


RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip \
    &&  pip install --no-cache-dir -r requirements.txt

COPY . /app/

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

CMD ["uvicorn", "ecommerce_backend.asgi:application", "--host", "0.0.0.0", "--port", "8000"]
