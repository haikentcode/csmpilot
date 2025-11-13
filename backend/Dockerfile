# Backend Dockerfile for CSM Copilot
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=csmpilot.settings

# Set work directory
WORKDIR /app

# Install system dependencies
# Added 'libpq-dev' - this provides the necessary headers for psycopg2/psycopg to compile against Postgres C-libraries.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    g++ \
    libc6-dev \
    libffi-dev \
    libssl-dev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Update certificates
RUN update-ca-certificates

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create necessary directories
RUN mkdir -p /app/media /app/static /app/staticfiles

# Collect static files (run migrations will be done at runtime)
RUN python manage.py collectstatic --noinput || echo "Static files collection completed"

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/customers/ || exit 1

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]