import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQZ } from "../../../providers/QZProvider";

const ReceiptModal = ({ show, onClose, receiptData, isSilent = false, autoPrint = false }) => {
  const [printStep, setPrintStep] = useState("IDLE"); // IDLE, CUSTOMER, STAFF
  const { isConnected, printer, printRaw } = useQZ();
  const [isQZPrinting, setIsQZPrinting] = useState(false);

  const [localSilent, setLocalSilent] = useState(isSilent);
  const [hasAttemptedSilent, setHasAttemptedSilent] = useState(false);

  // Helper: is QZ Tray ready for printing?
  const isQZReady = isConnected && printer;

  // Build raw text content for ESC/POS thermal printing
  const buildRawText = useCallback(() => {
    if (!receiptData) return "";
    let text = "";
    if (receiptData.customer) {
      text += receiptData.customer;
    }
    if (receiptData.staff) {
      if (text) text += "\n\n" + "=".repeat(32) + "\n\n";
      text += receiptData.staff;
    }
    return text;
  }, [receiptData]);

  // Effect 1: Initialize print flow on modal open
  // Only set printStep for browser printing when QZ is NOT available
  useEffect(() => {
    if (show && receiptData) {
      setLocalSilent(isSilent);
      setHasAttemptedSilent(false);

      // ONLY trigger browser print flow if QZ is NOT available
      // When QZ IS available, the silent print effect (Effect 2) handles everything
      if (!isQZReady) {
        if (receiptData.customer) {
          setPrintStep("CUSTOMER");
        } else if (receiptData.staff) {
          setPrintStep("STAFF");
        }
      } else {
        // QZ is ready — ensure printStep stays IDLE (no browser print)
        setPrintStep("IDLE");
      }
    } else {
      setPrintStep("IDLE");
    }
  }, [show, receiptData, isSilent, isQZReady]);

  // Effect 2: Automatic Silent Print via QZ Tray
  useEffect(() => {
    const triggerSilentPrint = async () => {
      const shouldSilent = localSilent || autoPrint;
      if (show && shouldSilent && !hasAttemptedSilent && isQZReady && receiptData) {
        setHasAttemptedSilent(true);
        try {
          await printRaw(buildRawText());
          // Only close automatically if it's fully silent (background mode)
          if (localSilent && onClose) onClose();
        } catch (err) {
          console.error("Auto Silent Print failed, showing modal", err);
          setLocalSilent(false); // Show UI so user can print manually
        }
      } else if (show && shouldSilent && !isQZReady) {
        // Fallback immediately if QZ not connected — browser print will handle it
        setLocalSilent(false);
      }
    };

    triggerSilentPrint();
  }, [show, localSilent, autoPrint, hasAttemptedSilent, isQZReady, receiptData, printRaw, onClose, buildRawText]);

  // Effect 3: Browser window.print() — ONLY when QZ is NOT available
  useEffect(() => {
    if (printStep === "IDLE") return;

    // GUARD: Never call window.print if QZ is connected
    if (localSilent || isQZReady) {
      // QZ became available after printStep was set — reset to IDLE
      setPrintStep("IDLE");
      return;
    }

    const handleAfterPrint = () => {
      if (printStep === "CUSTOMER" && receiptData.staff) {
        setPrintStep("STAFF");
      } else {
        setPrintStep("IDLE");
        if (localSilent && onClose) onClose();
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);

    const timer = setTimeout(() => {
      window.print();
    }, 300);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printStep, receiptData, localSilent, onClose, isQZReady]);

  if (!show || !receiptData) return null;

  // Unified print handler — uses QZ if available, falls back to browser print
  const handlePrintClick = async () => {
    if (isQZReady) {
      // Always use QZ when connected
      setIsQZPrinting(true);
      try {
        await printRaw(buildRawText());
        if (onClose) onClose();
      } catch (err) {
        console.error("QZ Print failed", err);
      } finally {
        setIsQZPrinting(false);
      }
    } else {
      // Fallback to browser print
      if (receiptData.customer) {
        setPrintStep("CUSTOMER");
      } else if (receiptData.staff) {
        setPrintStep("STAFF");
      }
    }
  };

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center print-overlay"
      style={{
        zIndex: 10070,
        background: isSilent ? "transparent" : "rgba(0,0,0,0.5)",
        backdropFilter: isSilent ? "none" : "blur(4px)",
        visibility: isSilent ? "hidden" : "visible",
        pointerEvents: isSilent ? "none" : "auto",
      }}
    >
      <style>
        {`
          @media print {
            @page {
              size: auto;
              margin: 0mm;
            }
            html, body {
              visibility: visible !important;
              height: auto !important;
              overflow: visible !important;
              background: white !important;
            }
            
            #root {
              display: none !important;
            }

            .print-overlay {
              visibility: visible !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: auto !important;
              background: white !important;
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .print-content {
              visibility: visible !important;
              position: static !important;
              width: 100% !important;
              max-width: none !important;
              max-height: none !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              overflow: visible !important;
              display: block !important;
            }

            .print-content * {
              visibility: visible !important;
            }

            .print-content .overflow-auto {
              overflow: visible !important;
              max-height: none !important;
              height: auto !important;
            }
            
            .receipt-text {
                white-space: pre !important;
                font-size: 12px !important;
                line-height: 1.2 !important;
                margin: 0 !important;
                text-align: left !important;
            }

            .no-print {
                display: none !important;
            }

            /* Hide copies based on current print step */
            .customer-copy-section {
                display: ${printStep === "CUSTOMER" ? "block" : "none"} !important;
            }
            .staff-copy-section {
                display: ${printStep === "STAFF" ? "block" : "none"} !important;
            }
          }
        `}
      </style>
      <div
        className="bg-white rounded-4 shadow-lg p-0 overflow-hidden animate-zoom-in d-flex flex-column print-content"
        style={{ width: "90%", maxWidth: "400px", maxHeight: "90vh" }}
      >
        {!isSilent && (
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light no-print">
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-medium m-0 text-dark">Order Receipt</h6>
              {isQZReady && (
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small">
                  <i className="bi bi-check-circle-fill me-1"></i> QZ Ready
                </span>
              )}
            </div>
            <button className="btn-close" onClick={onClose}></button>
          </div>
        )}

        <div className="p-4 overflow-auto custom-scrollbar">
          {receiptData?.customer && (
            <div className="customer-copy-section text-center">
              <div className="receipt-section" style={{ display: "flex", justifyContent: "center", paddingTop: "10px" }}>
                <pre
                  className="receipt-text"
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    whiteSpace: "pre",
                    fontSize: "12px",
                    lineHeight: "1.2",
                    margin: "0",
                    textAlign: "left",
                    width: "fit-content",
                  }}
                >
                  {receiptData.customer}
                </pre>
              </div>
            </div>
          )}

          {receiptData?.staff && (
            <div className="staff-copy-section text-center">
              <div className="receipt-section" style={{ paddingTop: "20px", display: "flex", justifyContent: "center" }}>
                <pre
                  className="receipt-text"
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    whiteSpace: "pre",
                    fontSize: "12px",
                    lineHeight: "1.2",
                    margin: "0",
                    textAlign: "left",
                    width: "fit-content",
                  }}
                >
                  {receiptData.staff}
                </pre>
              </div>
            </div>
          )}
        </div>

        {!isSilent && (
          <div className="p-3 border-top bg-light no-print d-flex gap-2">
            <button
              className="btn btn-light w-25 border fw-medium"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className={`btn sd-btn-primary w-75 fw-${isQZReady ? 'bold' : 'medium'} shadow-soft`}
              onClick={handlePrintClick}
              disabled={isQZPrinting}
            >
              <i className={`bi bi-printer${isQZReady ? '-fill' : ''} me-2`}></i>
              {isQZPrinting ? "Printing..." : isQZReady ? "Print (QZ)" : "Print"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default ReceiptModal;
