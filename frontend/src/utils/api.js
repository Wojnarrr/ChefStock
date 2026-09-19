const API_BASE_URL = "http://localhost:5050/api";

export async function apiFetch(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;

        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
            // Response body wasn't JSON — keep the generic message above.
        }

        throw new Error(errorMessage);
    }

    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : null;
}