import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

function StaffTab() {
    const { user, refreshMemberships } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load the member list once, when the tab first appears.
    useEffect(() => {
        const loadMembers = async () => {
            try {
                const data = await apiFetch("/members");
                setMembers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadMembers();
    }, []);

    const handleRoleChange = async (member, newRole) => {
        try {
            setError("");
            await apiFetch(`/members/${member._id}`, {
                method: "PATCH",
                body: JSON.stringify({ role: newRole }),
            });

            // Update just that one row instead of re-fetching the whole list.
            setMembers((current) =>
                current.map((m) => (m._id === member._id ? { ...m, role: newRole } : m))
            );

            // If you changed your OWN role, the rest of the app needs to know
            // (e.g. the sidebar should drop the Admin section).
            if (member.user._id === user.id) {
                await refreshMemberships();
            }
        } catch (err) {
            // e.g. "A restaurant must have at least one owner"
            setError(err.message);
        }
    };

    const handleRemove = async (member) => {
        if (!window.confirm(`Remove ${member.user.name} from this restaurant?`)) return;

        try {
            setError("");
            await apiFetch(`/members/${member._id}`, { method: "DELETE" });
            setMembers((current) => current.filter((m) => m._id !== member._id));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <section className="panel">
            <div className="panel-header">
                <div>
                    <h2>Staff</h2>
                    <p className="panel-subtitle">Everyone who has access to this restaurant.</p>
                </div>
                <span>{members.length}</span>
            </div>

            {error && <p className="error">{error}</p>}

            {loading ? (
                <p className="muted">Loading staff...</p>
            ) : (
                <div className="table-wrapper">
                    <table className="stock-table members-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th></th>
                        </tr>
                        </thead>

                        <tbody>
                        {members.map((member) => {
                            const isYou = member.user._id === user.id;

                            return (
                                <tr key={member._id}>
                                    <td>
                                        <strong>{member.user.name}</strong>
                                        {isYou && <span className="you-tag">You</span>}
                                    </td>
                                    <td>{member.user.email}</td>
                                    <td>
                                        <select
                                            className="role-select"
                                            value={member.role}
                                            onChange={(event) => handleRoleChange(member, event.target.value)}
                                            aria-label={`Role for ${member.user.name}`}
                                        >
                                            <option value="owner">Owner</option>
                                            <option value="staff">Staff</option>
                                        </select>
                                    </td>
                                    <td>{new Date(member.joinedAt).toLocaleDateString("en-IE")}</td>
                                    <td className="table-actions">
                                        {/* Leaving a restaurant yourself will live on the My Account page. */}
                                        {!isYou && (
                                            <button
                                                type="button"
                                                className="link-button danger"
                                                onClick={() => handleRemove(member)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default StaffTab;