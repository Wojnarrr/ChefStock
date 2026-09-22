const TOKEN_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWIyNzE3MzVjYWM4NTEyODVmMjUzNDYiLCJpYXQiOjE3OTAwNzkzNjgsImV4cCI6MTc5MjY3MTM2OH0.keCvsA-sa58XogM0K1JeTX9gH_zsXdMp5KvieIPRmmA";
const RESTAURANT_ID_KEY = "6ab271735cac851285f25347";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function getCurrentRestaurantId() {
    return localStorage.getItem(RESTAURANT_ID_KEY);
}

export function setCurrentRestaurantId(restaurantId) {
    localStorage.setItem(RESTAURANT_ID_KEY, restaurantId);
}

export function clearCurrentRestaurantId() {
    localStorage.removeItem(RESTAURANT_ID_KEY);
}

// Called on logout — wipes everything auth-related so the next login starts clean.
export function clearAuthStorage() {
    clearToken();
    clearCurrentRestaurantId();
}