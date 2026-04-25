import re
from dataclasses import dataclass
from typing import List, Dict
from .helpers.ai_classifier import classify_message_safety


@dataclass
class IntentResult:
    """Result of intent analysis"""
    intent: str  # BARGAIN, BROWSE, ABUSE, TIMEPASS, INQUIRY
    confidence: float  # 0.0 to 1.0
    action: str  # CONTINUE, WARN, BLOCK, EXIT, SHOW_PRODUCTS, CLARIFY
    reason: str  # Why this intent was chosen


class IntentClassifier:

    # Abuse patterns
    ABUSE_PATTERNS = [
        r'\b(chut\w*|bhen?ch\w*|madarch\w*|gand\w*|lund\w*|randi\w*|chinaal\w*|bosdike\w*)\b',
        r'\b(fuck\w*|shit\w*|bitch\w*|asshole\w*|bastard\w*)\b',
    ]

    SEXUAL_PATTERNS = [
        r'\b(sex|sexy|boobs?|nude|naked|horny|kiss|bed|chumma|body|hot)\b',
        r'\b(lund|come home|come with me|sleep with me)\b',
    ]

    # Browsing patterns 
    BROWSE_PATTERNS = [
        r'\b(aur kya|kya kya|what else|other|dusri|doosri)\b.*\b(hai|fish|machli|machhli)\b',
        r'\b(kuch aur|menu|list|dikha|show|options)\b',
        r'\b(aur kon|kaun|which)\b.*\b(fish|machli|machhli)\b',
    ]

    # Time-pass patterns (testing AI, not serious)
    TIMEPASS_PATTERNS = [
        r'\b(tum kon|kaun|who are you|real|fake|AI|bot|chatbot|robot)\b',
        r'\b(masti|mazak|joke|funny|test|testing|check)\b',
        r'\b(sup|wassup)\b$',  # Just greetings without context
    ]

    # Inquiry patterns (genuine questions about product)
    INQUIRY_PATTERNS = [
        r'\b(fresh|taza|taaza|quality|kaisa|kaise)\b',
        r'\b(kab aayi|when|timing|available)\b',
        r'\b(bones|kaante|katne)\b',
    ]

    def __init__(self):
        # Compile regex patterns for performance
        self.abuse_regex = [re.compile(p, re.IGNORECASE) for p in self.ABUSE_PATTERNS]
        self.browse_regex = [re.compile(p, re.IGNORECASE) for p in self.BROWSE_PATTERNS]
        self.timepass_regex = [re.compile(p, re.IGNORECASE) for p in self.TIMEPASS_PATTERNS]
        self.inquiry_regex = [re.compile(p, re.IGNORECASE) for p in self.INQUIRY_PATTERNS]
        self.sexual_regex = [re.compile(p, re.IGNORECASE) for p in self.SEXUAL_PATTERNS]

    def analyze(self, user_text: str, conversation_history=None, bargain_turn_count: int = 0, abuse_count: int = 0):
        text = (user_text or "").strip().lower()
        
        if not text:
            return IntentResult("EMPTY", 1.0, "CONTINUE", "Empty message")

        if abuse_count >= 2:
            return IntentResult("ABUSE", 1.0, "BLOCK", "Session already blocked")

        # 1) ABUSE (highest priority)
        for pattern in self.abuse_regex:
            print('000000000')
            if pattern.search(text):
                # Let AI confirm if it is actual abuse or just emotional speech
                ai_result = classify_message_safety(text)
                print('a_result here==>', ai_result)
                if ai_result["label"] == "ABUSE":
                    action = "BLOCK" if abuse_count + 1 >= 2 else "WARN"
                    return IntentResult("ABUSE", 0.95, action, "AI confirmed abusive language")
                # If not true abuse → continue normal classification
                break

        # 1a) SEXUAL / INAPPROPRIATE
        for pattern in self.sexual_regex:
            if pattern.search(text):
                action = "BLOCK" if abuse_count + 1 >= 2 else "WARN"
                return IntentResult("ABUSE", 0.95, action, "Sexual/inappropriate content detected")
            
        # 2) BROWSE intent
        for pattern in self.browse_regex:
            if pattern.search(text):
                return IntentResult("BROWSE", 0.85, "SHOW_PRODUCTS", "User asking about other products")

        # 3) TIMEPASS intent
        timepass_score = 0.0
        reasons = []

        for pattern in self.timepass_regex:
            if pattern.search(text):
                timepass_score += 0.4
                reasons.append("Testing/curiosity pattern")

        if bargain_turn_count > 10 and not self._has_bargaining_intent(text):
            timepass_score += 0.4
            reasons.append("Long conversation without price discussion")

        if timepass_score >= 0.6:
            print('timepass score==>', timepass_score)
            action = "GENTLE_EXIT" if bargain_turn_count < 8 else "FIRM_EXIT"
            return IntentResult("TIMEPASS", min(timepass_score, 0.95), action, "; ".join(reasons))
        
        # 4) INQUIRY intent
        for pattern in self.inquiry_regex:
            if pattern.search(text):
                return IntentResult("INQUIRY", 0.75, "CONTINUE", "Asking about product quality/details")
        
        # 5) BARGAIN intent
        if self._has_bargaining_intent(text):
            return IntentResult("BARGAIN", 0.70, "CONTINUE", "Bargaining keywords found")
        
        if re.fullmatch(r"(hi+|hey+|hello+)", text):
            return IntentResult("INQUIRY", 0.8, "CONTINUE", "Simple greeting")

        # AI Moderation Layer (only if regex did not catch anything)
        ai_result = classify_message_safety(text)
        print('ai_result==>', ai_result)
        if ai_result["label"] in ["SEXUAL", "HARASSMENT"]:
            action = "BLOCK" if abuse_count + 1 >= 2 else "WARN"
            return IntentResult("ABUSE", 0.95, action, "AI detected inappropriate content")

        if ai_result["label"] == "ABUSE":
            action = "BLOCK" if abuse_count + 1 >= 2 else "WARN"
            return IntentResult("ABUSE", 0.98, action, "AI detected abusive content")

        if ai_result["label"] == "TIMEPASS":
            print('------111111------')
            return IntentResult("TIMEPASS", 0.80, "CONTINUE", "Casual conversation")

        # 6) Fallback
        return IntentResult("UNKNOWN", 0.45, "CLARIFY", "No clear intent")


    def _has_bargaining_intent(self, text: str) -> bool:
        """Check if text contains bargaining keywords"""
        bargain_keywords = [
            "price","rate","kitne","kitna","kithne","kithna","bhav","daam",
            "rs","rupee","rupaye","₹","inr","kam","discount","sasta",
            "kg","kilo","gram","kharid","buy","dunga","last","dungi","final"
            ]
        return any(keyword in text for keyword in bargain_keywords)


# Singleton instance
classifier = IntentClassifier()