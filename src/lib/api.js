const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://securelite.onrender.com" ||
  "http://localhost:3000";

function toggleApiPrefix(path) {
  if (path.startsWith("/api/")) return path.slice(4);
  if (path.startsWith("/")) return "/api" + path;
  return path;
}

export async function request(path, options = {}) {
  const headers = {};
  if (options.body) headers["Content-Type"] = "application/json";

  const res = await fetch(BASE + path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (res.status === 404) {
    const res2 = await fetch(BASE + toggleApiPrefix(path), {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    return parseResponse(res2);
  }

  return parseResponse(res);
}

async function parseResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const err = new Error(`Server returned non-JSON (${res.status})`);
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}
