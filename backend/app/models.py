import enum
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship

from app.database import Base


class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    DEFAULTED = "defaulted"


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    id_proof_type = Column(String, nullable=True)   # e.g. Aadhaar, PAN, Passport
    id_proof_number = Column(String, nullable=True)
    id_proof_document = Column(Text, nullable=True)  # base64 data URL or document reference
    id_proof_document_name = Column(String, nullable=True)  # original file name e.g. aadhaar_front.pdf
    employment_type = Column(String, nullable=True)  # salaried / self-employed / etc.
    employer_name = Column(String, nullable=True)
    monthly_income = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    finance_accounts = relationship(
        "FinanceAccount", back_populates="customer", cascade="all, delete-orphan"
    )


class FinanceAccount(Base):
    __tablename__ = "finance_accounts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    amount_provided = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)       # annual %, flat for simplicity
    duration_months = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False, default=date.today)
    total_payable = Column(Float, nullable=False)        # amount + interest
    status = Column(Enum(AccountStatus), default=AccountStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="finance_accounts")
    repayments = relationship(
        "Repayment", back_populates="finance_account", cascade="all, delete-orphan"
    )

    @property
    def amount_paid(self) -> float:
        return sum(r.amount_paid for r in self.repayments)

    @property
    def outstanding_amount(self) -> float:
        return max(0.0, round(self.total_payable - self.amount_paid, 2))

    @property
    def monthly_installment(self) -> float:
        return round(self.total_payable / self.duration_months, 2) if self.duration_months else 0

    LATE_FINE_PER_DAY: float = 50.0  # ₹50 per day late fee

    @property
    def next_due_date(self):
        """Approximate next due date based on number of repayments made and monthly schedule."""
        if self.outstanding_amount <= 0:
            return None
        installments_paid = len(self.repayments)
        if installments_paid >= self.duration_months:
            return None
        return self.start_date + relativedelta(months=installments_paid + 1)

    @property
    def days_overdue(self) -> int:
        """Number of days past the next due date. 0 if not overdue or completed."""
        due = self.next_due_date
        if due is None:
            return 0
        today = date.today()
        delta = (today - due).days
        return max(0, delta)

    @property
    def late_fine_amount(self) -> float:
        """Total accumulated late fine: ₹50 × days overdue."""
        return round(self.days_overdue * self.LATE_FINE_PER_DAY, 2)

    @property
    def is_overdue(self) -> bool:
        return self.days_overdue > 0

    @property
    def total_due_now(self) -> float:
        """Amount customer should pay right now = installment + any late fine."""
        return round(self.monthly_installment + self.late_fine_amount, 2)

    @property
    def customer_name(self) -> str | None:
        return self.customer.full_name if self.customer else None

    @property
    def customer_phone(self) -> str | None:
        return self.customer.phone if self.customer else None


class Repayment(Base):
    __tablename__ = "repayments"

    id = Column(Integer, primary_key=True, index=True)
    finance_account_id = Column(Integer, ForeignKey("finance_accounts.id"), nullable=False)

    payment_date = Column(Date, nullable=False, default=date.today)
    amount_paid = Column(Float, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    finance_account = relationship("FinanceAccount", back_populates="repayments")

    @property
    def customer_name(self) -> str | None:
        if self.finance_account and self.finance_account.customer:
            return self.finance_account.customer.full_name
        return None
