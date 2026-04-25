import { useMemo, useState } from "react";
import { useProductList } from "../../features/useProduct";
import {
  useCreateInventory,
  useInventoryDetail,
  useInventoryHistory,
  useStoreInventoryList,
  useUpdateInventory,
} from "../../features/useStoreInventory";
import useDebounce from "../../shared/hooks/useDebounce";

const DEFAULT_LOCATION = "Store Warehouse";

import Skeleton from "react-loading-skeleton";
import DashboardPagination from "../dashboard/DashboardPagination";

// --- Component --- //

export default function StoreInventory() {
  document.title = "Inventory - Store Dashboard";
  // Inventory State
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Error State
  const [errors, setErrors] = useState({});

  const [blinkingRows, setBlinkingRows] = useState(new Set());

  // Modals
  const [activeModal, setActiveModal] = useState(null);

  // API Hooks
  const { data: inventoryData, isLoading: isInventoryLoading } =
    useStoreInventoryList({
      search: debouncedSearch,
      status: filterStatus,
      page: currentPage,
    });

  const { data: productsData } = useProductList(); // For Add Inventory dropdown

  const { mutate: createInventory, isPending: isCreating } =
    useCreateInventory();
  const { mutate: updateInventory, isPending: isUpdating } =
    useUpdateInventory();

  // History Hook (only fetch when modal is open and item selected)
  const { data: historyData, isLoading: isHistoryLoading } =
    useInventoryHistory(
      {
        search: selectedInventory?.sku,
      },
      {
        enabled: activeModal === "view-history" && !!selectedInventory,
      },
    );

  // Detail Hook (for Edit, to get min/max values if not in list)
  const { data: detailData } = useInventoryDetail(selectedInventory?.id, {
    enabled: activeModal === "edit-inv" && !!selectedInventory?.id,
  });

  // Merge selected inventory with detail data for editing
  const editingInventory = useMemo(() => {
    if (!selectedInventory) return null;
    if (detailData) return { ...selectedInventory, ...detailData };
    return selectedInventory;
  }, [selectedInventory, detailData]);

  // -- Render Helpers --
  const formatStockLog = (str) => {
    if (!str || typeof str !== 'string') return str;
    const match = str.match(/^([+-]?)(\d+(?:\.\d+)?)(.*)$/);
    if (match) {
      return `${match[1]}${parseFloat(match[2])}${match[3]}`;
    }
    return str;
  };

  const getStatusPill = (item) => {
    // Backend returns status string: OUT_OF_STOCK, LOW_STOCK, IN_STOCK
    const status = item.status;

    if (status === "OUT_OF_STOCK") {
      return (
        <span
          className="sd-pill"
          style={{ background: "#fef2f2", color: "#dc2626" }}
        >
          Out of Stock
        </span>
      );
    }
    if (status === "LOW_STOCK") {
      return (
        <span
          className="sd-pill"
          style={{ background: "#fffbeb", color: "#d97706" }}
        >
          Low Stock
        </span>
      );
    }
    return (
      <span
        className="sd-pill"
        style={{ background: "#f0fdf4", color: "#16a34a" }}
      >
        In Stock
      </span>
    );
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "RESTOCK":
        return (
          <i
            className="bi bi-box-seam text-white"
            style={{ fontSize: "0.9rem" }}
          ></i>
        );
      case "SALE":
        return (
          <i
            className="bi bi-cart-check text-white"
            style={{ fontSize: "0.9rem" }}
          ></i>
        );
      case "UPDATE":
        return (
          <i
            className="bi bi-pencil text-white"
            style={{ fontSize: "0.9rem" }}
          ></i>
        );
      case "ADJUSTMENT":
        return (
          <i
            className="bi bi-sliders text-white"
            style={{ fontSize: "0.9rem" }}
          ></i>
        );
      case "RETURN":
        return (
          <i
            className="bi bi-arrow-return-left text-white"
            style={{ fontSize: "0.9rem" }}
          ></i>
        );
      default:
        return (
          <i
            className="bi bi-circle text-white"
            style={{ fontSize: "0.9rem" }}
          ></i>
        );
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "RESTOCK":
        return "#198754";
      case "SALE":
        return "#ffc107";
      case "UPDATE":
        return "#0dcaf0";
      case "ADJUSTMENT":
        return "#6c757d";
      case "RETURN":
        return "#dc3545";
      default:
        return "#adb5bd";
    }
  };

  // -- Event Handlers --
  const closeModals = () => {
    setActiveModal(null);
    setSelectedInventory(null);
    setErrors({});
  };

  const openHistory = (item) => {
    setSelectedInventory(item);
    setActiveModal("view-history");
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      product_id: formData.get("product_id"),
      sku: formData.get("sku"),
      stock_kg: formData.get("stock_kg") || 0,
      stock_pieces: formData.get("stock_pieces") || 0,
      min_pieces_per_kg: formData.get("min_pieces_per_kg") || null,
      max_pieces_per_kg: formData.get("max_pieces_per_kg") || null,
      is_bargainable: formData.get("is_bargainable") === "on",
    };

    // Clean up empty strings to null
    if (!data.min_pieces_per_kg) delete data.min_pieces_per_kg;
    if (!data.max_pieces_per_kg) delete data.max_pieces_per_kg;

    createInventory(data, {
      onSuccess: () => {
        closeModals();
        setErrors({});
      },
      onError: (error) => {
        if (error.response && error.response.data) {
          setErrors(error.response.data);
        }
      },
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingInventory) return;

    const formData = new FormData(e.target);
    const data = {
      sku: formData.get("sku"),
      stock_kg: formData.get("stock_kg") || 0,
      stock_pieces: formData.get("stock_pieces") || 0,
      min_pieces_per_kg: formData.get("min_pieces_per_kg") || null,
      max_pieces_per_kg: formData.get("max_pieces_per_kg") || null,
      is_bargainable: formData.get("is_bargainable") === "on",
    };

    if (!data.min_pieces_per_kg) delete data.min_pieces_per_kg;
    if (!data.max_pieces_per_kg) delete data.max_pieces_per_kg;

    updateInventory(
      { id: editingInventory.id, data },
      {
        onSuccess: () => {
          closeModals();
          setErrors({});

          const updatedId = editingInventory.id;
          setBlinkingRows((prev) => {
            const next = new Set(prev);
            next.add(updatedId);
            return next;
          });
          setTimeout(() => {
            setBlinkingRows((prev) => {
              const next = new Set(prev);
              next.delete(updatedId);
              return next;
            });
          }, 2500);
        },
        onError: (error) => {
          if (error.response && error.response.data) {
            setErrors(error.response.data);
          }
        },
      },
    );
  };

  return (
    <div className="container-fluid p-0 fade-in">
      {/* Search & Filter Section */}
      <div className="sd-filter-container mb-4 justify-content-between w-100">
        <div className="d-flex align-items-center bg-white border rounded-pill px-3 py-2 shadow-sm sd-search-box">
          <i className="bi bi-search text-muted me-2"></i>
          <input
            type="text"
            className="border-0 bg-transparent w-100 text-dark"
            style={{ outline: "none", fontSize: "0.95rem" }}
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="d-flex gap-2 flex-wrap justify-content-between">
          <div className="sd-filter-bar flex-grow-1">
            <button
              className={`sd-filter-btn ${filterStatus === "ALL" ? "active" : ""}`}
              onClick={() => setFilterStatus("ALL")}
            >
              All Items
            </button>
            <div className="vr mx-1 bg-secondary opacity-25"></div>
            <button
              className={`sd-filter-btn ${filterStatus === "LOW_STOCK" ? "active" : ""}`}
              onClick={() => setFilterStatus("LOW_STOCK")}
            >
              Low Stock
            </button>
            <button
              className={`sd-filter-btn ${filterStatus === "OUT_OF_STOCK" ? "active" : ""}`}
              onClick={() => setFilterStatus("OUT_OF_STOCK")}
            >
              Out of Stock
            </button>
          </div>
          <button
            className="sd-btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setActiveModal("add-inv")}
          >
            <i className="bi bi-plus-lg"></i> Add Stock
          </button>
        </div>
      </div>

      <div className="sd-table-card">
        <div className="table-responsive">
          <table className="sd-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-center">Stock Level</th>
                <th>Status</th>
                <th className="text-center d-none d-md-table-cell">
                  Min/Max Pcs/Kg
                </th>
                <th className="text-center d-none d-md-table-cell">
                  Bargainable
                </th>
                <th className="text-end d-none d-lg-table-cell">
                  Last Updated
                </th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isInventoryLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="d-flex align-items-center">
                         <div className="me-3">
                           <Skeleton width={150} height={50} borderRadius={8} />
                         </div>
                        <div className="flex-grow-1">
                          <Skeleton width={120} />
                          <Skeleton width={80} />
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <Skeleton width={60} />
                      <Skeleton width={40} />
                    </td>
                    <td>
                      <Skeleton width={80} borderRadius={20} />
                    </td>
                    <td className="text-center d-none d-md-table-cell">
                      <Skeleton width={50} />
                    </td>
                    <td className="text-center d-none d-md-table-cell">
                      <Skeleton circle width={24} height={24} />
                    </td>
                    <td className="text-end d-none d-lg-table-cell">
                      <Skeleton width={100} />
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <Skeleton width={32} height={32} circle />
                        <Skeleton width={60} height={32} borderRadius={20} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : inventoryData?.results && inventoryData.results.length > 0 ? (
                inventoryData.results.map((item) => (
                  <tr
                    key={item.id}
                    className={`${blinkingRows.has(item.id) ? "row-blink-active" : ""} sd-hover-row`}
                  >
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-2 overflow-hidden me-3"
                          style={{
                            width: "150px",
                          
                            backgroundColor: "#f0f0f0",
                          }}
                        >
                          <img
                            src={item.product_image}
                            alt=""
                            className="w-100 h-100 object-fit-cover"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        </div>
                        <div>
                          <div
                            className="fw-medium text-dark"
                            style={{
                              maxWidth: "200px",
                              lineHeight: "1.2",
                              wordBreak: "break-word",
                            }}
                            title={item.product_name}
                          >
                            {item.product_name}
                          </div>
                          <div className="text-muted small">SKU: {item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="fw-medium text-dark">
                        {parseFloat(item.stock_kg)}{" "}
                        <small className="text-muted fw-normal">kg</small>
                      </div>
                      {item.stock_pieces > 0 && (
                        <div className="text-muted small">
                          {item.stock_pieces} pcs
                        </div>
                      )}
                    </td>
                    <td>{getStatusPill(item)}</td>
                    <td className="text-center d-none d-md-table-cell">
                      {item.min_max_display}
                    </td>
                    <td className="text-center d-none d-md-table-cell">
                      {item.is_bargainable ? (
                        <i className="bi bi-check-circle-fill text-success"></i>
                      ) : (
                        <i className="bi bi-dash-circle text-muted"></i>
                      )}
                    </td>
                    <td className="text-end text-muted small d-none d-lg-table-cell">
                      {new Date(item.last_updated).toLocaleString()}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-light border rounded-pill px-3 d-flex align-items-center justify-content-center pb-0"
                          style={{ height: "32px" }}
                          onClick={() => openHistory(item)}
                          title="History"
                        >
                          <i className="bi bi-clock"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                          onClick={() => {
                            setSelectedInventory(item);
                            setActiveModal("edit-inv");
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    No inventory found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isInventoryLoading && inventoryData?.count > 0 && (
        <DashboardPagination
          currentPage={currentPage}
          totalCount={inventoryData.count}
          pageSize={20}
          onPageChange={setCurrentPage}
        />
      )}

      {/* HISTORY MODAL */}
      {activeModal === "view-history" && selectedInventory && (
        <div className="sd-modal-overlay" style={{ zIndex: 2050 }}>
          <div
            className="sd-modal-container shadow-lg animate__animated animate__fadeInUp"
            style={{
              maxWidth: "600px",
              borderRadius: "24px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-white border-bottom d-flex align-items-center justify-content-between sticky-top">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                  <i className="bi bi-clock-history fs-5"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-medium text-dark">History Log</h5>
                  <p
                    className="mb-0 text-muted small"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Ref:{" "}
                    <span className="fw-medium">{selectedInventory.sku}</span>
                  </p>
                </div>
              </div>
              <button
                className="btn btn-light rounded-circle border-0 shadow-sm"
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={closeModals}
              >
                <i
                  className="bi bi-x-lg text-muted"
                  style={{ fontSize: "0.9rem" }}
                ></i>
              </button>
            </div>

            {/* Body with Timeline */}
            <div
              className="sd-modal-body bg-light p-0"
              style={{ maxHeight: "65vh", overflowY: "auto" }}
            >
              <div className="p-4">
                {isHistoryLoading ? (
                  <div className="text-center py-5">Loading history...</div>
                ) : historyData?.results && historyData.results.length > 0 ? (
                  <div className="position-relative">
                    {/* Timeline Line */}
                    <div
                      className="position-absolute h-100 bg-secondary bg-opacity-25"
                      style={{ width: "2px", left: "24px", top: "15px" }}
                    ></div>

                    {historyData.results.map((log) => (
                      <div
                        key={log.id}
                        className="d-flex gap-3 mb-4 position-relative"
                      >
                        {/* Icon Node */}
                        <div
                          className="rounded-circle shadow-sm d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "50px",
                            height: "50px",
                            background: getActionColor(log.action_type),
                            zIndex: 2,
                            border: "4px solid #f8f9fa",
                          }}
                        >
                          {getActionIcon(log.action_type)}
                        </div>

                        {/* Content Card */}
                        <div className="card border-0 shadow-sm flex-grow-1 rounded-4 overflow-hidden">
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div>
                                <div className="fw-medium text-dark">
                                  {formatStockLog(log.change)}
                                </div>
                                <div className="small text-muted">
                                  Stock Change
                                </div>
                              </div>
                              {log.old_weight && (
                                <div className="text-center px-2">
                                  <div className="fw-medium text-secondary">
                                    {formatStockLog(log.old_weight)}
                                  </div>
                                  <div className="small text-muted">
                                    Old Stock
                                  </div>
                                </div>
                              )}
                              <div className="text-end">
                                <div className="fw-medium text-dark">
                                  {log.user_name}
                                </div>
                                <div className="small text-muted">
                                  Updated By
                                </div>
                              </div>
                            </div>

                            <div className="d-flex justify-content-between">
                              <span className="small text-muted">
                                {new Date(log.created_at).toLocaleString()}
                              </span>
                            </div>

                            {log.notes && (
                              <div className="mt-2 text-muted small fst-italic text-break">
                                "{log.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted opacity-25 mb-3 d-block"></i>
                    <p className="text-muted fw-medium">
                      No history records found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT MODAL: ADD/EDIT INVENTORY */}
      {(activeModal === "add-inv" || activeModal === "edit-inv") && (
        <div className="sd-modal-overlay">
          <div className="sd-modal-container" style={{ maxWidth: "700px" }}>
            <div className="sd-modal-header">
              <h5 className="mb-0 fw-medium">
                {activeModal === "add-inv" ? "Add Inventory" : "Edit Inventory"}
              </h5>
              <button className="sd-modal-close" onClick={closeModals}>
                &times;
              </button>
            </div>
            <div className="sd-modal-body">
              {/* Global Errors */}
              {(errors.non_field_errors || errors.detail) && (
                <div className="alert alert-danger py-2 small mb-3">
                  {errors.non_field_errors?.join(" ") || errors.detail}
                </div>
              )}
              <form
                onSubmit={
                  activeModal === "add-inv" ? handleCreate : handleUpdate
                }
              >
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Product
                    </label>
                    {activeModal === "add-inv" ? (
                      <>
                        <select
                          name="product_id"
                          className={`form-select shadow-none ${errors.product_id || errors.product ? "is-invalid" : ""}`}
                          required
                        >
                          <option value="">Select Product...</option>
                          {productsData?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {(errors.product_id || errors.product) && (
                          <div className="invalid-feedback">
                            {errors.product_id || errors.product}
                          </div>
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={
                          editingInventory?.product_name ||
                          editingInventory?.product
                        } // Use loaded detail or fallback
                        readOnly
                        disabled
                      />
                    )}
                  </div>
                  {/* Location Hidden/Read-only for Single Location Manager */}
                  <div className="col-12">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Location
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={DEFAULT_LOCATION}
                      readOnly
                      disabled
                    />
                    <div className="form-text small">
                      Default store storage location.
                    </div>
                  </div>
                  {/* Only show SKU if it exists (Edit mode) */}
                  {activeModal === "edit-inv" && editingInventory?.sku && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label text-muted small fw-medium text-uppercase">
                          SKU
                        </label>
                        <input
                          type="text"
                          className={`form-control bg-light ${errors.sku ? "is-invalid" : ""}`}
                          value={editingInventory.sku}
                          readOnly
                          disabled
                        />
                        {errors.sku && (
                          <div className="invalid-feedback">{errors.sku}</div>
                        )}
                      </div>
                      <div className="col-md-6"></div>{" "}
                      {/* Spacer to keep alignment */}
                    </>
                  )}
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Stock (Kg)
                    </label>
                    <input
                      name="stock_kg"
                      type="number"
                      step="any"
                      className={`form-control shadow-none ${errors.stock_kg ? "is-invalid" : ""}`}
                      defaultValue={
                        activeModal === "edit-inv"
                          ? parseFloat(editingInventory?.stock_kg || 0)
                          : 0
                      }
                    />
                    {errors.stock_kg && (
                      <div className="invalid-feedback">{errors.stock_kg}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Stock (Pieces)
                    </label>
                    <input
                      name="stock_pieces"
                      type="number"
                      className={`form-control shadow-none ${errors.stock_pieces ? "is-invalid" : ""}`}
                      defaultValue={
                        activeModal === "edit-inv"
                          ? parseInt(editingInventory?.stock_pieces || 0, 10)
                          : 0
                      }
                    />
                    {errors.stock_pieces && (
                      <div className="invalid-feedback">
                        {errors.stock_pieces}
                      </div>
                    )}
                  </div>
                  {/* Advanced Fields */}
                  <div className="col-12">
                    <hr className="text-secondary opacity-25 my-2" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Min Pcs / Kg
                    </label>
                    <input
                      name="min_pieces_per_kg"
                      type="number"
                      className={`form-control shadow-none ${errors.min_pieces_per_kg ? "is-invalid" : ""}`}
                      placeholder="e.g. 8"
                      defaultValue={
                        activeModal === "edit-inv"
                          ? editingInventory?.min_pieces_per_kg
                          : ""
                      }
                    />
                    {errors.min_pieces_per_kg && (
                      <div className="invalid-feedback">
                        {errors.min_pieces_per_kg}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Max Pcs / Kg
                    </label>
                    <input
                      name="max_pieces_per_kg"
                      type="number"
                      className={`form-control shadow-none ${errors.max_pieces_per_kg ? "is-invalid" : ""}`}
                      placeholder="e.g. 10"
                      defaultValue={
                        activeModal === "edit-inv"
                          ? editingInventory?.max_pieces_per_kg
                          : ""
                      }
                    />
                    {errors.max_pieces_per_kg && (
                      <div className="invalid-feedback">
                        {errors.max_pieces_per_kg}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch cursor-pointer">
                      <input
                        name="is_bargainable"
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        id="bargainCheck"
                        defaultChecked={
                          activeModal === "edit-inv"
                            ? editingInventory?.is_bargainable
                            : true
                        }
                      />
                      <label
                        className="form-check-label text-dark fw-medium cursor-pointer"
                        htmlFor="bargainCheck"
                      >
                        Is Bargainable Product?
                      </label>
                      <div className="form-text small">
                        Allow customers to bargain on this product.
                      </div>
                    </div>
                  </div>
                  {activeModal === "edit-inv" && (
                    <div className="col-12">
                      <div className="alert alert-warning border-0 bg-warning bg-opacity-10 d-flex align-items-center small text-dark mt-2">
                        <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
                        <span>
                          <strong>Note:</strong> Deleting inventory is not
                          allowed. Set stock to 0 to mark as Out of Stock.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={closeModals}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="sd-btn-primary px-4"
                    disabled={isCreating || isUpdating}
                  >
                    {isCreating || isUpdating ? "Saving..." : "Save Inventory"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
