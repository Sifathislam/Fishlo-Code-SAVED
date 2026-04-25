import { ArrowRight, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/appPromo.css';

export default function AppPromo() {
  const navigate = useNavigate();

  return (
    <div className="app-promo-wrapper d-flex align-items-center justify-content-center">
      
      {/* Subtle Background Elements */}
      <div className="bg-shape-1 position-absolute z-0"></div>
      <div className="bg-shape-2 position-absolute z-0"></div>
      
      <div className="container text-center z-1 py-5 position-relative">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            
            <div className="mb-4 text-fishlo-red tag-bounce">
              <Smartphone size={64} strokeWidth={1.5} />
            </div>
            
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill border bg-white shadow-sm mb-4 text-fishlo-red fw-semibold" style={{ border: '1px solid rgba(228, 100, 90, 0.2) !important' }}>
              <span style={{ fontSize: '0.85rem' }}>Coming Soon</span>
            </div>
            
            <h1 className="display-4 fw-bold text-fishlo-gray mb-4 lh-sm">
              We are crafting a <br className="d-none d-sm-block" />
              <span className="text-fishlo-red">world-class mobile app</span> <br className="d-none d-sm-block" />
              for you.
            </h1>
            
            <p className="text-secondary mb-5 fs-5 mx-auto" style={{ fontWeight: 400, opacity: 0.85, lineHeight: 1.6, maxWidth: '500px' }}>
              Get ready for the ultimate fish buying experience, directly from your pocket. We can't wait to show you what's next.
            </p>

            {/* Action Buttons */}
            <div className="d-flex justify-content-center mb-2 px-3 px-sm-0">
              <button 
                className="btn btn-primary-fishlo btn-lg d-inline-flex align-items-center justify-content-center gap-2 shadow-none promo-action-btn"
                onClick={() => navigate('/')}
              >
                <ArrowRight className="promo-btn-icon" />
                <span className="text-nowrap">Continue Ordering on Web</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
