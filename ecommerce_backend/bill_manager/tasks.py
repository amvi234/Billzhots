# bill_manager/tasks.py
from celery import shared_task

from .models import Bill


@shared_task
def extract_bill_amount_task(bill_id):
    try:
        bill = Bill.objects.get(id=bill_id)

        amount = 99.99  # Dummy extraction for now.

        bill.amount = amount
        bill.save()

    except Exception as e:
        print(f"Failed to extract amount: {e}")
