from django.db import models

class FAQ(models.Model):
    question = models.CharField(max_length=255)
    answer = models.TextField()
    # Renamed to priority for clarity, low numbers (1, 2, 3) show first
    priority = models.PositiveIntegerField(default=0, help_text="Lower numbers show first (e.g., 1 is highest priority)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # 'priority' handles the sequence, '-created_at' is the fallback for ties
        ordering = ['priority', '-created_at'] 
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"

    def __str__(self):
        return f"({self.priority}) {self.question}"
