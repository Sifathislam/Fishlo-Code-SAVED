// LocationPicker.jsx
export default function LocationPicker({ value = "Surat", onChange }) {
  return (
    <div className="loc-search-style" role="group" aria-label="Pick location">
      <svg
        className="loc-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 2C8.4 2 5.4 4.9 5.4 8.5c0 5 6.6 11.2 6.6 11.2s6.6-6.2 6.6-11.2C18.6 4.9 15.6 2 12 2z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <circle cx="12" cy="8.5" r="2" fill="currentColor" />
      </svg>

      <select
        className="loc-select"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="Select location"
      >
        <option value="Surat">Surat</option>
        <option value="New Delhi City Center">New Delhi City Center</option>
        <option value="Rajkot">Rajkot</option>
        <option value="Udaipur">Udaipur</option>
      </select>

      <svg
        className="loc-caret"
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
