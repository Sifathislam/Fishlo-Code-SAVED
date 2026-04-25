import { Leaf, Lightbulb, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function NonBargain() {
    const didYouKnowList = [
    "Fishlo prepares your order in clean, controlled spaces — not in open market conditions.",
    "No open-air exposure. No crowd handling. Just hygienic at its peak.",
    "Fresh seafood quality depends on clean handling — that’s our priority every day.",
    "From cutting to packing, every order is handled with precision and care."
  ];

  const [didYouKnowIndex, setDidYouKnowIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDidYouKnowIndex((prev) =>
        prev === didYouKnowList.length - 1 ? 0 : prev + 1
      );
    }, 5000); // 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="nb-card">
      {/* Top gradient header */}
      <div className="nb-hero">
        {/* Top row */}
        <div className="nb-hero-top">
          <div className="nb-hero-left">
            <div className="nb-kicker">
              <Sparkles size={14} strokeWidth={1.6} />
              Premium Catch
            </div>

            <div className="nb-title">Why Choose Fishlo?</div>
          </div>

          <div className="nb-hero-right">
            <div className="nb-pill">
              <span className="shield-shine" aria-hidden="true">
                <ShieldCheck size={18} strokeWidth={1.5} />
              </span>
              Fishlo Freshness Control™
            </div>
          </div>
        </div>

        {/* Subtitle spans full width */}
        <div className="nb-subtitle">
          Premium seafood, handled with precision and care.
        </div>
      </div>

      {/* Main assurance body */}
      <div className="nb-body">
        <div className="nb-metrics">
          <div className="nb-metric">
            <Scale size={16} strokeWidth={1.6} />
            <div>
              <div className="nb-metric-title">Cleaned Weight Transparency</div>
              <div className="nb-metric-desc">
                Cleaning removes scales, guts, shell, or bones, so the final edible weight varies by seafood type.
              </div>
            </div>
          </div>

          <div className="nb-metric">
            <Leaf size={16} strokeWidth={1.6} />
            <div>
              <div className="nb-metric-title">Always Fresh, Never Compromised</div>
              <div className="nb-metric-desc">
                Handled with care to keep its natural flavour and texture intact.
              </div>
            </div>
          </div>
        </div>

        <div className="nb-divider" />

        <div className="nb-note">
          <Lightbulb size={16} strokeWidth={1.6} />
          <div className="nb-note-content">
            <span className="nb-note-strong">Did you know?</span>
            <div key={didYouKnowIndex} className="nb-note-text">
              {didYouKnowList[didYouKnowIndex]}
            </div>
          </div>
        </div>

        

        <div className="nb-foot">
          *Transparent pricing. Clean handling. No hidden surprises
        </div>
      </div>
    </div>
  );
}
