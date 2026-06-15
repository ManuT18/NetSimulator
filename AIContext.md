# Contexto del Proyecto

## Estado General
NetSimulator es un simulador de redes informáticas interactivo diseñado con fines educativos (desarrollado para la materia de Instalación, Mantenimiento y Reparación de Redes Informáticas en el ITLP). Permite arrastrar y soltar equipos (PCs y Routers) para diseñar topologías de red en tiempo real, configurar IPs y MACs, simular y visualizar el viaje de los paquetes salto a salto, inspeccionar PDUs (L2/L3) y repasar las capas del modelo OSI. El proyecto se encuentra estable y está desplegado en Vercel.

## Arquitectura y Decisiones
- **Tecnologías**: React 19 + Vite.
- **Estilos**: Tailwind CSS v4 con soporte para modo oscuro.
- **Iconografía**: Lucide React.
- **Estructura de Carpetas**:
  - `src/`: Lógica del simulador (componentes React para canvas interactivo, modales de configuración de red, y visualizadores de capas OSI).
  - `public/`: Recursos estáticos de la app.

## Tareas Completadas (Recientes)
- [x] Configuración inicial con React 19 y Tailwind CSS v4.
- [x] Implementación de canvas interactivo de arrastrar y soltar.
- [x] Simulación paso a paso de transmisión de paquetes de datos y visualización del modelo OSI.
- [x] Inspección detallada de tramas/paquetes en capas L2 y L3 (PDU).
- [x] Configuración del build de Vite y despliegue exitoso en Vercel.

## Próximos Pasos (TODO)
- [ ] Incorporar más dispositivos de red (Switches, Hubs, Access Points).
- [ ] Implementar soporte para simulación de protocolos comunes (DHCP, ARP, DNS, ICMP ping real simulado).
- [ ] Agregar validación de colisiones o bucles de red en topologías mal configuradas.
- [ ] Diseñar cuestionarios educativos o desafíos prácticos dentro de la aplicación para los estudiantes.

## Problemas Abiertos o Notas
- La simulación del camino óptimo actualmente asume rutas predeterminadas básicas; se planea incorporar algoritmos de ruteo dinámicos simplificados.
