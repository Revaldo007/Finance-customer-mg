"""
Core "smart" logic behind the unique enhancements:
- Repayment Health Indicator
- Smart Due-Date Monitoring
- Finance Account Timeline
- Financial Analytics aggregation
"""
from datetime import date
from app.models import FinanceAccount, AccountStatus

HEALTH_ON_TRACK = "on_track"
HEALTH_DUE_SOON = "due_soon"
HEALTH_PARTIAL = "partial"
HEALTH_OVERDUE = "overdue"
HEALTH_COMPLETED = "completed"

HEALTH_META = {
    HEALTH_ON_TRACK: {"label": "On Track", "emoji": "🟢"},
    HEALTH_DUE_SOON: {"label": "Payment Due Soon", "emoji": "🟡"},
    HEALTH_PARTIAL: {"label": "Partial Payment", "emoji": "🟠"},
    HEALTH_OVERDUE: {"label": "Overdue", "emoji": "🔴"},
    HEALTH_COMPLETED: {"label": "Completed", "emoji": "🔵"},
}


def get_health_status(account: FinanceAccount, today: date | None = None) -> str:
    today = today or date.today()

    if account.status == AccountStatus.COMPLETED or account.outstanding_amount <= 0:
        return HEALTH_COMPLETED

    due = account.next_due_date
    if due is None:
        return HEALTH_COMPLETED

    days_to_due = (due - today).days

    if days_to_due < 0:
        return HEALTH_OVERDUE
    if days_to_due <= 5:
        return HEALTH_DUE_SOON

    # If they've paid less than expected-by-now (partial), flag it
    expected_installments = max(0, (today.year - account.start_date.year) * 12 +
                                 (today.month - account.start_date.month))
    if len(account.repayments) < expected_installments:
        return HEALTH_PARTIAL

    return HEALTH_ON_TRACK


def health_payload(account: FinanceAccount) -> dict:
    status = get_health_status(account)
    meta = HEALTH_META[status]
    return {"code": status, "label": meta["label"], "emoji": meta["emoji"]}


def upcoming_payments(accounts: list[FinanceAccount], within_days: int = 7):
    """Returns accounts with due dates within `within_days`, plus already-overdue ones."""
    today = date.today()
    results = []
    for acc in accounts:
        if acc.status == AccountStatus.COMPLETED:
            continue
        due = acc.next_due_date
        if due is None:
            continue
        days = (due - today).days
        if days <= within_days:
            results.append({
                "finance_account_id": acc.id,
                "customer_id": acc.customer_id,
                "customer_name": acc.customer.full_name,
                "amount_due": acc.monthly_installment,
                "due_date": due,
                "days_remaining": days,
                "overdue": days < 0,
            })
    results.sort(key=lambda r: r["days_remaining"])
    return results


def build_timeline(account: FinanceAccount):
    events = [{
        "type": "account_created",
        "label": "Account Created",
        "date": account.created_at.date() if hasattr(account.created_at, "date") else account.created_at,
    }, {
        "type": "amount_disbursed",
        "label": f"Amount Disbursed (₹{account.amount_provided:,.2f})",
        "date": account.start_date,
    }]
    for idx, r in enumerate(sorted(account.repayments, key=lambda x: x.payment_date), start=1):
        events.append({
            "type": "repayment",
            "label": f"Repayment {idx} (₹{r.amount_paid:,.2f})",
            "date": r.payment_date,
        })
    if account.status == AccountStatus.COMPLETED or account.outstanding_amount <= 0:
        events.append({
            "type": "account_completed",
            "label": "Account Completed",
            "date": account.repayments[-1].payment_date if account.repayments else account.start_date,
        })
    return events
