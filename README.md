# GTA-Anime Landing — Proyecto inicial

Landing web interactiva estilo *anime + GTA futurista* con Three.js, optimizada para desplegar en **GitHub Pages**.

## Características principales
- Escena 3D con Three.js como módulo ES (OrbitControls + GLTFLoader incluidos).
- Fondo 3D procedural + posibilidad de cargar un modelo glTF (.glb).
- UI con glassmorphism, panel lateral con toggles (sombras, efectos, sonido) y botón Play/Demo.
- Carga progresiva de assets (low-res -> high-res), lazy loading y toggles de calidad.
- Buenas prácticas: gestión de recursos (`dispose()`), manejo de `resize`, accesibilidad básica (aria), y optimizaciones para móviles.
- Archivos listos para GitHub Pages.

## Estructura
(Ver árbol en el README original o en la cabecera del repo.)

## Requisitos locales (opcional)
Para desarrollo local, sirve con un servidor estático (no abrir `file://`):
```bash
# si tienes npm
npx http-server . -p 8080
# o
npx live-server
