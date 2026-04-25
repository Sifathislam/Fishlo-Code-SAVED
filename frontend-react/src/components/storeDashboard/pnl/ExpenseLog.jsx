import React, { useState } from "react";
import { Plus, Edit2, Trash2, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useExpenseList, useDeleteExpense } from "../../../features/useExpenses";
import ExpenseFormModal from "./ExpenseFormModal";

export default function ExpenseLog({ filters }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

  const { data: expenses, isLoading } = useExpenseList(filters);
  const deleteMutation = useDeleteExpense();

  const handleEdit = (expense) => {
    setEditExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this expense record?")) {
      deleteMutation.mutate(id, {
        onError: (err) => {
          const errMsg = err?.response?.data?.detail || "Failed to delete expense record. Please try again.";
          alert(errMsg);
        }
      });
    }
  };

  const handleAdd = () => {
    setEditExpense(null);
    setIsModalOpen(true);
  };



  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom p-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div className="d-flex align-items-center gap-3">
          <h6 className="fw-bold mb-0">Expense Log</h6>
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-2 fw-medium shadow-sm" onClick={handleAdd}>
          <Plus size={16} /> Add Expense
        </button>
      </div>
      
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr className="small text-uppercase text-muted">
                <th className="ps-4 border-0">Category</th>
                <th className="border-0">Description</th>
                <th className="border-0">Amount</th>
                <th className="border-0">Expense Date</th>
                <th className="text-end pe-4 border-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></td></tr>
              ) : expenses?.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="ps-4 py-3">
                      <span className={`badge rounded-pill fw-medium ${
                        expense.cost_type === 'OPERATIONAL'
                        ? 'bg-secondary-subtle text-secondary' 
                        : 'bg-primary-subtle text-primary'
                      }`}>
                        {expense.category_display}
                      </span>
                    </td>
                    <td className="text-dark small">{expense.description || "—"}</td>
                    <td className="fw-bold text-dark">₹{expense.amount.toLocaleString()}</td>
                    <td className="text-muted small">{new Date(expense.expense_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}</td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-1">
                        <button className="btn btn-sm btn-light border p-1" onClick={() => handleEdit(expense)}>
                          <Edit2 size={14} className="text-primary" />
                        </button>
                        <button className="btn btn-sm btn-light border p-1" onClick={() => handleDelete(expense.id)}>
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <div className="mb-2"><Filter size={24} className="opacity-25" /></div>
                    No expenses recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
            {expenses?.length > 0 && (
              <tfoot className="table-light border-top-0">
                <tr className="fw-bold">
                  <td colSpan="2" className="ps-4 py-3">Total for Selected Period</td>
                  <td colSpan="3" className="pe-4 text-primary">
                    ₹{expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ExpenseFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          expense={editExpense}
        />
      )}
    </div>
  );
}
