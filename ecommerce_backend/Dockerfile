FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt /app/


RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip \
    &&  pip install --no-cache-dir -r requirements.txt

COPY . /app/

RUN mkdir -p /app/db

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 80

CMD ["uvicorn", "ecommerce_backend.asgi:application", "--host", "0.0.0.0", "--port", "80"]
