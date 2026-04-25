import { useEffect, useState } from "react";
import { useGetManualReceipt } from "../../../features/useStoreReceipts";
import ReceiptModal from "./ReceiptModal";

const GlobalReceiptPrinter = () => {
  const [printData, setPrintData] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const getManualReceiptMutation = useGetManualReceipt();

  useEffect(() => {
    const handlePrintReceiptEvent = async (e) => {
      const orderNumber = e.detail?.orderNumber;
      if (!orderNumber) return;

      try {
        const res = await getManualReceiptMutation.mutateAsync({ orderNumber });

        if (res?.success) {
          const receiptData = {
            staff: res.staff_receipt || "",
            customer: res.customer_receipt || res.receipt || ""
          };

          // Use the unified ReceiptModal for silent printing
          setPrintData(receiptData);
          setShowFallback(true);
        }
      } catch (error) {
        console.error("Failed to auto-fetch receipt for printing", error);
      }
    };

    window.addEventListener("printStoreReceipt", handlePrintReceiptEvent);
    return () => {
      window.removeEventListener("printStoreReceipt", handlePrintReceiptEvent);
    };
  }, [getManualReceiptMutation]);

  return (
    <>
      {showFallback && printData && (
        <ReceiptModal
          show={true}
          onClose={() => {
            setPrintData(null);
            setShowFallback(false);
          }}
          receiptData={printData}
          isSilent={true}
          autoPrint={true}
        />
      )}
    </>
  );
};

export default GlobalReceiptPrinter;
