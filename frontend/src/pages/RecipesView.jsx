import {useAuth} from "../context/AuthContext.jsx";
import { useTableControls } from "../hooks/useTableControls";
import { TableControls, Pagination } from "../components/TableControls";

const byName = (a, b) => a.name.localeCompare(b.name);

function RecipesView({ recipes, onAddRecipe, onEditRecipe, onDeleteRecipe }) {
  const {role} = useAuth()
  const isOwner = role === 'owner';
  const controls = useTableControls(recipes, {
    getSearchText: (recipe) => `${recipe.name} ${recipe.notes ?? ""}`,
    filters: {
      all: { label: "All", test: () => true },
      sell: { label: "Sell", test: (recipe) => recipe.recipeType === "production" },
      prep: { label: "Prep", test: (recipe) => recipe.recipeType === "prep" },
    },
    sortOptions: {
      name: { label: "Name A–Z", compare: byName },
      type: {
        label: "Type",
        compare: (a, b) => a.recipeType.localeCompare(b.recipeType) || byName(a, b),
      },
    },
  });
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
            {isOwner && (
            <button className="primary-button" onClick={onAddRecipe}>
              Add Recipe
            </button>
            )}
          </div>
        </div>
        <TableControls controls={controls} placeholder="..." />

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
                  {isOwner && (
                  <th></th>
                  )}
                </tr>
                </thead>

                <tbody>
                {controls.rows.map((recipe) => (
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
                      {isOwner && (
                      <td className="table-actions">
                        <button className="link-button" onClick={() => onEditRecipe(recipe)}>
                          Edit
                        </button>
                        <button className="link-button danger" onClick={() => onDeleteRecipe(recipe)}>
                          Delete
                        </button>
                      </td>
                      )}
                    </tr>
                ))}
                </tbody>
              </table>

            </div>
        )}
        {controls.total === 0 && <p className="muted">Nothing matches.</p>}
        <Pagination controls={controls} />

      </section>
  );
}

export default RecipesView;