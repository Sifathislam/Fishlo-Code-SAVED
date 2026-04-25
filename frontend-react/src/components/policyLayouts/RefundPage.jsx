import { useGetPolicy } from "../../features/useGetPolicy";
import Loader from "../../shared/components/Loader";

const RefundPage = () => {
  const { data: refund, isLoading, isError, error } = useGetPolicy("refund");

  return (
    <div className="terms-content-wrapper">
      {isLoading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px", width: "100%" }}
        >
          <Loader />
        </div>
      ) : isError || !refund || refund.length === 0 ? (
        <div
          className="d-flex flex-column justify-content-center align-items-center text-center"
          style={{ minHeight: "400px", width: "100%" }}
        >
          <h4 className="text-muted mb-2">No data found</h4>
          {isError && (
            <p className="text-danger small">
              {error?.message || "Unable to load pricing policy."}
            </p>
          )}
        </div>
      ) : (
        <div className="policy-card">
          <div className="card-body">
            {refund?.[0]?.content && (
              <div
                className="policy-section-block"
                dangerouslySetInnerHTML={{ __html: refund[0].content }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundPage;
