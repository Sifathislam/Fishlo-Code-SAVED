import { useEffect, useRef, useState } from "react";
import useAuth from "../../hooks/useAuth";
import useStateHooks from "../../shared/hooks/useStateHooks";

const MEENA_TAI_RESPONSES = {
  aggressive: [
    "Arre beta, itni mehngai mein ₹600? Nuksan karwaoge kya?",
    "Itne mein toh meri kharid bhi nahi hai! Thoda toh upar aao.",
    "Bas? Itne mein toh sirf barf aayegi! Quality dekho pehle.",
    "600 mein toh chote wale aate hai, ye Golda jumbo size hai!",
    "Market mein ghoom lo, itna fresh maal kahin nahi milega.",
    "Beta, export quality hai, thoda toh socho!",
    "Aaj ki pakad kam hai, isliye bhav thoda tight hai.",
    "Isse sasta milega toh main dukan band kar dungi!",
  ],
  negotiating: [
    "Chalo, na tera na mera, ₹750 de dena. Par kisi ko bolna mat.",
    "Tum roz aate ho isliye maan rahi hoon. ₹720 last?",
    "Acha chalo, ₹10 aur kam kiye shagun ke liye. Ab toh le lo!",
    "Cleaning bhi kar ke dungi, uska charge nahi lungi. Deal?",
    "Agli baar aoge toh aur kam kar dungi, abhi itna rehne do.",
    "Kasam se, bahut nuksan ho raha hai mera itne kam mein.",
    "Thoda upar aao, ₹600 bahut kam hai beta.",
    "Mere purane grahak ho, isliye 700 kar deti hoon.",
  ],
  closing: [
    "Theek hai, ₹710 last. Isse ek rupaya kam nahi hoga.",
    "Ok baba, pack kar doon kya ₹710 mein?",
    "Ghar le jaoge toh yaad karoge ki Meena Tai ne kya maal diya tha.",
    "Chalo deal pakki kare? ₹740 mein done?",
    "Ye lo, ek piece extra daal diya. Ab khush?",
    "Pehla customer hai aaj ka, mana nahi karungi. ₹700 pakka!",
    "Chalo shagun kar dete hai, pack kar rahi hoon.",
    "Ziddi ho tum! Acha chalo, done.",
  ],
  general: [
    "Beta, ice wala maal nahi hai, seedha dock se aaya hai.",
    "Prawns ka size dekha hai? Ek dum jumbo hai!",
    "Mera bacha, thoda toh margin rehne de humare liye bhi.",
    "Pure Mumbai mein aisa rate nahi milega, guarantee hai.",
    "Dekho beta, bargaining apni jagah, quality apni jagah.",
    "Arre, dhaniya-mirchi free de dungi, rate mat todo.",
    "Baaki shop pe jao, woh log purana maal bech rahe hai.",
  ],
};

