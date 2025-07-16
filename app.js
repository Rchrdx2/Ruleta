/**
 * JUEGO DE RULETA EUROPEA - ARQUITECTURA MODULAR
 * Implementación completa con separación de responsabilidades
 * Autor: Sistema de IA especializado en desarrollo modular
 */

// =============================
// DATOS DE CONFIGURACIÓN
// =============================

const ROULETTE_DATA = {
  numbers: [
    { number: 0, color: "green" },
    { number: 32, color: "red" },
    { number: 15, color: "black" },
    { number: 19, color: "red" },
    { number: 4, color: "black" },
    { number: 21, color: "red" },
    { number: 2, color: "black" },
    { number: 25, color: "red" },
    { number: 17, color: "black" },
    { number: 34, color: "red" },
    { number: 6, color: "black" },
    { number: 27, color: "red" },
    { number: 13, color: "black" },
    { number: 36, color: "red" },
    { number: 11, color: "black" },
    { number: 30, color: "red" },
    { number: 8, color: "black" },
    { number: 23, color: "red" },
    { number: 10, color: "black" },
    { number: 5, color: "red" },
    { number: 24, color: "black" },
    { number: 16, color: "red" },
    { number: 33, color: "black" },
    { number: 1, color: "red" },
    { number: 20, color: "black" },
    { number: 14, color: "red" },
    { number: 31, color: "black" },
    { number: 9, color: "red" },
    { number: 22, color: "black" },
    { number: 18, color: "red" },
    { number: 29, color: "black" },
    { number: 7, color: "red" },
    { number: 28, color: "black" },
    { number: 12, color: "red" },
    { number: 35, color: "black" },
    { number: 3, color: "red" },
    { number: 26, color: "black" },
  ],
  betTypes: {
    straight: { name: "Número", payout: 35 },
    red: { name: "Rojo", payout: 1 },
    black: { name: "Negro", payout: 1 },
    odd: { name: "Impar", payout: 1 },
    even: { name: "Par", payout: 1 },
    low: { name: "1-18", payout: 1 },
    high: { name: "19-36", payout: 1 },
    dozen1: { name: "1ª Docena", payout: 2 },
    dozen2: { name: "2ª Docena", payout: 2 },
    dozen3: { name: "3ª Docena", payout: 2 },
    column1: { name: "1ª Columna", payout: 2 },
    column2: { name: "2ª Columna", payout: 2 },
    column3: { name: "3ª Columna", payout: 2 },
  },
  chipValues: [1000, 3000, 5000],
  config: {
    initialBalance: 50000,
    minBet: 1000,
    maxBet: 5000, // Cambiado de 25000 a 5000
    spinDuration: 4000,
    currency: "COP",
    exchangeRate: 1,
  },
};

// =============================
// MOTOR DE JUEGO - ROULETTE ENGINE
// =============================

class RouletteEngine {
  constructor() {
    this.balance = ROULETTE_DATA.config.initialBalance;
    this.currentBets = new Map();
    this.lastBets = new Map();
    this.history = [];
    this.statistics = {
      totalSpins: 0,
      totalWins: 0,
      totalProfit: 0,
    };
  }

  placeBet(betType, amount, number = null) {
    if (this.balance < amount) {
      console.warn("Balance insuficiente para esta apuesta");
      return false;
    }

    if (amount < ROULETTE_DATA.config.minBet) {
      console.warn(
        `Apuesta mínima permitida: $${ROULETTE_DATA.config.minBet.toLocaleString("es-CO")} COP`,
      );
      return false;
    }

    if (amount > ROULETTE_DATA.config.maxBet) {
      console.warn(
        `Apuesta máxima permitida: $${ROULETTE_DATA.config.maxBet.toLocaleString("es-CO")} COP`,
      );
      return false;
    }

    // Validación adicional para apuestas acumuladas
    const betKey = number !== null ? `${betType}-${number}` : betType;
    const existingBet = this.currentBets.get(betKey);
    const newTotalBet = existingBet ? existingBet.amount + amount : amount;

    if (newTotalBet > ROULETTE_DATA.config.maxBet) {
      console.warn(
        `La apuesta total en esta posición no puede exceder $${ROULETTE_DATA.config.maxBet.toLocaleString("es-CO")} COP`,
      );
      return false;
    }

    if (this.currentBets.has(betKey)) {
      existingBet.amount += amount;
    } else {
      this.currentBets.set(betKey, {
        type: betType,
        amount: amount,
        number: number,
        payout: ROULETTE_DATA.betTypes[betType].payout,
      });
    }

    this.balance -= amount;
    return true;
  }

