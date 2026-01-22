// const API_BASE_URL = "http://localhost:5000/api";

// export async function getHealthStatus() {
//   const response = await fetch(`${API_BASE_URL}/health`);
//   return response.json();
// }


const API_BASE_URL = "http://localhost:5000/api";
import { getToken } from "./authStorage";


async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error || "Request failed";
    throw new Error(message);
  }

  return data;
}

export async function getMe() {
  return request("/me");
}


export async function getHealthStatus() {
  return request("/health");
}

export async function register(email, password, username, nativeLanguage, targetLanguage, targetLevel) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, username, nativeLanguage, targetLanguage, targetLevel }),
  });
}


export async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getRecommendations() {
  return request("/recommendations");
}

export async function getAvailableInterests() {
  return request("/interests");
}

export async function getMyInterests() {
  return request("/interests/me");
}

export async function setMyInterests(interests) {
  return request("/interests/me", {
    method: "POST",
    body: JSON.stringify({ interests }),
  });
}

export async function getProfile() {
  return request("/profile");
}

export async function updateProfile(profileData) {
  return request("/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

export async function likeVideo(videoId) {
  return request("/feedback/like", {
    method: "POST",
    body: JSON.stringify({ videoId }),
  });
}

export async function dislikeVideo(videoId) {
  return request("/feedback/dislike", {
    method: "POST",
    body: JSON.stringify({ videoId }),
  });
}

export async function addToHistory(item) {
  return request("/history", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function getHistory(limit = 20) {
  return request(`/history?limit=${limit}`);
}

export async function clearHistory() {
  return request("/history", { method: "DELETE" });
}

export async function sendChat(provider, messages) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ provider, messages }),
  });
}

export async function tts(text, voice) {
  const token = getToken();

  const res = await fetch("http://localhost:5000/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, voice }),
  });

  if (!res.ok) {
    let msg = "TTS failed";
    try {
      const data = await res.json();
      msg = data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.blob(); // audio/mpeg
}

export async function stt(audioBlob) {
  const token = getToken();

  const form = new FormData();
  form.append("audio", audioBlob, "speech.webm");

  const res = await fetch("http://localhost:5000/api/stt", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // IMPORTANT: do NOT set Content-Type manually for FormData
    },
    body: form,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "STT failed");
  }

  return data; // { text }
}


export async function sttLocal(audioBlob) {
  const token = getToken();
  const form = new FormData();
  form.append("audio", audioBlob, "speech.webm");

  const res = await fetch("http://localhost:5000/api/stt/local", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Local STT failed");
  return data; // { text }
}
