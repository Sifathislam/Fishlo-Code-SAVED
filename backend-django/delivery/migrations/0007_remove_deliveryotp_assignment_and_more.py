import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

# 1. Open Django shell
# py manage.py dbshell
# TRUNCATE TABLE delivery_deliverylog CASCADE;
# TRUNCATE TABLE delivery_deliveryotp CASCADE;
# \q


class Migration(migrations.Migration):

    dependencies = [
        ("delivery", "0006_deliveryassignment_earning_amount_deliverybatch_and_more"),
        ("inventory", "0024_storagelocation_minimum_bargain_amount"),
        ("orders", "0051_order_cancelled_at_order_cancelled_by"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Remove old FKs
        migrations.RemoveField(model_name="deliveryotp", name="assignment"),
        migrations.RemoveField(model_name="deliverylog", name="assignment"),

        # 2. Rename BEFORE AlterModelOptions
        migrations.RenameModel(
            old_name="DeliveryBatch",
            new_name="DeliveryAssignmentBatch",
        ),

        # 3. AlterModelOptions after rename
        migrations.AlterModelOptions(
            name="deliveryassignmentbatch",
            options={},
        ),

        # 4. Create batch items
        migrations.CreateModel(
            name="DeliveryBatchItems",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("attempt_number", models.PositiveIntegerField(default=1)),
                ("batch", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assignments", to="delivery.deliveryassignmentbatch")),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="batch_items", to="orders.order")),
            ],
        ),

        # 5. Add new FKs as nullable — avoids FK violation on existing rows
        migrations.AddField(
            model_name="deliverylog",
            name="batch_item",
            field=models.ForeignKey(
                null=True, blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="logs",
                to="delivery.deliverybatchitems",
            ),
        ),
        migrations.AddField(
            model_name="deliveryotp",
            name="batch_item",
            field=models.ForeignKey(
                null=True, blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="otps",
                to="delivery.deliverybatchitems",
            ),
        ),

        # 6. Delete old model
        migrations.DeleteModel(name="DeliveryAssignment"),
    ]