  spin() {
    const randomIndex = Math.floor(
      Math.random() * ROULETTE_DATA.numbers.length,
    );
    const winningNumber = ROULETTE_DATA.numbers[randomIndex];

    this.history.unshift(winningNumber);
    if (this.history.length > 10) {
      this.history.pop();
    }

    this.statistics.totalSpins++;
    return winningNumber;
  }

  calculateWinnings(winningNumber) {
    let totalWinnings = 0;
    let winningBets = [];
    let losingBets = [];

    this.currentBets.forEach((bet, betKey) => {
      const isWinning = this.checkWinningBet(bet, winningNumber);

      if (isWinning) {
        const winAmount = bet.amount * (bet.payout + 1);
        totalWinnings += winAmount;
        winningBets.push({
          ...bet,
          winAmount: winAmount,
          key: betKey,
        });
      } else {
        losingBets.push({
          ...bet,
          key: betKey,
        });
      }
    });

    this.balance += totalWinnings;
    if (totalWinnings > 0) {
      this.statistics.totalWins++;
    }

    const totalBetAmount = Array.from(this.currentBets.values()).reduce(
      (sum, bet) => sum + bet.amount,
      0,
    );
    this.statistics.totalProfit += totalWinnings - totalBetAmount;

    this.lastBets = new Map(this.currentBets);
    this.currentBets.clear();

    return {
      totalWinnings,
      winningBets,
      losingBets,
      netProfit: totalWinnings - totalBetAmount,
    };
  }

  checkWinningBet(bet, winningNumber) {
    const num = winningNumber.number;
    const color = winningNumber.color;

    switch (bet.type) {
      case "straight":
        return bet.number === num;
      case "red":
        return color === "red";
      case "black":
        return color === "black";
      case "odd":
        return num !== 0 && num % 2 === 1;
      case "even":
        return num !== 0 && num % 2 === 0;
      case "low":
        return num >= 1 && num <= 18;
      case "high":
        return num >= 19 && num <= 36;
      case "dozen1":
        return num >= 1 && num <= 12;
      case "dozen2":
        return num >= 13 && num <= 24;
      case "dozen3":
        return num >= 25 && num <= 36;
      case "column1":
        return num !== 0 && num % 3 === 1;
      case "column2":
        return num !== 0 && num % 3 === 2;
      case "column3":
        return num !== 0 && num % 3 === 0;
      default:
        return false;
    }
  }

  repeatLastBets() {
    if (this.lastBets.size === 0) return false;

    const totalAmount = Array.from(this.lastBets.values()).reduce(
      (sum, bet) => sum + bet.amount,
      0,
    );

    if (this.balance < totalAmount) {
      console.warn("Balance insuficiente para repetir apuestas");
      return false;
    }

    this.lastBets.forEach((bet, betKey) => {
      this.currentBets.set(betKey, { ...bet });
    });

    this.balance -= totalAmount;
    return true;
  }

  clearBets() {
    const totalAmount = Array.from(this.currentBets.values()).reduce(
      (sum, bet) => sum + bet.amount,
      0,
    );

    this.balance += totalAmount;
    this.currentBets.clear();
  }

  getTotalBet() {
    return Array.from(this.currentBets.values()).reduce(
      (sum, bet) => sum + bet.amount,
      0,
    );
  }

  getActiveBets() {
    return Array.from(this.currentBets.entries()).map(([key, bet]) => ({
      key,
      ...bet,
    }));
  }
}

// =============================
// SISTEMA DE ANIMACIÓN - ROULETTE WHEEL
// =============================

