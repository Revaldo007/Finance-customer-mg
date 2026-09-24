# Web-Based Finance and Customer Management

Mini project: FastAPI + SQLite backend, React (Vite) + Tailwind CSS frontend.

## Structure

```
finance-customer-mgmt/
├── backend/     FastAPI + SQLAlchemy + SQLite
└── frontend/    React (Vite) + Tailwind CSS
```

## 1. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit SECRET_KEY before any real use
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- On first run, a default admin is seeded: **username `admin`, password `admin123`**.
  Change this password (or the seeding logic) before demoing/submitting.
- Database file `finance_app.db` is created automatically (SQLite).

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

- App runs at http://localhost:5173 and proxies `/api` calls to the backend on port 8000.

## What's implemented

**Core**
- Admin auth (JWT, bcrypt password hashing, protected routes/pages)
- Customer management (add/edit/view/search, full profile fields)
- Finance account management (amount, interest rate, duration, start date, auto-computed total payable, status)
- Repayment management (record payments, auto-calculated outstanding balance, history)
- Due/overdue tracking
- Dashboard (totals, active/completed/overdue counts)
- Reports (customer, finance, repayment, transaction history)

**Unique enhancements**
- ⭐ 360° Customer Financial Profile (`/customers/:id`) — personal info, all finance accounts,
  totals, and an expandable timeline per account
- ⭐ Repayment Health Indicator (🟢🟡🟠🔴🔵) — computed server-side in `backend/app/logic.py`
- ⭐ Smart Due-Date Monitoring — "Upcoming Payments" widget on the dashboard
  (`/api/dashboard/upcoming-payments`)
- ⭐ Finance Account Timeline — created → disbursed → each repayment → completed
- ⭐ Basic Financial Analytics — dashboard summary cards + monthly disbursement/collection
  line chart (`/api/dashboard/monthly-trend`)

## Where to go next

- The finance account edit/delete endpoints and a dedicated account-detail page are not
  built yet — currently accounts are viewed via the customer 360° profile.
- No automated tests yet.
- The interest calculation is a simple flat-rate formula
  (`principal * rate% * (months/12)`); swap in whatever amortization method your
  coursework expects if a different method is required.
- `SECRET_KEY` and the default admin password are placeholders — change both before
  any real deployment or public demo.