export default function BargainProductCard({ onClose, isOpen }) {
  const [sheetHeight, setSheetHeight] = useState(70);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi beta! Rawas fresh hai. Batao kya bhav chahiye?",
      sender: "ai",
    },
  ]);

  const scrollRef = useRef(null);

  const startY = useRef(0);
  const startHeight = useRef(0);
  const currentHeight = useRef(70);
  const { openLogin, setOpenLogin, setCartOpen } = useStateHooks();
  const { auth } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      // Use a slight timeout to ensure DOM has rendered new bubbles
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.touchAction = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !window.visualViewport) return;

    const handleViewportChange = () => {
      const heightDiff = window.innerHeight - window.visualViewport.height;
      const offset = heightDiff - window.visualViewport.offsetTop;

      const finalOffset = Math.max(offset, 0);
      document.documentElement.style.setProperty(
        "--keyboard-offset",
        `${finalOffset}px`,
      );

      setIsKeyboardOpen(finalOffset > 0);
    };

    // Listen to both resize and scroll to catch all viewport changes
    window.visualViewport.addEventListener("resize", handleViewportChange);
    window.visualViewport.addEventListener("scroll", handleViewportChange);

    // Initial check in case it's already in a state (unlikely but good practice)
    handleViewportChange();

    return () => {
      window.visualViewport.removeEventListener("resize", handleViewportChange);
      window.visualViewport.removeEventListener("scroll", handleViewportChange);
      document.documentElement.style.removeProperty("--keyboard-offset");
    };
  }, [isOpen]);

  const getTaiResponse = (text) => {
    const input = text.toLowerCase();
    let category = "general";

    if (
      input.includes("kam") ||
      input.includes("sasta") ||
      parseInt(input) < 700
    ) {
      category = "aggressive";
    } else if (
      input.includes("last") ||
      input.includes("rate") ||
      input.includes("final")
    ) {
      category = "negotiating";
    } else if (
      input.includes("pack") ||
      input.includes("done") ||
      input.includes("theek")
    ) {
      category = "closing";
    }

    const options = MEENA_TAI_RESPONSES[category];
    return options[Math.floor(Math.random() * options.length)];
  };

  const handleSendMessage = (text) => {
    if (!text.trim() || isTyping) return;

    const userMsg = { id: Date.now(), text, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate "Thinking"
    setTimeout(() => {
      setIsTyping(false);
      const aiMsg = {
        id: Date.now() + 1,
        text: getTaiResponse(text),
        sender: "ai",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1200);
  };

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    startHeight.current = currentHeight.current;
    setIsTransitioning(false); // Disable CSS transitions for instant drag response
  };

  const handleTouchMove = (e) => {
    const touchY = e.touches[0].clientY;
    const deltaY = startY.current - touchY;

    // Convert pixel movement to vh
    const deltaVh = (deltaY / window.innerHeight) * 100;
    let newHeight = startHeight.current + deltaVh;

    // Constraints
    if (newHeight > 100) newHeight = 100;
    if (newHeight < 20) newHeight = 20;

    currentHeight.current = newHeight;
    setSheetHeight(newHeight);
  };

  const handleTouchEnd = () => {
    setIsTransitioning(true);

    // Snap Logic
    if (currentHeight.current > 85) {
      setSheetHeight(100); // Snap to top
      currentHeight.current = 100;
    } else if (currentHeight.current < 50) {
      onClose();
      currentHeight.current = 70;
      setSheetHeight(70);
    } else {
      setSheetHeight(sheetHeight);
    }
  };


  return (
    <>
      <div className="chat-m-overlay" onClick={onClose} />
      <div
        className={`chat-m-root ${isTransitioning ? "sheet-transition" : ""} ${isKeyboardOpen ? "chat-m-open-keyboard" : ""}`}
        style={{ height: `${sheetHeight}vh` }}
      >
        {/* DRAG HANDLE - The user touches this to move the sheet */}
        <div
          className="drag-handle-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="drag-handle-bar"></div>
        </div>
        <div className="chat-m-phone">
          {/* Header */}
          <div
            className="chat-m-topbar"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="d-flex align-items-center gap-2">
              <img
                src="https://i.pravatar.cc/40?img=32"
                alt="Meena Tai"
                className="chat-m-avatar"
              />
              <div>
                <div className="d-flex align-items-center gap-1">
                  <span className="chat-m-title">Meena Tai</span>
                  <span className="chat-m-online">
                    <span className="chat-m-online-dot" />
                    <span className="chat-m-online-text">Online</span>
                  </span>
                </div>
                <div className="chat-m-subtitle">
                  Fishlo's Bargaining AI Assistant
                </div>
              </div>
            </div>
            <span onClick={onClose} className="chat-m-close">
              ✕
            </span>
          </div>

          {/* Product Image */}
          <div className="chat-m-main-content">
            {/* <img
              src={
                // product?.gallery?.find((item) => item.is_featured)?.image ||
                // "/Image/bargain.png"
              }
              alt="Golda Prawn"
              className="chat-m-bg-image"
            /> */}

            <div className="chat-m-message-area" ref={scrollRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-m-bubble chat-m-bubble-${msg.sender}`}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="chat-m-bubble chat-m-bubble-ai typing-dots">
                  <span>Meena Tai is typing</span>
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Card */}
          {/* <div className="chat-m-product-card">
            <div className="chat-m-product-header">
              <div
                className="chat-m-product-name"
                title="Golda Prawn Large Size Fresh Catch"
              >
                {product?.name}
              </div>
              <div className="chat-m-price">₹{product?.display_price}</div>
            </div>

            <div className="chat-m-quick-actions">
              <button
                className="chat-m-quick-btn"
                onClick={() => setInputValue("₹10 kam")}
              >
                ₹10 kam
              </button>
              <button
                className="chat-m-quick-btn"
                onClick={() => setInputValue("Last rate?")}
              >
                Last rate?
              </button>
              <button
                className="chat-m-quick-btn"
                onClick={() => setInputValue("Bulk order chahiye")}
              >
                Bulk khayega?
              </button>
            </div>
          </div> */}

          {/* Input */}
          {(auth?.authToken) ? (
            <div className="chat-m-input">
              <input
                type="text"
                className="chat-m-input-box"
                placeholder="Type here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSendMessage(inputValue)
                }
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                inputMode="search"
              />
              <button
                className="chat-m-send-btn"
                onClick={() => handleSendMessage(inputValue)}
              >
                ➤
              </button>
            </div>
          ) : (
            <div className="chat-m-input">
              <button
                className="chat-m-input-box"
                onClick={() => {
                  setOpenLogin(true);
                  onClose(); // Added parentheses to actually call the function
                }}
              >
                Login to Bargain
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
