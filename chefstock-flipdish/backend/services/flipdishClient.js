// Talks to the Flipdish API. Nothing else in the app knows about Flipdish's
// URLs, tokens or field names, so if Flipdish changes, only this file and
// flipdishImport.js change.
const BASE_URL = "https://api.flipdish.co";
const USER_AGENT = "ChefStock/0.1 (portfolio project)";

// Are the credentials in .env at all?
const isConfigured = () => Boolean(process.env.FLIPDISH_CLIENT_ID && process.env.FLIPDISH_CLIENT_SECRET);

// Tokens last a while, so keep one and reuse it until just before it expires.
let cachedToken = null; // { value, expiresAt }

const getAccessToken = async () => {
    if (!isConfigured()) {
        throw new Error("FLIPDISH_CLIENT_ID and FLIPDISH_CLIENT_SECRET aren't set in backend/.env");
    }

    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
        return cachedToken.value;
    }

    const response = await fetch(`${BASE_URL}/identity/connect/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: process.env.FLIPDISH_CLIENT_ID,
            client_secret: process.env.FLIPDISH_CLIENT_SECRET,
            scope: "api",
        }),
    });

    if (!response.ok) {
        throw new Error(`Flipdish login failed (${response.status}). Check the client id and secret in backend/.env.`);
    }

    const data = await response.json();
    cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return cachedToken.value;
};

const flipdishGet = async (path, params = {}) => {
    const token = await getAccessToken();
    const url = new URL(path, BASE_URL);

    for (const [key, value] of Object.entries(params)) {
        // Arrays become repeated params: ?state=A&state=B
        for (const item of [].concat(value)) url.searchParams.append(key, item);
    }

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
    });

    if (response.status === 429) throw new Error("Flipdish rate limit hit, try again in a minute.");
    if (response.status === 401 || response.status === 403) {
        throw new Error(`Flipdish said no (${response.status}). This login may not have access to that store.`);
    }
    if (!response.ok) throw new Error(`Flipdish request failed (${response.status}) for ${url.pathname}`);

    return response.json();
};

// The stores this login can see, so the owner can pick theirs.
const getStores = async () => {
    const result = await flipdishGet("/api/v1.0/stores", { page: 1, limit: 50 });
    return result.Data;
};

// Every order for one store between two dates, one page at a time.
const getOrders = async ({ storeId, from, to }) => {
    const orders = [];
    const limit = 100;

    for (let page = 1; ; page++) {
        const result = await flipdishGet("/api/v1.0/orders", {
            physicalRestaurantId: storeId,
            from: from.toISOString(),
            to: to.toISOString(),
            page,
            limit,
        });

        orders.push(...result.Data);
        if (result.Data.length < limit || orders.length >= result.TotalRecordCount) break;
    }

    return orders;
};

// Just one page of recent orders, for checking what real orders look like.
const getRecentOrders = async ({ storeId, days = 7, limit = 20 }) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    const result = await flipdishGet("/api/v1.0/orders", {
        physicalRestaurantId: storeId,
        from: from.toISOString(),
        to: to.toISOString(),
        page: 1,
        limit,
    });
    return result.Data;
};

module.exports = { isConfigured, getStores, getOrders, getRecentOrders };
