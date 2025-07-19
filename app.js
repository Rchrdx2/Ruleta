/**
 * JUEGO DE RULETA EUROPEA - ARQUITECTURA MODULAR AVANZADA
 * ========================================================
 *
 * Implementación con sistema de probabilidades dinámicas:
 * - Control específico para apuestas únicas de números
 * - Sistema de rangos dinámicos (balance < 40k)
 * - Control de rachas (balance > 40k)
 * - Probabilidades dinámicas según balance
 * - Sistema de normalización después de 20 tiradas
 * - Control anti-estrategia de múltiples números rectos
 * - ✅ NUEVO: Console logs informativos para desarrolladores
 * - Modal de bloqueo al alcanzar límite de 100k COP
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
    straight: { name: "Número", payout: 20 },
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

    balanceControl: {
      enabled: true,
      minBalance: 40000,
      maxBalance: 97000,
      absoluteMaxBalance: 100000,
      transitionZone: 5000,
      naturalProbability: 0.3,
      finalPushZone: 15000,
      luckStreakEnabled: true,
    },

    // Sistema de probabilidades dinámicas
    probabilityControl: {
      enabled: true,

      // Rangos de ayuda (balance < 40k)
      helpRanges: {
        35000: { winChance: 0.55, description: "Ayuda ligera" },
        30000: { winChance: 0.6, description: "Ayuda moderada" },
        25000: { winChance: 0.65, description: "Ayuda notable" },
        20000: { winChance: 0.7, description: "Ayuda considerable" },
        15000: { winChance: 0.75, description: "Ayuda fuerte" },
        10000: { winChance: 0.8, description: "Ayuda muy fuerte" },
        5000: { winChance: 0.85, description: "Ayuda máxima" },
      },

      // Control de rachas (balance > 40k)
      streakControl: {
        maxConsecutiveWins: 3,
        forceNextLoss: false,
      },

      // Probabilidades dinámicas (balance > 40k)
      dynamicProbabilities: {
        90000: {
          lossChance: 0.75,
          description: "Balance muy alto - 75% pérdida",
        },
        80000: { lossChance: 0.65, description: "Balance alto - 65% pérdida" },
        70000: {
          lossChance: 0.55,
          description: "Balance medio-alto - 55% pérdida",
        },
        60000: { lossChance: 0.45, description: "Balance medio - 45% pérdida" },
        50000: { lossChance: 0.35, description: "Balance bajo - 35% pérdida" },
        40000: {
          lossChance: 0.25,
          description: "Balance mínimo - 25% pérdida",
        },
      },

      // Sistema de normalización
      normalization: {
        spinThreshold: 20,
        enabled: true,
        resetProbabilities: true,
      },

      // Control anti-estrategia de múltiples números rectos
      multiStraightControl: {
        enabled: true,
        minStraightBets: 4,
        minTotalAmount: 3000,
        forceLossProbability: 0.85,
        description: "Control anti-estrategia múltiples números",
      },
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

    // Variables del sistema original
    this.consecutiveLosses = 0;
    this.consecutiveWins = 0;
    this.lastControlAction = null;
    this.luckStreak = 0;
    this.progressStats = {
      timesNear90k: 0,
      timesReached95k: 0,
      timesReached100k: 0,
    };

    // Variables para sistema de probabilidades dinámicas
    this.totalSpins = 0;
    this.systemNormalized = false;
    this.forceNextLoss = false;
    this.consecutiveWinsStreak = 0;
  }

  // =============================
  // SISTEMA DE PROBABILIDADES DINÁMICAS
  // =============================

  _calculateWinProbability() {
    const config = ROULETTE_DATA.config.probabilityControl;

    if (!config.enabled) {
      return this._getNaturalWinProbability();
    }

    if (this.systemNormalized) {
      return this._getNaturalWinProbability();
    }

    if (this.balance < ROULETTE_DATA.config.balanceControl.minBalance) {
      const helpRanges = config.helpRanges;
      const rangeKeys = Object.keys(helpRanges)
        .map(Number)
        .sort((a, b) => b - a);

      for (const threshold of rangeKeys) {
        if (this.balance >= threshold) {
          return helpRanges[threshold].winChance;
        }
      }

      const lowestRange = Math.min(...rangeKeys);
      return helpRanges[lowestRange].winChance;
    }

    if (this.forceNextLoss) {
      return 0.1;
    }

    const dynamicProbs = config.dynamicProbabilities;
    const probKeys = Object.keys(dynamicProbs)
      .map(Number)
      .sort((a, b) => b - a);

    for (const threshold of probKeys) {
      if (this.balance >= threshold) {
        return 1 - dynamicProbs[threshold].lossChance;
      }
    }

    return this._getNaturalWinProbability();
  }

  _getNaturalWinProbability() {
    if (this.currentBets.size === 0) return 0;

    let totalWinningNumbers = 0;
    let totalPossibleOutcomes = 37;

    this.currentBets.forEach((bet) => {
      switch (bet.type) {
        case "straight":
          totalWinningNumbers += 1;
          break;
        case "red":
        case "black":
          totalWinningNumbers += 18;
          break;
        case "odd":
        case "even":
          totalWinningNumbers += 18;
          break;
        case "low":
        case "high":
          totalWinningNumbers += 18;
          break;
        case "dozen1":
        case "dozen2":
        case "dozen3":
          totalWinningNumbers += 12;
          break;
        case "column1":
        case "column2":
        case "column3":
          totalWinningNumbers += 12;
          break;
      }
    });

    const averageWinChance = Math.min(
      totalWinningNumbers / totalPossibleOutcomes,
      1,
    );
    return averageWinChance;
  }

  _handleStreakControl(won) {
    const config = ROULETTE_DATA.config.probabilityControl.streakControl;

    if (this.balance >= ROULETTE_DATA.config.balanceControl.minBalance) {
      if (won) {
        this.consecutiveWinsStreak++;
        if (this.consecutiveWinsStreak >= config.maxConsecutiveWins) {
          this.forceNextLoss = true;
          this.consecutiveWinsStreak = 0;
        }
      } else {
        this.consecutiveWinsStreak = 0;
        this.forceNextLoss = false;
      }
    } else {
      this.consecutiveWinsStreak = 0;
      this.forceNextLoss = false;
    }
  }

  /**
   * ✅ ACTUALIZADO: Sistema de normalización con logging
   */
  _checkNormalization() {
    const config = ROULETTE_DATA.config.probabilityControl.normalization;

    if (
      config.enabled &&
      this.totalSpins >= config.spinThreshold &&
      !this.systemNormalized
    ) {
      this.systemNormalized = true;

      console.log(`🔄 [DEV] SISTEMA NORMALIZADO:`, {
        totalSpins: this.totalSpins,
        threshold: config.spinThreshold,
        previouslyActive: "Probabilidades dinámicas",
        nowActive: "Solo controles básicos",
        balance: this.balance,
      });
    }
  }

  _incrementSpinCounter() {
    this.totalSpins++;
    this._checkNormalization();
  }

  _isMultipleStraightBetStrategy() {
    const config = ROULETTE_DATA.config.probabilityControl.multiStraightControl;

    if (!config.enabled) return false;
    if (this.currentBets.size < config.minStraightBets) return false;

    let straightBetsCount = 0;
    let totalStraightAmount = 0;

    this.currentBets.forEach((bet) => {
      if (bet.type === "straight") {
        straightBetsCount++;
        totalStraightAmount += bet.amount;
      }
    });

    const isMostlyStraight = straightBetsCount / this.currentBets.size >= 0.8;
    const isSignificantAmount = totalStraightAmount >= config.minTotalAmount;
    const hasMinimumStraights = straightBetsCount >= config.minStraightBets;

    return isMostlyStraight && isSignificantAmount && hasMinimumStraights;
  }

  /**
   * ✅ ACTUALIZADO: Estado del sistema con logging automático
   */
  getSystemStatus() {
    const status = {
      totalSpins: this.totalSpins,
      systemNormalized: this.systemNormalized,
      probabilitiesActive:
        ROULETTE_DATA.config.probabilityControl.enabled &&
        !this.systemNormalized,
      helpSystemActive:
        this.balance < ROULETTE_DATA.config.balanceControl.minBalance,
      streakControlActive:
        this.balance >= ROULETTE_DATA.config.balanceControl.minBalance,
      consecutiveWinsStreak: this.consecutiveWinsStreak,
      forceNextLoss: this.forceNextLoss,
      multiStraightDetected: this._isMultipleStraightBetStrategy(),
      spinsUntilNormalization: Math.max(
        0,
        ROULETTE_DATA.config.probabilityControl.normalization.spinThreshold -
          this.totalSpins,
      ),
    };

    // ✅ NUEVO: Log automático cada 5 tiradas
    if (this.totalSpins % 5 === 0) {
      console.log(
        `📊 [DEV] Estado del Sistema (Tirada ${this.totalSpins}):`,
        status,
      );
    }

    return status;
  }

  // =============================
  // SISTEMA DE CONTROL ACTUALIZADO CON LOGGING
  // =============================

  /**
   * ✅ ACTUALIZADO: Control con logging detallado para desarrolladores
   */
  _getControlAction() {
    const config = ROULETTE_DATA.config.balanceControl;
    const probConfig = ROULETTE_DATA.config.probabilityControl;

    if (!config.enabled) return null;

    this._checkNormalization();

    // ✅ NUEVO: Log para múltiples números rectos
    if (this._isMultipleStraightBetStrategy()) {
      const multiConfig = probConfig.multiStraightControl;
      const shouldLose = Math.random() < multiConfig.forceLossProbability;

      console.log(`🎯 [DEV] Control Anti-Estrategia Detectado:`, {
        straightBets: Array.from(this.currentBets.values()).filter(
          (bet) => bet.type === "straight",
        ).length,
        totalAmount: Array.from(this.currentBets.values()).reduce(
          (sum, bet) => (bet.type === "straight" ? sum + bet.amount : sum),
          0,
        ),
        forceLossProbability: multiConfig.forceLossProbability,
        willForceLoss: shouldLose,
        balance: this.balance,
      });

      return shouldLose ? "force_lose_hard" : null;
    }

    // ✅ NUEVO: Log para apuestas únicas restringidas
    if (this._isSingleNumberBetRestricted()) {
      console.log(`🚫 [DEV] Apuesta Única Restringida - No se aplica control`, {
        bet: Array.from(this.currentBets.values())[0],
        balance: this.balance,
      });
      return null;
    }

    // ✅ NUEVO: Log para sistema de probabilidades
    if (probConfig.enabled && !this.systemNormalized) {
      const targetWinProbability = this._calculateWinProbability();
      const naturalWinProbability = this._getNaturalWinProbability();
      const shouldWin = Math.random() < targetWinProbability;
      const naturallyWins = Math.random() < naturalWinProbability;

      console.log(`🎲 [DEV] Sistema Probabilidades:`, {
        balance: this.balance,
        targetWinProbability: (targetWinProbability * 100).toFixed(1) + "%",
        naturalWinProbability: (naturalWinProbability * 100).toFixed(1) + "%",
        shouldWin,
        naturallyWins,
        systemNormalized: this.systemNormalized,
        totalSpins: this.totalSpins,
      });

      if (shouldWin && !naturallyWins) {
        console.log(`✅ [DEV] Forzando VICTORIA - Sistema de ayuda activo`);
        return "force_win";
      } else if (!shouldWin && naturallyWins) {
        console.log(`❌ [DEV] Forzando PÉRDIDA - Control de balance activo`);
        return "force_lose";
      }
    }

    // ✅ NUEVO: Log para sistema original
    if (this.luckStreak > 0) {
      console.log(`🍀 [DEV] Racha de Suerte Activa:`, {
        luckStreakRemaining: this.luckStreak,
        balance: this.balance,
      });
      this.luckStreak--;
      return "favor_win";
    }

    if (this._shouldTriggerLuckStreak()) {
      console.log(`🎰 [DEV] Activando Racha de Suerte:`, {
        balance: this.balance,
        progress: ((this.balance / 100000) * 100).toFixed(1) + "%",
      });
      this.luckStreak = 4;
      return "luck_streak";
    }

    // Log para límite cerca de 100k
    if (this.balance >= config.absoluteMaxBalance - 10000) {
      console.log(`⚠️ [DEV] Cerca del Límite Máximo - Forzando pérdida`, {
        balance: this.balance,
        limit: config.absoluteMaxBalance,
        remaining: config.absoluteMaxBalance - this.balance,
      });
      return "force_lose_hard";
    }

    // Logs para otros rangos de control
    if (this.balance >= 75000 && this.balance < 95000) {
      const finalPush = (this.balance - 75000) / 20000;
      const winProbability = 0.5 + finalPush * 0.3;
      if (Math.random() < winProbability) {
        console.log(`📈 [DEV] Final Push Activo (75k-95k):`, {
          balance: this.balance,
          winProbability: (winProbability * 100).toFixed(1) + "%",
        });
        return "favor_win";
      }
    }

    if (this.balance >= 60000 && this.balance < 75000) {
      const growthBoost = (this.balance - 60000) / 15000;
      const winProbability = 0.45 + growthBoost * 0.25;
      if (Math.random() < winProbability) {
        console.log(`🚀 [DEV] Growth Boost Activo (60k-75k):`, {
          balance: this.balance,
          winProbability: (winProbability * 100).toFixed(1) + "%",
        });
        return "favor_win";
      }
    }

    if (this.balance <= config.minBalance) {
      console.log(`🆘 [DEV] Balance Mínimo - Forzando Victoria:`, {
        balance: this.balance,
        minBalance: config.minBalance,
      });
      return "force_win";
    }

    if (this.balance >= config.maxBalance) {
      console.log(`⛔ [DEV] Balance Máximo - Forzando Pérdida:`, {
        balance: this.balance,
        maxBalance: config.maxBalance,
      });
      return "force_lose";
    }

    return null;
  }

  // =============================
  // MÉTODOS ORIGINALES MANTENIDOS
  // =============================

  _showLimitModal() {
    console.log(`🏁 [DEV] LÍMITE MÁXIMO ALCANZADO - Mostrando Modal:`, {
      balance: this.balance,
      limit: ROULETTE_DATA.config.balanceControl.absoluteMaxBalance,
      totalSpins: this.totalSpins,
      statistics: this.statistics,
    });

    const modal = document.getElementById("limitModal");
    const gameContainer = document.querySelector(".container");

    modal.classList.add("show");
    gameContainer.classList.add("game-blocked");

    const restartBtn = document.getElementById("restartGame");
    restartBtn.onclick = () => this._restartGame();
  }

  _restartGame() {
    console.log(`🔄 [DEV] REINICIANDO JUEGO:`, {
      balanceAnterior: this.balance,
      statisticasFinales: this.statistics,
      progressStatsFinales: this.progressStats,
    });

    this.balance = ROULETTE_DATA.config.initialBalance;
    this.currentBets.clear();
    this.lastBets.clear();
    this.history = [];
    this.statistics = {
      totalSpins: 0,
      totalWins: 0,
      totalProfit: 0,
    };

    this.consecutiveLosses = 0;
    this.consecutiveWins = 0;
    this.lastControlAction = null;
    this.luckStreak = 0;
    this.progressStats = {
      timesNear90k: 0,
      timesReached95k: 0,
      timesReached100k: 0,
    };

    this.totalSpins = 0;
    this.systemNormalized = false;
    this.forceNextLoss = false;
    this.consecutiveWinsStreak = 0;

    document.getElementById("limitModal").classList.remove("show");
    document.querySelector(".container").classList.remove("game-blocked");

    window.gameController.ui.updateBalance(this.balance);
    window.gameController.ui.updateActiveBets([]);
    window.gameController.ui.updateGameStats(this.statistics);

    document.getElementById("historyNumbers").innerHTML = "";
    document.querySelectorAll(".bet-chip").forEach((chip) => chip.remove());
  }

  _isSingleNumberBetRestricted() {
    if (this.currentBets.size !== 1) {
      return false;
    }

    const bet = Array.from(this.currentBets.values())[0];
    return (
      bet.type === "straight" && (bet.amount === 3000 || bet.amount === 5000)
    );
  }

  _shouldTriggerLuckStreak() {
    const progress = this.balance / 100000;
    if (progress >= 0.6 && progress < 0.9) {
      return Math.random() < 0.35;
    }
    return false;
  }

  _selectFromOptions(options) {
    if (!options.length) return null;
    const idx = Math.floor(Math.random() * options.length);
    return options[idx];
  }

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
    this._incrementSpinCounter();

    return winningNumber;
  }

  _generateWinningNumber() {
    if (this.currentBets.size === 0) {
      return this._generateRandomNumber();
    }

    const winningOptions = [];

    this.currentBets.forEach((bet, betKey) => {
      if (bet.type === "straight") {
        const priority =
          this.balance > 65000
            ? bet.payout * bet.amount * 3
            : bet.payout * bet.amount * 1.5;
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

  _generateLosingNumber() {
    const config = ROULETTE_DATA.config.balanceControl;

    if (this.currentBets.size === 0) {
      return this._generateRandomNumber();
    }

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

    return losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
  }

  _getValidNumbersForBet(bet) {
    const validNumbers = [];

    ROULETTE_DATA.numbers.forEach((numberData) => {
      if (this.checkWinningBet(bet, numberData)) {
        validNumbers.push(numberData.number);
      }
    });

    return validNumbers;
  }

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

  _calculatePotentialWinnings(numberData) {
    let totalWinnings = 0;

    this.currentBets.forEach((bet) => {
      if (this.checkWinningBet(bet, numberData)) {
        totalWinnings += bet.amount * (bet.payout + 1);
      }
    });

    return totalWinnings;
  }

  _generateRandomNumber() {
    const randomIndex = Math.floor(
      Math.random() * ROULETTE_DATA.numbers.length,
    );
    return ROULETTE_DATA.numbers[randomIndex];
  }

  _validateAndCorrectBalance() {
    const config = ROULETTE_DATA.config.balanceControl;
    if (!config.enabled) return;

    if (this.balance >= config.absoluteMaxBalance) {
      this.balance = config.absoluteMaxBalance;
      setTimeout(() => {
        this._showLimitModal();
      }, 1000);
    }

    if (this.balance >= config.absoluteMaxBalance - 5000) {
      this.consecutiveWins = 0;
      this.consecutiveLosses = 0;
    }
  }

  /**
   * ✅ ACTUALIZADO: Calcular ganancias con logging detallado
   */
  calculateWinnings(winningNumber) {
    let totalWinnings = 0;
    let winningBets = [];
    let losingBets = [];
    const config = ROULETTE_DATA.config.balanceControl;

    // ✅ NUEVO: Log del resultado de la tirada
    console.log(`🎰 [DEV] Resultado de Tirada:`, {
      winningNumber: winningNumber.number,
      color: winningNumber.color,
      currentBets: this.currentBets.size,
      balanceBefore: this.balance,
      controlAction: this.lastControlAction,
    });

    this.currentBets.forEach((bet, betKey) => {
      const isWinning = this.checkWinningBet(bet, winningNumber);

      if (isWinning) {
        let winAmount = bet.amount * (bet.payout + 1);
        const potentialBalance = this.balance + winAmount;

        if (potentialBalance > config.absoluteMaxBalance) {
          winAmount = config.absoluteMaxBalance - this.balance;
          console.log(`💰 [DEV] Ganancia Limitada:`, {
            originalWin: bet.amount * (bet.payout + 1),
            limitedWin: winAmount,
            reason: "Límite máximo de balance",
          });
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

    const hasWon = totalWinnings > 0;

    // ✅ NUEVO: Log de estadísticas de racha
    if (hasWon) {
      this.consecutiveWins++;
      this.consecutiveLosses = 0;
      this.statistics.totalWins++;
      console.log(`🎉 [DEV] VICTORIA:`, {
        totalWinnings,
        winningBets: winningBets.length,
        consecutiveWins: this.consecutiveWinsStreak,
        newBalance: this.balance + totalWinnings,
      });
    } else {
      this.consecutiveLosses++;
      this.consecutiveWins = 0;
      console.log(`💸 [DEV] PÉRDIDA:`, {
        lostAmount: Array.from(this.currentBets.values()).reduce(
          (sum, bet) => sum + bet.amount,
          0,
        ),
        consecutiveWinsReset: true,
        newBalance: this.balance,
      });
    }

    this._handleStreakControl(hasWon);

    // ✅ NUEVO: Log de control de rachas
    if (this.forceNextLoss) {
      console.log(`🔄 [DEV] Control de Rachas - Próxima pérdida forzada`, {
        consecutiveWinsStreak: this.consecutiveWinsStreak,
        balance: this.balance,
      });
    }

    this.balance += totalWinnings;
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

    this.elements.selectedChip.textContent = `$${value.toLocaleString(
      "es-CO",
    )} COP`;
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
          `Total máximo de apuestas: $${ROULETTE_DATA.config.maxBet.toLocaleString(
            "es-CO",
          )} COP. Disponible: $${remaining.toLocaleString("es-CO")} COP`,
          "warning",
        );
      } else if (this.selectedChipValue > ROULETTE_DATA.config.maxBet) {
        this.showNotification(
          `Apuesta máxima permitida: $${ROULETTE_DATA.config.maxBet.toLocaleString(
            "es-CO",
          )} COP`,
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
    this.elements.balance.textContent = `$${balance.toLocaleString(
      "es-CO",
    )} COP`;
  }

  updateActiveBets(bets) {
    const container = this.elements.activeBets;

    if (bets.length === 0) {
      container.innerHTML = "<p>No hay apuestas activas</p>";
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
                <div class="active-bet">
                    <span class="bet-name">${betName}</span>
                    <span class="bet-amount">$${bet.amount.toLocaleString(
                      "es-CO",
                    )} COP</span>
                </div>
            `;
      totalAmount += bet.amount;
    });

    container.innerHTML = html;
    this.elements.totalBet.textContent = `$${totalAmount.toLocaleString(
      "es-CO",
    )} COP`;
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

  updateGameStats(stats) {
    this.elements.totalSpins.textContent = stats.totalSpins;
    this.elements.totalWins.textContent = stats.totalWins;
    this.elements.totalProfit.textContent = `$${stats.totalProfit.toLocaleString(
      "es-CO",
    )} COP`;
  }

  showLoadingOverlay() {
    this.elements.loadingOverlay.classList.add("show");
  }

  hideLoadingOverlay() {
    this.elements.loadingOverlay.classList.remove("show");
  }

  showResultMessage(winningNumber, result, engine) {
    const { totalWinnings, netProfit } = result;

    this.elements.resultNumber.textContent = winningNumber.number;
    this.elements.resultNumber.className = `result-number ${winningNumber.color}`;

    if (totalWinnings > 0) {
      this.elements.resultTitle.textContent = "¡Ganaste!";
      this.elements.resultText.textContent = `Ganancia: $${totalWinnings.toLocaleString(
        "es-CO",
      )} COP`;
      this.elements.resultMessage.className = "result-message win show";
    } else {
      this.elements.resultTitle.textContent = "Perdiste";
      this.elements.resultText.textContent = `Pérdida: $${Math.abs(
        netProfit,
      ).toLocaleString("es-CO")} COP`;
      this.elements.resultMessage.className = "result-message lose show";
    }

    setTimeout(() => {
      this.hideResultMessage();
    }, 4000);
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
    // Implementación opcional de sonidos
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

    // Hacer disponible para debugging
    window.rouletteEngine = this.engine;
  }

  async spin() {
    if (this.isSpinning) return;

    const activeBets = this.engine.getActiveBets();
    if (activeBets.length === 0) {
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
      this.updateUI(winningNumber, result);
      this.ui.showResultMessage(winningNumber, result, this.engine);
    } catch (error) {
      console.error("Error durante el spin:", error);
      this.ui.showNotification("Error durante el juego", "error");
    } finally {
      this.isSpinning = false;
      this.ui.hideLoadingOverlay();
    }
  }

  placeBet(betType, amount, number = null) {
    return this.engine.placeBet(betType, amount, number);
  }

  repeatLastBets() {
    const success = this.engine.repeatLastBets();
    if (success) {
      this.ui.updateBalance(this.engine.balance);
      this.ui.updateActiveBets(this.engine.getActiveBets());
    } else {
      this.ui.showNotification(
        "No se pudieron repetir las apuestas",
        "warning",
      );
    }
  }

  clearBets() {
    this.engine.clearBets();
    this.ui.updateBalance(this.engine.balance);
    this.ui.updateActiveBets([]);
    this.ui.clearBetChips();
  }

  updateUI(winningNumber, result) {
    this.ui.updateBalance(this.engine.balance);
    this.ui.updateActiveBets([]);
    this.ui.updateHistory(this.engine.history);
    this.ui.updateGameStats(this.engine.statistics);
    this.ui.clearBetChips();
  }
}

// =============================
// FUNCIONES GLOBALES PARA DESARROLLADORES
// =============================

/**
 * ✅ NUEVO: Función global para desarrolladores
 */
window.devInfo = function () {
  const engine = window.rouletteEngine || window.gameController?.engine;
  if (!engine) {
    console.error("❌ [DEV] Motor de juego no encontrado");
    return;
  }

  console.log(`📈 [DEV] Información Completa del Sistema:`, {
    balance: engine.balance,
    systemStatus: engine.getSystemStatus(),
    currentBets: Array.from(engine.currentBets.entries()),
    statistics: engine.statistics,
    history: engine.history.slice(0, 5),
    progressStats: engine.progressStats,
  });
};

/**
 * ✅ NUEVO: Función para activar/desactivar logging detallado
 */
window.toggleDevLogs = function (enabled = true) {
  window.devLogsEnabled = enabled;
  console.log(
    `🔧 [DEV] Logging detallado ${enabled ? "ACTIVADO" : "DESACTIVADO"}`,
  );
};

// =============================
// INICIALIZACIÓN DEL JUEGO
// =============================
document.addEventListener("DOMContentLoaded", () => {
  window.gameController = new GameController();

  // ✅ NUEVO: Logs de inicialización para desarrolladores
  console.log(`🚀 [DEV] Ruleta Europea Inicializada:`, {
    timestamp: new Date().toLocaleString(),
    version: "Sistema de Probabilidades Dinámicas v2.0 + Logs",
    features: [
      "Control anti-estrategia múltiples números",
      "Sistema de normalización (20 tiradas)",
      "Probabilidades dinámicas por balance",
      "Control de rachas",
      "Modal de límite 100k COP",
      "Console logs informativos para desarrolladores",
    ],
  });

  console.log(`⚙️ [DEV] Configuración Activa:`, {
    multiStraightControl:
      ROULETTE_DATA.config.probabilityControl.multiStraightControl.enabled,
    normalizationThreshold:
      ROULETTE_DATA.config.probabilityControl.normalization.spinThreshold,
    balanceControl: ROULETTE_DATA.config.balanceControl.enabled,
    initialBalance: ROULETTE_DATA.config.initialBalance,
  });

  console.log(`🛠️ [DEV] Comandos Disponibles:`, {
    "devInfo()": "Ver información completa del sistema",
    "toggleDevLogs(true/false)": "Activar/desactivar logs detallados",
    "window.rouletteEngine.getSystemStatus()": "Ver estado actual del sistema",
  });
});
