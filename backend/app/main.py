from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, SessionLocal
from app.models import Admin
from app.auth import hash_password
from app.routers import auth, customers, finance, repayments, dashboard, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Web-Based Finance and Customer Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(finance.router)
app.include_router(repayments.router)
app.include_router(dashboard.router)
app.include_router(reports.router)


@app.on_event("startup")
def seed_default_admin():
    """Creates a default admin (username: admin / password: admin123) if none exists.
    CHANGE THIS PASSWORD before any real/demo deployment."""
    db = SessionLocal()
    try:
        if db.query(Admin).count() == 0:
            db.add(Admin(
                username="admin",
                hashed_password=hash_password("admin123"),
                full_name="System Administrator",
            ))
            db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
