import { useGetPolicy } from "../../features/useGetPolicy";
import Loader from "../../shared/components/Loader";

const WhyPricesPage = () => {
  const { data: prices, isLoading, isError, error } = useGetPolicy("prices");

  return (
    <div className="terms-content-wrapper">
      {isLoading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px", width: "100%" }}
        >
          <Loader />
        </div>
      ) : isError || !prices || prices.length === 0 ? (
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
            {prices?.[0]?.content && (
              <div
                className="policy-section-block"
                dangerouslySetInnerHTML={{ __html: prices[0].content }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhyPricesPage;
