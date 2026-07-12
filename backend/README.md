# Durian Guardian AI (DGA) Backend

> **Protect Every Tree. Predict Every Risk.**

AI-powered backend system for durian farm health management and risk prediction.

---

## Tech Stack

| Component      | Technology                     |
|----------------|--------------------------------|
| Framework      | FastAPI                        |
| Python         | 3.12+                          |
| Database       | MongoDB                        |
| ODM            | Motor (Async MongoDB Driver)   |
| Validation     | Pydantic v2                    |
| Auth           | JWT (Access + Refresh Token)   |
| Docs           | Swagger & ReDoc                |
| Testing        | Pytest                         |

---

## Prerequisites

- Python 3.12+
- MongoDB 7+ (running on localhost:27017)

---

## Installation

```bash
# 1. Clone project
cd backend

# 2. Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env if needed (default works for local MongoDB)

# 5. Ensure MongoDB is running
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
# Mac: brew services start mongodb-community

# 6. Start the server
python run.py
# or
uvicorn app.main:app --reload
```

---

## Access

| Service  | URL                        |
|----------|----------------------------|
| API      | http://localhost:8000      |
| Swagger  | http://localhost:8000/docs |
| ReDoc    | http://localhost:8000/redoc |

---

## Environment Variables

| Variable                          | Description                  | Default                                      |
|-----------------------------------|------------------------------|----------------------------------------------|
| `APP_NAME`                        | Application name             | Durian Guardian AI                           |
| `MONGODB_URL`                     | MongoDB connection string    | mongodb://localhost:27017                    |
| `MONGODB_DB_NAME`                 | MongoDB database name        | durian_guardian_ai                           |
| `JWT_SECRET_KEY`                  | JWT signing secret            | (change in production)                       |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL              | 30                                           |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS`   | Refresh token TTL             | 7                                            |
| `CORS_ORIGINS`                    | Allowed CORS origins          | http://localhost:3000,http://localhost:5173   |

---

## API Endpoints

All endpoints return unified JSON format:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Error format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

### Authentication
| Method | Endpoint                  | Description      |
|--------|---------------------------|------------------|
| POST   | /api/v1/auth/register     | Register user    |
| POST   | /api/v1/auth/login        | Login            |
| GET    | /api/v1/auth/me           | Get current user |
| PUT    | /api/v1/auth/profile      | Update profile   |

### Farms
| Method | Endpoint             | Description    |
|--------|----------------------|----------------|
| GET    | /api/v1/farms        | List farms     |
| GET    | /api/v1/farms/{id}   | Get farm       |
| POST   | /api/v1/farms        | Create farm    |
| PUT    | /api/v1/farms/{id}   | Update farm    |
| DELETE | /api/v1/farms/{id}   | Delete farm    |

### Zones
| Method | Endpoint             | Description    |
|--------|----------------------|----------------|
| GET    | /api/v1/zones        | List zones     |
| GET    | /api/v1/zones/{id}   | Get zone       |
| POST   | /api/v1/zones        | Create zone    |
| PUT    | /api/v1/zones/{id}   | Update zone    |
| DELETE | /api/v1/zones/{id}   | Delete zone    |

### Trees
| Method | Endpoint             | Description    |
|--------|----------------------|----------------|
| GET    | /api/v1/trees        | List trees     |
| GET    | /api/v1/trees/{id}   | Get tree       |
| POST   | /api/v1/trees        | Create tree    |
| PUT    | /api/v1/trees/{id}   | Update tree    |
| DELETE | /api/v1/trees/{id}   | Delete tree    |

### AI Detection
| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | /api/v1/ai/detect     | Upload image for disease detection |

### Weather
| Method | Endpoint                     | Description          |
|--------|------------------------------|----------------------|
| GET    | /api/v1/weather/{farm_id}    | Get weather data     |

### Risk Assessment
| Method | Endpoint                  | Description                |
|--------|---------------------------|----------------------------|
| POST   | /api/v1/risk/calculate    | Calculate disease risk score |

### Dashboard
| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | /api/v1/dashboard   | Get dashboard summary    |

### History
| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| GET    | /api/v1/history/{tree_id} | Get full tree history        |

### AI Agronomist
| Method | Endpoint         | Description                |
|--------|------------------|----------------------------|
| POST   | /api/v1/chat     | Ask AI agronomist question |

---

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API routers (versioned)
│   ├── core/            # Config, security, exceptions, logging
│   ├── database/        # MongoDB connection (Motor)
│   ├── models/          # Enums and type definitions
│   ├── schemas/         # Pydantic validation schemas
│   ├── repositories/    # MongoDB data access layer
│   ├── services/        # Business logic layer
│   ├── auth/            # Authentication service
│   ├── ai/              # AI detection service (mock)
│   ├── weather/         # Weather service (mock)
│   ├── dashboard/       # Dashboard aggregation service
│   ├── utils/           # Utilities
│   └── main.py          # FastAPI app factory
├── tests/               # Pytest test suite
├── uploads/             # Uploaded images
├── .env.example
├── requirements.txt
├── run.py               # Entry point
└── README.md
```

---

## Architecture

- **Clean Architecture** - Separation of concerns with Router → Service → Repository pattern
- **Async MongoDB** - Motor driver for non-blocking database operations
- **Unified Response** - All APIs return `{success, message, data}` or `{success, message, errors}`
- **RBAC** - Role-Based Access Control via JWT claims
- **Service Pattern** - AI, Weather, Risk modules use mock services, swappable to real models

---

## Testing

```bash
# Ensure MongoDB is running, then:
pytest

# With coverage
pytest --cov=app tests/

# Specific test
pytest tests/test_auth.py -v
```

---

## AI Integration

All AI modules use the **Service Pattern**:

| Module      | Current | Future              |
|-------------|---------|---------------------|
| Detection   | Mock    | YOLO / EfficientNet |
| Risk Score  | Mock    | XGBoost             |
| Agronomist  | Mock    | Ollama / LLM        |

To replace a mock service, just implement the same interface in the service file — no Router changes needed.
=======
Hello World!
>>>>>>> 01ce429bfb51eba94b2e231e7b4e442b8cfef375
