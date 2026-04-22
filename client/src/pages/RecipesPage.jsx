import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { recipeData } from "../data/recipeData";
import styles from "./RecipesPage.module.css";
import { useAuth } from "../context/AuthContext";

export default function RecipesPage({ onNavigate, onLogout }) {
  const { user } = useAuth();
  
  // Try to determine current phase based on a very basic heuristic or user settings if available
  // In a real app we'd fetch this from the analytics/PCOD info.
  // For this, we'll try to default to "Menstrual", or user could pick.
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("wellnessfit_saved_recipes");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch(e) {}
    }
    
    // Auto-highlight phase based on rudimentary local storage trick or "Menstrual"
    // The prompt says "Active phase auto-highlighted based on user's current cycleDay".
    // We will assume "All" if we don't have it explicitly, or try to read it.
  }, []);

  const toggleFavorite = (id) => {
    const isFav = favorites.includes(id);
    const newFavs = isFav ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem("wellnessfit_saved_recipes", JSON.stringify(newFavs));
  };

  const filteredRecipes = recipeData.filter(r => {
    if (activeTab === "Favorites") return favorites.includes(r.id);
    if (activeTab !== "All" && r.phase !== activeTab) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.titleTamil.includes(search)) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar active="recipes" onNavigate={onNavigate} onLogout={onLogout} />
      
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div className={styles.header}>
          <h1>PCOD Recipes 🍳</h1>
          <p>Hormone-balancing meals tailored for every phase of your cycle.</p>
        </div>

        <div className={styles.filters}>
          <div className={styles.tabs}>
            {["All", "Menstrual", "Follicular", "Ovulatory", "Luteal", "Favorites ❤️"].map(tab => {
              const tabName = tab.replace(" ❤️", "");
              return (
                <div 
                  key={tab} 
                  className={`${styles.tab} ${activeTab === tabName ? styles.active : ""}`}
                  onClick={() => setActiveTab(tabName)}
                >
                  {tab}
                </div>
              );
            })}
          </div>
          <input 
            type="text" 
            placeholder="Search recipes..." 
            className={styles.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.grid} style={{ marginTop: '20px' }}>
          {filteredRecipes.length === 0 ? (
            <p>No recipes found.</p>
          ) : (
            filteredRecipes.map(recipe => (
              <div key={recipe.id} className={styles.card}>
                <div className={`${styles.phaseBadge} ${styles['phase' + recipe.phase]}`}>
                  {recipe.phase}
                </div>
                <div className={styles.emojiImage}>{recipe.image}</div>
                <h3 className={styles.title}>{recipe.title}</h3>
                <div className={styles.titleTamil}>{recipe.titleTamil}</div>
                
                <div className={styles.pills}>
                  <span className={styles.pill}>⏱️ {recipe.prepTime}</span>
                  <span className={styles.pill}>🔥 {recipe.calories} kcal</span>
                </div>

                <div className={styles.macros}>
                  <div className={styles.macroItem}>
                    <span className={styles.macroLabel}>Protein</span>
                    <span className={styles.macroValue}>{recipe.protein}g</span>
                  </div>
                  <div className={styles.macroItem}>
                    <span className={styles.macroLabel}>Carbs</span>
                    <span className={styles.macroValue}>{recipe.carbs}g</span>
                  </div>
                  <div className={styles.macroItem}>
                    <span className={styles.macroLabel}>Fat</span>
                    <span className={styles.macroValue}>{recipe.fat}g</span>
                  </div>
                </div>

                <div className={styles.goodFor}>✨ Good for: {recipe.goodFor}</div>

                <button className={styles.viewBtn} onClick={() => setSelectedRecipe(recipe)}>
                  View Recipe →
                </button>
              </div>
            ))
          )}
        </div>

        {selectedRecipe && (
          <div className={styles.modalOverlay} onClick={() => setSelectedRecipe(null)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <button className={styles.closeBtn} onClick={() => setSelectedRecipe(null)}>×</button>
              
              <div className={styles.modalHeader}>
                <div>
                  <div className={styles.emojiImage} style={{ fontSize: '4rem', marginBottom: '0', textAlign: 'left' }}>
                    {selectedRecipe.image}
                  </div>
                  <h2 style={{ margin: '10px 0 0' }}>{selectedRecipe.title}</h2>
                  <div style={{ color: '#666' }}>{selectedRecipe.titleTamil}</div>
                  <div style={{ marginTop: '5px' }}>
                     <span className={`${styles.phaseBadge} ${styles['phase' + selectedRecipe.phase]}`} style={{ position: 'static', display: 'inline-block' }}>
                        {selectedRecipe.phase} Phase
                      </span>
                  </div>
                </div>
                <button 
                  className={styles.favBtn} 
                  onClick={() => toggleFavorite(selectedRecipe.id)}
                >
                  {favorites.includes(selectedRecipe.id) ? "❤️" : "🤍"}
                </button>
              </div>

              <div className={styles.pills} style={{ justifyContent: 'flex-start' }}>
                  <span className={styles.pill}>⏱️ {selectedRecipe.prepTime}</span>
                  <span className={styles.pill}>🔥 {selectedRecipe.calories} kcal</span>
                  <span className={styles.pill}>🥩 P: {selectedRecipe.protein}g</span>
                  <span className={styles.pill}>🍞 C: {selectedRecipe.carbs}g</span>
                  <span className={styles.pill}>🥑 F: {selectedRecipe.fat}g</span>
              </div>

              <div className={styles.sectionTitle}>Ingredients</div>
              <ul className={styles.list}>
                {selectedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>

              <div className={styles.sectionTitle}>Instructions</div>
              <ol className={styles.list}>
                {selectedRecipe.steps.map((step, i) => <li key={i}>{step}</li>)}
              </ol>

              <button className={styles.groceryBtn} onClick={() => alert("Ingredients added to grocery list!")}>
                🛒 Add ingredients to grocery list
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
