FROM python:3.11-slim

WORKDIR /app

# System deps for some ML libs (optional but common)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY config.yaml ./config.yaml
RUN mkdir -p /app/data /app/logs /app/outputs /app/models

ENV PYTHONPATH=/app/src \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/app/models \
    TRANSFORMERS_CACHE=/app/models \
    SENTENCE_TRANSFORMERS_HOME=/app/models

CMD ["python", "-m", "src.main"]
