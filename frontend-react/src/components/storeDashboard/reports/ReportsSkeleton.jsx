export default function ReportsSkeleton() {
  return (
    <div className="placeholder-glow">
      {/* HERO METRICS SKELETON */}
      <div className="row g-4 mb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`col-lg-4 ${i === 3 ? "col-md-12" : "col-md-6"}`}
          >
            <div className="sd-brand-card p-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="placeholder rounded"
                  style={{ width: "56px", height: "56px" }}
                ></div>
                <div className="flex-grow-1">
                  <div className="placeholder col-6 mb-2 rounded"></div>
                  <div className="placeholder col-8 h3 mb-0 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SALES & REVENUE SKELETON */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="sd-table-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="placeholder col-4 rounded"></div>
              <div className="placeholder col-2 rounded"></div>
            </div>
            <div
              className="placeholder w-100 rounded"
              style={{ height: "320px" }}
            ></div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="sd-table-card p-4 h-100">
            <div className="placeholder col-6 mb-4 rounded"></div>
            <div
              className="placeholder rounded-circle mx-auto d-block"
              style={{ width: "160px", height: "160px" }}
            ></div>
            <div className="mt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="d-flex justify-content-between mb-3"
                >
                  <div className="placeholder col-4 rounded"></div>
                  <div className="placeholder col-2 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS & CUSTOMERS SKELETON */}
      <div className="row g-4">
        {[1, 2].map((i) => (
          <div key={i} className="col-lg-6">
            <div className="sd-table-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="placeholder col-5 rounded"></div>
                <div className="placeholder col-2 rounded"></div>
              </div>
              <div className="table-responsive">
                <table className="table table-borderless">
                  <thead>
                    <tr>
                      <th><div className="placeholder col-8 rounded"></div></th>
                      <th><div className="placeholder col-8 rounded"></div></th>
                      <th><div className="placeholder col-8 rounded"></div></th>
                      <th><div className="placeholder col-8 rounded"></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((j) => (
                      <tr key={j}>
                        <td className="py-3"><div className="placeholder col-10 rounded"></div></td>
                        <td><div className="placeholder col-6 rounded"></div></td>
                        <td><div className="placeholder col-8 rounded"></div></td>
                        <td><div className="placeholder col-4 rounded"></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
