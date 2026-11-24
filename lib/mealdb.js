
const BASE_URL = process.env.NEXT_PUBLIC_THEMEALDB_API_URL;

const verificarConfiguracion = () => {
  if (!BASE_URL) {
    throw new Error(
      "No se encontró la configuración de TheMealDB. Verifica tu archivo .env.local."
    );
  }
};

const consultarAPI = async (endpoint, mensajeError) => {
  verificarConfiguracion();

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);

    if (!response.ok) {
      throw new Error(mensajeError);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "No se pudo conectar con TheMealDB. Verifica tu conexión a internet."
      );
    }

    throw error;
  }
};

// Buscar recetas por nombre
export async function getRecipesByName(name) {
  if (!name.trim()) return [];

  const data = await consultarAPI(
    `search.php?s=${encodeURIComponent(name)}`,
    "Error al buscar recetas."
  );

  return data.meals || [];
}

// Buscar una receta por su ID
export async function getRecipeById(id) {
  const data = await consultarAPI(
    `lookup.php?i=${encodeURIComponent(id)}`,
    "Error al consultar la receta."
  );

  return data.meals?.[0] || null;
}

// Obtener una receta aleatoria
export async function getRandomRecipe() {
  const data = await consultarAPI(
    "random.php",
    "Error al obtener una receta aleatoria."
  );

  return data.meals?.[0] || null;
}

// Obtener todas las categorías
export async function getCategories() {
  const data = await consultarAPI(
    "categories.php",
    "Error al consultar las categorías."
  );

  return data.categories || [];
}

// Obtener recetas de una categoría
export async function getRecipesByCategory(category) {
  if (!category.trim()) return [];

  const data = await consultarAPI(
    `filter.php?c=${encodeURIComponent(category)}`,
    "Error al filtrar recetas por categoría."
  );

  return data.meals || [];
}

// Obtener recetas por ingrediente
export async function getRecipesByIngredient(ingredient) {
  if (!ingredient.trim()) return [];

  const data = await consultarAPI(
    `filter.php?i=${encodeURIComponent(ingredient)}`,
    "Error al buscar recetas por ingrediente."
  );

  return data.meals || [];
}
