import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import StaffTab from "./StaffTab";
import RestaurantTab from "./RestaurantTab";

const TABS = [
    { id: "staff", label: "Staff" },
    { id: "restaurant", label: "Restaurant" },
];

function ManagementView() {
    const { currentRestaurantId } = useAuth();
    const [activeTab, setActiveTab] = useState("staff");

    return (
        <>
            <div className="tabs" role="tablist">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`tab ${activeTab === tab.id ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* key={currentRestaurantId}: when you switch restaurant, React throws the
                tab away and builds a fresh one, so no old restaurant's data is left behind. */}
            {activeTab === "staff" ? (
                <StaffTab key={currentRestaurantId} />
            ) : (
                <RestaurantTab key={currentRestaurantId} />
            )}
        </>
    );
}

export default ManagementView;