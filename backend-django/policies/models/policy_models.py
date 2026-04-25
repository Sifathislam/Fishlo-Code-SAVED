from django.db import models
from ckeditor.fields import RichTextField

class PolicyPage(models.Model):
    PAGE_CHOICES = [
        ('privacy', 'Privacy Policy'),
        ('quality', 'Quality Promise'),
        ('refund', 'Refund Policy'),
        ('terms', 'Terms of Service'),
        ('prices', 'Why Prices Change'),
        ('bargaining', 'How Bargaining Works'),
        ('ai_fisher', 'Meet Our AI Fisherwoman'),
        ('delivery', 'Delivery Information'),
        ('help', 'Help / Contact Us'),
    ]
    slug = models.CharField(max_length=50, choices=PAGE_CHOICES, unique=True)
    title = models.CharField(max_length=100)
    content = RichTextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

