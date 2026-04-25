import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useProductList } from "../../features/useProduct";
import {
  useCreatePricing,
  usePricingList,
  useUpdatePricing,
} from "../../features/useStorePricing";
import useDebouncedValue from "../../shared/hooks/useDebounce";

export default function StorePricing() {
  document.title = "Pricing - Store Dashboard";
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [blinkingRows, setBlinkingRows] = useState(new Set());

  const [errors, setErrors] = useState({});

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);

  // API Hooks
  const { data: pricingData, isLoading: isPricingLoading } =
    usePricingList(debouncedSearchTerm);
  const { data: productList, isLoading: isProductListLoading } =
    useProductList();

    const createPricingMutation = useCreatePricing();
  const updatePricingMutation = useUpdatePricing();

  const products = pricingData?.results || [];
  const loading = isPricingLoading;
  const formatPrice = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    return Number(val).toFixed(2);
  };
  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm({
      wholesale_price: product.wholesale_price,
      regular_price: product.regular_price,
      display_price: product.display_price,
      bargain_price: product.bargain_price,
      min_price: product.min_price,
    });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setErrors({});
  };
  const handleSave = (productId) => {
    const payload = {
      wholesale_price: formatPrice(editForm.wholesale_price),
      regular_price: formatPrice(editForm.regular_price),
      display_price: formatPrice(editForm.display_price),
      bargain_price: formatPrice(editForm.bargain_price),
      min_price: formatPrice(editForm.min_price),
    };

    updatePricingMutation.mutate(
      { id: productId, data: payload },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditForm({});
          setErrors({});
        },

        onError: (error) => {

          if (!error.response) return;

          const data = error.response.data;
          let formattedErrors = {};

          // DRF field errors
          if (typeof data === "object") {
            formattedErrors = data;
          }

          // DRF detail message
          if (data?.detail) {
            formattedErrors.non_field_errors = [data.detail];
          }

          setErrors(formattedErrors);
        },
      },
    );
  };
  const handleCreate = (e) => {
    e.preventDefault();

    const payload = {
      product: editForm.product_id,
      wholesale_price: formatPrice(editForm.wholesale_price),
      regular_price: formatPrice(editForm.regular_price),
      display_price: formatPrice(editForm.display_price),
      bargain_price: formatPrice(editForm.bargain_price),
      min_price: formatPrice(editForm.min_price),
    };

    createPricingMutation.mutate(payload, {
      onSuccess: () => {
        setEditingId(null);
        setEditForm({});
        setErrors({});
      },
      onError: (error) => {
        if (error.response && error.response.data) {
          setErrors(error.response.data);
        }
      },
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === "" ? "" : parseFloat(value);

    setEditForm((prev) => {
      let updatedForm = {
        ...prev,
        [name]: name === "product_id" ? value : numValue,
      };

      // Logic: If display_price changes, calculate bargain and min prices
      if (name === "display_price") {
        const bargain = numValue * 0.9; // 10% decrease
        const min = bargain * 0.9; // 10% decrease from bargain

        updatedForm = {
          ...updatedForm,
          bargain_price: parseFloat(bargain.toFixed(2)),
          min_price: parseFloat(min.toFixed(2)),
        };
      }

      return updatedForm;
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="container-fluid p-0 fade-in">
      {/* Filter Bar */}
      <div className="sd-filter-container mb-4 w-100">
        <div
          className="d-flex align-items-center bg-white border rounded-pill px-3 py-2 shadow-sm sd-search-box flex-grow-1"
          style={{ maxWidth: "400px" }}
        >
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
        <div className="d-flex gap-2">
          <button
            className="btn btn-brand rounded-pill px-4 shadow-sm"
            onClick={() => {
              setEditingId("new");
              setErrors({});
            }}
          >
            <i className="bi bi-plus-lg me-2"></i> Add Pricing
          </button>
        </div>
      </div>

      {/* ADD PRICING MODAL */}
      {editingId === "new" && (
        <div className="sd-modal-overlay">
          <div className="sd-modal-container" style={{ maxWidth: "600px" }}>
            <div className="sd-modal-header">
              <h5 className="mb-0 fw-medium">Add New Product Pricing</h5>
              <button
                className="sd-modal-close"
                onClick={() => {
                  setEditingId(null);
                  setErrors({});
                }}
              >
                &times;
              </button>
            </div>
            <div className="sd-modal-body">
              {errors.non_field_errors && (
                <div className="alert alert-danger py-2 small mb-3">
                  {errors.non_field_errors.join(" ")}
                </div>
              )}
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-medium text-uppercase">
                    Select Product
                  </label>
                  <select
                    className={`form-select shadow-none ${errors.product ? "is-invalid" : ""}`}
                    name="product_id"
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a product...</option>
                    {!isProductListLoading &&
                      productList?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                  {errors.product && (
                    <div className="invalid-feedback">{errors.product}</div>
                  )}
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Wholesale (₹)
                    </label>
                    <input
                      type="number"
                      name="wholesale_price"
                      className={`form-control shadow-none ${errors.wholesale_price ? "is-invalid" : ""}`}
                      onChange={handleChange}
                      required
                    />
                    {errors.wholesale_price && (
                      <div className="invalid-feedback">
                        {errors.wholesale_price.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Regular (₹)
                    </label>
                    <input
                      type="number"
                      name="regular_price"
                      className={`form-control shadow-none ${errors.regular_price ? "is-invalid" : ""}`}
                      onChange={handleChange}
                      required
                    />
                    {errors.regular_price && (
                      <div className="invalid-feedback">
                        {errors.regular_price.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Display (₹)
                    </label>
                    <input
                      type="number"
                      name="display_price"
                      className={`form-control shadow-none ${errors.display_price ? "is-invalid" : ""}`}
                      onChange={handleChange}
                      required
                    />
                    {errors.display_price && (
                      <div className="invalid-feedback">
                        {errors.display_price.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Bargain (₹)
                    </label>
                    <input
                      type="number"
                      name="bargain_price"
                      className={`form-control shadow-none ${errors.bargain_price ? "is-invalid" : ""}`}
                      value={editForm.bargain_price || ""}
                      readOnly
                      tabIndex="-1"
                      required
                    />
                    {errors.bargain_price && (
                      <div className="invalid-feedback">
                        {errors.bargain_price.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-medium text-uppercase">
                      Min Price (₹)
                    </label>
                    <input
                      type="number"
                      name="min_price"
                      className={`form-control shadow-none ${errors.min_price ? "is-invalid" : ""}`}
                      value={editForm.min_price || ""}
                      readOnly
                      tabIndex="-1"
                      required
                    />
                    {errors.min_price && (
                      <div className="invalid-feedback">
                        {errors.min_price.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => {
                      setEditingId(null);
                      setErrors({});
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={createPricingMutation.isPending}
                  >
                    {createPricingMutation.isPending
                      ? "Saving..."
                      : "Save Pricing"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="sd-table-card">
        <div className="table-responsive">
          <table className="sd-table align-middle">
            <thead className="bg-light">
              <tr>
                <th style={{ width: "30%" }}>Product</th>
                <th>Wholesale (₹)</th>
                <th>Regular (₹)</th>
                <th>Display (₹)</th>
                <th>Bargain (₹)</th>
                <th>Min (₹)</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton Loader
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <Skeleton width={150} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td>
                      <Skeleton width={80} />
                    </td>
                    <td className="text-end">
                      <Skeleton width={40} />
                    </td>
                  </tr>
                ))
              ) : products.length > 0 ? (
                products.map((product) => {
                  const isEditing = editingId === product.id;
                  return (
                    <tr
                      key={product.id}
                      className={`${blinkingRows.has(product.id) ? "row-blink-active" : ""} ${isEditing ? "bg-light" : "sd-hover-row"}`}
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
                              src={product.product_image}
                              alt=""
                              className="w-100 h-100"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          </div>
                          <span className="fw-medium text-dark">
                            {product.product_name}
                          </span>
                        </div>
                      </td>
                      {/* Wholesale */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            name="wholesale_price"
                            className="form-control form-control-sm"
                            value={editForm.wholesale_price}
                            onChange={handleChange}
                          />
                        ) : (
                          <span className="text-muted fw-medium">
                            ₹{product.wholesale_price}
                          </span>
                        )}
                      </td>

                      {/* Regular */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            name="regular_price"
                            className="form-control form-control-sm"
                            value={editForm.regular_price}
                            onChange={handleChange}
                          />
                        ) : (
                          <span className="text-dark fw-medium">
                            ₹{product.regular_price}
                          </span>
                        )}
                      </td>

                      {/* Display */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            name="display_price"
                            className="form-control form-control-sm"
                            value={editForm.display_price}
                            onChange={handleChange}
                          />
                        ) : (
                          <span className="text-dark fw-medium">
                            ₹{product.display_price}
                          </span>
                        )}
                      </td>

                      {/* Bargain */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            name="bargain_price"
                            className="form-control bg-light shadow-none form-control-sm"
                            value={editForm.bargain_price || ""}
                            readOnly
                            tabIndex="-1"
                          />
                        ) : (
                          <span className="text-muted fw-medium">
                            ₹{product.bargain_price}
                          </span>
                        )}
                      </td>

                      {/* Min */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            name="min_price"
                            className="form-control  bg-light shadow-none form-control-sm"
                            value={editForm.min_price || ""}
                            readOnly
                            tabIndex="-1"
                          />
                        ) : (
                          <span className="text-muted fw-medium">
                            ₹{product.min_price}
                          </span>
                        )}
                      </td>

                      <td className="text-end">
                        {isEditing ? (
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleSave(product.id)}
                              disabled={updatePricingMutation.isPending}
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={handleCancelEdit}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm btn-light border shadow-sm text-danger"
                            onClick={() => handleEditClick(product)}
                          >
                            <i className="bi bi-pencil-fill"></i> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
