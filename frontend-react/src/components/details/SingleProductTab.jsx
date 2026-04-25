export default function SingleProdcutTab({product}) {
  return (
    <div className="sp-single-pro-tab" >
      <div className="sp-single-pro-tab-wrapper">
        <div className="sp-single-pro-tab-nav">
          <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
             
            </li>

            {/* <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="review-tab"
                data-bs-toggle="tab"
                data-bs-target="#sp-spt-nav-review"
                type="button"
                role="tab"
                aria-controls="sp-spt-nav-review"
                aria-selected="false"
              >
                Reviews
              </button>
            </li> */}
          </ul>

          
        </div>
        <div className="tab-content sp-single-pro-tab-content">
          <div id="sp-spt-nav-details" className="tab-pane fade show active">
            <div
              className="sp-single-pro-tab-desc"
              dangerouslySetInnerHTML={{ __html: product?.details }}
            ></div>
          </div>

          <div id="sp-spt-nav-review" className="tab-pane fade">
            <div className="row">
              <div className="sp-t-review-wrapper">
                <div className="sp-t-review-item">
                  <div className="sp-t-review-avtar">
                    <img src="/template_styles/img/user/1.jpg" alt="user" />
                  </div>
                  <div className="sp-t-review-content">
                    <div className="sp-t-review-top">
                      <div className="sp-t-review-name">Mariya Lykra</div>
                      <div className="sp-t-review-rating">
                        <i className="ri-star-fill" />
                        <i className="ri-star-fill" />
                        <i className="ri-star-fill" />
                        <i className="ri-star-fill" />
                        <i className="ri-star-fill grey" />
                      </div>
                    </div>
                    <div className="sp-t-review-bottom">
                      <p>
                        Lorem Ipsum is simply dummy text of the printing and
                        typesetting industry. Lorem Ipsum has been the
                        industry's standard dummy text ever since the 1500s,
                        when an unknown printer took a galley of type and
                        scrambled it to make a type specimen.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="sp-t-review-item">
                  <div className="sp-t-review-avtar">
                    <img src="/template_styles/img/user/2.jpg" alt="user" />
                  </div>
                  <div className="sp-t-review-content">
                    <div className="sp-t-review-top">
                      <div className="sp-t-review-name">Moris Willson</div>
                      <div className="sp-t-review-rating">
                        <i className="ri-star-fill" />
                        <i className="ri-star-fill" />
                        <i className="ri-star-fill" />
                        <i className="ri-star-fill grey" />
                        <i className="ri-star-fill grey" />
                      </div>
                    </div>
                    <div className="sp-t-review-bottom">
                      <p>
                        Lorem Ipsum has been the industry's standard dummy text
                        ever since the 1500s, when an unknown printer took a
                        galley of type and scrambled it to make a type specimen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sp-ratting-content">
                <h3>Add a Review</h3>
                <div className="sp-ratting-form">
                  <form>
                    <div className="sp-ratting-star">
                      <span>Your rating:</span>
                      <div className="sp-t-review-rating">
                        <i className="ri-star-fill" />
                        <i className="ri-star-fill" />
                        <i className="ri-star-fill grey" />
                        <i className="ri-star-fill grey" />
                        <i className="ri-star-fill grey" />
                      </div>
                    </div>
                    <div className="sp-ratting-input">
                      <input name="your-name" placeholder="Name" type="text" />
                    </div>
                    <div className="sp-ratting-input">
                      <input
                        name="your-email"
                        placeholder="Email*"
                        type="email"
                        required
                      />
                    </div>
                    <div className="sp-ratting-input form-submit">
                      <textarea
                        name="your-commemt"
                        placeholder="Enter Your Comment"
                        defaultValue={""}
                      />
                      <button className="sp-btn-2" type="submit" value="Submit">
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
