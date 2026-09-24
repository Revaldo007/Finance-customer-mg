from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer, FinanceAccount, Repayment
from app.auth import get_current_admin
from app.logic import health_payload

router = APIRouter(prefix="/api/reports", tags=["reports"],
                    dependencies=[Depends(get_current_admin)])


@router.get("/customers")
def customer_report(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    return [{
        "id": c.id,
        "full_name": c.full_name,
        "phone": c.phone,
        "email": c.email,
        "num_accounts": len(c.finance_accounts),
        "total_borrowed": sum(a.amount_provided for a in c.finance_accounts),
        "total_outstanding": sum(a.outstanding_amount for a in c.finance_accounts),
    } for c in customers]


@router.get("/finance")
def finance_report(db: Session = Depends(get_db)):
    accounts = db.query(FinanceAccount).all()
    return [{
        "id": a.id,
        "customer_name": a.customer.full_name,
        "amount_provided": a.amount_provided,
        "interest_rate": a.interest_rate,
        "total_payable": a.total_payable,
        "amount_paid": a.amount_paid,
        "outstanding_amount": a.outstanding_amount,
        "status": a.status,
        "health": health_payload(a),
    } for a in accounts]


@router.get("/repayments")
def repayment_report(db: Session = Depends(get_db)):
    repayments = db.query(Repayment).order_by(Repayment.payment_date.desc()).all()
    return [{
        "id": r.id,
        "finance_account_id": r.finance_account_id,
        "customer_name": r.finance_account.customer.full_name,
        "payment_date": r.payment_date,
        "amount_paid": r.amount_paid,
        "note": r.note,
    } for r in repayments]


@router.get("/transactions")
def transaction_history(db: Session = Depends(get_db)):
    """Combined chronological history: disbursements + repayments."""
    accounts = db.query(FinanceAccount).all()
    events = []
    for a in accounts:
        events.append({
            "type": "disbursement",
            "date": a.start_date,
            "customer_name": a.customer.full_name,
            "finance_account_id": a.id,
            "amount": a.amount_provided,
        })
        for r in a.repayments:
            events.append({
                "type": "repayment",
                "date": r.payment_date,
                "customer_name": a.customer.full_name,
                "finance_account_id": a.id,
                "amount": r.amount_paid,
            })
    events.sort(key=lambda e: e["date"], reverse=True)
    return events
