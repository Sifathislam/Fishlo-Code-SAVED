import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCreateExpense, useUpdateExpense } from "../../../features/useExpenses";

const CATEGORIES = [
  { value: "FISH_COST", label: "Fish Cost (Procurement)", group: "Variable" },
  { value: "MASALA_COST", label: "Masala Cost (Procurement)", group: "Variable" },
  { value: "TRAVEL", label: "Travel/Transport", group: "Variable" },
  { value: "ICE", label: "Ice Cost", group: "Variable" },
  { value: "PACKAGING", label: "Packaging Cost", group: "Variable" },
  { value: "CLEANING", label: "Store Cleaning", group: "Variable" },
  { value: "LABOUR", label: "Labour Cost", group: "Variable" },
  { value: "OTHER", label: "Other Variable Cost", group: "Variable" },
  { value: "RENT", label: "Store Rent", group: "Operational" },
  { value: "UTILITIES", label: "Utilities (Elec/Water)", group: "Operational" },
  { value: "STORE_MISC", label: "Store Misc (Repair/Mkt)", group: "Operational" },
  { value: "SALARY", label: "Salary", group: "Operational" },
  { value: "OTHER", label: "Other Operational Cost", group: "Operational" },
];

export default function ExpenseFormModal({
  isOpen,
  onClose,
  expense
}) {
  const initialCategory = expense ? expense.category : "";
  const initialCostType = expense
    ? (expense.cost_type === "OPERATIONAL" ? "Operational" : "Variable")
    : "Variable";

  const [costType, setCostType] = useState(initialCostType);
  const dateInputRef = React.useRef(null);
  const [formData, setFormData] = useState({
    category: initialCategory,
    custom_category: expense ? expense.custom_category || "" : "",
    amount: expense ? expense.amount : "",
    description: expense ? expense.description : "",
    expense_date: expense ? expense.expense_date : new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});


  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  useEffect(() => {
    if (expense) {
      setCostType(expense.cost_type === "OPERATIONAL" ? "Operational" : "Variable");
      setFormData({
        category: expense.category,
        custom_category: expense.custom_category || "",
        amount: expense.amount,
        description: expense.description,
        expense_date: expense.expense_date,
      });
    } else {
      setCostType("Variable");
      setFormData({
        category: "",
        custom_category: "",
        amount: "",
        description: "",
        expense_date: new Date().toISOString().split('T')[0],
      });
    }
    setErrors({});
  }, [expense]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      ...formData,
      cost_type: costType.toUpperCase() // match the backend enums
    };

    const handleSuccess = () => {
      setErrors({});
      onClose();
    };

    const handleError = (err) => {
      if (err?.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ non_field_errors: ["An unexpected error occurred. Please try again."] });
      }
    };

    if (expense) {
      updateMutation.mutate({ id: expense.id, ...payload }, { onSuccess: handleSuccess, onError: handleError });
    } else {
      createMutation.mutate(payload, { onSuccess: handleSuccess, onError: handleError });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-bottom p-3">
            <h6 className="modal-title fw-bold">{expense ? "Edit Expense" : "Record New Expense"}</h6>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errors.non_field_errors && (
                <div className="alert alert-danger p-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errors.non_field_errors.join(" ")}
                </div>
              )}
              {errors.detail && (
                <div className="alert alert-danger p-2 small mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errors.detail}
                </div>
              )}

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Cost Type</label>
                  <div className="d-flex w-100 shadow-sm rounded-pill p-1 bg-light border" role="group">
                    <button
                      type="button"
                      className="btn flex-fill rounded-pill border-0 fw-medium"
                      style={costType === 'Variable' ? { backgroundColor: '#e4645a', color: '#fff', boxShadow: '0 4px 6px rgba(228, 100, 90, 0.25)' } : { color: '#6c757d', backgroundColor: 'transparent' }}
                      onClick={() => {
                        setCostType("Variable");
                        setFormData({ ...formData, category: "FISH_COST" });
                      }}
                    >
                      Variable Cost
                    </button>

                    <button
                      type="button"
                      className="btn flex-fill rounded-pill border-0 fw-medium"
                      style={costType === 'Operational' ? { backgroundColor: '#e4645a', color: '#fff', boxShadow: '0 4px 6px rgba(228, 100, 90, 0.25)' } : { color: '#6c757d', backgroundColor: 'transparent' }}
                      onClick={() => {
                        setCostType("Operational");
                        setFormData({ ...formData, category: "" });
                      }}
                    >
                      Operational Cost
                    </button>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Category</label>
                  <select
                    className={`form-select border-light-subtle ${errors.category ? 'is-invalid' : ''}`}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select {costType} Category</option>
                    {CATEGORIES.filter(c => c.group === costType).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.category && <div className="invalid-feedback">{errors.category.join(" ")}</div>}
                  {(formData.category === "FISH_COST" || formData.category === "MASALA_COST") && !errors.category && (
                    <div className="form-text text-brand small mt-1">
                      <i className="bi bi-info-circle me-1"></i>
                      {formData.category === "FISH_COST" ? "Fish" : "Masala"} Cost entries are used as COGS in your P&L reports.
                    </div>
                  )}
                  {formData.category === "OTHER" && (
                    <div className="mt-3">
                      <label className="form-label small fw-bold text-muted">Custom Category Name</label>
                      <input
                        type="text"
                        className={`form-control border-light-subtle ${errors.custom_category ? 'is-invalid' : ''}`}
                        placeholder="e.g. Stationery, Internet"
                        value={formData.custom_category}
                        onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                        required
                      />
                      {errors.custom_category && <div className="invalid-feedback">{errors.custom_category.join(" ")}</div>}
                    </div>
                  )}
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-control border-light-subtle ${errors.amount ? 'is-invalid' : ''}`}
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                  {errors.amount && <div className="invalid-feedback">{errors.amount.join(" ")}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Expense Date</label>
                  <div
                    className={`form-control border-light-subtle d-flex align-items-center justify-content-between position-relative p-0 ${errors.expense_date ? 'is-invalid' : ''}`}
                    style={{ height: '38px', cursor: 'pointer' }}
                    onClick={() => dateInputRef.current?.showPicker()}
                  >
                    <span className="px-3 text-dark small">
                      {formData.expense_date
                        ? new Date(formData.expense_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
                        : <span className="text-muted">Select date</span>
                      }
                    </span>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      required
                      style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
                    />
                  </div>
                  {errors.expense_date && <div className="invalid-feedback">{errors.expense_date.join(" ")}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold text-muted">Description (Optional)</label>
                  <textarea
                    className={`form-control border-light-subtle ${errors.description ? 'is-invalid' : ''}`}
                    rows="2"
                    placeholder="e.g. Purchased 50kg Pomfret"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  {errors.description && <div className="invalid-feedback">{errors.description.join(" ")}</div>}
                </div>
              </div>
            </div>
            <div className="modal-footer border-top-0 p-3 bg-light">
              <button type="button" className="btn btn-white border px-4 rounded-pill fw-medium shadow-sm" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="btn btn-brand px-4 rounded-pill shadow-sm fw-medium d-flex align-items-center gap-2"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : expense ? "Update Changes" : "Save Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
