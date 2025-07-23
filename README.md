# Juego de Ruleta Europea

Este es un proyecto de un juego de Ruleta Europea con una arquitectura modular avanzada y un sistema de probabilidades dinámicas.

## Características Principales

- **Arquitectura Modular:** El código está organizado en clases que manejan la lógica del juego (`RouletteEngine`), la interfaz de usuario (`RouletteUI`), la animación de la ruleta (`RouletteWheel`) y un controlador principal (`GameController`).
- **Sistema de Probabilidades Dinámicas:**
    - **Control de Balance:** Las probabilidades de ganar o perder se ajustan dinámicamente según el saldo del jugador para mantener el juego equilibrado.
    - **Control de Rachas:** Evita rachas de victorias excesivamente largas.
    - **Normalización:** Después de 20 giros, el sistema de probabilidades se normaliza para volver a un juego más estándar.
- **Sistema Anti-Estrategias:**
    - **Control de Múltiples Apuestas a Pleno:** Detecta y penaliza estrategias de apostar a muchos números individuales a la vez.
    - **Control de Apuestas Restringidas:** Las apuestas de alto valor (3k o 5k) a un solo número están diseñadas para no ganar nunca, como medida de control.
- **Mecanismos de Protección al Jugador:**
    - **Sistema de Acolchonamiento:** Evita que el saldo del jugador llegue a cero, dándole una oportunidad de recuperarse.
    - **Victoria Mínima Inteligente:** Durante las primeras 20 tiradas, el sistema puede forzar una victoria con el menor pago posible para mantener al jugador en el juego, pero solo si la ganancia no es desproporcionada con respecto a lo apostado.
- **Anti-Sesgo:** Utiliza un algoritmo de mezcla (Fisher-Yates) para asegurar que la selección de números sea verdaderamente aleatoria y no esté influenciada por su posición en el array.
- **Interfaz Atractiva y Responsiva:** La interfaz está diseñada con un tema de casino oscuro, con animaciones y efectos visuales para una experiencia de usuario inmersiva. Se adapta a diferentes tamaños de pantalla.

## Arquitectura

El proyecto está estructurado en los siguientes componentes principales en `app.js`:

- `ROULETTE_DATA`: Un objeto de configuración que contiene todos los datos del juego, como los números de la ruleta, los tipos de apuesta, los valores de las fichas y las complejas reglas de control de probabilidad y saldo.
- `RouletteEngine`: El cerebro del juego. Gestiona el estado del juego, el saldo, las apuestas, el historial de giros y toda la lógica de control de probabilidades.
- `RouletteWheel`: Se encarga de la animación visual de la ruleta y la bola.
- `RouletteUI`: Controla todos los elementos de la interfaz de usuario, como mostrar el saldo, actualizar las apuestas, mostrar los resultados y manejar las interacciones del usuario.
- `GameController`: Es el punto de entrada que inicializa y coordina todas las partes del juego (motor, ruleta y UI).

## Tecnologías Utilizadas

- **HTML5:** Para la estructura de la página.
- **CSS3:** Para los estilos, animaciones y el diseño responsivo.
- **JavaScript (ES6+):** Para toda la lógica del juego, manipulación del DOM y la interactividad.

## Cómo Jugar

1.  Abre el archivo `index.html` en tu navegador.
2.  Selecciona una ficha con el valor que desees apostar.
3.  Haz clic en los números de la mesa o en las áreas de apuesta externa para realizar tus apuestas.
4.  Presiona el botón "Girar Ruleta" para comenzar el juego.
5.  Puedes usar "Repetir Apuesta" para volver a colocar las apuestas del último giro o "Limpiar Mesa" para quitarlas todas.
6.  El juego se bloqueará si alcanzas el saldo máximo de 100,000 COP, y podrás reiniciarlo desde un modal.
