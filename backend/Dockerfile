# Use Python 3.10 for better SSL/TLS compatibility with MongoDB Atlas M0 free tier
FROM python:3.10.15-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Render will provide $PORT)
EXPOSE 8000

# Start the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
