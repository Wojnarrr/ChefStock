import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function RegisterStaffForm({ onSwitchToLogin }) {
    const { registerStaff } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        joinCode: "",
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
            await registerStaff({ ...formData, joinCode: formData.joinCode.trim().toUpperCase() });
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
                    <h2>Join a Restaurant</h2>
                    <p className="panel-subtitle">
                        Ask your manager for the restaurant's join code.
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
                        Join Code
                        <input
                            name="joinCode"
                            value={formData.joinCode}
                            onChange={handleChange}
                            placeholder="e.g. REST-A1B2C3"
                            required
                        />
                    </label>
                </div>

                {error && <p className="error">{error}</p>}

                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={onSwitchToLogin}>
                        Back to Login
                    </button>
                    <button type="submit" className="primary-button" disabled={submitting}>
                        {submitting ? "Joining..." : "Join Restaurant"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default RegisterStaffForm;