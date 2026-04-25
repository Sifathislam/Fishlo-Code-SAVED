const POPULAR_SEARCH_ITEMS = [
  "Pomfret",
  "Surmai",
  "Mackerel",
  "Prawns",
  "Sardines",
  "Lobster",
];

function PopularSearches({ setSearch }) {
  return (
    <div className="popular-searches-container">
      <h5 className="popular-title">Popular Searches</h5>
      <div className="popular-pills-wrapper">
        {POPULAR_SEARCH_ITEMS.map((item) => (
          <div
            key={item}
            className="popular-pill"
            onClick={() => setSearch(item)}
          >
            <svg
              className="trending-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PopularSearches;
