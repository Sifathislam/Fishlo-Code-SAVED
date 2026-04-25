import React, { useMemo } from "react";

export default function VolumeHeatmap({ heatmap }) {
  const maxHeatmapVal = useMemo(() => {
    if (!heatmap?.grid?.length) return 1;
    const allVals = heatmap.grid.flatMap((row) => row.values);
    return Math.max(...allVals, 1);
  }, [heatmap]);

  if (!heatmap || !heatmap.grid || heatmap.grid.length === 0) return null;

  return (
    <div className="sd-table-card p-4 h-100">
      <h5 className="fw-medium mb-4">Store Volume Heatmap</h5>
      <div className="table-responsive">
        <table className="table table-borderless text-center w-100 align-middle">
          <thead>
            <tr>
              <th className="text-muted fw-normal small">Hr/Day</th>
              {heatmap.days.map((d, i) => (
                <th
                  key={i}
                  className="fw-medium text-secondary text-uppercase small"
                  style={{ fontSize: "0.7rem" }}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.grid.map((row) => (
              <tr key={row.hour}>
                <td
                  className="fw-medium text-muted small text-end pe-2"
                  style={{ fontSize: "0.75rem" }}
                >
                  {row.hour}
                </td>
                {row.values.map((val, cidx) => {
                  const opacity = val / maxHeatmapVal;
                  return (
                    <td key={cidx} className="p-1">
                      <div
                        className="rounded"
                        title={`${val} orders`}
                        style={{
                          height: "24px",
                          background: `rgba(215, 87, 76, ${
                            opacity < 0.1 ? 0.05 : opacity
                          })`,
                        }}
                      ></div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-between small text-muted mt-3">
          <span>Low</span>
          <div
            style={{
              height: 4,
              width: 50,
              background:
                "linear-gradient(to right, rgba(215,87,76,0.1), rgba(215,87,76,1))",
              borderRadius: 2,
            }}
          ></div>
          <span>Peak</span>
        </div>
      </div>
    </div>
  );
}
