from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from ..serializers import PolicyPageSerializer, FAQSerializer
from ..selectors.policy_selectors import get_active_faqs


class PolicyDetailView(generics.RetrieveAPIView):
    queryset = None  # handled by DRF via get_queryset
    serializer_class = PolicyPageSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        # same as: PolicyPage.objects.all()
        from ..models import PolicyPage
        return PolicyPage.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        # We return the content field directly so the frontend gets raw HTML
        return Response([{"content": serializer.data.get('content', '')}])


class FAQListAPIView(APIView):
    def get(self, request, format=None):
        faqs = get_active_faqs()
        serializer = FAQSerializer(faqs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
