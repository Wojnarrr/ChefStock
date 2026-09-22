import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function LoginForm({ onSwitchToRegisterOwner, onSwitchToRegisterStaff }) {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((currentFormData) => ({ ...currentFormData, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await login(formData.email, formData.password);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="panel form-panel">
            <div className="panel-header">
                <div>
                    <h2>Log in to ChefStock</h2>
                    <p className="panel-subtitle">Enter your email and password to continue.</p>
                </div>
            </div>

            <form className="stock-form" onSubmit={handleSubmit}>
                <label className="full-width-label">
                    Email
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label className="full-width-label">
                    Password
                    <input
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </label>

                {error && <p className="error">{error}</p>}

                <div className="form-actions">
                    <button type="submit" className="primary-button" disabled={submitting}>
                        {submitting ? "Logging in..." : "Log In"}
                    </button>
                </div>
            </form>

            <p className="panel-subtitle" style={{ marginTop: "20px" }}>
                New here?{" "}
                <button type="button" className="link-button" onClick={onSwitchToRegisterOwner}>
                    Register a restaurant
                </button>{" "}
                or{" "}
                <button type="button" className="link-button" onClick={onSwitchToRegisterStaff}>
                    join with a code
                </button>
            </p>
        </section>
    );
}

export default LoginForm;