import { useState } from "react";
import { useSubmit } from "../hooks/useSubmit";
function CreatePrepTaskForm({ recipes, onSubmit, onCancel }) {
    const prepRecipes = recipes.filter(
        (recipe) => recipe.recipeType === "prep" && recipe.isActive
    );

    const [formData, setFormData] = useState({
        taskName: "",
        linkedRecipe: "",
        targetQuantity: "",
        assignedTo: "",
        dueTime: "",
        notes: "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((currentFormData) => {
            const updatedFormData = { ...currentFormData, [name]: value };

            // Clearing the recipe means this is now a plain task —
            // clear its quantity too so we don't submit a stale number.
            if (name === "linkedRecipe" && value === "") {
                updatedFormData.targetQuantity = "";
            }

            return updatedFormData;
        });
    };

    const { submit, error, saving } = useSubmit(onSubmit);

    const handleSubmit = (event) => {
        event.preventDefault();

        submit({
            taskName: formData.taskName,
            // "" means "No recipe" in the dropdown; the database needs null for that.
            linkedRecipe: formData.linkedRecipe || null,
            targetQuantity: formData.linkedRecipe ? Number(formData.targetQuantity) : null,
            assignedTo: formData.assignedTo,
            dueTime: formData.dueTime,
            notes: formData.notes,
        });
    };

    const selectedRecipe = prepRecipes.find(
        (recipe) => recipe._id === formData.linkedRecipe
    );

    return (
        <section className="panel form-panel">
            <div className="panel-header">
                <div>
                    <h2>Add Prep Task</h2>
                    <p className="panel-subtitle">
                        Add a recipe-based prep item, or a plain reminder for the team.
                    </p>
                </div>
            </div>

            <form className="stock-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <label>
                        Task Name
                        <input
                            name="taskName"
                            value={formData.taskName}
                            onChange={handleChange}
                            placeholder="e.g. Make garlic mayo, Slice ham, Call supplier"
                            required
                        />
                    </label>

                    <label>
                        Linked Recipe
                        <select
                            name="linkedRecipe"
                            value={formData.linkedRecipe}
                            onChange={handleChange}
                        >
                            <option value="">No recipe — just a task</option>
                            {prepRecipes.map((recipe) => (
                                <option key={recipe._id} value={recipe._id}>
                                    {recipe.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {formData.linkedRecipe && (
                        <label>
                            Target Quantity ({selectedRecipe?.outputUnit})
                            <input
                                name="targetQuantity"
                                type="number"
                                step="0.001"
                                value={formData.targetQuantity}
                                onChange={handleChange}
                                placeholder={`e.g. ${selectedRecipe?.outputQuantity || 1}`}
                                required
                            />
                        </label>
                    )}

                    <label>
                        Assigned To
                        <input
                            name="assignedTo"
                            value={formData.assignedTo}
                            onChange={handleChange}
                            placeholder="Optional"
                        />
                    </label>

                    <label>
                        Due
                        <input
                            name="dueTime"
                            value={formData.dueTime}
                            onChange={handleChange}
                            placeholder="e.g. Before lunch service"
                        />
                    </label>
                </div>

                <label className="full-width-label">
                    Notes
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Optional"
                        rows="3"
                    />
                </label>
                {error && <p className="error">{error}</p>}

                <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-button">
                        Add Task
                    </button>
                </div>
            </form>
        </section>
    );
}

export default CreatePrepTaskForm;