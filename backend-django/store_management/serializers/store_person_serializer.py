from ..models.manager_models import StoreManagerProfile
from rest_framework import serializers



class StoreManagerInfoSerializer(serializers.ModelSerializer):
    storage_location_name = serializers.SerializerMethodField()
    class Meta:
        model = StoreManagerProfile
        fields = ["id", "first_name","last_name","storage_location_name"]

    def get_storage_location_name(self,obj):
        return obj.storage_location.name    