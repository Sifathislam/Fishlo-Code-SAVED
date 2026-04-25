import { MessageCircle } from "lucide-react";
import { useState } from "react";
import BargainProductCard from "./BargainProductCard";
import BargainChatbox from "./ChatBox";

export default function CheckoutChatBox() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sp-shop-sidebar d-none d-lg-block m-t-991">
        <div id="shop_sidebar">
          <BargainChatbox />
        </div>
      </div>

      {/* Mobile Chatbox */}
      <div className="d-block d-lg-none">
        {/* Overlay (click outside does nothing) */}
        <div className={`mobile-chatbox-overlay ${isOpen ? "open" : ""}`}>
          {isOpen && (
            <BargainProductCard
              isMobile={true}
              onClose={() => setIsOpen(false)}
              isOpen={isOpen}
            />
          )}
        </div>

        {/* Floating Button */}

        <button type="button" className="chat-float-btn" onClick={() => setIsOpen(!isOpen)}>
          <MessageCircle size={24} />
        </button>
      </div>
    </>
  );
}
