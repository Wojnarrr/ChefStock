import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function RegisterOwnerForm({ onSwitchToLogin }) {
    const { registerOwner } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        restaurantName: "",
        restaurantAddress: "",
    });
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
            await registerOwner(formData);
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
                    <h2>Register Your Restaurant</h2>
                    <p className="panel-subtitle">
                        Creates your account and your restaurant. You'll be the owner.
                    </p>
                </div>
            </div>

            <form className="stock-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <label>
                        Your Name
                        <input name="name" value={formData.name} onChange={handleChange} required />
                    </label>

                    <label>
                        Email
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                        />
                    </label>

                    <label>
                        Restaurant Name
                        <input
                            name="restaurantName"
                            value={formData.restaurantName}
                            onChange={handleChange}
                            required
                        />
                    </label>
                </div>

                <label className="full-width-label">
                    Restaurant Address
                    <input
                        name="restaurantAddress"
                        value={formData.restaurantAddress}
                        onChange={handleChange}
                        placeholder="Optional"
                    />
                </label>

                {error && <p className="error">{error}</p>}

                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={onSwitchToLogin}>
                        Back to Login
                    </button>
                    <button type="submit" className="primary-button" disabled={submitting}>
                        {submitting ? "Creating account..." : "Create Account"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default RegisterOwnerForm;