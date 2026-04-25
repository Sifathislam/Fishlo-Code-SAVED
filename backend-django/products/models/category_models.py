from django.db import models


# ----------------
# CATEGORY Model
# ----------------
class Category(models.Model):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(max_length=300, unique=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="images/category/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(auto_now_add=False, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


# -------------------
# SUBCATEGORY Model
# -------------------
class SubCategory(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="subcategories"
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=300, unique=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="images/subcategory/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(auto_now_add=False, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Sub Categories"
        ordering = ["name"]

    def __str__(self):
        return f"{self.category.name} → {self.name}"
