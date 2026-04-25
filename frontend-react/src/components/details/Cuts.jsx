import { useRef, useState } from "react";

export default function DetailsCuts({hoveredCutImage, product, selectedCutId,handleSelectCut, setHoveredCutImage}) {

      const scrollRef = useRef(null);
      const [isDragging, setIsDragging] = useState(false);
      const [startX, setStartX] = useState(0);
      const [scrollLeft, setScrollLeft] = useState(0);
      const [hasMoved, setHasMoved] = useState(false);

      // --- Drag Logic Handlers ---
      const handleMouseDown = (e) => {
        setIsDragging(true);
        setHasMoved(false);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
      };
    
      const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
    
        if (Math.abs(x - startX) > 5) {
          setHasMoved(true);
        }
    
        scrollRef.current.scrollLeft = scrollLeft - walk;
      };
    
      const stopDragging = () => {
        setIsDragging(false);
      };

  return (
    <div
      className="sp-timer m-b-24"
      style={{ position: "relative", pointerEvents: "auto" }}
    >
      {hoveredCutImage && (
        <div className="cut-hover-preview">
          <img src={hoveredCutImage} alt="Preview" draggable="false" />
        </div>
      )}
      <div
        className="cut-selector-container"
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {product?.cuts?.map((cut) => {
          const isSelected = selectedCutId === cut.id;
          const priceNum = parseFloat(cut.price);

          return (
            <div
              key={cut.id}
              onClick={() => handleSelectCut(cut.id)}
              onMouseEnter={() => setHoveredCutImage(cut.image)}
              onMouseLeave={() => setHoveredCutImage(null)}
              className={`cut-item ${isSelected ? "active" : ""}`}
              title={cut.name}
            >
              {/* The Image Box - Controls the shape/border */}
              <div className="cut-image-box">
                <img src={cut.image} alt={cut.name} draggable="false" />
                <div className="cut-price-badge">
                  {
                    priceNum > 0 ? `₹${priceNum}` : ""
                    // <span className="text-success fw-medium">FREE</span>
                  }
                </div>
              </div>

              {/* The Name - Sitting clearly below the image */}
              <span className="cut-name">{cut.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
