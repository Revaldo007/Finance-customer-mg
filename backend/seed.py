"""
Seed script — populates the database with dummy data so the UI isn't empty.

Usage (from the backend/ folder, with venv activated):
    python seed.py            # seeds data (skips if customers already exist)
    python seed.py --reset    # drops all tables and reseeds from scratch

Creates:
    - 1 admin user            (admin / admin123)  — same as the app's own startup seed
    - 6 customers, covering different repayment-health scenarios:
        1. Ravi Kumar     -> 🟢 On Track    (regular monthly payments, up to date)
        2. Meena S        -> 🟡 Due Soon    (next payment due within days)
        3. Arun Pillai    -> 🔴 Overdue     (missed a payment, due date has passed)
        4. Suresh Babu    -> 🔵 Completed   (fully repaid)
        5. Lakshmi Devi   -> 🟢 On Track    (account just opened, first cycle)
        6. Priya Nair     -> no finance account yet (tests the "no accounts" empty state)
"""
import sys
from datetime import date
from dateutil.relativedelta import relativedelta

from app.database import Base, engine, SessionLocal
from app.models import Admin, Customer, FinanceAccount, Repayment, AccountStatus
from app.auth import hash_password

TODAY = date.today()


def months_ago(n: int) -> date:
    return TODAY - relativedelta(months=n)


def compute_total_payable(principal: float, rate: float, months: int) -> float:
    interest = principal * (rate / 100) * (months / 12)
    return round(principal + interest, 2)


