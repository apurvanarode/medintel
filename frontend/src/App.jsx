import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Triage from "./pages/Triage";
import Imaging from "./pages/Imaging";
import RiskPrediction from "./pages/RiskPrediction";
import Chatbot from "./pages/Chatbot";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/triage" element={<Triage />} />
        <Route path="/imaging" element={<Imaging />} />
        <Route path="/risk" element={<RiskPrediction />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;