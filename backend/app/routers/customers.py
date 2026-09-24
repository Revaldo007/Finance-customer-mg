from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Customer, Admin
from app.schemas import CustomerCreate, CustomerUpdate, CustomerOut
from app.auth import get_current_admin
from app.logic import health_payload, build_timeline

router = APIRouter(prefix="/api/customers", tags=["customers"],
                    dependencies=[Depends(get_current_admin)])


@router.get("", response_model=List[CustomerOut])
def list_customers(q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Customer)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            Customer.full_name.ilike(like),
            Customer.phone.ilike(like),
            Customer.email.ilike(like),
            Customer.id_proof_number.ilike(like),
        ))
    return query.order_by(Customer.full_name).all()


@router.post("", response_model=CustomerOut, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).get(customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).get(customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).get(customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    db.delete(customer)
    db.commit()


@router.get("/{customer_id}/profile")
def customer_360_profile(customer_id: int, db: Session = Depends(get_db)):
    """The '360° Customer Financial Profile' enhancement: personal info + every
    finance account with its health status, outstanding balance and timeline."""
    customer = db.query(Customer).get(customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")

    accounts_payload = []
    for acc in customer.finance_accounts:
        accounts_payload.append({
            "id": acc.id,
            "amount_provided": acc.amount_provided,
            "interest_rate": acc.interest_rate,
            "duration_months": acc.duration_months,
            "start_date": acc.start_date,
            "total_payable": acc.total_payable,
            "amount_paid": acc.amount_paid,
            "outstanding_amount": acc.outstanding_amount,
            "status": acc.status,
            "health": health_payload(acc),
            "timeline": build_timeline(acc),
        })

    total_provided = sum(a.amount_provided for a in customer.finance_accounts)
    total_paid = sum(a.amount_paid for a in customer.finance_accounts)
    total_outstanding = sum(a.outstanding_amount for a in customer.finance_accounts)

    return {
        "customer": CustomerOut.model_validate(customer),
        "summary": {
            "total_amount_provided": total_provided,
            "total_amount_paid": total_paid,
            "total_outstanding": total_outstanding,
            "num_accounts": len(customer.finance_accounts),
        },
        "finance_accounts": accounts_payload,
    }
