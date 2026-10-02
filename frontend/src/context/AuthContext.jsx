import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import {
    getToken,
    setToken,
    clearAuthStorage,
    getCurrentRestaurantId,
    setCurrentRestaurantId,
    clearCurrentRestaurantId,
} from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [memberships, setMemberships] = useState([]);
    const [currentRestaurantId, setCurrentRestaurantIdState] = useState(
        getCurrentRestaurantId()
    );
    // "initializing" covers the one-time check on page load: do we already
    // have a token, and if so, is it still valid? The rest of the app
    // shouldn't render until this resolves, or a logged-in user would
    // briefly flash the login page on every refresh.
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState("");

    // Decides which restaurant is selected, given the user's memberships.
    // Keeps `preferredId` if the user still belongs to it; otherwise picks the
    // only restaurant if there's exactly one; otherwise selects nothing, and
    // AuthGate shows the picker (2+ restaurants) or the join screen (0).
    const syncSelectedRestaurant = (memberships, preferredId) => {
        const belongsTo = (id) => memberships.some((m) => m.restaurant._id === id);

        let nextId = null;
        if (preferredId && belongsTo(preferredId)) {
            nextId = preferredId;
        } else if (memberships.length === 1) {
            nextId = memberships[0].restaurant._id;
        }

        if (nextId) {
            setCurrentRestaurantId(nextId);
        } else {
            clearCurrentRestaurantId();
        }
        setCurrentRestaurantIdState(nextId);
    };

    const applyAuthResult = (data) => {
        setToken(data.token);
        setUser(data.user);
        setMemberships(data.memberships);
        syncSelectedRestaurant(data.memberships, getCurrentRestaurantId());
    };

    useEffect(() => {
        const restoreSession = async () => {
            const token = getToken();

            if (!token) {
                setInitializing(false);
                return;
            }

            try {
                const data = await apiFetch("/auth/me");
                setUser(data.user);
                setMemberships(data.memberships);

                // The restaurant saved from last time might be one the user
                // no longer belongs to (e.g. an owner removed them).
                syncSelectedRestaurant(data.memberships, getCurrentRestaurantId());
            } catch {
                // Token is invalid or expired — clear it and fall back to logged-out.
                clearAuthStorage();
                setUser(null);
                setMemberships([]);
            } finally {
                setInitializing(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (email, password) => {
        setError("");
        const data = await apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        applyAuthResult(data);
    };

    const registerOwner = async ({ name, email, password, restaurantName, restaurantAddress }) => {
        setError("");
        const data = await apiFetch("/auth/register/owner", {
            method: "POST",
            body: JSON.stringify({ name, email, password, restaurantName, restaurantAddress }),
        });
        applyAuthResult(data);
    };

    const registerStaff = async ({ name, email, password, joinCode }) => {
        setError("");
        const data = await apiFetch("/auth/register/staff", {
            method: "POST",
            body: JSON.stringify({ name, email, password, joinCode }),
        });
        applyAuthResult(data);
    };

    const logout = () => {
        clearAuthStorage();
        setUser(null);
        setMemberships([]);
        setCurrentRestaurantIdState(null);
    };

    const selectRestaurant = (restaurantId) => {
        setCurrentRestaurantId(restaurantId);
        setCurrentRestaurantIdState(restaurantId);
    };
    // Re-fetches the user's memberships from the server. Used after anything
// that changes them: renaming a restaurant, a new join code, creating or
// joining a restaurant, or changing your own role.
    const refreshMemberships = async () => {
        const data = await apiFetch("/auth/me");
        setMemberships(data.memberships);
        syncSelectedRestaurant(data.memberships, currentRestaurantId);
        return data.memberships;
    };

    const currentMembership = memberships.find(
        (m) => m.restaurant._id === currentRestaurantId
    );

    const value = {
        user,
        memberships,
        currentRestaurantId,
        currentMembership,
        role: currentMembership?.role || null,
        isAuthenticated: !!user,
        initializing,
        error,
        login,
        registerOwner,
        registerStaff,
        logout,
        selectRestaurant,
        refreshMemberships,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }

    return context;
}