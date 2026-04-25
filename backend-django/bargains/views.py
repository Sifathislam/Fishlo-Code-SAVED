from decimal import Decimal

from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from inventory.models.inventory_models import Inventory
from .services import end_chat_session, generate_initial_greeting, start_chat_session, log_reply_message
from accounts.models.profile_models import UserProfile
from .models import ChatMessage, ChatSession
from products.models.product_models import Product
from products.utils import get_user_storage_location, get_location_inventory
from .ai import handle_user_message
from .state import get_or_create_bargain_state, save_bargain_state

from orders.models.cart_models import Cart, CartItem


class ChatSessionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        device_type = request.data.get("device_type")
        if not device_type:
            return Response({"error": "device_type required"}, status=400)

        VALID_DEVICE_TYPES = {choice[0] for choice in ChatSession.DEVICE_CHOICES}
        if device_type not in VALID_DEVICE_TYPES:
            return Response({"error": "Invalid device type"}, status=400)

        user = request.user

        try:
            user_profile = user.profile
        except UserProfile.DoesNotExist:
            return Response({"error": "User profile not found"}, status=404)

        storage_location = get_user_storage_location(request)

        # 🔹 Get cart
        cart = Cart.objects.filter(user=user, is_active=True).first()
        if not cart:
            return Response({"error": "Cart not found"}, status=400)

        cart_items = CartItem.objects.filter(cart=cart)

        cart_total = cart.get_subtotal()

        if cart_total <= 699:
            return Response({"error": "Bargain not allowed"}, status=400)

        # 🔹 Only one active session
        existing_session = ChatSession.objects.filter(
            user_profile=user_profile,
            storage_location=storage_location,
            ended_at__isnull=True
        ).first()

        if existing_session:
            return Response({"session_id": existing_session.id})

        # 🔹 CREATE SESSION FIRST
        session = start_chat_session(
            user_profile=user_profile,
            storage_location=storage_location,
            device_type=device_type
        )

        # 🔹 Build cart snapshot
        snapshot_items = []
        for item in cart_items:
            snapshot_items.append({
                "product_id": item.product.id,
                "name": item.product.name,
                "quantity": str(item.quantity),
                "unit_price": float(item.unit_price),
                "subtotal": float(item.get_subtotal())
            })

        session.cart_total = cart_total
        session.cart_snapshot = {
            "items": snapshot_items,
            "cart_total": float(cart_total)
        }
        session.save(update_fields=["cart_total", "cart_snapshot"])

        # 🔹 Generate greeting
        greeting_data = generate_initial_greeting(
            session=session,
            storage_location=storage_location,
            cart_total=cart_total
        )

        offer_details = greeting_data["offer_details"]

        # 🔹 Initialize state
        state = get_or_create_bargain_state(session)
        state.initial_cart_total = Decimal(offer_details["original_total"])
        state.current_counter_total = Decimal(offer_details["counter_total"])
        state.bargain_turn_count = 0
        state.non_serious_turn_count = 0
        state.last_user_offer = None
        state.repeat_offer_count = 0
        save_bargain_state(state)

        # 🔹 Log first message
        log_reply_message(session, {
            "reply": greeting_data["reply"],
            "message_type": "COUNTER",
            "offer_details": offer_details,
            "ui": {}
        }, role="AGENT")

        return Response({
            "session_id": session.id,
            "initial_message": {
                "reply": greeting_data["reply"],
                "message_type": "COUNTER",
                "offer_details": offer_details,
                "is_initial_offer": True,
                "ui": {
                    "show_accept_button": True,
                    "show_counter_button": True
                }
            }
        })

class ChatMessageCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get("session_id")
        user_text = request.data.get("message")

        if not session_id or not user_text:
            return Response({"error": "session_id and message are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user profile
        user_profile = getattr(request.user, "profile", None)
        if not user_profile:
            return Response({"error": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get session that belongs to this user
        try:
            session = ChatSession.objects.select_related("storage_location").get(id=session_id, user_profile=user_profile, ended_at__isnull=True)
        except ChatSession.DoesNotExist:
            return Response({"error": "Invalid session"}, status=status.HTTP_404_NOT_FOUND)
        
        storage_location = session.storage_location

        # Full AI pipeline starts
        response_data = handle_user_message(session=session, user_text=user_text, storage_location=storage_location)
        return Response(response_data, status=status.HTTP_200_OK)


class ActiveChatSessionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_profile = getattr(request.user, "profile", None)
        if not user_profile:
            return Response({"error": "User profile not found"}, status=404)
        
        storage_location = get_user_storage_location(request)
        if not storage_location:
            return Response({"session": None})
        
        session = (
            ChatSession.objects.filter(user_profile=user_profile, storage_location=storage_location, ended_at__isnull=True)
            .order_by("-started_at")
            .first()
        )

        print('session==>', session)

        if not session:
            return Response({"session": None})
        
        messages = ChatMessage.objects.filter(session=session).order_by("created_at")

        response = {
            "session_id": session.id,
            "messages": [
                {
                    "id": m.id,
                    "text": m.text,
                    "role": m.role,
                    "created_at": m.created_at,
                }
                for m in messages
            ]
        }
        return Response(response)
    

class EndChatSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get("session_id")

        if not session_id:
            return Response({"error": "session_id required"}, status=400)

        user_profile = getattr(request.user, "profile", None)
        if not user_profile:
            return Response({"error": "User profile not found"}, status=404)

        try:
            session = ChatSession.objects.get(id=session_id, user_profile=user_profile, ended_at__isnull=True)
        except ChatSession.DoesNotExist:
            return Response({"error": "Invalid session"}, status=404)

        end_chat_session(session)
        print('chat ended')
        return Response({"status": "ended"})