class RouletteWheel {
  constructor() {
    this.wheelElement = document.getElementById("rouletteWheel");
    this.ballElement = document.getElementById("ball");
    this.isSpinning = false;
    this.currentRotation = 0;
  }

  spin(winningNumber, duration = ROULETTE_DATA.config.spinDuration) {
    return new Promise((resolve) => {
      if (this.isSpinning) return;

      this.isSpinning = true;

      const numberIndex = ROULETTE_DATA.numbers.findIndex(
        (n) => n.number === winningNumber.number,
      );
      const degreesPerNumber = 360 / ROULETTE_DATA.numbers.length;
      const targetRotation =
        numberIndex * degreesPerNumber + Math.random() * degreesPerNumber;

      const totalRotation = this.currentRotation + 1800 + targetRotation;

      this.wheelElement.style.transform = `rotate(${totalRotation}deg)`;
      this.animateBall(targetRotation, duration);

      this.currentRotation = totalRotation % 360;

      setTimeout(() => {
        this.isSpinning = false;
        resolve();
      }, duration);
    });
  }

  animateBall(finalPosition, duration) {
    const startTime = Date.now();
    const initialRadius = 130;
    const finalRadius = 80;

    const animateBallStep = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentRadius =
        initialRadius - (initialRadius - finalRadius) * easeOut;
      const angle = ((progress * 720 + finalPosition) * Math.PI) / 180;

      const x = Math.cos(angle) * currentRadius;
      const y = Math.sin(angle) * currentRadius;

      this.ballElement.style.transform = `translate(${x}px, ${y}px)`;

      if (progress < 1) {
        requestAnimationFrame(animateBallStep);
      }
    };

    requestAnimationFrame(animateBallStep);
  }

  resetBall() {
    this.ballElement.style.transform = "translate(0, 0)";
  }
}

// =============================
// INTERFAZ DE USUARIO - ROULETTE UI
// =============================

class RouletteUI {
  constructor() {
    this.selectedChipValue = 1000;
    this.elements = this.initializeElements();
    this.initializeEventListeners();
    this.generateBettingTable();
  }

  initializeElements() {
    return {
      balance: document.getElementById("balance"),
      selectedChip: document.getElementById("selectedChip"),
      totalBet: document.getElementById("totalBet"),
      activeBets: document.getElementById("activeBets"),
      historyNumbers: document.getElementById("historyNumbers"),
      totalSpins: document.getElementById("totalSpins"),
      totalWins: document.getElementById("totalWins"),
      totalProfit: document.getElementById("totalProfit"),
      spinBtn: document.getElementById("spinBtn"),
      repeatBtn: document.getElementById("repeatBtn"),
      clearBtn: document.getElementById("clearBtn"),
      resultMessage: document.getElementById("resultMessage"),
      resultTitle: document.getElementById("resultTitle"),
      resultText: document.getElementById("resultText"),
      resultNumber: document.getElementById("resultNumber"),
      loadingOverlay: document.getElementById("loadingOverlay"),
    };
  }

