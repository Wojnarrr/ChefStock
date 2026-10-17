import {useTableControls} from "../hooks/useTableControls.js";
function PrepTasksView({ prepTasks, onAddPrepTask, onCompleteTask }) {
    const handleCompleteClick = (task) => {
        if (task.linkedRecipe) {
            const confirmed = window.confirm(
                `Mark "${task.taskName}" done? This will deduct ${task.targetQuantity} ${task.linkedRecipe.outputUnit} worth of ingredients from stock.`
            );

            if (!confirmed) {
                return;
            }
        }

        onCompleteTask(task._id);
    };
    const controls = useTableControls(prepTasks, {
        getSearchText: (task) => `${task.taskName} ${task.assignedTo} ${task.linkedRecipe?.name ?? ""}`,
        filters: {
            todo: { label: "To do", test: (task) => task.status !== "done" },
            done: { label: "Done", test: (task) => task.status === "done" },
        },
        sortOptions: {
            added: { label: "Order added", compare: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
            recent: {
                label: "Most recent",
                compare: (a, b) => new Date(b.completedAt ?? b.createdAt) - new Date(a.completedAt ?? a.createdAt),
            },
        },
    });
    return (
        <section className="panel stock-table-panel">
            <div className="panel-header">
                <div>
                    <h2>Prep List</h2>
                    <p className="panel-subtitle">
                        Today's prep tasks, reminders, and recipe-based prep.
                    </p>
                </div>

                <div className="panel-actions">
                    <span>{prepTasks.length}</span>
                    <button className="primary-button" onClick={onAddPrepTask}>
                        Add Task
                    </button>
                </div>
            </div>

            {prepTasks.length === 0 ? (
                <p className="muted">No prep tasks yet.</p>
            ) : (
                <div className="table-wrapper">
                    <table className="stock-table">
                        <thead>
                        <tr>
                            <th>Task</th>
                            <th>Recipe</th>
                            <th>Assigned To</th>
                            <th>Due</th>
                            <th>Status</th>
                            <th>Notes</th>
                            <th></th>
                        </tr>
                        </thead>

                        <tbody>
                        {prepTasks.map((task) => (
                            <tr key={task._id}>
                                <td>
                                    <strong>{task.taskName}</strong>
                                </td>

                                <td>
                                    {task.linkedRecipe
                                        ? `${task.linkedRecipe.name} × ${task.targetQuantity} ${task.linkedRecipe.outputUnit}`
                                        : "—"}
                                </td>

                                <td>{task.assignedTo || "—"}</td>
                                <td>{task.dueTime || "—"}</td>

                                <td>
                    <span className={`status-pill ${task.status}`}>
                      {task.status.replace("_", " ")}
                    </span>
                                </td>

                                <td>{task.notes || "—"}</td>

                                <td>
                                    {task.status !== "done" && (
                                        <button
                                            className="secondary-button"
                                            onClick={() => handleCompleteClick(task)}
                                        >
                                            Mark Done
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default PrepTasksView;