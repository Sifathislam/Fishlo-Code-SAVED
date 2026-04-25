# accounts/admins/admin_site.py

# Packages Imports
from django import forms
from django.contrib import admin
from django.contrib.auth.forms import AuthenticationForm


# ----------------------------------
# Custom Admin Authentication Form
# ----------------------------------
class AdminAuthenticationForm(AuthenticationForm):
    username = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={"autofocus": True, "autocomplete": "email"}),
    )

    error_messages = {
        "invalid_login": (
            "Please enter a correct email and password. Note that both fields may be case-sensitive."
        ),
        "inactive": "This account is inactive.",
    }


# ---------------------------------------
# Set Custom Login Form for Admin Site
# -------------------------------------
admin.site.login_form = AdminAuthenticationForm
admin.site.login_template = "admin/login.html"

# Customize admin site header and title
admin.site.site_header = "Fishlo  Admin"
admin.site.site_title = "Fishlo  Admin Portal"
admin.site.index_title = "Welcome to Fishlo  Administration"