  initializeEventListeners() {
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        this.selectChip(parseInt(chip.dataset.value));
      });
    });

    this.elements.spinBtn.addEventListener("click", () => {
      window.gameController.spin();
    });

    this.elements.repeatBtn.addEventListener("click", () => {
      window.gameController.repeatLastBets();
    });

    this.elements.clearBtn.addEventListener("click", () => {
      window.gameController.clearBets();
    });

    this.elements.resultMessage.addEventListener("click", () => {
      this.hideResultMessage();
    });
  }

  generateBettingTable() {
    const numbersGrid = document.getElementById("numbersGrid");

    for (let i = 1; i <= 36; i++) {
      const numberData = ROULETTE_DATA.numbers.find((n) => n.number === i);
      const cell = document.createElement("div");
      cell.className = `number-cell ${numberData.color}`;
      cell.textContent = i;
      cell.dataset.number = i;
      cell.addEventListener("click", () => {
        this.placeBet("straight", i);
      });
      numbersGrid.appendChild(cell);
    }

    document.querySelectorAll(".bet-cell").forEach((cell) => {
      cell.addEventListener("click", () => {
        const betType = cell.dataset.bet;
        this.placeBet(betType);
      });
    });
  }

  selectChip(value) {
    this.selectedChipValue = value;

    document.querySelectorAll(".chip").forEach((chip) => {
      chip.classList.remove("selected");
    });

    document.querySelector(`[data-value="${value}"]`).classList.add("selected");
    this.elements.selectedChip.textContent = `$${value.toLocaleString("es-CO")} COP`;
  }

  showNotification(message, type = "warning") {
    // Crear elemento de notificación
    const notification = document.createElement("div");
    notification.className = `notification notification--${type}`;
    notification.textContent = message;

    // Agregar estilos inline
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === "warning" ? "#f59e0b" : "#ef4444"};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  placeBet(betType, number = null) {
    const success = window.gameController.placeBet(
      betType,
      this.selectedChipValue,
      number,
    );

    if (success) {
      this.updateBetDisplay(betType, number);
      this.playSound("chipPlace");
    } else {
      // Mostrar notificación de error
      if (window.gameController.engine.balance < this.selectedChipValue) {
        this.showNotification(
          "Balance insuficiente para esta apuesta",
          "error",
        );
      } else if (this.selectedChipValue > ROULETTE_DATA.config.maxBet) {
        this.showNotification(
          `Apuesta máxima permitida: $${ROULETTE_DATA.config.maxBet.toLocaleString("es-CO")} COP`,
          "warning",
        );
      } else {
        this.showNotification("No se pudo realizar la apuesta", "error");
      }
    }
  }

  updateBetDisplay(betType, number) {
    const betKey = number !== null ? `${betType}-${number}` : betType;
    const selector =
      number !== null ? `[data-number="${number}"]` : `[data-bet="${betType}"]`;
    const element = document.querySelector(selector);

    if (element) {
      let chipElement = element.querySelector(".bet-chip");
      if (!chipElement) {
        chipElement = document.createElement("div");
        chipElement.className = "bet-chip";
        chipElement.style.backgroundColor = this.getChipColor(
          this.selectedChipValue,
        );
        element.appendChild(chipElement);
      }

      const currentAmount = parseInt(chipElement.textContent) || 0;
      chipElement.textContent = currentAmount + this.selectedChipValue;
    }
  }

  getChipColor(value) {
    const colors = {
      1000: "#3b82f6",
      3000: "#dc2626",
      5000: "#059669",
    };
    return colors[value] || "#6b7280";
  }

  updateBalance(balance) {
    this.elements.balance.textContent = `$${balance.toLocaleString("es-CO")} COP`;
  }

  updateActiveBets(bets) {
    const container = this.elements.activeBets;

    if (bets.length === 0) {
      container.innerHTML = '<p class="no-bets">No hay apuestas activas</p>';
      this.elements.totalBet.textContent = "$0 COP";
      return;
    }

    let totalAmount = 0;
    let html = "";

    bets.forEach((bet) => {
      const betName =
        bet.number !== null
          ? `${ROULETTE_DATA.betTypes[bet.type].name} ${bet.number}`
          : ROULETTE_DATA.betTypes[bet.type].name;

      html += `
                <div class="bet-item">
                    <span>${betName}</span>
                    <span>$${bet.amount.toLocaleString("es-CO")} COP</span>
                </div>
            `;
      totalAmount += bet.amount;
    });

    container.innerHTML = html;
    this.elements.totalBet.textContent = `$${totalAmount.toLocaleString("es-CO")} COP`;
  }

  updateHistory(history) {
    const container = this.elements.historyNumbers;
    container.innerHTML = "";

    history.forEach((number) => {
      const numberElement = document.createElement("div");
      numberElement.className = `history-number ${number.color}`;
      numberElement.textContent = number.number;
      container.appendChild(numberElement);
    });
  }

  updateStatistics(stats) {
    this.elements.totalSpins.textContent = stats.totalSpins;
    this.elements.totalWins.textContent = stats.totalWins;
    this.elements.totalProfit.textContent = `$${stats.totalProfit.toLocaleString("es-CO")} COP`;
  }

  showResultMessage(winningNumber, results) {
    this.elements.resultNumber.textContent = winningNumber.number;
    this.elements.resultNumber.className = `result-number ${winningNumber.color}`;

    if (results.totalWinnings > 0) {
      this.elements.resultTitle.textContent = "¡Felicitaciones!";
      this.elements.resultText.textContent = `Has ganado $${results.totalWinnings.toLocaleString("es-CO")} COP`;
    } else {
      this.elements.resultTitle.textContent = "Mejor suerte la próxima vez";
      this.elements.resultText.textContent =
        "No hay apuestas ganadoras en esta ronda";
    }

    this.elements.resultMessage.classList.add("show");
  }

  hideResultMessage() {
    this.elements.resultMessage.classList.remove("show");
  }

  showLoading() {
    this.elements.loadingOverlay.classList.add("show");
  }

  hideLoading() {
    this.elements.loadingOverlay.classList.remove("show");
  }

  playSound(soundType) {
    // Implementar sonidos si es necesario
  }
}

