from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer, FinanceAccount, AccountStatus
from app.schemas import DashboardSummary
from app.auth import get_current_admin
from app.logic import get_health_status, HEALTH_OVERDUE, upcoming_payments

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"],
                    dependencies=[Depends(get_current_admin)])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db)):
    customers_count = db.query(Customer).count()
    accounts = db.query(FinanceAccount).all()

    total_provided = sum(a.amount_provided for a in accounts)
    total_collected = sum(a.amount_paid for a in accounts)
    total_outstanding = sum(a.outstanding_amount for a in accounts)

    active = sum(1 for a in accounts if a.status == AccountStatus.ACTIVE
                 and get_health_status(a) != HEALTH_OVERDUE)
    completed = sum(1 for a in accounts if a.status == AccountStatus.COMPLETED)
    overdue = sum(1 for a in accounts if a.status == AccountStatus.ACTIVE
                  and get_health_status(a) == HEALTH_OVERDUE)

    return DashboardSummary(
        total_customers=customers_count,
        total_amount_provided=round(total_provided, 2),
        total_collected=round(total_collected, 2),
        total_outstanding=round(total_outstanding, 2),
        active_accounts=active,
        completed_accounts=completed,
        overdue_accounts=overdue,
    )


@router.get("/upcoming-payments")
def upcoming(within_days: int = 7, db: Session = Depends(get_db)):
    accounts = db.query(FinanceAccount).filter(
        FinanceAccount.status == AccountStatus.ACTIVE
    ).all()
    return upcoming_payments(accounts, within_days=within_days)


@router.get("/monthly-trend")
def monthly_trend(months: int = 6, db: Session = Depends(get_db)):
    """Simple monthly disbursement vs collection trend for the analytics chart."""
    from app.models import Repayment
    today = date.today()
    buckets = []
    for i in range(months - 1, -1, -1):
        month = (today.month - i - 1) % 12 + 1
        year = today.year + ((today.month - i - 1) // 12)
        buckets.append({"year": year, "month": month, "disbursed": 0.0, "collected": 0.0})

    accounts = db.query(FinanceAccount).all()
    for a in accounts:
        for b in buckets:
            if a.start_date.year == b["year"] and a.start_date.month == b["month"]:
                b["disbursed"] += a.amount_provided

    repayments = db.query(Repayment).all()
    for r in repayments:
        for b in buckets:
            if r.payment_date.year == b["year"] and r.payment_date.month == b["month"]:
                b["collected"] += r.amount_paid

    return buckets
