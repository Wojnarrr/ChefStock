import { useTableControls } from "../hooks/useTableControls";
import { TableControls, Pagination } from "../components/TableControls";
import { formatDate } from "../utils/format";

const newest = (a, b) => new Date(b.productionDate) - new Date(a.productionDate);

function ProductionView({ productionBatches, onAddProductionBatch }) {
    const controls = useTableControls(productionBatches, {
        getSearchText: (batch) =>
            [batch.notes, ...batch.itemsProduced.map((item) => item.recipe?.name)].join(" "),
        sortOptions: {
            newest: { label: "Newest first", compare: newest },
            oldest: { label: "Oldest first", compare: (a, b) => newest(b, a) },
        },
    });
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
            <TableControls controls={controls} placeholder="..." />
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
                        {controls.rows.map((batch) => (
                            <tr key={batch._id}>
                                <td>{formatDate(batch.productionDate)}</td>

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
            <Pagination controls={controls} />
        </section>
    );
}

export default ProductionView;