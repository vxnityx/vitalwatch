FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8080

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers ${WEB_CONCURRENCY:-3} --access-logfile -"]
