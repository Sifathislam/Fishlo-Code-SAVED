from datetime import timedelta
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Count, Q, Sum
from django.utils import timezone

from ..models.orders_models import Order, PaymentMethodLog
from ..store_serializers import StoreOrderSerializer
from ..pagination import StoreOrderPagination
from ..filters import StoreOrderFilter  
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from store_management.models import StoreManagerProfile
from django.contrib.gis.db.models import Union
from ..services.store_cancel_refund_service import store_cancel_order_service
from ..templatetags.weight_filters import format_weight_kg
from inventory.models.delivery_slot_models import DeliveryTimeSlot
from orders.models.orders_models import OrderItem
class StoreOverviewView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Get the logged-in manager's profile
        try:
            manager_profile = request.user.store_manager_profile
            storage_location = manager_profile.storage_location
        except (AttributeError, StoreManagerProfile.DoesNotExist):
            return Response(
                {"error": "User is not a store manager or has no profile."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not storage_location:
            # If manager has no storage location assigned, return empty stats/orders
            # or handle as error depending on business logic. 
            # For now, let's return zeros to avoid crashing.
            return Response({
                'stats': {k: 0 for k in ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'PROCESSING', 'DELIVERED', 'CANCELLED']},
                'recent_orders': []
            }, status=status.HTTP_200_OK)
        zones = storage_location.delivery_zones.all()
    
        
        store_orders = Order.objects.filter(
            order_address__point__within=zones.aggregate(union=Union('geom'))['union']
        )
        
        # Handling edge case: If storage has no zones or aggregate returns None
        if not zones.exists():
             store_orders = Order.objects.none()

        #  Single query to get all counts using conditional aggregation
        stats = store_orders.aggregate(
            pending=Count('id', filter=Q(status=Order.OrderStatus.PENDING) & Q(payment_status__in=['PAID', 'PARTIALLY_PAID', 'PENDING'])),
            confirmed=Count('id', filter=Q(status=Order.OrderStatus.CONFIRMED) & Q(payment_status__in=['PAID', 'PARTIALLY_PAID', 'PENDING'])),
            processing=Count('id', filter=Q(status=Order.OrderStatus.PROCESSING) & Q(payment_status__in=['PAID', 'PARTIALLY_PAID', 'PENDING'])),
            packed=Count('id', filter=Q(status=Order.OrderStatus.PACKED) & Q(payment_status__in=['PAID', 'PARTIALLY_PAID', 'PENDING'])),
            out_for_delivery=Count('id', filter=Q(status=Order.OrderStatus.OUT_FOR_DELIVERY) & Q(payment_status__in=['PAID', 'PARTIALLY_PAID', 'PENDING'])),
            delivered=Count('id', filter=Q(status=Order.OrderStatus.DELIVERED) & Q(payment_status__in=['PAID', 'PARTIALLY_PAID', 'PENDING'])),
            cancelled=Count('id', filter=Q(status=Order.OrderStatus.CANCELLED) | Q(payment_status='FAILED'))
        )
        
        recent_orders = store_orders.filter(
            Q(payment_status__in=['PAID', 'PARTIALLY_PAID']) |
            Q(payment_method='COD', payment_status='PENDING')
        ).order_by('-created_at')[:5]
        recent_orders_serializer = StoreOrderSerializer(recent_orders, many=True)
        
        data = {
            'stats': {
                'PENDING': stats['pending'] or 0,
                'CONFIRMED': stats['confirmed'] or 0,
                'PACKED': stats['packed'] or 0,
                'OUT_FOR_DELIVERY': stats['out_for_delivery'] or 0,
                'PROCESSING': stats['processing'] or 0,
                'DELIVERED': stats['delivered'] or 0,
                'CANCELLED': stats['cancelled'] or 0
            },
            'recent_orders': recent_orders_serializer.data
        }
        
        return Response(data, status=status.HTTP_200_OK)
    

class StoreOrderListView(ListAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = StoreOrderSerializer
    pagination_class = StoreOrderPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = StoreOrderFilter
    search_fields = ['order_number', 'order_address__full_name', 'order_address__phone']

    def get_queryset(self):
        # Filter by Manager's Storage Location
        try:
            manager_profile = self.request.user.store_manager_profile
            storage_location = manager_profile.storage_location
        except (AttributeError, StoreManagerProfile.DoesNotExist):
            return Order.objects.none()

        if not storage_location:
             return Order.objects.none()

        zones = storage_location.delivery_zones.all()
        if not zones.exists():
            return Order.objects.none()

        # Filter orders within the zones
        queryset = Order.objects.filter(
            order_address__point__within=zones.aggregate(union=Union('geom'))['union']
        )

        # Apply payment status filter if provided
        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
           return queryset.order_by('-created_at')
        
        return queryset.filter(
            Q(payment_status__in=['PAID', 'PARTIALLY_PAID']) | 
            Q(payment_method='COD', payment_status='PENDING') |
            Q(status=Order.OrderStatus.CANCELLED) |
            Q(payment_status='FAILED')
        ).order_by('-created_at')

class StoreOrderUpdateView(UpdateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = StoreOrderSerializer
    lookup_field = 'order_number'

    def get_queryset(self):
        try:
            manager_profile = self.request.user.store_manager_profile
            storage_location = manager_profile.storage_location
        except (AttributeError, StoreManagerProfile.DoesNotExist):
            return Order.objects.none()

        if not storage_location:
            return Order.objects.none()

        zones = storage_location.delivery_zones.all()
        if not zones.exists():
            return Order.objects.none()

        return Order.objects.filter(
            order_address__user_address__point__within=zones.aggregate(union=Union('geom'))['union']
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {'success': False, 'message': 'No status provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if new_status == 'PROCESSING':
            order_item_and_weights = request.data.get('order_item_and_weights', [])

            # Resolve the correct storage location
            storage_location = instance.storage_location
            if not storage_location:
                try:
                    manager_profile = request.user.store_manager_profile
                    storage_location = manager_profile.storage_location
                except Exception:
                    pass

            print(f"[PROCESSING] Order #{instance.order_number} | Storage: {storage_location} | Items payload: {order_item_and_weights}")

            from django.db import transaction as db_transaction

            with db_transaction.atomic():
                for item in order_item_and_weights:
                    order_item_id = item.get('order_item_id')
                    weight_type = item.get('weight_type')
                    weight = item.get('weight')

                    try:
                        order_item = OrderItem.objects.get(id=order_item_id)
                    except OrderItem.DoesNotExist:
                        print(f"[PROCESSING] ⚠ OrderItem {order_item_id} not found, skipping")
                        continue

                    if weight_type == 'gram':
                        weight_in_kg = Decimal(str(weight)) / 1000
                    else:  # kg
                        weight_in_kg = Decimal(str(weight))

                    # product_weight stores weight per unit
                    order_item.product_weight = weight_in_kg
                    order_item.save(update_fields=['product_weight'])

                    # Deduct actual measured weight × quantity from inventory
                    # Staff enters WEIGHT PER UNIT. System multiplies by quantity.
                    # e.g. staff enters 1kg, qty=3 → deducts 3kg
                    if order_item.product and storage_location:
                        from inventory.models.inventory_models import Inventory
                        inv = Inventory.objects.select_for_update().filter(
                            product=order_item.product,
                            storagelocation=storage_location
                        ).first()
                        if inv and order_item.product.sell_type == 'WEIGHT':
                            total_weight_to_deduct = weight_in_kg * Decimal(str(order_item.quantity))
                            stock_before = inv.stock_kg
                            inv.stock_kg = max(inv.stock_kg - total_weight_to_deduct, Decimal('0'))
                            inv.save(update_fields=['stock_kg'], skip_history=True)
                            print(f"[PROCESSING]  {order_item.product_name}: "
                                  f"entered={weight}{weight_type} (={weight_in_kg}kg/unit) × qty={order_item.quantity} "
                                  f"= {total_weight_to_deduct}kg deducted | "
                                  f"stock: {stock_before}kg → {inv.stock_kg}kg")
                        elif inv:
                            print(f"[PROCESSING] ⏭ {order_item.product_name}: sell_type={order_item.product.sell_type}, skipped weight deduction")
                    else:
                        print(f"[PROCESSING] ⚠ {order_item.product_name}: no product or storage_location, skipped")



        # ── CANCELLATION FLOW ────────────────────────────────────────────────
        if new_status == 'CANCELLED':

            # 1. Validate required fields for cancellation
            cancellation_reason = request.data.get('cancellation_reason', '').strip()
            refund_type         = request.data.get('refundType', '').strip().upper()

            if not cancellation_reason:
                return Response(
                    {'success': False, 'message': 'cancellation_reason is required for cancellation.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not refund_type:
                return Response(
                    {'success': False, 'message': 'refundType is required for cancellation. '
                                                   'Use FULL_REFUND, PARTIAL_REFUND, or NO_REFUND.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Restock inventory before cancelling
            def restock_inventory(order):
                from inventory.models.inventory_models import Inventory
                from django.db import transaction as db_transaction

                # Resolve storage location: use order's stored location first,
                # then fall back to the cancelling manager's location,
                # then fall back to any inventory for the product.
                storage_loc = order.storage_location
                if not storage_loc:
                    try:
                        storage_loc = request.user.store_manager_profile.storage_location
                    except Exception:
                        pass

                # Reliable check: was this order EVER in PROCESSING status?
                # Weight stock is deducted ONLY when the order enters PROCESSING
                # and store staff enters the actual measured weight.
                # We check tracking history rather than current status, because
                # the order may have moved past PROCESSING (e.g. to PACKED) before cancel.
                was_weight_deducted = order.tracking_history.filter(
                    status='PROCESSING'
                ).exists()

                with db_transaction.atomic():
                    for item in order.order_items.select_related('product').all():
                        if not item.product:
                            # Skip custom items (no linked product)
                            continue

                        # Find inventory scoped to the correct storage location
                        if storage_loc:
                            inventory = Inventory.objects.select_for_update().filter(
                                product=item.product,
                                storagelocation=storage_loc
                            ).first()
                        else:
                            # Last-resort fallback: grab whichever inventory record exists
                            inventory = Inventory.objects.select_for_update().filter(
                                product=item.product
                            ).first()

                        if not inventory:
                            continue

                        if item.product.sell_type == 'WEIGHT':
                            # Only restock weight if it was actually deducted at PROCESSING.
                            # product_weight = per-unit actual weight entered by staff.
                            # total to restore = product_weight × quantity
                            # e.g. 1kg × 3 qty → restore 3kg; 250g × 2 qty → restore 500g
                            if was_weight_deducted and item.product_weight:
                                total_weight_to_restock = item.product_weight * Decimal(str(item.quantity))
                                inventory.stock_kg += total_weight_to_restock
                                inventory.save(update_fields=['stock_kg'], skip_history=True)
                        else:  # PIECE or PACK — always deducted at order time
                            if item.quantity:
                                inventory.stock_pieces += item.quantity
                                inventory.save(update_fields=['stock_pieces'], skip_history=True)

            # Restock for ALL payment types: PAID, PARTIALLY_PAID, PENDING (COD/walk-in).
            # Only skip if order is already CANCELLED (no double restock).
            if instance.status != 'CANCELLED':
                restock_inventory(instance)

            # 3. Build payload and call refund service
            #    The service handles: cancelling order + creating Refund record + calling Razorpay
            payload = {
                "order_number" : instance.order_number,
                "reason"       : cancellation_reason,
                "refundType"   : refund_type,
                "refundAmount" : request.data.get('refundAmount'),  # only used for PARTIAL_REFUND
            }

            success, message, data, status_code = store_cancel_order_service(
                store_user=request.user,
                payload=payload,
            )

            if not success:
                return Response(
                    {'success': False, 'message': message},
                    status=status_code,
                )

            # 4. Update order tracking / status history via centralized method
            instance.refresh_from_db()  # reload since service already saved the order
            instance.update_status(
                new_status='CANCELLED',
                updated_by_user=request.user,
                notes=request.data.get('notes', f"Order cancelled by store. Reason: {cancellation_reason}"),
                updated_from='STORE_DASHBOARD'
            )

            return Response(
                {'success': True, 'message': message, 'data': data},
                status=status.HTTP_200_OK,
            )

        # ── ALL OTHER STATUS UPDATES (CONFIRMED, PACKED, OUT_FOR_DELIVERY, etc.) ──
        instance.update_status(
            new_status=new_status,
            updated_by_user=request.user,
            notes=request.data.get('notes', f"Status updated to {new_status}"),
            updated_from='STORE_DASHBOARD'
        )

        return Response(
            {'success': True, 'message': 'Order status updated successfully'},
            status=status.HTTP_200_OK,
        )
        
class StoreNewOrderCheckView(APIView):
    """Lightweight endpoint for polling new orders — returns only count and latest ID."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            manager_profile = request.user.store_manager_profile
            storage_location = manager_profile.storage_location
        except (AttributeError, StoreManagerProfile.DoesNotExist):
             return Response({'active_order_ids': []}, status=status.HTTP_200_OK)

        if not storage_location:
             return Response({'active_order_ids': []}, status=status.HTTP_200_OK)

        zones = storage_location.delivery_zones.all()
        if not zones.exists():
             return Response({'active_order_ids': []}, status=status.HTTP_200_OK)

        import logging
        logger = logging.getLogger(__name__)

        # Filter completed orders in these zones (base query)
        base_qs = Order.objects.filter(
            Q(payment_status__in=['PAID', 'PARTIALLY_PAID']) |
            Q(payment_method='COD', payment_status='PENDING')
        ).exclude(status__in=['CANCELLED', 'DELIVERED'])  # Only active orders
        
        zones_union = zones.aggregate(union=Union('geom'))['union']
        if not zones_union:
             return Response({'active_order_ids': []}, status=status.HTTP_200_OK)

        active_orders = base_qs.filter(
            order_address__point__within=zones_union
        )
        
        # Get list of all currently active completed order IDs
        active_order_ids = list(active_orders.values_list('id', flat=True))
        
        return Response({
            'active_order_ids': active_order_ids,
        }, status=status.HTTP_200_OK)


class StoreOrdersBySlotView(APIView):
    """
    Returns orders filtered by delivery date (today/tomorrow) and optionally by slot_id.
    Also returns all available delivery slots with order counts for the selected day.
    No pagination, no search — purely slot-based.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Resolve manager's storage location + zones
        try:
            manager_profile = request.user.store_manager_profile
            storage_location = manager_profile.storage_location
        except (AttributeError, StoreManagerProfile.DoesNotExist):
            return Response(
                {"error": "User is not a store manager or has no profile."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not storage_location:
            return Response({"error": "No storage location assigned."}, status=status.HTTP_403_FORBIDDEN)

        zones = storage_location.delivery_zones.all()
        if not zones.exists():
            return Response({
                "date": "", "date_value": "", "slots": [], "orders": [],
                "summary": {"total_orders": 0, "total_weight": "0 kg", "bikes_needed": 0, "pending_deliveries": 0}
            }, status=status.HTTP_200_OK)

        zones_union = zones.aggregate(union=Union('geom'))['union']
        if not zones_union:
            return Response({
                "date": "", "date_value": "", "slots": [], "orders": [],
                "summary": {"total_orders": 0, "total_weight": "0 kg", "bikes_needed": 0, "pending_deliveries": 0}
            }, status=status.HTTP_200_OK)

        # 2. Determine the target date
        now_dt = timezone.localtime()
        today = now_dt.date()
        date_param = request.query_params.get('date', 'today').lower()

        if date_param == 'tomorrow':
            target_date = today + timedelta(days=1)
            delivery_day_key = "TOMORROW"
        else:
            target_date = today
            delivery_day_key = "TODAY"

        # 3. Base queryset: orders within zones, matching the target date
        base_qs = Order.objects.filter(
            order_address__point__within=zones_union,
            estimated_delivery_date=target_date,
        ).filter(
            Q(payment_status__in=['PAID', 'PARTIALLY_PAID']) |
            Q(payment_method='COD', payment_status='PENDING')
        ).exclude(status="CANCELLED")

        # 4. Get available delivery slots for this storage location + day
        #    We show TODAY's slot definitions as the display slots, but we need
        #    to match orders by TIME RANGE, not by slot FK, because an order placed
        #    yesterday for "TOMORROW" has a TOMORROW slot FK, but today it should
        #    appear under the equivalent TODAY slot.
        time_slots = DeliveryTimeSlot.objects.filter(
            storagelocation=storage_location,
            delivery_day=delivery_day_key,
        ).order_by('start_time')

        # Collect ALL slot IDs for this storage location that share the same
        # time range, regardless of delivery_day label.
        # This maps each display slot -> set of matching slot IDs across days.
        all_slots_for_location = DeliveryTimeSlot.objects.filter(
            storagelocation=storage_location,
        )
        time_range_to_ids = {}
        for s in all_slots_for_location:
            key = (s.start_time, s.end_time)
            time_range_to_ids.setdefault(key, set()).add(s.id)

        slots_data = []
        for slot in time_slots:
            key = (slot.start_time, slot.end_time)
            matching_ids = time_range_to_ids.get(key, {slot.id})
            count = base_qs.filter(delivery_slot_id__in=matching_ids).count()
            slots_data.append({
                "id": slot.id,
                "label": slot.label(),
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "order_count": count,
                "is_active": slot.is_active,
            })

        # 5. Filter by specific slot if slot_id provided
        slot_id = request.query_params.get('slot_id')
        if slot_id:
            # Find the time range for the requested slot, then include all
            # slot IDs that share the same time range
            try:
                requested_slot = DeliveryTimeSlot.objects.get(id=slot_id)
                key = (requested_slot.start_time, requested_slot.end_time)
                matching_ids = time_range_to_ids.get(key, {int(slot_id)})
            except DeliveryTimeSlot.DoesNotExist:
                matching_ids = {int(slot_id)}
            orders_qs = base_qs.filter(delivery_slot_id__in=matching_ids).order_by('created_at')
        else:
            # If no slot_id, show all orders for the day
            orders_qs = base_qs.order_by('created_at')

        # 6. Compute summary
        total_orders = orders_qs.count()
        import math
        bikes_needed = math.ceil(total_orders / 10) if total_orders > 0 else 0
        
        pending_deliveries = orders_qs.filter(status__in=[Order.OrderStatus.PENDING, Order.OrderStatus.CONFIRMED, Order.OrderStatus.PROCESSING, Order.OrderStatus.PACKED]).count()

        total_weight_raw = orders_qs.aggregate(tw=Sum('total_weight'))['tw'] or Decimal("0.00")

        # 7. Serialize orders
        serializer = StoreOrderSerializer(orders_qs, many=True)

        return Response({
            "date": date_param,
            "date_value": str(target_date),
            "slots": slots_data,
            "orders": serializer.data,
            "summary": {
                "total_orders": total_orders,
                "total_weight": format_weight_kg(total_weight_raw),
                "bikes_needed": bikes_needed,
                "pending_deliveries": pending_deliveries,
            }
        }, status=status.HTTP_200_OK)


class StoreOrderPaymentMethodUpdateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_number):
        try:
            # Reusing the logic from StoreOrderUpdateView to ensure manager has access to this order
            manager_profile = request.user.store_manager_profile
            storage_location = manager_profile.storage_location
            if not storage_location:
                return Response({"error": "No storage location assigned."}, status=status.HTTP_403_FORBIDDEN)

            zones = storage_location.delivery_zones.all()
            if not zones.exists():
                return Response({"error": "No zones assigned."}, status=status.HTTP_403_FORBIDDEN)

            # Filter by zone (via user_address or snapshot point) OR by matched storage_location
            union_geom = zones.aggregate(union=Union('geom'))['union']
            order = Order.objects.filter(order_number=order_number).filter(
                Q(order_address__user_address__point__within=union_geom) |
                Q(order_address__point__within=union_geom) |
                Q(storage_location=storage_location)
            ).first()

            if not order:
                return Response(
                    {"success": False, "message": "Order not found or access denied"},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {"success": False, "message": f"Error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_method = request.data.get("payment_method")
        if not new_method:
            return Response(
                {"success": False, "message": "No payment method provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_methods = ["CASH", "UPI_ONLINE"]
        if new_method not in allowed_methods:
            return Response(
                {"success": False, "message": f"Invalid payment method. Allowed: {', '.join(allowed_methods)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.status == "CANCELLED":
            return Response(
                {"success": False, "message": f"Cannot update payment method for {order.status} orders"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.payment_method not in ["CASH", "UPI_ONLINE"]:
            return Response(
                {"success": False, "message": f"Cannot update payment method for {order.payment_method} orders"},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_method = order.payment_method
        if old_method == new_method:
            return Response(
                {"success": True, "message": "Payment method is already set to this value"},
                status=status.HTTP_200_OK
            )
        
        # Update order
        order.payment_method = new_method
        order.save(update_fields=["payment_method", "updated_at"])

        # Create log
        PaymentMethodLog.objects.create(
            order=order,
            old_method=old_method,
            new_method=new_method,
            changed_by=request.user,
            notes=request.data.get("notes", f"Payment method updated from {old_method} to {new_method} by store manager.")
        )

        return Response(
            {"success": True, "message": "Payment method updated successfully"},
            status=status.HTTP_200_OK
        )
