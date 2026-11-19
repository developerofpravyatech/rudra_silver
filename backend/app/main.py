from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import router as api_v1_router
from app.api.v1.auth import router as auth_router
from app.db.session import engine, Base

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database connection note: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Next-Gen Jewellery ERP Backend API for Rudra Silver (FastAPI + MySQL)",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
