/**
 * JUEGO DE RULETA EUROPEA - ARQUITECTURA MODULAR
 * Implementación con control específico para apuestas únicas de números
 * Solo apuestas únicas de 3k/5k COP a números pierden protección
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
    straight: { name: "Número", payout: 20 }, // Pago reducido de 35 a 20
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
    maxBet: 5000,
    spinDuration: 4000,
    currency: "COP",
    exchangeRate: 1,
    // SISTEMA DE CONTROL CON RESTRICCIONES ESPECÍFICAS
    balanceControl: {
      enabled: true,
      minBalance: 40000, // Forzar victorias bajo este límite
      maxBalance: 97000, // Forzar pérdidas sobre este límite
      absoluteMaxBalance: 100000, // LÍMITE ABSOLUTO - NUNCA SUPERAR
      transitionZone: 5000, // Zona de transición gradual
      naturalProbability: 0.3, // Probabilidad base de resultado natural
      finalPushZone: 15000, // Zona de impulso final
      luckStreakEnabled: true, // Activar rachas de suerte
    },
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
    // Variables internas para el control invisible
    this.consecutiveLosses = 0;
    this.consecutiveWins = 0;
    this.lastControlAction = null;

    // VARIABLES PARA CONTROL DE PROBABILIDADES
    this.luckStreak = 0; // Contador de racha de suerte
    this.progressStats = {
      // Estadísticas de progreso
      timesNear90k: 0,
      timesReached95k: 0,
      timesReached100k: 0,
    };
  }

  // MÉTODO MODIFICADO: Verificar apuestas únicas de números con montos específicos
  _isSingleNumberBetRestricted() {
    // Verificar que solo haya una apuesta activa
    if (this.currentBets.size !== 1) {
      return false;
    }

    const bet = Array.from(this.currentBets.values())[0];

    // Solo aplicar restricción para apuestas a números específicos de 3k o 5k COP
    return (
      bet.type === "straight" && (bet.amount === 3000 || bet.amount === 5000)
    );
  }

  // MÉTODO: Determinar si activar racha de suerte
  _shouldTriggerLuckStreak() {
    const progress = this.balance / 100000;

    if (progress >= 0.6 && progress < 0.9) {
      return Math.random() < 0.35; // 35% chance de racha
    }

    return false;
  }

  // MÉTODO: Helper para seleccionar de opciones
  _selectFromOptions(options) {
    if (!options.length) return null;
    const idx = Math.floor(Math.random() * options.length);
    return options[idx];
  }

  // MÉTODO PRINCIPAL MODIFICADO: Control con restricciones específicas
  _getControlAction() {
    const config = ROULETTE_DATA.config.balanceControl;

    if (!config.enabled) return null;

    // NUEVA LÓGICA: Control específico para apuestas únicas de números 3k/5k
    if (this._isSingleNumberBetRestricted()) {
      // Sin protección para fichas únicas de 3k/5k COP a números
      return null; // Resultado completamente aleatorio
    }

    // RESTO DE LÓGICA: Protección activa para todos los demás casos

    // Control de rachas de suerte
    if (this.luckStreak > 0) {
      this.luckStreak--;
      return "favor_win";
    }

    // Activar racha de suerte
    if (this._shouldTriggerLuckStreak()) {
      this.luckStreak = 4;
      return "luck_streak";
    }

    // Control absoluto cerca del límite máximo
    if (this.balance >= config.absoluteMaxBalance - 10000) {
      return "force_lose_hard";
    }

    // Zona de impulso final mejorada (75k-95k)
    if (this.balance >= 75000 && this.balance < 95000) {
      const finalPush = (this.balance - 75000) / 20000;
      const winProbability = 0.5 + finalPush * 0.3;
      if (Math.random() < winProbability) return "favor_win";
    }

    // Zona de crecimiento acelerado (60k-75k)
    if (this.balance >= 60000 && this.balance < 75000) {
      const growthBoost = (this.balance - 60000) / 15000;
      const winProbability = 0.45 + growthBoost * 0.25;
      if (Math.random() < winProbability) return "favor_win";
    }

    // Control directo en límites extremos
    if (this.balance <= config.minBalance) {
      return "force_win";
    }

    if (this.balance >= config.maxBalance) {
      return "force_lose";
    }

    // Control gradual en zonas de transición
    const lowerTransition = config.minBalance + config.transitionZone;
    const upperTransition = config.maxBalance - config.transitionZone;

    if (this.balance < lowerTransition) {
      const intensity =
        (lowerTransition - this.balance) / config.transitionZone;
      const winProbability = config.naturalProbability + intensity * 0.5;
      return Math.random() < winProbability ? "favor_win" : null;
    }

    if (this.balance > upperTransition) {
      const intensity =
        (this.balance - upperTransition) / config.transitionZone;
      const lossProbability = config.naturalProbability + intensity * 0.5;
      return Math.random() < lossProbability ? "favor_lose" : null;
    }

    // Control adaptativo basado en rachas
    if (this.consecutiveLosses >= 3 && this.balance < config.initialBalance) {
      return Math.random() < 0.7 ? "favor_win" : null;
    }

    if (this.consecutiveWins >= 3 && this.balance > config.initialBalance) {
      return Math.random() < 0.35 ? "favor_lose" : null;
    }

    return null;
  }

  // MÉTODO: Spin con control invisible
  spin() {
    const controlAction = this._getControlAction();
    this.lastControlAction = controlAction;

    let winningNumber;

    if (
      controlAction === "force_win" ||
      controlAction === "favor_win" ||
      controlAction === "luck_streak"
    ) {
      winningNumber = this._generateWinningNumber();
    } else if (
      controlAction === "force_lose" ||
      controlAction === "favor_lose" ||
      controlAction === "force_lose_hard"
    ) {
      winningNumber = this._generateLosingNumber();
    } else {
      const randomIndex = Math.floor(
        Math.random() * ROULETTE_DATA.numbers.length,
      );
      winningNumber = ROULETTE_DATA.numbers[randomIndex];
    }

    this.history.unshift(winningNumber);
    if (this.history.length > 10) {
      this.history.pop();
    }

    this.statistics.totalSpins++;
    return winningNumber;
  }

  // MÉTODO MEJORADO: Generar número ganador con mejor priorización
  _generateWinningNumber() {
    if (this.currentBets.size === 0) {
      return this._generateRandomNumber();
    }

    const winningOptions = [];

    this.currentBets.forEach((bet, betKey) => {
      if (bet.type === "straight") {
        // Priorizar números específicos cuando el balance es alto
        const priority =
          this.balance > 65000
            ? bet.payout * bet.amount * 3 // Triple prioridad
            : bet.payout * bet.amount * 1.5; // 50% más prioridad

        winningOptions.push({
          number: bet.number,
          priority: priority,
          bet: bet,
        });
      } else {
        const validNumbers = this._getValidNumbersForBet(bet);
        validNumbers.forEach((num) => {
          winningOptions.push({
            number: num,
            priority: bet.payout * bet.amount,
            bet: bet,
          });
        });
      }
    });

    if (winningOptions.length === 0) {
      return this._generateRandomNumber();
    }

    // Ordenar por prioridad y seleccionar más favorablemente
    winningOptions.sort((a, b) => b.priority - a.priority);
    const topOptions = winningOptions.slice(
      0,
      Math.ceil(winningOptions.length * 0.6),
    );

    const selectedOption = this._selectFromOptions(topOptions);
    return ROULETTE_DATA.numbers.find(
      (n) => n.number === selectedOption.number,
    );
  }

  // MÉTODO: Generar número perdedor
  _generateLosingNumber() {
    const config = ROULETTE_DATA.config.balanceControl;

    if (this.currentBets.size === 0) {
      return this._generateRandomNumber();
    }

    const isNearLimit = this.balance >= config.absoluteMaxBalance - 10000;
    const losingNumbers = [];

    ROULETTE_DATA.numbers.forEach((numberData) => {
      let isWinning = false;

      this.currentBets.forEach((bet) => {
        if (this.checkWinningBet(bet, numberData)) {
          isWinning = true;
        }
      });

      if (!isWinning) {
        losingNumbers.push(numberData);
      }
    });

    if (losingNumbers.length === 0) {
      return this._findMinimumWinNumber();
    }

    if (isNearLimit) {
      return losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
    }

    return losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
  }

  // MÉTODO: Obtener números válidos para una apuesta
  _getValidNumbersForBet(bet) {
    const validNumbers = [];

    ROULETTE_DATA.numbers.forEach((numberData) => {
      if (this.checkWinningBet(bet, numberData)) {
        validNumbers.push(numberData.number);
      }
    });

    return validNumbers;
  }

  // MÉTODO: Encontrar número con mínima ganancia
  _findMinimumWinNumber() {
    let minWinnings = Infinity;
    let bestNumber = null;

    ROULETTE_DATA.numbers.forEach((numberData) => {
      const winnings = this._calculatePotentialWinnings(numberData);
      if (winnings < minWinnings) {
        minWinnings = winnings;
        bestNumber = numberData;
      }
    });

    return bestNumber || this._generateRandomNumber();
  }

  // MÉTODO: Calcular ganancias potenciales
  _calculatePotentialWinnings(numberData) {
    let totalWinnings = 0;

    this.currentBets.forEach((bet) => {
      if (this.checkWinningBet(bet, numberData)) {
        totalWinnings += bet.amount * (bet.payout + 1);
      }
    });

    return totalWinnings;
  }

  // MÉTODO: Generar número aleatorio
  _generateRandomNumber() {
    const randomIndex = Math.floor(
      Math.random() * ROULETTE_DATA.numbers.length,
    );
    return ROULETTE_DATA.numbers[randomIndex];
  }

  // MÉTODO: Validar y corregir balance si excede límites
  _validateAndCorrectBalance() {
    const config = ROULETTE_DATA.config.balanceControl;

    if (!config.enabled) return;

    if (this.balance > config.absoluteMaxBalance) {
      this.balance = config.absoluteMaxBalance;
      console.log(
        `Balance corregido a límite máximo: ${config.absoluteMaxBalance}`,
      );
    }

    if (this.balance >= config.absoluteMaxBalance - 5000) {
      this.consecutiveWins = 0;
      this.consecutiveLosses = 0;
    }
  }

  // MÉTODO: Calcular ganancias SIN bonificaciones en valores
  calculateWinnings(winningNumber) {
    let totalWinnings = 0;
    let winningBets = [];
    let losingBets = [];

    const config = ROULETTE_DATA.config.balanceControl;

    this.currentBets.forEach((bet, betKey) => {
      const isWinning = this.checkWinningBet(bet, winningNumber);

      if (isWinning) {
        // Ganancia normal según las reglas estándar
        let winAmount = bet.amount * (bet.payout + 1);

        // Verificar que no exceda el límite absoluto
        const potentialBalance = this.balance + winAmount;
        if (potentialBalance > config.absoluteMaxBalance) {
          winAmount = config.absoluteMaxBalance - this.balance;
        }

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

    // Actualizar contadores de racha
    if (totalWinnings > 0) {
      this.consecutiveWins++;
      this.consecutiveLosses = 0;
      this.statistics.totalWins++;
    } else {
      this.consecutiveLosses++;
      this.consecutiveWins = 0;
    }

    this.balance += totalWinnings;

    // Actualizar estadísticas de progreso
    this._updateProgressStats();

    this._validateAndCorrectBalance();

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

  // MÉTODO: Actualizar estadísticas de progreso
  _updateProgressStats() {
    if (this.balance >= 90000) {
      this.progressStats.timesNear90k++;
    }
    if (this.balance >= 95000) {
      this.progressStats.timesReached95k++;
    }
    if (this.balance >= 100000) {
      this.progressStats.timesReached100k++;
    }
  }

  // Resto de métodos existentes...
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

    const currentTotalBet = this.getTotalBet();
    if (currentTotalBet + amount > ROULETTE_DATA.config.maxBet) {
      console.warn(
        `El total acumulado de apuestas no puede exceder $${ROULETTE_DATA.config.maxBet.toLocaleString("es-CO")} COP`,
      );
      return false;
    }

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

    if (totalAmount > ROULETTE_DATA.config.maxBet) {
      console.warn("Las apuestas repetidas exceden el límite máximo");
      return false;
    }

    const currentTotalBet = this.getTotalBet();
    if (currentTotalBet + totalAmount > ROULETTE_DATA.config.maxBet) {
      console.warn("Repetir apuestas excedería el límite máximo total");
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

  getAvailableBetLimit() {
    const currentTotal = this.getTotalBet();
    return ROULETTE_DATA.config.maxBet - currentTotal;
  }

  canPlaceBet(amount) {
    const currentTotal = this.getTotalBet();
    return (
      this.balance >= amount &&
      amount >= ROULETTE_DATA.config.minBet &&
      currentTotal + amount <= ROULETTE_DATA.config.maxBet
    );
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
    const notification = document.createElement("div");
    notification.className = `notification notification--${type}`;
    notification.textContent = message;

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
      const engine = window.gameController.engine;
      const currentTotal = engine.getTotalBet();
      const wouldExceedTotal =
        currentTotal + this.selectedChipValue > ROULETTE_DATA.config.maxBet;

      if (engine.balance < this.selectedChipValue) {
        this.showNotification(
          "Balance insuficiente para esta apuesta",
          "error",
        );
      } else if (wouldExceedTotal) {
        const remaining = ROULETTE_DATA.config.maxBet - currentTotal;
        this.showNotification(
          `Total máximo de apuestas: $${ROULETTE_DATA.config.maxBet.toLocaleString("es-CO")} COP. Disponible: $${remaining.toLocaleString("es-CO")} COP`,
          "warning",
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
    this.elements.totalBet.innerHTML = `<strong>$${totalAmount.toLocaleString("es-CO")} COP</strong>`;
  }

  updateHistory(numbers) {
    const container = this.elements.historyNumbers;
    container.innerHTML = "";

    numbers.forEach((numberData) => {
      const element = document.createElement("div");
      element.className = `history-number ${numberData.color}`;
      element.textContent = numberData.number;
      container.appendChild(element);
    });
  }

  updateStatistics(stats) {
    this.elements.totalSpins.textContent = stats.totalSpins;
    this.elements.totalWins.textContent = stats.totalWins;
    this.elements.totalProfit.textContent = `$${stats.totalProfit.toLocaleString("es-CO")} COP`;
  }

  showLoadingOverlay() {
    this.elements.loadingOverlay.classList.add("show");
  }

  hideLoadingOverlay() {
    this.elements.loadingOverlay.classList.remove("show");
  }

  showResultMessage(winningNumber, result) {
    this.elements.resultNumber.textContent = winningNumber.number;
    this.elements.resultNumber.className = `result-number ${winningNumber.color}`;

    if (result.totalWinnings > 0) {
      this.elements.resultTitle.textContent = "¡Ganaste!";
      this.elements.resultText.textContent = `Has ganado $${result.totalWinnings.toLocaleString("es-CO")} COP`;
    } else {
      this.elements.resultTitle.textContent = "Sin suerte";
      this.elements.resultText.textContent = "Mejor suerte la próxima vez";
    }

    this.elements.resultMessage.classList.add("show");
  }

  hideResultMessage() {
    this.elements.resultMessage.classList.remove("show");
  }

  clearBetChips() {
    document.querySelectorAll(".bet-chip").forEach((chip) => {
      chip.remove();
    });
  }

  playSound(soundName) {
    // Implementación de sonidos opcional
  }
}

// =============================
// CONTROLADOR DE JUEGO - GAME CONTROLLER
// =============================

class GameController {
  constructor() {
    this.engine = new RouletteEngine();
    this.wheel = new RouletteWheel();
    this.ui = new RouletteUI();
    this.isSpinning = false;

    this.updateUI();
  }

  placeBet(betType, amount, number = null) {
    if (this.isSpinning) return false;

    const success = this.engine.placeBet(betType, amount, number);
    if (success) {
      this.updateUI();
    }
    return success;
  }

  async spin() {
    if (this.isSpinning) return;
    if (this.engine.getTotalBet() === 0) {
      this.ui.showNotification(
        "Debes realizar al menos una apuesta",
        "warning",
      );
      return;
    }

    this.isSpinning = true;
    this.ui.showLoadingOverlay();

    try {
      const winningNumber = this.engine.spin();
      await this.wheel.spin(winningNumber);

      const result = this.engine.calculateWinnings(winningNumber);

      this.ui.hideLoadingOverlay();
      this.ui.showResultMessage(winningNumber, result);
      this.ui.clearBetChips();
      this.updateUI();
    } catch (error) {
      console.error("Error during spin:", error);
      this.ui.hideLoadingOverlay();
      this.ui.showNotification("Error durante el giro", "error");
    } finally {
      this.isSpinning = false;
    }
  }

  repeatLastBets() {
    if (this.isSpinning) return false;

    const success = this.engine.repeatLastBets();
    if (success) {
      this.updateUI();
      this.ui.showNotification("Apuestas repetidas exitosamente", "success");
    } else {
      if (this.engine.lastBets.size === 0) {
        this.ui.showNotification(
          "No hay apuestas anteriores para repetir",
          "warning",
        );
      }
    }
    return success;
  }

  clearBets() {
    if (this.isSpinning) return false;

    this.engine.clearBets();
    this.ui.clearBetChips();
    this.updateUI();
    this.ui.showNotification("Mesa limpiada", "success");
  }

  updateUI() {
    this.ui.updateBalance(this.engine.balance);
    this.ui.updateActiveBets(this.engine.getActiveBets());
    this.ui.updateHistory(this.engine.history);
    this.ui.updateStatistics(this.engine.statistics);
  }
}

// =============================
// INICIALIZACIÓN
// =============================

const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .notification--success {
    background-color: #059669 !important;
  }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", () => {
  window.gameController = new GameController();
});
