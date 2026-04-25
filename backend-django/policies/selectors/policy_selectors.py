from ..models import PolicyPage, FAQ


def get_policy_page_by_slug(slug: str) -> PolicyPage:
    return PolicyPage.objects.get(slug=slug)


def get_active_faqs():
    return FAQ.objects.filter(is_active=True).order_by('priority')
