import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Interests from "./pages/Interests";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Chat from "./pages/Chat";
import NotesWidget from "./components/NotesWidget";

export default function App() {
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <BrowserRouter>
      <Navbar />

      <div style={{ padding: 12 }}>
        <button onClick={() => setNotesOpen(true)}>Open Notes</button>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/interests" element={<Interests />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>

      {notesOpen && (
        <NotesWidget open={notesOpen} onClose={() => setNotesOpen(false)} />
      )}
    </BrowserRouter>
  );
}
