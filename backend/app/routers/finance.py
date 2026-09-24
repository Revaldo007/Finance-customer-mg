from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import FinanceAccount, Customer, AccountStatus
from app.schemas import FinanceAccountCreate, FinanceAccountOut
from app.auth import get_current_admin
from app.logic import health_payload, build_timeline, upcoming_payments

router = APIRouter(prefix="/api/finance-accounts", tags=["finance"],
                    dependencies=[Depends(get_current_admin)])


def _to_out(acc: FinanceAccount) -> dict:
    status = acc.status
    if acc.outstanding_amount <= 0 or (acc.duration_months and len(acc.repayments) >= acc.duration_months):
        status = AccountStatus.COMPLETED
    elif acc.is_overdue:
        status = AccountStatus.OVERDUE

    return {
        "id": acc.id,
        "customer_id": acc.customer_id,
        "customer_name": acc.customer.full_name if acc.customer else None,
        "customer_phone": acc.customer.phone if acc.customer else None,
        "amount_provided": acc.amount_provided,
        "interest_rate": acc.interest_rate,
        "duration_months": acc.duration_months,
        "start_date": acc.start_date,
        "total_payable": acc.total_payable,
        "status": status.value if hasattr(status, "value") else str(status),
        "amount_paid": acc.amount_paid,
        "outstanding_amount": acc.outstanding_amount,
        "monthly_installment": acc.monthly_installment,
        "next_due_date": acc.next_due_date,
        "days_overdue": acc.days_overdue,
        "late_fine_amount": acc.late_fine_amount,
        "is_overdue": acc.is_overdue,
        "total_due_now": acc.total_due_now,
    }


@router.get("", response_model=List[FinanceAccountOut])
def list_accounts(customer_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(FinanceAccount).options(joinedload(FinanceAccount.customer))
    if customer_id:
        query = query.filter(FinanceAccount.customer_id == customer_id)
    accounts = query.all()
    return [_to_out(a) for a in accounts]


@router.post("", response_model=FinanceAccountOut, status_code=201)
def create_account(payload: FinanceAccountCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).get(payload.customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")

    principal = payload.amount_provided
    interest = principal * (payload.interest_rate / 100) * (payload.duration_months / 12)
    total_payable = round(principal + interest, 2)

    account = FinanceAccount(
        customer_id=payload.customer_id,
        amount_provided=principal,
        interest_rate=payload.interest_rate,
        duration_months=payload.duration_months,
        start_date=payload.start_date,
        total_payable=total_payable,
        status=AccountStatus.ACTIVE,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _to_out(account)


@router.get("/{account_id}", response_model=FinanceAccountOut)
def get_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(FinanceAccount).get(account_id)
    if not account:
        raise HTTPException(404, "Finance account not found")
    return _to_out(account)


@router.get("/{account_id}/health")
def get_account_health(account_id: int, db: Session = Depends(get_db)):
    account = db.query(FinanceAccount).get(account_id)
    if not account:
        raise HTTPException(404, "Finance account not found")
    return health_payload(account)


@router.get("/{account_id}/timeline")
def get_account_timeline(account_id: int, db: Session = Depends(get_db)):
    account = db.query(FinanceAccount).get(account_id)
    if not account:
        raise HTTPException(404, "Finance account not found")
    return build_timeline(account)


@router.get("/alerts/upcoming")
def get_upcoming(within_days: int = 7, db: Session = Depends(get_db)):
    accounts = db.query(FinanceAccount).filter(
        FinanceAccount.status == AccountStatus.ACTIVE
    ).all()
    return upcoming_payments(accounts, within_days=within_days)
