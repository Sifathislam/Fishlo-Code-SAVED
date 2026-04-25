from django.db import migrations


def create_sequence(apps, schema_editor):
    """
    Create PostgreSQL sequence for order number generation.
    This is atomic and handles unlimited concurrent orders.
    """
    schema_editor.execute(
        """
        CREATE SEQUENCE IF NOT EXISTS order_number_seq
        START WITH 1
        INCREMENT BY 1
        NO MAXVALUE
        NO CYCLE;
    """
    )


def drop_sequence(apps, schema_editor):
    """
    Drop sequence if migration is reversed.
    """
    schema_editor.execute("DROP SEQUENCE IF EXISTS order_number_seq;")


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0014_alter_ordertracking_options_ordertracking_notes_and_more"),
    ]

    operations = [
        migrations.RunPython(create_sequence, reverse_code=drop_sequence),
    ]
