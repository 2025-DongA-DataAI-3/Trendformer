import React from "react";
import { Flame, Sparkles, TrendingUp, PlayCircle } from "lucide-react";
import ImageSlider from "./ImageSlider";

const Home = () => {
  return (
    <div className="home-page">
      <section className="home-viewer-section">
        <div className="home-section-head">
          <div>
            
          </div>
        </div>

        <ImageSlider />
      </section>
    </div>
  );
};

export default Home;