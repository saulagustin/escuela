
async function cargarProductos() {
  const contenedor = document.getElementById("productos");

  try {
    const respuesta = await fetch("/api/productos");
    const juegos = await respuesta.json();

    contenedor.innerHTML = juegos.map(juego => `
      <div class="producto">
        <img src="${juego.imagen}" alt="${juego.nombre}">
        <div class="producto-info">
          <h3>${juego.nombre}</h3>
          <p>${juego.descripcion}</p>
          <p class="precio">$${juego.precio} MXN</p>
          <button onclick="agregarCarrito(${juego.id})">
            Agregar al carrito
          </button>
        </div>
      </div>
    `).join("");

  } catch {
    contenedor.textContent = "Error al cargar los juegos.";
  }
}

function agregarCarrito(id) {
  const carrito = JSON.parse(
    sessionStorage.getItem("carrito") || "[]"
  );

  const juego = carrito.find(p => p.id === id);

  if (juego) {
    juego.cantidad++;
  } else {
    carrito.push({ id, cantidad: 1 });
  }

  sessionStorage.setItem("carrito", JSON.stringify(carrito));

  alert("Juego agregado al carrito.");
}

cargarProductos();
