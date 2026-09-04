function PrepBatchesView({ prepBatches, onAddPrepBatch }) {
  return (
    <section className="panel stock-table-panel">
      <div className="panel-header">
        <div>
          <h2>Prep Batches</h2>
          <p className="panel-subtitle">
            Kitchen prep that converts raw or delivered stock into prepared items.
          </p>
        </div>

        <div className="panel-actions">
          <span>{prepBatches.length}</span>
          <button className="primary-button" onClick={onAddPrepBatch}>
            Add Prep Batch
          </button>
        </div>
      </div>

      {prepBatches.length === 0 ? (
        <p className="muted">No prep batches recorded yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Inputs Used</th>
                <th>Outputs Produced</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {prepBatches.map((prepBatch) => (
                <tr key={prepBatch._id}>
                  <td>{new Date(prepBatch.createdAt).toLocaleDateString()}</td>

                  <td>
                    {prepBatch.inputItems?.map((item, index) => (
                      <div key={index}>
                        <strong>{item.stockItem?.name || "Unknown item"}</strong>{" "}
                        -{item.quantityUsed} {item.unit}
                      </div>
                    ))}
                  </td>

                  <td>
                    {prepBatch.outputItems?.map((item, index) => (
                      <div key={index}>
                        <strong>{item.stockItem?.name || "Unknown item"}</strong>{" "}
                        +{item.quantityProduced} {item.unit}
                      </div>
                    ))}
                  </td>

                  <td>{prepBatch.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default PrepBatchesView;
