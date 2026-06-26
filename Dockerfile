# ── Stage 1: Python Backend ────────────────────────────────────────────
FROM python:3.9-slim AS backend

WORKDIR /app

# Install system deps for scipy/scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY server.py .
COPY hybrid_recommendations.py .
COPY content_based_filtering.py .
COPY collaborative_filtering.py .
COPY fuzzy_search.py .
COPY data_cleaning.py .

# Copy runtime data (the 4 files the server needs, ~42MB)
COPY runtime_data/ ./data/

# Render sets PORT env var, default to 8000 for local testing
ENV PORT=8000

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
