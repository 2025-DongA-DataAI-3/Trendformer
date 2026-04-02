import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Trend from "./example/Trend";
import CategoryVideos from "./example/CategoryVideos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/trend" replace />} />
        <Route path="/trend" element={<Trend />} />
        <Route path="/category/:categoryId" element={<CategoryVideos />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;