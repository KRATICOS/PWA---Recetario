
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

import InstallPrompt from "@/app/components/InstallPromt.jsx";

import {
  getRecipesByName,
  getRecipesByCategory,
} from "@/lib/mealdb";

const categorias = [
  { nombre: "Desayunos", api: "Breakfast", icono: "🍳" },
  { nombre: "Pollo", api: "Chicken", icono: "🍗" },
  { nombre: "Pastas", api: "Pasta", icono: "🍝" },
  { nombre: "Mariscos", api: "Seafood", icono: "🦐" },
  { nombre: "Postres", api: "Dessert", icono: "🍰" },
  { nombre: "Vegetarianas", api: "Vegetarian", icono: "🥗" },
];

export default function Home() {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Desayunos");

  const [favoritos, setFavoritos] = useState([]);
  const [favoritosCargados, setFavoritosCargados] = useState(false);

  // Confirmación personalizada para eliminar favoritos
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [recetaPendiente, setRecetaPendiente] = useState(null);

  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Navegación entre apartados
  const [vista, setVista] = useState("inicio");
  const [vistaAnterior, setVistaAnterior] = useState("inicio");

  // Información de la receta seleccionada
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  // Notificaciones Toast
  const [toast, setToast] = useState(null);

  // Cerrar automáticamente las notificaciones después de 3 segundos
  useEffect(() => {
    if (!toast) return;

    const temporizador = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(temporizador);
  }, [toast]);

  // Mostrar una notificación
  const mostrarToast = (mensaje, tipo = "success") => {
    setToast({
      mensaje,
      tipo,
      id: Date.now(),
    });
  };

  // Cargar favoritos desde localStorage
  useEffect(() => {
    try {
      const guardados = localStorage.getItem("chefCasaFavoritos");

      if (guardados) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFavoritos(JSON.parse(guardados));
      }
    } catch (err) {
      console.error("Error al cargar favoritos:", err);
    } finally {
      setFavoritosCargados(true);
    }
  }, []);

  // Guardar favoritos automáticamente
  useEffect(() => {
    if (favoritosCargados) {
      try {
        localStorage.setItem(
          "chefCasaFavoritos",
          JSON.stringify(favoritos)
        );
      } catch (err) {
        console.error("No se pudieron guardar los favoritos:", err);
      }
    }
  }, [favoritos, favoritosCargados]);

  // Cargar recetas iniciales
  useEffect(() => {
    const cargarRecetas = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRecipesByCategory("Breakfast");
        setRecetas(data || []);
      } catch (err) {
        setError(err.message || "No se pudieron cargar las recetas.");
      } finally {
        setLoading(false);
      }
    };

    cargarRecetas();
  }, []);

  // Buscar recetas
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!busqueda.trim()) {
      cargarPorCategoria(categoriaSeleccionada);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCategoriaSeleccionada("Todas");
      setVista("inicio");

      const data = await getRecipesByName(busqueda.trim());

      setRecetas(data || []);
    } catch (err) {
      setError(err.message || "Error al buscar recetas.");
      setRecetas([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar recetas por categoría
  const cargarPorCategoria = async (nombreCategoria) => {
    try {
      setLoading(true);
      setError("");
      setBusqueda("");
      setVista("inicio");

      if (nombreCategoria === "Todas") {
        const resultados = await Promise.all(
          categorias.map((categoria) =>
            getRecipesByCategory(categoria.api)
          )
        );

        const recetasUnicas = Array.from(
          new Map(
            resultados
              .flat()
              .map((receta) => [receta.idMeal, receta])
          ).values()
        );

        setRecetas(recetasUnicas);
        setCategoriaSeleccionada("Todas");
      } else {
        const categoria = categorias.find(
          (item) => item.nombre === nombreCategoria
        );

        if (!categoria) return;

        const data = await getRecipesByCategory(categoria.api);

        setRecetas(data || []);
        setCategoriaSeleccionada(nombreCategoria);
      }
    } catch (err) {
      setError(err.message || "No se pudieron cargar las recetas.");
      setRecetas([]);
    } finally {
      setLoading(false);
    }
  };

  // Consultar los detalles completos de una receta
  const obtenerDetalleReceta = async (idMeal) => {
    const respuesta = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`
    );

    if (!respuesta.ok) {
      throw new Error("No se pudo consultar la receta.");
    }

    const data = await respuesta.json();

    if (!data.meals || data.meals.length === 0) {
      throw new Error("No encontramos los detalles de esta receta.");
    }

    return data.meals[0];
  };

  // Guardar una copia de la imagen en Cache Storage cuando sea posible
  const guardarImagenFavorita = async (url) => {
    if (!url || typeof window === "undefined" || !("caches" in window)) {
      return;
    }

    try {
      const cache = await caches.open("chefCasa-favorite-images-v1");
      const respuesta = await fetch(url, { mode: "cors" });

      if (respuesta.ok) {
        await cache.put(url, respuesta.clone());
      }
    } catch (err) {
      console.warn("No se pudo guardar la imagen en caché:", err);
    }
  };

  // Agregar o quitar favoritos. Al agregarlos se intenta guardar la receta completa.
  const alternarFavorito = async (receta) => {
    const existe = favoritos.some(
      (item) => item.idMeal === receta.idMeal
    );

    if (existe) {
      setRecetaPendiente(receta);
      setMostrarConfirmacion(true);
      return;
    }

    let recetaCompleta = receta;

    try {
      if (!receta.strInstructions) {
        recetaCompleta = await obtenerDetalleReceta(receta.idMeal);
      }
    } catch (err) {
      console.warn(
        "No se pudieron descargar los detalles. Se guardará la información disponible:",
        err
      );
    }

    const yaExiste = favoritos.some(
      (item) => item.idMeal === receta.idMeal
    );

    if (yaExiste) return;

    setFavoritos((actuales) => {
      if (actuales.some((item) => item.idMeal === receta.idMeal)) {
        return actuales;
      }

      return [...actuales, recetaCompleta];
    });

    if (recetaCompleta.strMealThumb) {
      guardarImagenFavorita(recetaCompleta.strMealThumb);
    }

    mostrarToast("¡Receta agregada a favoritos!", "success");
  };

  // Confirmar eliminación de favoritos
  const confirmarEliminacion = () => {
    if (!recetaPendiente) return;

    setFavoritos((actuales) =>
      actuales.filter(
        (item) => item.idMeal !== recetaPendiente.idMeal
      )
    );

    setMostrarConfirmacion(false);
    setRecetaPendiente(null);

    mostrarToast("Receta eliminada de favoritos", "delete");
  };

  // Rechazar eliminación de favoritos
  const cancelarEliminacion = () => {
    setMostrarConfirmacion(false);
    setRecetaPendiente(null);
  };

  // Verificar si una receta es favorita
  const esFavorito = (id) => {
    return favoritos.some(
      (item) => item.idMeal === id
    );
  };

  // Abrir apartado de favoritos
  const abrirFavoritos = () => {
    setVista("favoritos");
    setRecetaSeleccionada(null);
  };

  // Abrir los detalles: primero buscar una copia completa local y luego consultar la API
  const abrirDetalle = async (receta) => {
    setVistaAnterior(vista);
    setVista("detalle");
    setRecetaSeleccionada(null);
    setLoadingDetalle(true);
    setErrorDetalle("");

    try {
      const recetaGuardada = favoritos.find(
        (item) => item.idMeal === receta.idMeal
      );

      // Las recetas completas guardadas en favoritos se muestran sin Internet
      if (receta.strInstructions) {
        setRecetaSeleccionada(receta);
        return;
      }

      if (recetaGuardada?.strInstructions) {
        setRecetaSeleccionada(recetaGuardada);
        return;
      }

      // Compatibilidad con favoritos antiguos que solo guardaban datos básicos
      const recetaCompleta = await obtenerDetalleReceta(receta.idMeal);
      setRecetaSeleccionada(recetaCompleta);

      setFavoritos((actuales) =>
        actuales.map((item) =>
          item.idMeal === recetaCompleta.idMeal
            ? recetaCompleta
            : item
        )
      );

      if (recetaCompleta.strMealThumb) {
        guardarImagenFavorita(recetaCompleta.strMealThumb);
      }
    } catch (err) {
      setErrorDetalle(
        "Esta receta todavía no tiene sus detalles guardados. Conéctate a Internet una vez, abre la receta y vuelve a guardarla en favoritos para consultarla después sin conexión."
      );
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Regresar al apartado anterior
  const regresar = () => {
    setVista(vista === "detalle" ? vistaAnterior : "inicio");
    setRecetaSeleccionada(null);
    setErrorDetalle("");
  };

  // Obtener ingredientes y cantidades de TheMealDB
  const obtenerIngredientes = (receta) => {
    const ingredientes = [];

    for (let i = 1; i <= 20; i++) {
      const ingrediente = receta[`strIngredient${i}`]?.trim();
      const cantidad = receta[`strMeasure${i}`]?.trim();

      if (ingrediente) {
        ingredientes.push({
          nombre: ingrediente,
          cantidad: cantidad || "Al gusto",
        });
      }
    }

    return ingredientes;
  };

  // Separar instrucciones por párrafos
  const obtenerInstrucciones = (texto) => {
    return (texto || "")
      .split(/\r\n|\n|\r/)
      .map((paso) => paso.trim())
      .filter(Boolean);
  };

  return (
    <main className="min-h-screen bg-[#fffaf3] text-[#30251f]">

      <InstallPrompt />

      {/* NOTIFICACIONES TOAST */}
      {toast && (
        <div
          key={toast.id}
          role="alert"
          aria-live="polite"
          className={`fixed right-5 top-24 z-[200] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-2xl border bg-white px-5 py-4 shadow-xl animate-in slide-in-from-right-5 fade-in duration-300 ${
            toast.tipo === "success"
              ? "border-green-200 text-green-700"
              : "border-red-200 text-red-600"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
              toast.tipo === "success"
                ? "bg-green-100"
                : "bg-red-100"
            }`}
          >
            {toast.tipo === "success" ? "❤️" : "🗑️"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">
              {toast.tipo === "success"
                ? "¡Excelente!"
                : "Favoritos actualizados"}
            </p>

            <p className="mt-1 text-xs font-medium text-stone-500">
              {toast.mensaje}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Cerrar notificación"
            className="ml-1 shrink-0 text-xl text-stone-400 transition hover:text-stone-700"
          >
            ×
          </button>
        </div>
      )}

      {/* ENCABEZADO */}
      <header className="sticky top-0 z-50 border-b border-orange-100 bg-[#fffaf3]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10">

          <button
            onClick={() => {
              setVista("inicio");
              setRecetaSeleccionada(null);
            }}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-2xl shadow-md shadow-orange-200">
              🍳
            </div>

            <div className="text-left">
              <h1 className="text-xl font-black tracking-tight">
                Chef<span className="text-orange-500">Casa</span>
              </h1>

              <p className="text-[10px] font-semibold uppercase tracking-[2px] text-stone-400">
                Cocina con pasión
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-stone-600 md:flex">

            <button
              onClick={() => setVista("inicio")}
              className={`transition hover:text-orange-500 ${
                vista === "inicio" ? "text-orange-500" : ""
              }`}
            >
              Inicio
            </button>

            <button
              onClick={() => {
                setVista("inicio");
                document.getElementById("categorias")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="transition hover:text-orange-500"
            >
              Categorías
            </button>

            <button
              onClick={() => {
                setVista("inicio");
                document.getElementById("recetas")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="transition hover:text-orange-500"
            >
              Recetas
            </button>

            <button
              onClick={abrirFavoritos}
              className={`flex items-center gap-2 transition hover:text-orange-500 ${
                vista === "favoritos" ? "text-orange-500" : ""
              }`}
            >
              ❤️ Favoritos
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                {favoritos.length}
              </span>
            </button>
          </nav>

          <button
            onClick={abrirFavoritos}
            className="rounded-full bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
          >
            ❤️ <span className="hidden sm:inline">Mis favoritos</span>
            <span className="sm:hidden">{favoritos.length}</span>
          </button>

        </div>
      </header>

      {/* VISTA DE DETALLES */}
      {vista === "detalle" && (
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-10">

          <button
            onClick={regresar}
            className="mb-8 flex items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-600 shadow-sm transition hover:bg-orange-50"
          >
            ← Regresar
          </button>

          {loadingDetalle && (
            <div className="py-24 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />

              <p className="mt-5 font-semibold text-stone-500">
                Cargando receta...
              </p>
            </div>
          )}

          {!loadingDetalle && errorDetalle && (
            <div className="rounded-3xl bg-white p-10 text-center">
              <p className="text-4xl">⚠️</p>
              <h2 className="mt-4 text-xl font-black">
                No pudimos abrir la receta
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                {errorDetalle}
              </p>
              <button
                onClick={regresar}
                className="mt-5 rounded-full bg-orange-500 px-6 py-3 font-bold text-white"
              >
                Regresar
              </button>
            </div>
          )}

          {!loadingDetalle && recetaSeleccionada && (
            <div>

              {/* IMAGEN Y NOMBRE */}
              <div className="grid items-center gap-10 lg:grid-cols-2">

                <div className="relative overflow-hidden rounded-4xl shadow-xl shadow-orange-100">
                  <Image
                    src={recetaSeleccionada.strMealThumb}
                    alt={recetaSeleccionada.strMeal}
                    width={1000}
                    height={750}
                    unoptimized
                    priority
                    className="h-87.5 w-full object-cover sm:h-120"
                  />
                </div>

                <div>
                  <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-600">
                    🍽️ {recetaSeleccionada.strCategory || "Receta"}
                  </span>

                  <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
                    {recetaSeleccionada.strMeal}
                  </h1>

                  <p className="mt-4 text-stone-500">
                    {recetaSeleccionada.strArea
                      ? `Cocina de origen: ${recetaSeleccionada.strArea}`
                      : "Descubre cómo preparar esta deliciosa receta."}
                  </p>

                  <button
                    onClick={() =>
                      alternarFavorito(recetaSeleccionada)
                    }
                    className="mt-7 flex items-center gap-3 rounded-2xl border border-orange-200 bg-white px-6 py-4 font-bold text-orange-600 shadow-sm transition hover:bg-orange-50"
                  >
                    {esFavorito(recetaSeleccionada.idMeal)
                      ? "❤️ Quitar de favoritos"
                      : "🤍 Agregar a favoritos"}
                  </button>
                </div>

              </div>

              {/* INGREDIENTES E INSTRUCCIONES */}
              <div className="mt-16 grid gap-10 lg:grid-cols-3">

                {/* INGREDIENTES */}
                <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm lg:col-span-1">

                  <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                    Lo que necesitas
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Ingredientes
                  </h2>

                  <p className="mt-2 text-sm text-stone-400">
                    Lista de ingredientes y cantidades.
                  </p>

                  <div className="mt-7 space-y-4">
                    {obtenerIngredientes(recetaSeleccionada).map(
                      (ingrediente, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3"
                        >
                          <span className="text-sm font-semibold">
                            {ingrediente.nombre}
                          </span>

                          <span className="text-right text-xs font-bold text-orange-500">
                            {ingrediente.cantidad}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                </div>

                {/* PREPARACIÓN */}
                <div className="rounded-3xl border border-orange-100 bg-white p-7 shadow-sm lg:col-span-2">

                  <p className="text-sm font-bold uppercase tracking-widest text-orange-500">
                    Manos a la obra
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Preparación
                  </h2>

                  <p className="mt-2 text-sm text-stone-400">
                    Sigue estos pasos para preparar tu receta.
                  </p>

                  <div className="mt-8 space-y-7">
                    {obtenerInstrucciones(
                      recetaSeleccionada.strInstructions
                    ).map((paso, index) => (
                      <div
                        key={index}
                        className="flex gap-5"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 font-black text-orange-600">
                          {index + 1}
                        </div>

                        <div className="flex-1 border-b border-stone-100 pb-6">
                          <h3 className="font-black">
                            Paso {index + 1}
                          </h3>

                          <p className="mt-2 text-sm leading-7 text-stone-500">
                            {paso}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {recetaSeleccionada.strYoutube && (
                    <a
                      href={recetaSeleccionada.strYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-600"
                    >
                      ▶ Ver video de preparación
                    </a>
                  )}

                </div>

              </div>

              {/* REGRESAR */}
              <div className="mt-12 text-center">
                <button
                  onClick={regresar}
                  className="rounded-full bg-orange-500 px-8 py-4 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                >
                  ← Regresar a las recetas
                </button>
              </div>

            </div>
          )}

        </section>
      )}

      {/* VISTA DE FAVORITOS */}
      {vista === "favoritos" && (
        <section className="mx-auto min-h-[70vh] max-w-7xl px-5 py-16 lg:px-10">

          <button
            onClick={regresar}
            className="mb-8 rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
          >
            ← Regresar al inicio
          </button>

          <div className="mb-10">
            <p className="text-sm font-bold uppercase tracking-[2px] text-orange-500">
              Tu colección personal
            </p>

            <h2 className="mt-3 text-4xl font-black">
              ❤️ Mis recetas favoritas
            </h2>

            <p className="mt-3 text-stone-400">
              Aquí encontrarás todas las recetas que has guardado.
            </p>

            <p className="mt-2 text-sm font-bold text-orange-500">
              {favoritos.length} recetas guardadas
            </p>
          </div>

          {!favoritosCargados ? (
            <p className="py-12 text-center text-stone-500">
              Cargando favoritos...
            </p>
          ) : favoritos.length === 0 ? (

            <div className="rounded-3xl border border-orange-100 bg-white px-5 py-16 text-center">

              <p className="text-6xl">💔</p>

              <h3 className="mt-6 text-2xl font-black">
                Todavía no tienes favoritos
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-400">
                Explora nuestras recetas y presiona el corazón de tus
                platillos favoritos para guardarlos aquí.
              </p>

              <button
                onClick={() => setVista("inicio")}
                className="mt-7 rounded-full bg-orange-500 px-7 py-3 font-bold text-white transition hover:bg-orange-600"
              >
                Explorar recetas
              </button>

            </div>

          ) : (

            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">

              {favoritos.map((receta) => (

                <article
                  key={receta.idMeal}
                  onClick={() => abrirDetalle(receta)}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-orange-50 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-100"
                >

                  <div className="relative overflow-hidden">

                    <Image
                      src={receta.strMealThumb}
                      alt={receta.strMeal}
                      width={700}
                      height={500}
                      unoptimized
                      className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
                    />

                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-orange-600">
                      {receta.strCategory || "Favorita"}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alternarFavorito(receta);
                      }}
                      aria-label="Quitar de favoritos"
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl shadow-md transition hover:scale-110"
                    >
                      ❤️
                    </button>

                  </div>

                  <div className="p-5">

                    <h3 className="text-lg font-black">
                      {receta.strMeal}
                    </h3>

                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4 text-xs font-semibold">
                      <span className="text-stone-400">
                        🍽️ Ver receta
                      </span>

                      <span className="text-orange-500">
                        Ver detalles →
                      </span>
                    </div>

                  </div>

                </article>

              ))}

            </div>
          )}

        </section>
      )}

      {/* VISTA PRINCIPAL */}
      {vista === "inicio" && (
        <>

          {/* PORTADA */}
          <section
            id="inicio"
            className="mx-auto max-w-7xl px-5 pb-16 pt-12 lg:px-10 lg:pt-20"
          >
            <div className="grid items-center gap-12 lg:grid-cols-2">

              <div>

                <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
                  ✨ Tu cocina, tu inspiración
                </span>

                <h2 className="mt-7 max-w-xl text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
                  Descubre el placer de{" "}
                  <span className="text-orange-500">cocinar.</span>
                </h2>

                <p className="mt-6 max-w-lg text-lg leading-8 text-stone-500">
                  Encuentra recetas deliciosas, descubre nuevos sabores
                  y prepara platillos increíbles desde la comodidad de tu hogar.
                </p>

                {/* BUSCADOR */}
                <form
                  onSubmit={handleSearch}
                  className="mt-9 flex max-w-xl items-center gap-3 rounded-2xl border border-orange-100 bg-white p-2 shadow-xl shadow-orange-100/50"
                >

                  <span className="pl-3 text-xl">🔎</span>

                  <input
                    type="text"
                    placeholder="¿Qué quieres cocinar hoy?"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3 text-sm text-stone-700 outline-none placeholder:text-stone-400"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    Buscar
                  </button>

                </form>

                <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-stone-500">
                  <span>✓ Recetas variadas</span>
                  <span>✓ Nuevos sabores</span>
                  <span>✓ Tus recetas favoritas</span>
                </div>

              </div>

              {/* IMAGEN PORTADA */}
              <div className="relative mx-auto w-full max-w-xl">

                <div className="absolute -right-5 -top-5 h-32 w-32 rounded-full bg-orange-200/60 blur-2xl" />

                <div className="absolute -bottom-5 -left-5 h-40 w-40 rounded-full bg-yellow-200/60 blur-2xl" />

                <div className="relative overflow-hidden rounded-4xl shadow-2xl shadow-orange-200/50">

                  <Image
                    src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200"
                    alt="Mesa con ingredientes frescos y comida"
                    width={900}
                    height={750}
                    priority
                    unoptimized
                    className="h-107.5 w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 p-8 text-white">
                    <p className="text-sm font-semibold text-orange-300">
                      INSPÍRATE Y DISFRUTA
                    </p>

                    <h3 className="mt-2 text-3xl font-black">
                      Cada receta tiene una historia.
                    </h3>
                  </div>

                </div>

                {/* TARJETA DE FAVORITOS */}
                <button
                  onClick={abrirFavoritos}
                  className="absolute -bottom-6 -left-4 rounded-2xl bg-white p-4 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl sm:-left-8"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
                      ❤️
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        Tus favoritas
                      </p>

                      <p className="text-xs text-stone-400">
                        {favoritos.length} recetas guardadas
                      </p>
                    </div>

                    <span className="ml-2 text-orange-500">→</span>

                  </div>

                </button>

              </div>

            </div>
          </section>

          {/* CATEGORÍAS */}
          <section id="categorias" className="bg-white py-16">

            <div className="mx-auto max-w-7xl px-5 lg:px-10">

              <div className="mb-9">
                <p className="text-sm font-bold uppercase tracking-[2px] text-orange-500">
                  Explora sabores
                </p>

                <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                  ¿Qué se te antoja?
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">

                {categorias.map((categoria) => (

                  <button
                    key={categoria.api}
                    onClick={() => cargarPorCategoria(categoria.nombre)}
                    className={`group rounded-2xl border p-5 text-center transition hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-50 hover:shadow-lg ${
                      categoriaSeleccionada === categoria.nombre
                        ? "border-orange-400 bg-orange-50"
                        : "border-stone-100 bg-[#fffaf3]"
                    }`}
                  >

                    <span className="text-4xl">
                      {categoria.icono}
                    </span>

                    <p className="mt-3 text-sm font-bold">
                      {categoria.nombre}
                    </p>

                  </button>

                ))}

              </div>

            </div>

          </section>

          {/* RECETAS */}
          <section
            id="recetas"
            className="mx-auto max-w-7xl px-5 py-16 lg:px-10"
          >

            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">

              <div>
                <p className="text-sm font-bold uppercase tracking-[2px] text-orange-500">
                  Para disfrutar
                </p>

                <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                  Recetas destacadas
                </h2>

                <p className="mt-2 text-stone-400">
                  Platillos que te encantarán preparar.
                </p>
              </div>

              <button
                onClick={() => cargarPorCategoria("Todas")}
                className="rounded-full border border-orange-200 px-5 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
              >
                Ver todas
              </button>

            </div>

            {/* FILTROS */}
            <div className="mb-7 flex flex-wrap gap-2">

              {["Todas", ...categorias.map((categoria) => categoria.nombre)].map(
                (categoria) => (

                  <button
                    key={categoria}
                    onClick={() => cargarPorCategoria(categoria)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      categoriaSeleccionada === categoria
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-white text-stone-500 hover:bg-orange-50 hover:text-orange-600"
                    }`}
                  >
                    {categoria}
                  </button>

                )
              )}

            </div>

            {/* CARGANDO */}
            {loading && (
              <div className="py-16 text-center">

                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />

                <p className="mt-5 text-sm font-semibold text-stone-500">
                  Preparando tus recetas...
                </p>

              </div>
            )}

            {/* ERROR */}
            {!loading && error && (
              <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-10 text-center">

                <p className="text-4xl">⚠️</p>

                <h3 className="mt-4 text-xl font-black text-red-700">
                  No pudimos cargar las recetas
                </h3>

                <p className="mt-2 text-sm text-red-500">
                  {error}
                </p>

                <button
                  onClick={() => cargarPorCategoria(categoriaSeleccionada)}
                  className="mt-5 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white"
                >
                  Intentar nuevamente
                </button>

              </div>
            )}

            {/* TARJETAS */}
            {!loading && !error && recetas.length > 0 && (

              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">

                {recetas.map((receta) => (

                  <article
                    key={receta.idMeal}
                    onClick={() => abrirDetalle(receta)}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-orange-50 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-100"
                  >

                    <div className="relative overflow-hidden">

                      <Image
                        src={receta.strMealThumb}
                        alt={receta.strMeal}
                        width={700}
                        height={500}
                        unoptimized
                        className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
                      />

                      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-orange-600">
                        {receta.strCategory ||
                          (categoriaSeleccionada === "Todas"
                            ? "Receta"
                            : categoriaSeleccionada)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alternarFavorito(receta);
                        }}
                        aria-label={
                          esFavorito(receta.idMeal)
                            ? "Quitar de favoritos"
                            : "Agregar a favoritos"
                        }
                        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl shadow-md transition hover:scale-110"
                      >
                        {esFavorito(receta.idMeal) ? "❤️" : "🤍"}
                      </button>

                    </div>

                    <div className="p-5">

                      <h3 className="text-lg font-black">
                        {receta.strMeal}
                      </h3>

                      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4 text-xs font-semibold">

                        <span className="text-stone-400">
                          🍽️ Ver receta
                        </span>

                        <span className="text-orange-500">
                          Ver detalles →
                        </span>

                      </div>

                    </div>

                  </article>

                ))}

              </div>

            )}

            {/* SIN RESULTADOS */}
            {!loading && !error && recetas.length === 0 && (

              <div className="rounded-3xl bg-white px-5 py-14 text-center">

                <p className="text-4xl">🍽️</p>

                <h3 className="mt-4 text-xl font-black">
                  No encontramos recetas
                </h3>

                <p className="mt-2 text-sm text-stone-400">
                  Intenta con otro nombre o selecciona una categoría diferente.
                </p>

                <button
                  onClick={() => cargarPorCategoria("Todas")}
                  className="mt-5 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white"
                >
                  Explorar recetas
                </button>

              </div>

            )}

          </section>

          {/* LLAMADO A LA ACCIÓN */}
          <section className="px-5 pb-16 lg:px-10">

            <div className="mx-auto max-w-7xl overflow-hidden rounded-4xl bg-[#30251f] px-7 py-12 text-center text-white sm:px-12">

              <p className="text-sm font-bold uppercase tracking-[3px] text-orange-400">
                El ingrediente secreto eres tú
              </p>

              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black sm:text-5xl">
                Hoy es un buen día para preparar algo delicioso.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-stone-300">
                Explora nuevas recetas, guarda tus favoritas y convierte cada
                comida en una experiencia especial.
              </p>

              <button
                onClick={() => document.getElementById("recetas")?.scrollIntoView({
                  behavior: "smooth",
                })}
                className="mt-8 rounded-full bg-orange-500 px-8 py-4 text-sm font-black text-white transition hover:bg-orange-600"
              >
                Descubrir recetas
              </button>

            </div>

          </section>

        </>
      )}

      {/* CONFIRMACIÓN PARA ELIMINAR FAVORITOS */}
      {mostrarConfirmacion && recetaPendiente && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-[#30251f]/60 p-4 backdrop-blur-sm"
          onClick={cancelarEliminacion}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacion"
            className="w-full max-w-sm rounded-3xl border border-orange-100 bg-[#fffaf3] p-6 shadow-2xl shadow-black/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
              ❤️
            </div>

            <div className="mt-5 text-center">
              <h2
                id="titulo-confirmacion"
                className="text-xl font-black text-[#30251f]"
              >
                ¿Eliminar de favoritos?
              </h2>

              <p className="mt-3 text-sm leading-6 text-stone-500">
                ¿Deseas quitar{" "}
                <span className="font-bold text-orange-600">
                  {recetaPendiente.strMeal}
                </span>{" "}
                de tu lista de recetas favoritas?
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={confirmarEliminacion}
                className="w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-white shadow-md shadow-orange-200 transition hover:bg-orange-600 active:scale-[0.98]"
              >
                Eliminar de favoritos
              </button>

              <button
                type="button"
                onClick={cancelarEliminacion}
                className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 font-bold text-orange-700 transition hover:bg-orange-50 active:scale-[0.98]"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIE DE PÁGINA */}
      <footer className="border-t border-orange-100 bg-white px-5 py-8">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row lg:px-10">

          <div className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>

            <span className="font-black">
              Chef<span className="text-orange-500">Casa</span>
            </span>
          </div>

          <p className="text-center text-xs text-stone-400">
            © 2026 ChefCasa. Cocina, descubre y disfruta.
          </p>

          <p className="text-xs font-semibold text-stone-500">
            Hecho con pasión por la cocina.
          </p>

        </div>

      </footer>

    </main>
  );
}
