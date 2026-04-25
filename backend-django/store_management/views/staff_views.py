from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from store_management.selectors.staff_selectors import get_all_staff, get_staff_summary, get_staff_by_id,get_all_form_choices
from store_management.services.services_staff import delete_staff, toggle_staff_status
from store_management.serializers.staff_serializer import (
    StaffListSerializer,
    StaffCreateUpdateSerializer,
    StaffDetailSerializer,
)
from store_management.utils import get_safe_storage_location
from ..permissions import IsStoreManagerStaff


class StaffListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        queryset = get_all_staff(
            storage_location=get_safe_storage_location(request),
            role=request.query_params.get('role'),
            status_filter=request.query_params.get('status'),
            search=request.query_params.get('search'),
        )
        return Response({
            "summary": get_staff_summary(queryset),
            "staff": StaffListSerializer(queryset, many=True).data
        })

    def post(self, request):
        serializer = StaffCreateUpdateSerializer(data=request.data,context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StaffDetailView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request, pk):
        staff = get_staff_by_id(pk)
        return Response(StaffDetailSerializer(staff).data)

    def put(self, request, pk):
        staff = get_staff_by_id(pk)
        serializer = StaffCreateUpdateSerializer(staff, data=request.data,context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, pk):
        staff = get_staff_by_id(pk)
        serializer = StaffCreateUpdateSerializer(staff, data=request.data, partial=True,context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        staff = get_staff_by_id(pk)
        delete_staff(instance=staff)
        return Response(
            {"message": "Staff deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )


class StaffToggleStatusView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def patch(self, request, pk):
        staff = get_staff_by_id(pk)
        try:
            toggle_staff_status(
                instance=staff,
                new_status=request.data.get('status')
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"id": staff.id, "status": staff.status})
    
    

class StaffFormChoicesView(APIView):
    """
    GET /api/staff/choices/
    Frontend calls this once on form open to populate all dropdowns
    """
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def get(self, request):
        return Response(get_all_form_choices())