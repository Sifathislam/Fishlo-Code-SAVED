from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

@dataclass
class BargainState:
    session_id: str

    bargain_turn_count: int = 0
    non_serious_turn_count: int = 0
    # intent_score: int = 50

    last_user_offer: Optional[Decimal] = None
    repeat_offer_count: int = 0
    initial_cart_total: Optional[Decimal] = None
    current_counter_total: Optional[Decimal] = None

    # walk_away_attempted: bool = False
    # extra_used: bool = False

    abuse_count: int = 0
    is_blocked: bool = False

    status: str = "active"  # active | ended | closed




_BARGAIN_STATE = {}
def get_or_create_bargain_state(session):
    key = str(session.id)

    if key not in _BARGAIN_STATE:
        _BARGAIN_STATE[key] = BargainState(
            session_id=session.id,
        )

    return _BARGAIN_STATE[key]



def reset_bargain_state(session):
    key = f"{session.id}"

    if key in _BARGAIN_STATE:
        del _BARGAIN_STATE[key]


def save_bargain_state(state):
    key = str(state.session_id)
    _BARGAIN_STATE[key] = state
