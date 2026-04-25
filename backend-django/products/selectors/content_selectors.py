from ..models import Source, WhatYouGet


def get_what_you_get_queryset(product_id):
    return WhatYouGet.objects.filter(product_id=product_id)


def get_sources_queryset(product_id):
    return Source.objects.filter(product_id=product_id)
