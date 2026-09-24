from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.models import AccountStatus


# ---------- Auth ----------
class AdminLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ---------- Customer ----------
class CustomerBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    id_proof_document: Optional[str] = None
    id_proof_document_name: Optional[str] = None
    employment_type: Optional[str] = None
    employer_name: Optional[str] = None
    monthly_income: Optional[float] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---------- Finance Account ----------
class FinanceAccountBase(BaseModel):
    amount_provided: float
    interest_rate: float
    duration_months: int
    start_date: date


class FinanceAccountCreate(FinanceAccountBase):
    customer_id: int


class FinanceAccountOut(FinanceAccountBase):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    total_payable: float
    status: AccountStatus
    amount_paid: float
    outstanding_amount: float
    monthly_installment: float
    next_due_date: Optional[date] = None
    days_overdue: int = 0
    late_fine_amount: float = 0.0
    is_overdue: bool = False
    total_due_now: float = 0.0
    model_config = ConfigDict(from_attributes=True)


# ---------- Repayment ----------
class RepaymentBase(BaseModel):
    payment_date: date
    amount_paid: float
    note: Optional[str] = None


class RepaymentCreate(RepaymentBase):
    finance_account_id: int


class RepaymentOut(RepaymentBase):
    id: int
    finance_account_id: int
    customer_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ---------- Dashboard ----------
class DashboardSummary(BaseModel):
    total_customers: int
    total_amount_provided: float
    total_collected: float
    total_outstanding: float
    active_accounts: int
    completed_accounts: int
    overdue_accounts: int
