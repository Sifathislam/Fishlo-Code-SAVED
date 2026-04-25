from rest_framework import serializers
from ..models import PolicyPage, FAQ

class PolicyPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PolicyPage
        fields = ['slug', 'title', 'updated_at', 'content']

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['id', 'question', 'answer']
