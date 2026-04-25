import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, CheckCircle, Clock, Percent, ShieldCheck, 
  Truck, ChevronDown, ChevronUp, Star, Award, 
  Target, BarChart3, Users, Zap 
} from 'lucide-react';
import '../styles/b2bFrozen.css';

export default function B2BFrozenSeafood() {
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    volume: '',
    message: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const [counts, setCounts] = useState({ restaurants: 0, accuracy: 0, savings: 0 });
  
  const sectionRefs = {
    hero: useRef(null),
    stats: useRef(null),
    features: useRef(null),
    products: useRef(null),
    workflow: useRef(null)
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
            if (entry.target.id === 'stats') {
              startCounters();
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const startCounters = () => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounts({
        restaurants: Math.floor(progress * 500),
        accuracy: (progress * 99.8).toFixed(1),
        savings: Math.floor(progress * 25)
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setFormData({ businessName: '', contactName: '', phone: '', email: '', volume: '', message: '' });
      setIsSubmitted(false);
    }, 5000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    { q: "What is your Minimum Order Quantity (MOQ)?", a: "Our standard MOQ starts at 50kg per delivery to ensure wholesale pricing. However, we can create custom tiers for smaller boutique restaurants or cloud kitchens based on weekly volumes." },
    { q: "Do you provide sample batches for our Head Chef?", a: "Yes. We understand the importance of quality testing. Once you submit a bulk inquiry, your assigned account manager can arrange a complimentary tasting sample of our premium cuts." },
    { q: "How is the seafood packaged?", a: "All items are packed using food-grade, vacuum-sealed materials and transported in specialized -18°C reefer vehicles to guarantee the cold chain is never broken." },
    { q: "What is the delivery schedule?", a: "We offer flexible delivery schedules including daily, bi-weekly, or weekly drops depending on your inventory turnover. Deliveries are typically scheduled during non-peak morning hours." }
  ];

  return (
    <div className="b2b-frozen-page">
      {/* 1. Hero Section */}
      <section className="b2b-hero" id="hero" ref={sectionRefs.hero}>
        <div className="b2b-hero-bg" style={{ backgroundImage: `url('/assets/b2b/hero.png')` }}></div>
        <div className="b2b-container">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <div className="b2b-hero-content">
                <span className="b2b-badge"><Zap size={12} /> Wholesale & Restaurant Partner</span>
                <h1 className="b2b-hero-title">
                  Premium Frozen Seafood<br />for <span>High-End Kitchens.</span>
                </h1>
                <p className="b2b-hero-subtitle">
                  Empower your culinary vision with export-grade sea catches. 
                  Consistent sizing, zero-chemical processing, and factory-direct pricing 
                  delivered straight to your freezer.
                </p>
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <a href="#inquiry-form" className="b2b-btn-primary">
                    Request Wholesale Quote <ArrowRight size={16} />
                  </a>
                  <div className="d-flex align-items-center gap-2 text-secondary">
                    <CheckCircle size={14} className="text-success" />
                    <span className="small fw-semibold">FSSAI Certified Supply</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div id="stats" ref={sectionRefs.stats} className={`b2b-hero-stats-card ${isVisible.stats ? 'animate-in' : ''}`}>
                <div className="b2b-stat-item">
                  <div className="b2b-stat-number">{counts.restaurants}+</div>
                  <div className="b2b-stat-label">Restaurant<br />Partners Trusted</div>
                </div>
                <div className="b2b-stat-item">
                  <div className="b2b-stat-number">{counts.accuracy}%</div>
                  <div className="b2b-stat-label">Order<br />Accuracy Rate</div>
                </div>
                <div className="b2b-stat-item">
                  <div className="b2b-stat-number">{counts.savings}%</div>
                  <div className="b2b-stat-label">Average Food<br />Cost Savings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Bar */}
      <section className="b2b-trust-bar">
        <div className="b2b-container">
          <div className="b2b-trust-grid">
            <div className="b2b-trust-item"><Award size={16} /> 100% Traceable Catch</div>
            <div className="b2b-trust-item"><Truck size={16} /> -18°C Cold Chain</div>
            <div className="b2b-trust-item"><Users size={16} /> Dedicated Support</div>
            <div className="b2b-trust-item"><Target size={16} /> Calibration Matching</div>
          </div>
        </div>
      </section>

      {/* 3. Value Proposition Section */}
      <section className="b2b-features" id="features" ref={sectionRefs.features}>
        <div className="b2b-container">
          <div className="b2b-section-header">
            <h2 className="b2b-section-title">Engineered for Chefs</h2>
            <p className="b2b-section-subtitle">Why leading hotels and clouds kitchens switch to Fishlo B2B.</p>
          </div>
          
          <div className="row g-3">
            <div className="col-md-4">
              <div className="b2b-feature-card">
                <div className="b2b-feature-icon"><Percent size={24} /></div>
                <h3>Cost Stabilization</h3>
                <p>Lock in annual pricing and hedge against seasonal cost spikes. Standardize your menu costs with 25% lower inventory overhead.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="b2b-feature-card">
                <div className="b2b-feature-icon"><ShieldCheck size={24} /></div>
                <h3>Chemical-Free IQF</h3>
                <p>Blast freezing at -40°C locks in structural integrity without preservatives. Give your customers the taste of the ocean.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="b2b-feature-card">
                <div className="b2b-feature-icon"><Clock size={24} /></div>
                <h3>Zero Cleaning Waste</h3>
                <p>Portioned, cleaned, and descaled. Save hours in prep time and pay only for what you cook. 100% yield efficiency.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Showcase Section */}
      <section className="b2b-showcase" id="products" ref={sectionRefs.products}>
        <div className="b2b-container">
          <div className="b2b-section-header">
            <h2 className="b2b-section-title">Our Premium Selection</h2>
            <p className="b2b-section-subtitle">Consistent quality for high-volume commercial ranges.</p>
          </div>
          <div className="row g-3">
            {[
              { title: "IQF White Pomfret", type: "FISH", img: "/assets/b2b/pomfret.png", desc: "Whole cleaned or steaks. Consistent sizing for perfect plating." },
              { title: "Tiger Prawns (PDTO)", type: "SHELLFISH", img: "/assets/b2b/prawns.png", desc: "Peeled, deveined, tail-on. Zero glazing weight fraud." },
              { title: "Seer Fish Steaks", type: "FISH", img: "/assets/b2b/seerfish.png", desc: "Uniform thickness cuts. Immediate pan-ready convenience." },
              { title: "Cleaned Squid Tubes", type: "CEPHALOPOD", img: "https://images.unsplash.com/photo-1599481238332-b01166697851?auto=format&fit=crop&q=80&w=400", desc: "Tender white tubes & tentacles. Ideal for calamari rings." }
            ].map((prod, i) => (
              <div className="col-6 col-lg-3" key={i}>
                <div className="b2b-product-card">
                  <div className="b2b-product-image" style={{ backgroundImage: `url('${prod.img}')` }}>
                    <div className="b2b-product-overlay"></div>
                  </div>
                  <div className="b2b-product-content">
                    <span className="b2b-product-type">{prod.type}</span>
                    <h4>{prod.title}</h4>
                    <p className="text-secondary">{prod.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="b2b-workflow" id="workflow" ref={sectionRefs.workflow}>
        <div className="b2b-container">
          <div className="b2b-section-header">
            <h2 className="b2b-section-title">Integration Strategy</h2>
            <p className="b2b-section-subtitle">Simple, reliable steps to secure your supply chain.</p>
          </div>
          <div className="row g-0 b2b-timeline">
            {[
              { n: "1", t: "Registration", p: "Register your business and share monthly SKU requirements." },
              { n: "2", t: "Consultation", p: "Dedicated manager provides custom quote & tasting sample." },
              { n: "3", t: "Delivery", p: "Scheduled, temperature-controlled delivery to your HQ." }
            ].map((step, i) => (
              <div className="col-lg-4" key={i}>
                <div className="b2b-step">
                  <div className="b2b-step-number">{step.n}</div>
                  <h4 className="fw-bold">{step.t}</h4>
                  <p className="px-4 text-secondary">{step.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="b2b-faq">
        <div className="b2b-container">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="b2b-section-header">
                <h2 className="b2b-section-title">Support & FAQ</h2>
              </div>
              <div className="b2b-accordion">
                {faqs.map((faq, index) => (
                  <div className={`b2b-accordion-item ${openFaq === index ? 'active' : ''}`} key={index}>
                    <button className="b2b-accordion-header" onClick={() => toggleFaq(index)}>
                      <span>{faq.q}</span>
                      {openFaq === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div className="b2b-accordion-body">
                      <p className="text-secondary">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Lead Generation Section */}
      <section className="b2b-contact" id="inquiry-form">
        <div className="b2b-container">
          <div className="b2b-form-wrapper">
            <div className="b2b-form-info">
              <h2 className="text-white fw-bold">Let's build<br />your menu.</h2>
              <p className="opacity-75 mb-4">Join the network of professional kitchens optimized for growth and quality.</p>
              
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle size={18} />
                  <span>Custom Quote within 4 Hours</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle size={18} />
                  <span>Complimentary Chef Samples</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <CheckCircle size={18} />
                  <span>Flexible Payment Terms</span>
                </div>
              </div>
            </div>
            
            <div className="b2b-form-main">
              {isSubmitted ? (
                <div className="text-center py-4">
                  <div className="b2b-step-number bg-success text-white border-success mx-auto">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="fw-bold mb-2">Inquiry Received!</h3>
                  <p className="text-secondary">Our B2B team will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="b2b-form-label">Business Name</label>
                      <input type="text" className="b2b-form-control" name="businessName" placeholder="e.g. Blue Lagoon" required />
                    </div>
                    <div className="col-md-6">
                      <label className="b2b-form-label">Contact Person</label>
                      <input type="text" className="b2b-form-control" name="contactName" placeholder="Full Name" required />
                    </div>
                    <div className="col-md-6">
                      <label className="b2b-form-label">Phone Member</label>
                      <input type="tel" className="b2b-form-control" name="phone" placeholder="+91" required />
                    </div>
                    <div className="col-md-6">
                      <label className="b2b-form-label">Email Address</label>
                      <input type="email" className="b2b-form-control" name="email" placeholder="chef@business.com" required />
                    </div>
                    <div className="col-12">
                      <label className="b2b-form-label">Monthly Volume Target</label>
                      <select className="b2b-form-control" name="volume" required>
                        <option value="">Select volume</option>
                        <option value="50-100">50 - 100 kg / month</option>
                        <option value="100-500">100 - 500 kg / month</option>
                        <option value="500-1000">500 - 1000 kg / month</option>
                        <option value="1000+">1000+ kg / month</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="b2b-btn-primary w-100 justify-content-center mt-2">
                        Submit Partnership Inquiry <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
