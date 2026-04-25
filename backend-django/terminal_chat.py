import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "fishlo_main.settings")
django.setup()

# --- Imports AFTER setup ---
from accounts.models import UserProfile
from bargains.ai import handle_user_message
from bargains.services import start_chat_session
from inventory.models import Inventory


def pick_inventory():
    qs = Inventory.objects.select_related("product", "storagelocation").all()[:10]

    print("\nAvailable inventory:")
    for inv in qs:
        product = inv.product
        matrix = product.get_price_matrix(inv.storagelocation)
        print(
            f"{inv.id}: {product.name} | "
            f"display={matrix.display_price if matrix else 'N/A'} | "
            f"bargain={matrix.bargain_price if matrix else 'N/A'} | "
            f"min={matrix.min_price if matrix else 'N/A'}"
        )

    inv_id = input("\nEnter Inventory ID (blank = first): ").strip()
    if inv_id:
        return Inventory.objects.get(id=int(inv_id))
    return qs.first()


def main():
    user = UserProfile.objects.first()
    if not user:
        raise RuntimeError("No UserProfile found")

    inventory = pick_inventory()
    if not inventory:
        raise RuntimeError("No Inventory found")

    session = start_chat_session(
        user_profile=user,
        storage_location=inventory.storagelocation,
        device_type="TERMINAL",
    )

    print(f"\n💬 Chat started about {inventory.product.name}")
    print("Type 'exit' to quit\n")

    while True:
        text = input("You: ").strip()
        if text.lower() in ("exit", "quit", "bye"):
            print("Aunty: Theek hai beta, kal milte hai 👋")
            break

        # ✅ THIS IS THE ONLY IMPORTANT LINE
        reply = handle_user_message(
            session=session, user_text=text, product=inventory.product, inventory=inventory, storage_location=inventory.storagelocation,
        )

        print("Aunty:", reply)


if __name__ == "__main__":
    main()
