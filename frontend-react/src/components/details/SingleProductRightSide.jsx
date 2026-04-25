import { useState } from "react";
import BargainProductCard from "../checkout/BargainProductCard";
import Masala from "./Masala";
import { useMostLovedProducts } from "../../features/useProduct";

export default function SingleProductRightSide({data}) {
  const [isOpen, setIsOpen] = useState(false);
  

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sp-shop-sidebar d-none d-lg-block m-t-991">
        <div id="shop_sidebar">
          {<Masala  data={data} fish={true} />}
        </div>
      </div>


    </>
  );
}
