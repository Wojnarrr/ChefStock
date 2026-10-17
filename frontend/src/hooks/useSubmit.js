import { useState } from "react";

// Runs a form's onSubmit and keeps track of saving and any error,
// so every form handles failures the same way.
export function useSubmit(onSubmit) {
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const submit = async (data) => {
        setError("");
        setSaving(true);

        try {
            await onSubmit(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return { submit, error, saving };
}