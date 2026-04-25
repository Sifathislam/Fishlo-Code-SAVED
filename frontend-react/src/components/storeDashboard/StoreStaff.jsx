import { useState } from "react";
import {
  useStoreStaff,
  useStaffFormChoices,
  useToggleStaffStatus,
} from "../../features/useStoreStaff";
import useDebouncedValue from "../../shared/hooks/useDebounce";

import StaffStats from "./staff/StaffStats";
import StaffDesktopTable from "./staff/StaffDesktopTable";
import StaffMobileList from "./staff/StaffMobileList";
import StaffModal from "./staff/StaffModal";

export default function StoreStaff() {
  document.title = "Staff - Store Dashboard";

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 500);
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // API Hooks
  const { data: staffResponse, isLoading: loading } = useStoreStaff({
    search: debouncedSearch,
    role: filterRole,
    status: filterStatus,
  });

  const { data: choicesData } = useStaffFormChoices();
  const toggleStatusAction = useToggleStaffStatus();

  const staffList = staffResponse?.staff || [];
  const summary = staffResponse?.summary || {
    total_staff: 0,
    active_now: 0,
    on_leave: 0,
  };

  const handleOpenModal = (staff = null) => {
    setEditingStaff(staff);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
  };

  const handleToggleStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === "Inactive" ? "Active" : "Inactive";
    if (
      window.confirm(
        `Are you sure you want to mark this member as ${nextStatus}?`
      )
    ) {
      toggleStatusAction.mutate(
        { id, status: nextStatus },
        {
          onError: (err) =>
            alert(err.response?.data?.error || "Failed to toggle status"),
        }
      );
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h2 className="sd-header-title mb-1">Staff Management</h2>
          <p className="sd-header-subtitle mb-0">
            Manage your store team and roles
          </p>
        </div>
        <button
          className="sd-btn-primary shadow-sm d-flex align-items-center justify-content-center gap-2"
          onClick={() => handleOpenModal()}
          style={{ whiteSpace: "nowrap" }}
        >
          <i className="bi bi-person-plus-fill"></i> Add Staff
        </button>
      </div>

      <StaffStats loading={loading} summary={summary} />

      <StaffDesktopTable
        loading={loading}
        staffList={staffList}
        choicesData={choicesData}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onEdit={handleOpenModal}
        onToggleStatus={handleToggleStatus}
      />

      <StaffMobileList
        loading={loading}
        staffList={staffList}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onEdit={handleOpenModal}
        onToggleStatus={handleToggleStatus}
      />

      {showModal && (
        <StaffModal
          editingStaff={editingStaff}
          onClose={handleCloseModal}
          choicesData={choicesData}
        />
      )}
    </div>
  );
}
