# Generated by Django 4.2.20 on 2025-06-08 09:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bill_manager", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelManagers(
            name="bill",
            managers=[],
        ),
        migrations.AlterField(
            model_name="bill",
            name="content_type",
            field=models.CharField(db_index=True, max_length=50),
        ),
    ]
