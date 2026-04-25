# Multi-stage build for optimized image size
FROM python:3.11-bookworm as base

ENV PYTHONUNBUFFERED=1 \
    # this below line for GDAL path 
    GDAL_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/libgdal.so 
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies for GDAL, PostGIS, WeasyPrint, and PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    # PostgreSQL client and development files
    gcc \
    libpq-dev \
    postgresql-client \
    # GDAL/GEOS dependencies
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    binutils \
    python3-gdal \
    # WeasyPrint dependencies
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    # Additional useful tools
    curl \
    && rm -rf /var/lib/apt/lists/*

# COPY requirements
COPY requirements.txt /app/requirements.txt

# INSTALL PYTHON DEPENDENCIES
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . /app

# Create runtime directories
RUN mkdir -p /app/static /app/media /app/logs

EXPOSE 8000

CMD ["gunicorn", "fishlo_main.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "180"]