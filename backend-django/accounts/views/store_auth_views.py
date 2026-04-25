from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model


User = get_user_model()

class StoreLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"error": "Please provide both email and password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Authenticate using CustomAuthBackend (which now supports role-based password login)
        user = authenticate(username=email, password=password)

        if not user:
            return Response(
                {"error": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check Role
        if user.role not in [User.Roles.STORE_MANAGER, User.Roles.DELIVERY_PARTNER]:
            return Response(
                {"error": "Unauthorized access. This login is for Store Staff only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Generate Tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful",
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                "role": user.role,
            },
            status=status.HTTP_200_OK,
        )
