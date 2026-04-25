import React from 'react';
import Skeleton from 'react-loading-skeleton';

export default function SlotsHeader({ slots, loading, isFetching, selectedSlotId, setSelectedSlotId, selectedDateSlot, setSelectedDateSlot }) {
  return (
    <div className="d-flex align-items-center flex-wrap gap-2 mb-4">
      <div className="dropdown">
        <button
          className="btn border fw-medium px-3 py-2 d-flex align-items-center gap-2 bg-white text-dark dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
          style={{ 
            fontSize: "0.95rem", 
            borderRadius: "0.5rem",
            borderColor: "#e2e8f0" 
          }}
        >
          <i className="bi bi-calendar-event text-secondary"></i>
          {selectedDateSlot === 'today' ? 'TODAY' : 'TOMORROW'}
        </button>
        <ul className="dropdown-menu shadow-sm border-0">
          <li>
            <button className={`dropdown-item ${selectedDateSlot === 'today' ? 'active bg-primary' : ''}`} onClick={() => setSelectedDateSlot('today')}>
              TODAY
            </button>
          </li>
          <li>
            <button className={`dropdown-item ${selectedDateSlot === 'tomorrow' ? 'active bg-primary' : ''}`} onClick={() => setSelectedDateSlot('tomorrow')}>
              TOMORROW
            </button>
          </li>
        </ul>
      </div>
      {loading || (isFetching && slots.length === 0) ? (
        Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} width={150} height={40} borderRadius="0.5rem" />
        ))
      ) : (
        slots.map((slot) => (
          <button
            key={slot.id}
            className={`btn border fw-medium px-4 py-2 d-flex align-items-center gap-2 ${
              selectedSlotId === slot.id
                ? "bg-primary text-white shadow-sm border-primary"
                : "bg-white text-dark"
            }`}
            onClick={() => setSelectedSlotId(slot.id)}
            style={{ 
              fontSize: "0.95rem", 
              borderRadius: "0.5rem",
              borderColor: "#e2e8f0" 
            }}
          >
            {slot.label}
            <span className={`ms-1 ${selectedSlotId === slot.id ? 'text-white' : 'text-secondary'}`}>
              ({slot.order_count})
            </span>
          </button>
        ))
      )}
    </div>
  );
}
