import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DisplayRecords from "./pages/DisplayRecords";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DisplayRecords />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
