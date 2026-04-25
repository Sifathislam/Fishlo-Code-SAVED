import React from 'react';
import { useProducts } from "../../features/useProduct";
import MarinatedFishCard from './MarinatedFishCard';

export default function MarinatedFish(){
    const { data, isPending, isError } = useProducts('ready-to-cook');
  
      return (
        <section
          className="sp-product-tab sp-products padding-tb-50 pt-0"
        >
          <div className="container">
            <div className="row mb-3">
              <div className="section-detail mb-2 mb-lg-3">
                <div className="sp-title">
                  <h2 data-cursor="big">Marinated Fish</h2>
                  <p>Cut, cleaned, and ready to cook</p>
                </div>
              </div>
            </div>
            <MarinatedFishCard
              data={data}
              isLoading={isPending}
              isError={isError}
            />
          </div>
        </section>
      );
    }
  