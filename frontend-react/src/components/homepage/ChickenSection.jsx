import React from 'react';
import { useProducts } from "../../features/useProduct";
import ChickenSectionCard from './ChickenSectionCard';

export default function ChickenSection(){
    const { data, isPending, isError } = useProducts('chicken');
    if (!isPending && data?.results?.length === 0) return null;
  
      return (
        <section
          className="sp-product-tab sp-products padding-tb-50 pt-0"
        >
          <div className="container">
            <div className="row mb-3">
              <div className="section-detail mb-2 mb-lg-5">
                <div className="sp-title">
                  <h2 data-cursor="big">Fresh Chicken</h2>
                  <p>Handpicked quality chicken, delivered fresh!</p>
                </div>
              </div>
            </div>
            <ChickenSectionCard
              data={data}
              isLoading={isPending}
              isError={isError}
            />
          </div>
        </section>
      );
    }
  