import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import {
    getToken,
    setToken,
    clearAuthStorage,
    getCurrentRestaurantId,
    setCurrentRestaurantId,
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

    const applyAuthResult = (data) => {
        setToken(data.token);
        setUser(data.user);
        setMemberships(data.memberships);

        // If the person only has one restaurant, there's nothing to choose —
        // select it automatically. Otherwise leave it unset so the app can
        // show a restaurant picker.
        if (data.memberships.length === 1) {
            const onlyRestaurantId = data.memberships[0].restaurant._id;
            setCurrentRestaurantId(onlyRestaurantId);
            setCurrentRestaurantIdState(onlyRestaurantId);
        }
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

                // The restaurant ID stored from last time might belong to a
                // membership that no longer exists (e.g. removed by the owner).
                // Only keep it if it still matches something real.
                const storedRestaurantId = getCurrentRestaurantId();
                const stillValid = data.memberships.some(
                    (m) => m.restaurant._id === storedRestaurantId
                );

                if (storedRestaurantId && stillValid) {
                    setCurrentRestaurantIdState(storedRestaurantId);
                } else if (data.memberships.length === 1) {
                    const onlyRestaurantId = data.memberships[0].restaurant._id;
                    setCurrentRestaurantId(onlyRestaurantId);
                    setCurrentRestaurantIdState(onlyRestaurantId);
                }
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