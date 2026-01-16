import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Interests from "./pages/Interests";
import Profile from "./pages/Profile";
import History from "./pages/History";


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ padding: 12 }}>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/interests" element={<Interests />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}
