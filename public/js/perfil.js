
async function cargarPerfil() {
  try {
    const respuesta = await fetch("/api/usuario");
    const datos = await respuesta.json();

    if (!datos.usuario) {
      location.href = "/pages/login.html";
      return;
    }

    document.getElementById("nombreUsuario").textContent =
      datos.usuario.nombre;

    document.getElementById("correoUsuario").textContent =
      datos.usuario.correo;

    cargarCompras();

  } catch {
    alert("No se pudo cargar el perfil.");
  }
}

async function cargarCompras() {
  const contenedor = document.getElementById("historial");

  try {
    const respuesta = await fetch("/api/compras");
    const compras = await respuesta.json();

    contenedor.innerHTML = compras.length
      ? compras.map(c => `
        <div class="item-carrito">
          <div>
            <strong>${c.codigo}</strong>
            <p>Total: $${c.total} MXN</p>
            <p>${new Date(c.fecha).toLocaleString("es-MX")}</p>
          </div>
        </div>
      `).join("")
      : "<p>No tienes compras todavía.</p>";

  } catch {
    contenedor.textContent = "Error al consultar compras.";
  }
}

async function cerrarSesion() {
  await fetch("/api/logout", { method: "POST" });
  location.href = "/pages/login.html";
}

cargarPerfil();
