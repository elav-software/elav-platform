// 1. Guardamos el HTML del menú
const menuHTML = `
    <nav class="navbar">
        <div class="logo-container">
            <a href="index.html" style="display: flex; align-items: center;">
                <img src="./logo.png" alt="CFC Logo" class="logo-img">
            </a>
        </div>
        
        <div class="menu-toggle">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </div>
        
        <ul class="nav-links">
            <li><a href="index.html">Inicio</a></li>
            <li><a href="soy-nuevo.html">Soy Nuevo</a></li>
            <li><a href="eventos.html">Eventos</a></li>
            <li><a href="media.html">Media</a></li>
            <li><a href="contacto.html">Contacto</a></li>
        </ul>
        <a href="https://www.cfccasanova.com/connect/portal/login" class="btn-cta" target="_blank" rel="noopener">Portal CFC</a>
    </nav>
`;

// 2. Guardamos el HTML del footer
const footerHTML = `
    <footer style="text-align: center; padding: 40px; border-top: 1px solid var(--borde-tarjeta); color: var(--texto-secundario); margin-top: 50px;">
        <p>© 2026 Centro Familiar Cristiano. Todos los derechos reservados.</p>
    </footer>
`;

// 3. Insertamos los componentes en los contenedores de la página
document.getElementById('menu-contenedor').innerHTML = menuHTML;
document.getElementById('footer-contenedor').innerHTML = footerHTML;

// 4. Activamos el botón del menú para celulares
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}
