from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Repayment, FinanceAccount, AccountStatus
from app.schemas import RepaymentCreate, RepaymentOut
from app.auth import get_current_admin

router = APIRouter(prefix="/api/repayments", tags=["repayments"],
                    dependencies=[Depends(get_current_admin)])


@router.get("", response_model=List[RepaymentOut])
def list_repayments(finance_account_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Repayment).options(
        joinedload(Repayment.finance_account).joinedload(FinanceAccount.customer)
    )
    if finance_account_id:
        query = query.filter(Repayment.finance_account_id == finance_account_id)
    return query.order_by(Repayment.payment_date.desc()).all()


@router.post("", response_model=RepaymentOut, status_code=201)
def record_repayment(payload: RepaymentCreate, db: Session = Depends(get_db)):
    account = db.query(FinanceAccount).options(
        joinedload(FinanceAccount.repayments),
        joinedload(FinanceAccount.customer)
    ).filter(FinanceAccount.id == payload.finance_account_id).first()
    if not account:
        raise HTTPException(404, "Finance account not found")

    if account.outstanding_amount <= 0 or account.status == AccountStatus.COMPLETED:
        raise HTTPException(400, "This finance account is already fully paid and completed.")

    repayment = Repayment(**payload.model_dump())
    db.add(repayment)
    db.flush()  # so account.amount_paid reflects this new repayment

    # Update account status based on outstanding balance
    if account.outstanding_amount <= 0:
        account.status = AccountStatus.COMPLETED
    elif account.is_overdue:
        account.status = AccountStatus.OVERDUE
    else:
        account.status = AccountStatus.ACTIVE

    db.commit()
    db.refresh(repayment)
    return repayment


@router.delete("/{repayment_id}", status_code=204)
def delete_repayment(repayment_id: int, db: Session = Depends(get_db)):
    repayment = db.query(Repayment).get(repayment_id)
    if not repayment:
        raise HTTPException(404, "Repayment not found")
    account = repayment.finance_account
    db.delete(repayment)
    db.flush()
    if account.status == AccountStatus.COMPLETED and account.outstanding_amount > 0:
        account.status = AccountStatus.ACTIVE if not account.is_overdue else AccountStatus.OVERDUE
    db.commit()
