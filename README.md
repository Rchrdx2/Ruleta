# Ruleta Europea

Juego de ruleta europea en JavaScript, HTML y CSS con lógica avanzada de control de saldo, fairness y experiencia de usuario profesional.

## Características principales

- **Ruleta europea** con 37 números (0-36).
- **Apuestas múltiples**: número, color, docena, columna, par/impar, rango.
- **Sistema de fichas**: $1K, $3K, $5K COP.
- **Balance inicial**: $50,000 COP. Meta: $100,000 COP.
- **Payouts**:
  - Número (straight): 18x
  - Color, par/impar, bajo/alto: 2x
  - Docena, columna: 3x
- **Modal de ayuda** flotante con reglas y tips.
- **Modal de victoria** al alcanzar $100,000 COP (redirige al inicio).
- **Animaciones y efectos visuales** (brillo dorado, fichas, rueda animada).
- **Sistema anti-explotación**: previene abusos y rachas largas.
- **Protección de saldo bajo**: imposible perder con menos de $10,000 COP.
- **Restricción a apuestas de 3K a número**: nunca pueden ganar.

## Estructura del proyecto

```
Ruleta/
├── app.js         # Lógica principal del juego y UI
├── index.html     # Estructura HTML y modales
├── style.css      # Estilos visuales y responsividad
└── README.md      # Documentación
```

## Cómo jugar

1. Selecciona una ficha ($1K, $3K, $5K).
2. Haz clic en la mesa para apostar (número, color, docena, columna, etc).
3. Presiona **Girar Ruleta** para jugar.
4. El saldo inicial es de $50,000 COP. Llega a $100,000 COP para ganar.
5. El pago por acertar un número es 18x, otras apuestas pagan menos.
6. Si tu saldo baja de $10,000 COP, siempre ganarás hasta recuperarte.
7. Las apuestas de $3K a un número nunca pueden ganar.
8. ¡Juega responsablemente y diviértete!

## Lógica y fairness

- El motor de juego implementa controles para evitar rachas largas y explotar patrones.
- El payout de número es menor al tradicional para mayor balance.
- El sistema detecta repeticiones y ajusta probabilidades para mantener el juego justo.
- El saldo nunca puede superar $100,000 COP.

## Personalización

- Puedes modificar los valores de fichas, payouts y límites en `ROULETTE_DATA` en `app.js`.
- Los estilos y colores se ajustan en `style.css`.

## Créditos

Desarrollado por Rchrdx2.

---

¿Dudas o sugerencias? Abre un issue o contacta al autor.
