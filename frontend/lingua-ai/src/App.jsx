// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";

import "./App.css";

import Navbar from "./components/Navbar";
import NotesWidget from "./components/NotesWidget";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Interests from "./pages/Interests";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Roleplay from "./pages/Roleplay";
import Story from "./pages/Story";

function AppShell() {
  const location = useLocation();
  const [notesOpen, setNotesOpen] = useState(false);

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!isAuthPage && (
        <div className="app-shell">
          <Navbar onToggleNotes={() => setNotesOpen(true)} />
        </div>
      )}

      {/* Main content */}
      <div className={isAuthPage ? "" : "app-shell"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/interests" element={<Interests />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/story" element={<Story />} />
          <Route path="/roleplay" element={<Roleplay />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>

      {/* Notes only outside auth pages */}
      {!isAuthPage && (
        <NotesWidget open={notesOpen} onClose={() => setNotesOpen(false)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}