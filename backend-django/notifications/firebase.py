"""
firebase.py
-----------
Initializes Firebase Admin SDK ONCE when Django starts.
All other files import `get_firebase_app()` to get the app instance.
"""

import logging
import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings


_firebase_app = None  # module-level singleton


def get_firebase_app():
    """
    Returns the initialized Firebase app.
    Safe to call multiple times — only initializes once.
    """
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    # Check if already initialized (e.g. during testing)
    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        return _firebase_app

    try:
        # Path to your Firebase service account JSON file
        # Set FIREBASE_CREDENTIALS_PATH in your settings.py
        cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)

        if not cred_path:
            raise ValueError(
                "FIREBASE_CREDENTIALS_PATH is not set in settings.py. "
                "Download your service account JSON from Firebase Console → "
                "Project Settings → Service Accounts → Generate new private key"
            )

        cred = credentials.Certificate(cred_path)
        _firebase_app = firebase_admin.initialize_app(cred)

    except Exception as e:
        raise

    return _firebase_app
