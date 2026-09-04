function ProductionView({ productionBatches, onAddProductionBatch }) {
    return (
        <section className="panel stock-table-panel">
            <div className="panel-header">
                <div>
                    <h2>Production</h2>
                    <p className="panel-subtitle">
                        Batches made from recipes, with stock deducted automatically.
                    </p>
                </div>

                <div className="panel-actions">
                    <span>{productionBatches.length}</span>
                    <button className="primary-button" onClick={onAddProductionBatch}>
                        Add Production Batch
                    </button>
                </div>
            </div>

            {productionBatches.length === 0 ? (
                <p className="muted">No production recorded yet.</p>
            ) : (
                <div className="table-wrapper">
                    <table className="stock-table">
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>Items Produced</th>
                            <th>Notes</th>
                        </tr>
                        </thead>

                        <tbody>
                        {productionBatches.map((batch) => (
                            <tr key={batch._id}>
                                <td>{new Date(batch.productionDate).toLocaleDateString()}</td>

                                <td>
                                    {batch.itemsProduced.map((item, index) => (
                                        <div key={index}>
                                            <strong>{item.recipe?.name || "Unknown recipe"}</strong>{" "}
                                            × {item.quantityProduced} {item.outputUnit}
                                        </div>
                                    ))}
                                </td>

                                <td>{batch.notes || "—"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default ProductionView;