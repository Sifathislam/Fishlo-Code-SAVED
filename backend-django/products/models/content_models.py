from ckeditor.fields import RichTextField
from django.db import models

from .product_models import Product


# --------------------
# What You Get Model
# -------------------
class WhatYouGet(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    name = models.CharField(
        max_length=255, verbose_name="Name", help_text="Enter the name/title"
    )
    image = models.ImageField(
        upload_to="what_you_get/images/",
        verbose_name="Image",
        help_text="Upload an image",
    )
    content = RichTextField(
        verbose_name="Content", help_text="Enter the rich text content"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "What You Get"
        verbose_name_plural = "What You Get"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


# ---------------
# Source Model
# --------------
class Source(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    name = models.CharField(
        max_length=255, verbose_name="Name", help_text="Enter the source name/title"
    )
    image = models.ImageField(
        upload_to="sources/images/", verbose_name="Image", help_text="Upload an image"
    )
    content = RichTextField(
        verbose_name="Content", help_text="Enter the rich text content"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Source"
        verbose_name_plural = "Sources"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
