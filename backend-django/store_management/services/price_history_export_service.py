import csv
from django.http import HttpResponse


def export_price_history_csv(qs, filename="price_history_export.csv"):
    """
    Builds a CSV HttpResponse from a PriceHistory queryset.
    """
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    writer = csv.writer(response)
    writer.writerow([
        "Date",
        "Product",
        "Storage Location",
        "Action",
        "Changed By",

        "Old Wholesale",
        "Old Regular",
        "Old Display",
        "Old Bargain",
        "Old Min",

        "New Wholesale",
        "New Regular",
        "New Display",
        "New Bargain",
        "New Min",
    ])

    for row in qs.order_by("-created_at"):
        writer.writerow([
            row.created_at,
            row.product.name,
            getattr(row.storage_location, "name", str(row.storage_location_id)),
            row.action,
            (row.user if row.user else ""),

            row.old_wholesale_price,
            row.old_regular_price,
            row.old_display_price,
            row.old_bargain_price,
            row.old_min_price,

            row.new_wholesale_price,
            row.new_regular_price,
            row.new_display_price,
            row.new_bargain_price,
            row.new_min_price,
        ])

    return response
