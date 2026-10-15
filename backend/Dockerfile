FROM python:3.12-slim

# Не создавать .pyc и не буферизовать stdout (важно для логов docker)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Сначала копируем только requirements — слой закэшируется
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Потом код
COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]