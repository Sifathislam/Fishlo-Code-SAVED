from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
import base64
import os
from django.conf import settings
from ..permissions import IsStoreManagerStaff

class QZSignView(APIView):
    permission_classes = [IsAuthenticated, IsStoreManagerStaff]

    def post(self, request):
        to_sign = request.data.get('request')
        if not to_sign:
            return Response({'error': 'No request message provided'}, status=400)

        try:
            # Path to private key
            key_path = os.path.join(settings.BASE_DIR, "certs", "private-key.pem")
            
            with open(key_path, "rb") as key_file:
                private_key = serialization.load_pem_private_key(
                    key_file.read(),
                    password=None
                )

            # Sign the message using SHA1 as required by QZ Tray
            signature = private_key.sign(
                to_sign.encode('utf-8'),
                padding.PKCS1v15(),
                hashes.SHA1()
            )

            return Response(base64.b64encode(signature).decode('utf-8'))
        except Exception as e:
            return Response({'error': str(e)}, status=500)