// =============================
// CONTROLADOR PRINCIPAL - GAME CONTROLLER
// =============================

class GameController {
  constructor() {
    this.engine = new RouletteEngine();
    this.wheel = new RouletteWheel();
    this.ui = new RouletteUI();
    this.isSpinning = false;

    this.initializeGame();
  }

  initializeGame() {
    this.ui.updateBalance(this.engine.balance);
    this.ui.updateActiveBets(this.engine.getActiveBets());
    this.ui.updateHistory(this.engine.history);
    this.ui.updateStatistics(this.engine.statistics);
    this.ui.selectChip(1000);
  }

  placeBet(betType, amount, number = null) {
    if (this.isSpinning) return false;

    const success = this.engine.placeBet(betType, amount, number);
    if (success) {
      this.ui.updateBalance(this.engine.balance);
      this.ui.updateActiveBets(this.engine.getActiveBets());
    }
    return success;
  }

  async spin() {
    if (this.isSpinning) return;
    if (this.engine.getTotalBet() === 0) {
      alert("Debes hacer al menos una apuesta antes de girar");
      return;
    }

    this.isSpinning = true;
    this.ui.showLoading();

    try {
      const winningNumber = this.engine.spin();

      await this.wheel.spin(winningNumber);

      const results = this.engine.calculateWinnings(winningNumber);

      this.ui.hideLoading();
      this.ui.updateBalance(this.engine.balance);
      this.ui.updateActiveBets(this.engine.getActiveBets());
      this.ui.updateHistory(this.engine.history);
      this.ui.updateStatistics(this.engine.statistics);
      this.ui.showResultMessage(winningNumber, results);

      this.clearBetChips();
    } catch (error) {
      console.error("Error durante el giro:", error);
      this.ui.hideLoading();
    }

    this.isSpinning = false;
  }

  repeatLastBets() {
    if (this.isSpinning) return;

    const success = this.engine.repeatLastBets();
    if (success) {
      this.ui.updateBalance(this.engine.balance);
      this.ui.updateActiveBets(this.engine.getActiveBets());
      this.updateBetDisplay();
    }
  }

  clearBets() {
    if (this.isSpinning) return;

    this.engine.clearBets();
    this.ui.updateBalance(this.engine.balance);
    this.ui.updateActiveBets(this.engine.getActiveBets());
    this.clearBetChips();
  }

  clearBetChips() {
    document.querySelectorAll(".bet-chip").forEach((chip) => {
      chip.remove();
    });
  }

  updateBetDisplay() {
    this.clearBetChips();

    this.engine.getActiveBets().forEach((bet) => {
      const selector =
        bet.number !== null
          ? `[data-number="${bet.number}"]`
          : `[data-bet="${bet.type}"]`;
      const element = document.querySelector(selector);

      if (element) {
        const chipElement = document.createElement("div");
        chipElement.className = "bet-chip";
        chipElement.style.backgroundColor = this.ui.getChipColor(bet.amount);
        chipElement.textContent = bet.amount;
        element.appendChild(chipElement);
      }
    });
  }
}

// =============================
// INICIALIZACIÓN
// =============================

window.addEventListener("DOMContentLoaded", () => {
  window.gameController = new GameController();
});
