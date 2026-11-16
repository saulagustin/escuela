
let carrito = JSON.parse(
  sessionStorage.getItem("carrito") || "[]"
);

async function cargarCarrito() {
  const respuesta = await fetch("/api/productos");
  const productos = await respuesta.json();

  carrito = carrito.map(item => {
    const producto = productos.find(p => p.id === item.id);
    return producto ? { ...producto, cantidad: item.cantidad } : null;
  }).filter(Boolean);

  actualizarCarrito();
}

function actualizarCarrito() {
  const lista = document.getElementById("listaCarrito");

  lista.innerHTML = carrito.length
    ? carrito.map(p => `
      <div class="item-carrito">
        <span>${p.nombre} x ${p.cantidad}</span>
        <strong>$${p.precio * p.cantidad} MXN</strong>
        <button onclick="eliminar(${p.id})">Eliminar</button>
      </div>
    `).join("")
    : "<p>Tu carrito está vacío.</p>";

  const total = carrito.reduce(
    (s, p) => s + p.precio * p.cantidad, 0
  );

  document.getElementById("total").textContent = total;
}

function eliminar(id) {
  carrito = carrito.filter(p => p.id !== id);
  sessionStorage.setItem("carrito", JSON.stringify(
    carrito.map(p => ({ id: p.id, cantidad: p.cantidad }))
  ));
  actualizarCarrito();
}

async function comprar() {
  if (!carrito.length) {
    alert("Tu carrito está vacío.");
    return;
  }

  try {
    const respuesta = await fetch("/api/comprar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productos: carrito.map(p => ({
          id: p.id,
          cantidad: p.cantidad
        }))
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error);
    }

    carrito = [];
    sessionStorage.removeItem("carrito");

    document.getElementById("codigoCompra").textContent =
      datos.compra.codigo;

    document.getElementById("resultado").classList.remove("oculto");

    actualizarCarrito();

  } catch (error) {
    alert(error.message);
  }
}

cargarCarrito();
