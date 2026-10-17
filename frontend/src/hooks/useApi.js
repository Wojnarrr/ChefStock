import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

// Loads one API path when the component appears.
// reload() fetches it again, e.g. after you save something.
export function useApi(path) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const reload = useCallback(async () => {
        try {
            setError("");
            const result = await apiFetch(path);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [path]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { data, loading, error, reload };
}