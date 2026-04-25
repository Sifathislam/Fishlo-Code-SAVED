# orders/migrations/0049_create_order_token_seq.py
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0048_order_token_generated_at_order_token_number"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE SEQUENCE IF NOT EXISTS order_token_seq
                START WITH 1121
                INCREMENT BY 1;
            """,
            reverse_sql="DROP SEQUENCE IF EXISTS order_token_seq;",
        ),
    ]