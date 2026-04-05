import React from "react";
import "./Home.css";
import ImageSlider from "./ImageSlider";

const Home = () => {
  return (
    <div className="home-page">
      <section className="home-viewer-section">
        <div className="home-section-head"></div>
        <ImageSlider />
      </section>
    </div>
  );
};

export default Home;