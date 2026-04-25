import { useEffect, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import { useLocation } from "react-router-dom";
import { useGetFAQs } from "../features/useGetPolicy";

const FAQ = () => {
  const { data, isLoading, isError } = useGetFAQs();
  const location = useLocation();
  const faqRef = useRef(null);

  useEffect(() => {
    if (!isLoading && data && data.length > 0) {
      if (location.hash === "#faq" && faqRef.current) {
        // slight delay to ensure render is complete
        setTimeout(() => {
          faqRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [isLoading, data, location.hash]);

  if (isLoading) {
    return (
      <section className="faq-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">
              <div className="text-center mb-4">
                <Skeleton width={250} height={40} className="mb-2" />
                <Skeleton width={300} height={20} />
              </div>
              <div className="mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="mb-4">
                    <Skeleton height={50} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isError || !data || data.length === 0) {
    return null;
  }

  return (
    <section className="faq-section" id="faq" ref={faqRef}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="text-center mb-4">
              <h2 className="faq-title">Frequently Asked Questions</h2>
              <p className="faq-subtitle">
                Everything you need to know about our fresh delivery and
                returns.
              </p>
            </div>

            <div className="accordion custom-faq" id="fishloFaq">
              {data.map((item, index) => (
                <div className="accordion-item" key={item.id || index}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${index !== 0 ? "collapsed" : ""
                        }`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse${index}`}
                      aria-expanded={index === 0 ? "true" : "false"}
                    >
                      {item.question}
                    </button>
                  </h2>
                  <div
                    id={`collapse${index}`}
                    className={`accordion-collapse collapse ${index === 0 ? "show" : ""
                      }`}
                    data-bs-parent="#fishloFaq"
                  >
                    <div className="accordion-body">{item.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
