from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from ..rate_limiter import OTPRateLimiter
from ..serializers import SendOTPSerializer, VerifyOTPSerializer, UserSerializer
from ..services import send_otp_service, verify_otp_service, logout_service

rate_limiter = OTPRateLimiter(max_attempts=3, window_minutes=5)


class SendOTPView(APIView):
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone_number = serializer.validated_data["phone_number"]
        data, code = send_otp_service(phone_number, rate_limiter)
        return Response(data, status=code)


class VerifyOTPView(APIView):
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        otp_code = serializer.validated_data["otp"]
        session_id = serializer.validated_data["session_id"]

        data, code = verify_otp_service(session_id, otp_code, rate_limiter)
        return Response(data, status=code)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        data, code = logout_service(request, refresh_token)
        return Response(data, status=code)
