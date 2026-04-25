from ..serializers import SubscriberSerializer


def create_subscriber(*, data, user=None):
    serializer = SubscriberSerializer(data=data)

    serializer.is_valid(raise_exception=False)

    if serializer.is_valid():
        if user and user.is_authenticated:
            serializer.save(user=user)  # Save with User link
        else:
            serializer.save()  # Save as Guest
        return serializer, True

    return serializer, False
