function RecipesView({ recipes, onAddRecipe }) {
  return (
    <section className="panel stock-table-panel">
      <div className="panel-header">
        <div>
          <h2>Recipes</h2>
          <p className="panel-subtitle">
            Standard recipes created by the head chef for prep and production.
          </p>
        </div>

        <div className="panel-actions">
          <span>{recipes.length}</span>
          <button className="primary-button" onClick={onAddRecipe}>
            Add Recipe
          </button>
        </div>
      </div>

      {recipes.length === 0 ? (
        <p className="muted">No recipes created yet.</p>
      ) : (
        <div className="table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Output</th>
                <th>Ingredients</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe._id}>
                  <td>
                    <strong>{recipe.name}</strong>
                  </td>

                  <td>
                    <span className={`status-pill ${recipe.recipeType}`}>
                      {recipe.recipeType || "production"}
                    </span>
                  </td>

                  <td>
                    {recipe.recipeType === "prep" ? (
                      <>
                        {recipe.outputQuantity} {recipe.outputUnit}{" "}
                        {recipe.outputStockItem?.name
                          ? `of ${recipe.outputStockItem.name}`
                          : ""}
                      </>
                    ) : (
                      <>
                        1 {recipe.outputUnit}
                        {recipe.portionsPerOutput
                          ? ` / ${recipe.portionsPerOutput} portions`
                          : ""}
                      </>
                    )}
                  </td>

                  <td>
                    {recipe.ingredients?.map((ingredient, index) => (
                      <div key={index}>
                        <strong>
                          {ingredient.stockItem?.name || "Unknown item"}
                        </strong>{" "}
                        {ingredient.quantity} {ingredient.unit}
                        {ingredient.isOptional ? " optional" : ""}
                      </div>
                    ))}
                  </td>

                  <td>{recipe.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default RecipesView;
