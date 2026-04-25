import { EllipsisVertical, Lightbulb, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../shared/api";
import useAuth from "../../hooks/useAuth";
import useStateHooks from "../../shared/hooks/useStateHooks";


function BargainChatbox({ isMobile, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const messagesEndRef = useRef(null);
  const { auth } = useAuth();
  const { openLogin, setOpenLogin, setCartOpen } = useStateHooks();
  const [showMenu, setShowMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [finalPrice, setFinalPrice] = useState(null);
  const [isCountering, setIsCountering] = useState(false);
  
  // Check active sessions on load
  useEffect(() => {
    if (!auth?.authToken ) return;

    const checkActiveSession = async () => {
      try {
        const response = await api.get(
          `/chat/sessions/active/`,
          {
            headers: {
              Authorization: `Bearer ${auth.authToken}`,
            },
          }
        );

        const data = response.data;

        if (!data?.session_id) return;

        const formattedMessages = (data.messages || []).map((m) => {
          // Handle both old string format and new structured format
          const content =
            typeof m.text === "string"
              ? { reply: m.text }
              : m.text || {};

          return {
            id: m.id,
            text: content.reply || "",
            sender: m.role === "USER" ? "user" : "ai",
            timestamp: m.created_at
              ? new Date(m.created_at)
              : new Date(),

            // Structured metadata
            messageType: content.message_type || null,
            offerDetails: content.offer_details || null,
            ui: content.ui || {},
            isInitialOffer: content.is_initial_offer || false,
          };
        });

        setSessionId(data.session_id);
        setMessages(formattedMessages);
        setHasStarted(true);

      } catch (error) {
        console.error(
          "Failed to load session:",
          error.response?.data || error.message
        );
      }
    };

    checkActiveSession();
  }, [auth?.authToken]);


  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;
    if (!sessionId) return;

    const userText = inputMessage;

    const newUserMessage = {
      id: `${Date.now()}-${Math.random()}`,
      text: userText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage("");

    try {
      const response = await api.post("/chat/messages/",{
          session_id: sessionId,
          message: userText,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.authToken}`,
          },
        }
      );

      const data = response.data;

      const aiMessage = {
        id: `${Date.now()}-${Math.random()}-ai`,
        text: data.reply,  // ✅ ONLY reply string
        sender: "ai",
        timestamp: new Date(),
        messageType: data.message_type,
        offerDetails: data.offer_details,
        ui: data.ui,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (data.session_status === "closed") {
        setIsClosed(true);
        setFinalPrice(data.offer_details?.agreed_price || null);
      }

    } catch (error) {
      console.error(
        "Message failed:",
        error.response?.data || error.message
      );
    }
  };


const handleStartBargaining = async () => {
    if (!auth?.authToken) return;
    
    try {
      setIsStarting(true);

      setIsClosed(false);
      setIsCountering(false);
      setFinalPrice(null);
      setMessages([]);

      const response = await api.post("/chat/sessions/",{
          device_type: "WEB",
        },
        {
          headers: {
            Authorization: `Bearer ${auth.authToken}`,
          },
        }
      );

      setSessionId(response.data.session_id);
      setHasStarted(true);

      if (response.data.initial_message) {
        const initial = response.data.initial_message;

        const aiMessage = {
          id: `${Date.now()}-initial`,
          text: initial.reply,
          sender: "ai",
          timestamp: new Date(),
          messageType: initial.message_type,
          offerDetails: initial.offer_details,
          ui: initial.ui || {},
          isInitialOffer: initial.is_initial_offer || false,
        };

        setMessages([aiMessage]);
      }

    } catch (error) {
      console.error(
        "Start bargaining failed:",
        error.response?.data || error.message
      );
    } finally {
      setIsStarting(false);
    }
  };


  const handleEndChat = async () => {
    await api.post("/chat/sessions/end/", { session_id: sessionId });
    setHasStarted(false);
    setSessionId(null);
    setMessages([]);
    setShowMenu(false);
  };



  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);


  const lastMessage = messages[messages.length - 1];
  const isOfferActive =
  lastMessage &&
  lastMessage.sender === "ai" &&
  lastMessage.offerDetails?.counter_total &&
  !isClosed &&
  !isCountering;


  

  return (
    <div className="p-0 ai-chat-ultra">
      <div className="aiu-card">
        <div className="aiu-header">
          <div className="aiu-left">
            <div className="aiu-avatar">
              <img src="/marketing/bargain-bot.png" alt="AI Fisherwoman" />
            </div>
            <div>
              <div className="aiu-title">Meena Tai</div>
              <div className="aiu-subtitle">
                Fishlo’s AI Bargaining Assistant
              </div>
            </div>
          </div>

          <div className="aiu-header-actions">
            <div className="aiu-badge">
              <span className="aiu-dot" /> Online
            </div>

            {/* Three Dots Menu */}
            {hasStarted && (
              <div className="aiu-menu">
                <button
                  type="button"
                  className="aiu-menu-btn"
                  onClick={() => setShowMenu((prev) => !prev)}
                >
                <EllipsisVertical strokeWidth={1} />
                </button>

                {showMenu && (
                  <div className="aiu-menu-dropdown">
                    <button type="button" onClick={handleEndChat}>
                      End Bargain
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Close button only visible on mobile */}
            {isMobile && (
              <button type="button" onClick={onClose} className="aiu-close-btn">
                <X size={20} />
              </button>
            )}
          </div>

        </div>

        <div className="aiu-body">

        {!hasStarted ? (
          <div className="aiu-start text-center p-4">
            <p className="mb-3">
              💬 Want a better price? <br />Negotiate directly with Meena Tai.
            </p>

            {(auth?.authToken) ? (
              <button
                type="button"
                className="btn accent-gradient text-light"
                onClick={handleStartBargaining}
                disabled={isStarting}
              >
                {isStarting ? "Starting..." : "Start Bargaining"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => setOpenLogin(true)}
              >
                Login to Bargain
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="aiu-messages" ref={messagesEndRef}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`aiu-row ${message.sender === "user" ? "is-user" : "is-ai"}`}
                >
                  <div
                    className={`aiu-bubble ${message.sender === "user" ? "bubble-user" : "bubble-ai"}`}
                  >
                    <div className="aiu-text">{message.text}</div>

                      {/* ACCEPTED OFFER */}
                      {message.messageType === "ACCEPTED" && message.offerDetails?.agreed_price && (
                        <div className="aiu-final-offer">
                          ✅ Final Price: ₹ {message.offerDetails.agreed_price}
                        </div>
                      )}



                    {message.timestamp && (
                      <div className="aiu-time">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* QUICK BUTTONS */}
            <div className="aiu-quick">
              <button
                type="button"
                className="aiu-chip"
                onClick={() => setInputMessage("₹10 less please")}
              >
                ₹10 less
              </button>
              <button
                type="button"
                className="aiu-chip"
                onClick={() => setInputMessage("If I add 500g, can you reduce?")}
              >
                Add more & reduce
              </button>
              <button
                type="button"
                className="aiu-chip"
                onClick={() => setInputMessage("Last kithna?")}
              >
                Last kithna?
              </button>
            </div>

            {isClosed && (
              <div className="aiu-closed-box">
                <div className="closed-title">🛑 Bargain Ended</div>

                {finalPrice && (
                  <div className="closed-price">
                    Final Price: ₹ {finalPrice}
                  </div>
                )}

                <div className="closed-actions">
                  <button
                    type="button"
                    className="btn btn-dark ms-2"
                    onClick={() => {
                      setMessages([]);
                      setSessionId(null);
                      setHasStarted(false);
                      setIsClosed(false);
                    }}
                  >
                    Start New Bargain
                  </button>
                </div>
              </div>
            )}

            {/* INPUT TEXT */}
            {!isClosed && (
              isOfferActive ? (
                <div className="aiu-offer-actions">
                  <div className="offer-amount text-green fw-bold">
                    ₹ {lastMessage.offerDetails.counter_total}
                  </div>

                  <button
                    type="button"
                    className="btn accent-gradient text-light"
                    onClick={() =>
                      handleAcceptOffer(lastMessage.offerDetails.counter_total)
                    }
                  >
                    Accept Offer
                  </button>

                  <button
                    type="button"
                    className="btn btn-light text-dark ms-2"
                    onClick={() => {
                      setIsCountering(true);
                      setInputMessage("");
                    }}
                  >
                    Counter
                  </button>
                </div>
              ) : (
                <div className="aiu-inputWrap">
                  <input
                    type="text"
                    className="aiu-input"
                    placeholder="Write here"
                    value={inputMessage}
                    disabled={!sessionId}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    className="aiu-send"
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!sessionId}
                  >
                    <Send size={16} />
                  </button>
                </div>
              )
            )}
          </>
        )}

        <div className="aiu-hint">
          <Lightbulb strokeWidth={2} size={20} color="#E4645A" />
          Tip: Polite offers and bulk quantities often get better prices.
        </div>
</div>

      </div>
    </div>
  );
}



export default BargainChatbox;