def reset_db():
    print("Dropping all tables…")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Customer).count() > 0:
            print("Customers already exist — skipping seed. Run with --reset to start fresh.")
            return

        # --- Admin -------------------------------------------------------
        if db.query(Admin).count() == 0:
            db.add(Admin(
                username="admin",
                hashed_password=hash_password("admin123"),
                full_name="System Administrator",
            ))

        # --- Customers -----------------------------------------------------
        ravi = Customer(
            full_name="Ravi Kumar", phone="9840012345", email="ravi.kumar@example.com",
            address="12 Anna Nagar, Chennai, Tamil Nadu", id_proof_type="Aadhaar",
            id_proof_number="XXXX-XXXX-1234", employment_type="Salaried",
            employer_name="Infosys Ltd", monthly_income=55000,
        )
        meena = Customer(
            full_name="Meena S", phone="9940023456", email="meena.s@example.com",
            address="45 Gandhi Road, Coimbatore, Tamil Nadu", id_proof_type="PAN",
            id_proof_number="ABCDE1234F", employment_type="Self-Employed",
            employer_name="Meena Boutique", monthly_income=38000,
        )
        arun = Customer(
            full_name="Arun Pillai", phone="9790034567", email="arun.pillai@example.com",
            address="7 MG Street, Madurai, Tamil Nadu", id_proof_type="Aadhaar",
            id_proof_number="XXXX-XXXX-5678", employment_type="Salaried",
            employer_name="TVS Motors", monthly_income=42000,
        )
        suresh = Customer(
            full_name="Suresh Babu", phone="9600045678", email="suresh.babu@example.com",
            address="23 Beach Road, Nagercoil, Tamil Nadu", id_proof_type="Voter ID",
            id_proof_number="TN/09/123/456789", employment_type="Salaried",
            employer_name="State Bank of India", monthly_income=48000,
        )
        lakshmi = Customer(
            full_name="Lakshmi Devi", phone="9500056789", email="lakshmi.devi@example.com",
            address="9 Market Street, Trichy, Tamil Nadu", id_proof_type="Aadhaar",
            id_proof_number="XXXX-XXXX-9012", employment_type="Self-Employed",
            employer_name="Lakshmi Tailoring", monthly_income=30000,
        )
        priya = Customer(
            full_name="Priya Nair", phone="9445067890", email="priya.nair@example.com",
            address="18 Lake View, Kanyakumari, Tamil Nadu", id_proof_type="PAN",
            id_proof_number="PQRSX5678L", employment_type="Salaried",
            employer_name="TCS", monthly_income=52000,
        )

        db.add_all([ravi, meena, arun, suresh, lakshmi, priya])
        db.flush()  # assigns IDs

        # --- Finance accounts -----------------------------------------------
        # 1) Ravi — On Track: started 5 months ago, 5 of 12 installments paid on time
        ravi_acc = FinanceAccount(
            customer_id=ravi.id, amount_provided=120000, interest_rate=12,
            duration_months=12, start_date=months_ago(5),
            total_payable=compute_total_payable(120000, 12, 12),
            status=AccountStatus.ACTIVE,
        )
        # 2) Meena — Due Soon: started 3 months ago, 2 of 10 installments paid, next due ~now
        meena_acc = FinanceAccount(
            customer_id=meena.id, amount_provided=60000, interest_rate=14,
            duration_months=10, start_date=months_ago(3),
            total_payable=compute_total_payable(60000, 14, 10),
            status=AccountStatus.ACTIVE,
        )
        # 3) Arun — Overdue: started 4 months ago, only 1 of 8 installments paid
        arun_acc = FinanceAccount(
            customer_id=arun.id, amount_provided=45000, interest_rate=15,
            duration_months=8, start_date=months_ago(4),
            total_payable=compute_total_payable(45000, 15, 8),
            status=AccountStatus.ACTIVE,
        )
        # 4) Suresh — Completed: started 6 months ago, 6-month loan, fully paid off
        suresh_acc = FinanceAccount(
            customer_id=suresh.id, amount_provided=30000, interest_rate=10,
            duration_months=6, start_date=months_ago(6),
            total_payable=compute_total_payable(30000, 10, 6),
            status=AccountStatus.ACTIVE,  # will flip to COMPLETED once fully repaid below
        )
        # 5) Lakshmi — On Track / fresh: account opened today, first cycle
        lakshmi_acc = FinanceAccount(
            customer_id=lakshmi.id, amount_provided=25000, interest_rate=13,
            duration_months=6, start_date=TODAY,
            total_payable=compute_total_payable(25000, 13, 6),
            status=AccountStatus.ACTIVE,
        )
        # 6) Priya — no finance account (tests empty state on her profile page)

        db.add_all([ravi_acc, meena_acc, arun_acc, suresh_acc, lakshmi_acc])
        db.flush()

        # --- Repayments -------------------------------------------------------
        def add_repayments(account: FinanceAccount, count: int, amount: float, note=None):
            for i in range(1, count + 1):
                db.add(Repayment(
                    finance_account_id=account.id,
                    payment_date=account.start_date + relativedelta(months=i),
                    amount_paid=amount,
                    note=note,
                ))

        # Ravi: 5 on-time installments
        ravi_installment = round(ravi_acc.total_payable / ravi_acc.duration_months, 2)
        add_repayments(ravi_acc, 5, ravi_installment)

        # Meena: 2 installments paid so far
        meena_installment = round(meena_acc.total_payable / meena_acc.duration_months, 2)
        add_repayments(meena_acc, 2, meena_installment)

        # Arun: only 1 installment paid (rest overdue)
        arun_installment = round(arun_acc.total_payable / arun_acc.duration_months, 2)
        add_repayments(arun_acc, 1, arun_installment, note="First installment only")

        # Suresh: all 6 installments paid in full -> account completed
        suresh_installment = round(suresh_acc.total_payable / suresh_acc.duration_months, 2)
        add_repayments(suresh_acc, 6, suresh_installment)
        suresh_acc.status = AccountStatus.COMPLETED

        # Lakshmi: no repayments yet (brand new account)

        db.commit()
        print("Seed data created successfully:")
        print("  Admin login: admin / admin123")
        print("  Customers: Ravi Kumar, Meena S, Arun Pillai, Suresh Babu, Lakshmi Devi, Priya Nair")

    finally:
        db.close()


if __name__ == "__main__":
    if "--reset" in sys.argv:
        reset_db()
    seed()