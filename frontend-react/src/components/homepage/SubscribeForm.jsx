import { useState } from "react";
import { useSubscribeNewsletter } from "../../features/useNewsletter";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const { mutate, isPending, isSuccess, isError, error } =
    useSubscribeNewsletter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    mutate(
      { email },
      {
        onSuccess: () => {
          setEmail("");
        },
      }
    );
  };

  return (
    <section
      className="sp-subscribe p-tb-50"
      data-aos="fade-up"
      data-aos-duration={1000}
      data-aos-delay={200}
    >
      <div className="container">
        <div className="row">
          <div className="section-detail centerd">
            <div className="sp-title">
              <p>
                <img src="template_styles/img/icons/15.svg" alt="" />
                Subscribe Now: Get Exclusive Updates and Content!
              </p>
              <h2 data-cursor="big">
                Stay Updated: Subscribe for Exclusive Content
              </h2>
            </div>
          </div>

          <div className="sp-subscribe-form">
            <form onSubmit={handleSubmit} style={{ marginBottom: "0" }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
              />
              <button
                type="submit"
                className="sp-btn-4 mt-2 mt-md-0"
                disabled={isPending}
                style={{
                  border: "none",
                  cursor: isPending ? "wait" : "pointer",
                }}
              >
                {isPending ? "Sending..." : "Subscribe!"}
              </button>
            </form>
          </div>

          <div className="col-12 text-center" style={{ marginTop: "15px" }}>
            {isSuccess && (
              <p style={{ color: "#28a745", fontWeight: "600" }}>
                Success! You have been subscribed.
              </p>
            )}

            {isError && (
              <p style={{ color: "#d7574c", fontWeight: "600" }}>
                {error?.response?.data?.email?.[0] ||
                  "Something went wrong. Try again."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
