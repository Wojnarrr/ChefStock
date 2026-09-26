// Names of the localStorage entries. These are just labels, not secrets.
const TOKEN_KEY = "chefstock_token";
const RESTAURANT_ID_KEY = "chefstock_restaurant_id";

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