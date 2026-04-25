import { useState } from "react";
import { Outlet } from "react-router-dom";
import About from "../components/homepage/About";
import Banner from "../components/homepage/Banner";
import HomeBottomPromotions from "../components/homepage/BottomPromotion";
import Category from "../components/homepage/Category";
import Collection from "../components/homepage/Collection";
import FeatureCollection from "../components/homepage/FeatureCollection";
import FreshCuts from "../components/homepage/FreshCuts";
import FrozenFood from "../components/homepage/FrozenFood";
import MidlePromotions from "../components/homepage/MidlePromotions";
import RecentView from "../components/homepage/RecentView";
import SubscribeForm from "../components/homepage/SubscribeForm";
import useAuth from "../hooks/useAuth";
import FAQ from "../components/Faq";
import MarinatedFish from "../components/homepage/MarinatedFish";
import ChickenSection from "../components/homepage/ChickenSection";

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false);
  const { auth } = useAuth();

  return (
    <>
      {/* SEO Tags for Home Page */}
      <title>Fishlo - Fresh Premium Seafood Online</title>
      <meta name="description" content="Looking for fresh seafood? Order 100% chemical-free sea fish,  and authentic spices from Fishlo. Enjoy fast home delivery and cash on delivery." />
      <meta name="keywords" content="Fishlo, buy sea fish online, fresh fish delivery, online seafood, authentic fish masala, cash on delivery fish, chemical free fish, ready to cook fish, fish fry masala" />

      {/* Open Graph (Facebook/WhatsApp) */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Fishlo - Fresh Premium Seafood Online" />
      <meta property="og:description" content="Looking for fresh seafood? Order 100% chemical-free sea fish, and authentic spices from Fishlo. Enjoy fast home delivery and cash on delivery." />
      <meta property="og:site_name" content="Fishlo" />
      <meta property="og:url" content={window.location.href} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Fishlo - Order Fresh Fish, Seafood & Spices" />
      <meta name="twitter:description" content="Looking for fresh seafood? Order 100% chemical-free sea fish, and authentic spices from Fishlo." />

      {/* Canonical Link */}
      <link rel="canonical" href={window.location.href} />

      <Outlet />
      {/* <Navbar variant={"normal"} setCartOpen={setCartOpen} /> */}
      <Banner />
      <Collection />
      <Category />
      {/* <DiscoutCarousel /> */}
      <FeatureCollection />
      <ChickenSection />
      <MarinatedFish />
      <FreshCuts />
      <FrozenFood />
      <MidlePromotions />

      {/* <MasalaHome /> */}
      <About />
      <RecentView />
      <HomeBottomPromotions />
      <FAQ />
      {/* <DeliveryInfo /> */}
      <SubscribeForm />
    </>
  );
}
