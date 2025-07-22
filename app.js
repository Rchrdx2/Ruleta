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
 * - ✅ NUEVO: Sistema de Acolchonamiento (evita balance cero)
 * - ✅ CORREGIDO: Sistema de Victoria Mínima GLOBAL inteligente
 * - ✅ SOLUCIONADO: Eliminado sesgo del número 32
 * - ✅ MEJORADO: Distribución verdaderamente aleatoria
 * - ✅ IMPLEMENTADO: Control ABSOLUTO para apuestas restringidas (3k/5k)
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

      // ✅ NUEVO: Sistema de acolchonamiento
      paddingSystem: {
        enabled: true,
        minimumBalance: 5000,
        triggerBalance: 15000,
        forceWinProbability: 0.85,
        description: "Evita que el balance llegue a cero",
        logEnabled: true,
      },

      // ✅ CORREGIDO: Control de victoria mínima GLOBAL con evaluación inteligente
      minimumWinControl: {
        enabled: true,
        maxSpins: 20,
        maxWinToLossRatio: 3.0, // Si victoria mínima > total apostado × 3, mejor perder
        description:
          "Victoria mínima inteligente durante las primeras 20 tiradas",
        logEnabled: true,
      },
    },

    probabilityControl: {
      enabled: true,
      helpRanges: {
        35000: { winChance: 0.55, description: "Ayuda ligera" },
        30000: { winChance: 0.6, description: "Ayuda moderada" },
        25000: { winChance: 0.65, description: "Ayuda notable" },
        20000: { winChance: 0.7, description: "Ayuda considerable" },
        15000: { winChance: 0.75, description: "Ayuda fuerte" },
        10000: { winChance: 0.8, description: "Ayuda muy fuerte" },
        5000: { winChance: 0.85, description: "Ayuda máxima" },
      },

      streakControl: {
        maxConsecutiveWins: 3,
        forceNextLoss: false,
      },

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

      normalization: {
        spinThreshold: 20,
        enabled: true,
        resetProbabilities: true,
      },

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

    // ✅ NUEVO: Sistema anti-sesgo
    this.numberFrequency = new Map();
    this.shuffledNumbers = this._createShuffledNumbers();

    console.log(
      "🎲 [DEV] Sistema Anti-Sesgo Activado - Distribución aleatoria mejorada",
    );
  }

  // =============================
  // ✅ NUEVO: SISTEMA ANTI-SESGO
  // =============================

  /**
   * ✅ NUEVO: Crea un array de números aleatorizado para evitar sesgos posicionales
   */
  _createShuffledNumbers() {
    const numbers = [...ROULETTE_DATA.numbers];
    // Algoritmo Fisher-Yates para una mezcla verdaderamente aleatoria
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers;
  }

  /**
   * ✅ NUEVO: Rebarajea los números periódicamente para mantener aleatoriedad
   */
  _reshuffleNumbers() {
    if (this.totalSpins % 10 === 0) {
      this.shuffledNumbers = this._createShuffledNumbers();
      console.log(`🔀 [DEV] Números rebarajados en tirada ${this.totalSpins}`);
    }
  }

  /**
   * ✅ NUEVO: Monitorea la frecuencia de aparición de números
   */
  _updateNumberFrequency(number) {
    this.numberFrequency.set(
      number,
      (this.numberFrequency.get(number) || 0) + 1,
    );

    // Log cada 20 tiradas
    if (this.totalSpins % 20 === 0) {
      const sortedFreq = Array.from(this.numberFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      console.log(
        `📊 [DEV] Top 10 números más frecuentes (${this.totalSpins} tiradas):`,
        sortedFreq.map(([num, freq]) => `${num}:${freq}`),
      );
    }
  }

  // =============================
  // SISTEMA DE ACOLCHONAMIENTO
  // =============================

  _shouldActivatePaddingSystem() {
    const config = ROULETTE_DATA.config.balanceControl.paddingSystem;
    if (!config.enabled) return false;
    return this.balance <= config.triggerBalance;
  }

  _handlePaddingSystem() {
    const config = ROULETTE_DATA.config.balanceControl.paddingSystem;
    if (!this._shouldActivatePaddingSystem()) return null;

    if (this.balance <= config.minimumBalance) {
      console.log(
        `🛡️ [DEV] ACOLCHONAMIENTO CRÍTICO - Balance: ${this.balance}`,
        {
          minimumBalance: config.minimumBalance,
          action: "Forzando victoria inmediata",
        },
      );
      return "padding_force_win";
    }

    const shouldWin = Math.random() < config.forceWinProbability;
    if (shouldWin) {
      console.log(
        `🛡️ [DEV] ACOLCHONAMIENTO ACTIVO - Balance: ${this.balance}`,
        {
          triggerBalance: config.triggerBalance,
          winProbability: (config.forceWinProbability * 100).toFixed(1) + "%",
          action: "Aplicando ayuda",
        },
      );
      return "padding_help_win";
    }

    return null;
  }

  // =============================
  // ✅ CORREGIDO: SISTEMA DE VICTORIA MÍNIMA GLOBAL INTELIGENTE
  // =============================

  _isMinimumWinSystemActive() {
    const config = ROULETTE_DATA.config.balanceControl.minimumWinControl;
    if (!config.enabled) return false;

    const isWithinSpinLimit = this.totalSpins < config.maxSpins;

    if (!isWithinSpinLimit) {
      console.log(`⏱️ [DEV] Victoria Mínima DESACTIVADA:`, {
        currentSpin: this.totalSpins,
        maxSpins: config.maxSpins,
        reason: "Límite de tiradas alcanzado",
      });
    }

    return isWithinSpinLimit;
  }

  /**
   * ✅ NUEVO: Calcula la victoria mínima posible
   */
  _calculateMinimumPossibleWinning() {
    if (this.currentBets.size === 0) return 0;

    let minimumWin = Infinity;

    ROULETTE_DATA.numbers.forEach((numberData) => {
      let totalWinnings = 0;
      let hasWinningBets = false;

      this.currentBets.forEach((bet) => {
        if (this.checkWinningBet(bet, numberData)) {
          totalWinnings += bet.amount * (bet.payout + 1);
          hasWinningBets = true;
        }
      });

      if (hasWinningBets && totalWinnings < minimumWin) {
        minimumWin = totalWinnings;
      }
    });

    return minimumWin === Infinity ? 0 : minimumWin;
  }

  /**
   * ✅ ACTUALIZADO: Victoria mínima con evaluación aleatoria para evitar sesgos
   */
  _findMinimumWinningNumber() {
    if (this.currentBets.size === 0) {
      return this._generateRandomNumber();
    }

    let minimumWinnings = Infinity;
    let bestWinningNumber = null;
    let bestWinDetails = null;

    console.log(`💰 [DEV] Analizando Victoria Mínima GLOBAL:`, {
      totalBets: this.currentBets.size,
      balance: this.balance,
      evaluatingNumbers: ROULETTE_DATA.numbers.length,
      currentSpin: this.totalSpins,
      spinsRemaining: Math.max(
        0,
        ROULETTE_DATA.config.balanceControl.minimumWinControl.maxSpins -
          this.totalSpins,
      ),
      note: "Sistema activo independiente del balance con evaluación aleatoria",
    });

    // ✅ MEJORADO: Evaluar números en orden aleatorio para evitar sesgos
    const numbersToEvaluate = [...ROULETTE_DATA.numbers].sort(
      () => Math.random() - 0.5,
    );

    numbersToEvaluate.forEach((numberData) => {
      let totalWinnings = 0;
      let hasWinningBets = false;
      let winningBetsDetails = [];

      this.currentBets.forEach((bet) => {
        if (this.checkWinningBet(bet, numberData)) {
          const winAmount = bet.amount * (bet.payout + 1);
          totalWinnings += winAmount;
          hasWinningBets = true;
          winningBetsDetails.push({
            type: bet.type,
            number: bet.number,
            amount: bet.amount,
            payout: bet.payout,
            winAmount: winAmount,
          });
        }
      });

      if (hasWinningBets && totalWinnings < minimumWinnings) {
        minimumWinnings = totalWinnings;
        bestWinningNumber = numberData;
        bestWinDetails = {
          number: numberData.number,
          color: numberData.color,
          totalWinnings: totalWinnings,
          winningBets: winningBetsDetails.length,
          details: winningBetsDetails,
        };
      }
    });

    if (bestWinningNumber) {
      console.log(
        `✅ [DEV] Victoria Mínima GLOBAL Seleccionada:`,
        bestWinDetails,
      );
      return bestWinningNumber;
    }

    console.log(`⚠️ [DEV] No hay victorias posibles - usando método estándar`);
    return this._generateWinningNumber();
  }

  // =============================
  // ✅ NUEVO: CONTROL DE APUESTAS RESTRINGIDAS
  // =============================

  /**
   * ✅ NUEVO: Detecta apuestas únicas de números con montos de 3k o 5k
   */
  _isSingleNumberBetRestricted() {
    if (this.currentBets.size !== 1) {
      return false;
    }

    const bet = Array.from(this.currentBets.values())[0];
    const isRestricted =
      bet.type === "straight" && (bet.amount === 3000 || bet.amount === 5000);

    if (isRestricted) {
      console.log(`🚫 [DEV] APUESTA ÚNICA RESTRINGIDA DETECTADA:`, {
        type: bet.type,
        number: bet.number,
        amount: bet.amount,
        balance: this.balance,
        note: "Esta apuesta NUNCA ganará - control absoluto activo",
      });
    }

    return isRestricted;
  }

  /**
   * ✅ NUEVO: Genera un número que garantiza pérdida para apuestas restringidas
   */
  _generateLosingNumberForRestricted() {
    const bet = Array.from(this.currentBets.values())[0];
    const restrictedNumber = bet.number;

    // Crear lista de todos los números EXCEPTO el apostado
    const losingNumbers = ROULETTE_DATA.numbers.filter(
      (numberData) => numberData.number !== restrictedNumber,
    );

    if (losingNumbers.length === 0) {
      // Fallback extremo (no debería ocurrir)
      return ROULETTE_DATA.numbers[0];
    }

    const selectedNumber =
      losingNumbers[Math.floor(Math.random() * losingNumbers.length)];

    console.log(`🎯 [DEV] NÚMERO PERDEDOR FORZADO PARA APUESTA RESTRINGIDA:`, {
      restrictedBet: {
        number: restrictedNumber,
        amount: bet.amount,
      },
      winningNumber: selectedNumber.number,
      color: selectedNumber.color,
      guarantee: "PÉRDIDA 100% ASEGURADA",
    });

    return selectedNumber;
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
    this._reshuffleNumbers();
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
      minimumWinActive: this._isMinimumWinSystemActive(),
      paddingSystemActive: this._shouldActivatePaddingSystem(),
      antibiasActive: true,
      restrictedBetDetected: this._isSingleNumberBetRestricted(),
    };

    if (this.totalSpins % 5 === 0) {
      console.log(
        `📊 [DEV] Estado del Sistema (Tirada ${this.totalSpins}):`,
        status,
      );
    }

    return status;
  }

  // =============================
  // ✅ CORREGIDO: SISTEMA DE CONTROL CON PRIORIDAD ABSOLUTA Y EVALUACIÓN INTELIGENTE
  // =============================

  _getControlAction() {
    const config = ROULETTE_DATA.config.balanceControl;
    const probConfig = ROULETTE_DATA.config.probabilityControl;

    if (!config.enabled) return null;

    this._checkNormalization();

    // ✅ PRIORIDAD ABSOLUTA: Detectar y bloquear apuestas únicas restringidas (3k o 5k)
    if (this._isSingleNumberBetRestricted()) {
      console.log(
        `🚫 [DEV] APUESTA ÚNICA RESTRINGIDA DETECTADA - Forzando pérdida`,
        {
          bet: Array.from(this.currentBets.values())[0],
          balance: this.balance,
          action: "FORCE_LOSE_ALWAYS",
          priority: "ABSOLUTA - Sin excepciones",
          note: "Esta apuesta NUNCA puede ganar",
        },
      );
      return "force_lose_always";
    }

    // PRIORIDAD 1: Sistema de acolchonamiento
    const paddingAction = this._handlePaddingSystem();
    if (paddingAction) {
      return paddingAction;
    }

    // ✅ PRIORIDAD 2 CORREGIDA: Victoria mínima GLOBAL con evaluación inteligente
    if (this._isMinimumWinSystemActive()) {
      const minimumPossibleWin = this._calculateMinimumPossibleWinning();
      const totalBetAmount = this.getTotalBet();
      const maxWinToLossRatio = config.minimumWinControl.maxWinToLossRatio;

      // ✅ EVALUACIÓN INTELIGENTE: ¿Es mejor ganar mínimo o perder?
      if (minimumPossibleWin > totalBetAmount * maxWinToLossRatio) {
        console.log(
          `⚖️ [DEV] Victoria Mínima - Forzando PÉRDIDA (mejor opción):`,
          {
            minimumWin: minimumPossibleWin,
            totalBet: totalBetAmount,
            ratio: (minimumPossibleWin / totalBetAmount).toFixed(2),
            maxRatio: maxWinToLossRatio,
            decision: "PÉRDIDA TOTAL es mejor que victoria mínima",
            example:
              "Como tu caso: 63k ganancia vs 5k apostado = ratio 12.6 > 3.0",
          },
        );
        return "force_lose";
      } else if (minimumPossibleWin > 0) {
        console.log(`⚖️ [DEV] Victoria Mínima GLOBAL Activada:`, {
          minimumWin: minimumPossibleWin,
          totalBet: totalBetAmount,
          ratio: (minimumPossibleWin / totalBetAmount).toFixed(2),
          strategy: "Victoria mínima es aceptable",
          note: "Ratio dentro del límite permitido",
        });
        return "force_win_minimum";
      } else {
        console.log(`⚖️ [DEV] Victoria Mínima - No hay victorias posibles:`, {
          totalBets: this.currentBets.size,
          action: "Pérdida natural",
        });
        return "force_lose";
      }
    }

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

    if (this.balance >= config.absoluteMaxBalance - 10000) {
      console.log(`⚠️ [DEV] Cerca del Límite Máximo - Forzando pérdida`, {
        balance: this.balance,
        limit: config.absoluteMaxBalance,
        remaining: config.absoluteMaxBalance - this.balance,
      });
      return "force_lose_hard";
    }

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
  // ✅ MEJORADO: MÉTODO SPIN CON CONTROL ABSOLUTO
  // =============================

  spin() {
    const controlAction = this._getControlAction();
    this.lastControlAction = controlAction;
    let winningNumber;

    // ✅ CONTROL ABSOLUTO: Apuestas únicas restringidas SIEMPRE pierden
    if (controlAction === "force_lose_always") {
      winningNumber = this._generateLosingNumberForRestricted();
      console.log(`🚫 [DEV] APUESTA RESTRINGIDA - Número perdedor forzado:`, {
        winningNumber: winningNumber.number,
        color: winningNumber.color,
        restrictedBet: Array.from(this.currentBets.values())[0],
        guarantee: "PÉRDIDA ASEGURADA AL 100%",
        note: "Sin posibilidad de victoria - control absoluto",
      });
    }
    // Resto de controles existentes
    else if (
      controlAction === "padding_force_win" ||
      controlAction === "padding_help_win"
    ) {
      winningNumber = this._generateWinningNumber();
    } else if (controlAction === "force_win_minimum") {
      winningNumber = this._findMinimumWinningNumber();
    } else if (
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
      winningNumber = this._generateRandomNumber();
    }

    // ✅ NUEVO: Actualizar estadísticas de frecuencia
    this._updateNumberFrequency(winningNumber.number);

    this.history.unshift(winningNumber);
    if (this.history.length > 10) {
      this.history.pop();
    }

    this.statistics.totalSpins++;
    this._incrementSpinCounter();

    return winningNumber;
  }

  // =============================
  // MÉTODOS DE GENERACIÓN MEJORADOS
  // =============================

  /**
   * ✅ MEJORADO: Genera números aleatorios usando el array mezclado
   */
  _generateRandomNumber() {
    const randomIndex = Math.floor(Math.random() * this.shuffledNumbers.length);
    return this.shuffledNumbers[randomIndex];
  }

  /**
   * ✅ MEJORADO: Victoria con evaluación aleatoria para evitar sesgos
   */
  _generateWinningNumber() {
    if (this.currentBets.size === 0) {
      return this._generateRandomNumber();
    }

    const winningOptions = [];

    // ✅ MEJORADO: Aleatorizar orden de evaluación de apuestas
    const betsArray = Array.from(this.currentBets.entries()).sort(
      () => Math.random() - 0.5,
    );

    betsArray.forEach(([betKey, bet]) => {
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

        // ✅ MEJORADO: Aleatorizar números válidos
        const shuffledValidNumbers = validNumbers.sort(
          () => Math.random() - 0.5,
        );

        shuffledValidNumbers.forEach((num) => {
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

    // ✅ MEJORADO: Selección más aleatoria
    const selectedOption =
      topOptions[Math.floor(Math.random() * topOptions.length)];

    return ROULETTE_DATA.numbers.find(
      (n) => n.number === selectedOption.number,
    );
  }

  /**
   * ✅ MEJORADO: Pérdida con evaluación aleatoria
   */
  _generateLosingNumber() {
    if (this.currentBets.size === 0) {
      return this._generateRandomNumber();
    }

    const losingNumbers = [];

    // ✅ MEJORADO: Evaluar números en orden aleatorio
    const numbersToEvaluate = [...ROULETTE_DATA.numbers].sort(
      () => Math.random() - 0.5,
    );

    numbersToEvaluate.forEach((numberData) => {
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

    // ✅ NUEVO: Reiniciar sistema anti-sesgo
    this.numberFrequency.clear();
    this.shuffledNumbers = this._createShuffledNumbers();

    document.getElementById("limitModal").classList.remove("show");
    document.querySelector(".container").classList.remove("game-blocked");

    window.gameController.ui.updateBalance(this.balance);
    window.gameController.ui.updateActiveBets([]);
    window.gameController.ui.updateGameStats(this.statistics);

    document.getElementById("historyNumbers").innerHTML = "";
    document.querySelectorAll(".bet-chip").forEach((chip) => chip.remove());
  }

  _shouldTriggerLuckStreak() {
    const progress = this.balance / 100000;
    if (progress >= 0.6 && progress < 0.9) {
      return Math.random() < 0.35;
    }
    return false;
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

  _validateAndCorrectBalance() {
    const config = ROULETTE_DATA.config.balanceControl;

    if (!config.enabled) return;

    if (
      this.balance < config.paddingSystem.minimumBalance &&
      config.paddingSystem.enabled
    ) {
      console.log(`🛡️ [DEV] ACOLCHONAMIENTO - Ajustando balance mínimo:`, {
        balanceActual: this.balance,
        balanceMinimo: config.paddingSystem.minimumBalance,
      });
      this.balance = config.paddingSystem.minimumBalance;
    }

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

  calculateWinnings(winningNumber) {
    let totalWinnings = 0;
    let winningBets = [];
    let losingBets = [];
    const config = ROULETTE_DATA.config.balanceControl;

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

    if (hasWon) {
      this.consecutiveWins++;
      this.consecutiveLosses = 0;
      this.statistics.totalWins++;

      console.log(`🎉 [DEV] VICTORIA:`, {
        totalWinnings,
        winningBets: winningBets.length,
        consecutiveWins: this.consecutiveWinsStreak,
        newBalance: this.balance + totalWinnings,
        controlApplied: this.lastControlAction,
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
        `Apuesta mínima permitida: $${ROULETTE_DATA.config.minBet.toLocaleString(
          "es-CO",
        )} COP`,
      );
      return false;
    }

    if (amount > ROULETTE_DATA.config.maxBet) {
      console.warn(
        `Apuesta máxima permitida: $${ROULETTE_DATA.config.maxBet.toLocaleString(
          "es-CO",
        )} COP`,
      );
      return false;
    }

    const currentTotalBet = this.getTotalBet();
    if (currentTotalBet + amount > ROULETTE_DATA.config.maxBet) {
      console.warn(
        `El total acumulado de apuestas no puede exceder $${ROULETTE_DATA.config.maxBet.toLocaleString(
          "es-CO",
        )} COP`,
      );
      return false;
    }

    const betKey = number !== null ? `${betType}-${number}` : betType;
    const existingBet = this.currentBets.get(betKey);
    const newTotalBet = existingBet ? existingBet.amount + amount : amount;

    if (newTotalBet > ROULETTE_DATA.config.maxBet) {
      console.warn(
        `La apuesta total en esta posición no puede exceder $${ROULETTE_DATA.config.maxBet.toLocaleString(
          "es-CO",
        )} COP`,
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
    this.soundEnabled = true;
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
      const success = window.gameController.repeatLastBets();
      if (success) {
        this.updateActiveBets(window.gameController.engine.getActiveBets());
        this.updateBalance(window.gameController.engine.balance);
        this.regenerateChipVisuals();
      }
    });

    this.elements.clearBtn.addEventListener("click", () => {
      window.gameController.clearBets();
      this.updateActiveBets([]);
      this.updateBalance(window.gameController.engine.balance);
      this.clearChipVisuals();
    });

    this.elements.resultMessage.addEventListener("click", () => {
      this.hideResultMessage();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideResultMessage();
      }
    });
  }

  generateBettingTable() {
    const numbersGrid = document.getElementById("numbersGrid");
    numbersGrid.innerHTML = "";

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
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
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
      this.updateActiveBets(window.gameController.engine.getActiveBets());
      this.updateBalance(window.gameController.engine.balance);
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
      const newAmount = currentAmount + this.selectedChipValue;
      chipElement.textContent = newAmount;
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
                    <span class="bet-name">${betName}</span>
                    <span class="bet-amount">$${bet.amount.toLocaleString(
                      "es-CO",
                    )}</span>
                </div>
            `;
      totalAmount += bet.amount;
    });

    html += `
            <div class="total-bet">
                <strong>Total: $${totalAmount.toLocaleString("es-CO")} COP</strong>
            </div>
        `;

    container.innerHTML = html;
    this.elements.totalBet.textContent = `$${totalAmount.toLocaleString(
      "es-CO",
    )} COP`;
  }

  updateHistory(history) {
    const container = this.elements.historyNumbers;
    container.innerHTML = "";

    history.forEach((number) => {
      const element = document.createElement("div");
      element.className = `history-number ${number.color}`;
      element.textContent = number.number;
      container.appendChild(element);
    });
  }

  updateGameStats(stats) {
    this.elements.totalSpins.textContent = stats.totalSpins;
    this.elements.totalWins.textContent = stats.totalWins;

    const profitClass =
      stats.totalProfit >= 0 ? "profit-positive" : "profit-negative";
    this.elements.totalProfit.innerHTML = `<span class="${profitClass}">$${stats.totalProfit.toLocaleString(
      "es-CO",
    )} COP</span>`;
  }

  showResult(result, winningNumber) {
    const { totalWinnings, netProfit } = result;
    const isWin = totalWinnings > 0;

    this.elements.resultNumber.textContent = winningNumber.number;
    this.elements.resultNumber.className = `result-number ${winningNumber.color}`;

    if (isWin) {
      this.elements.resultTitle.textContent = "¡GANASTE!";
      this.elements.resultTitle.style.color = "#00c853";
      this.elements.resultText.innerHTML = `
                <p>Ganaste <strong>$${totalWinnings.toLocaleString(
                  "es-CO",
                )}</strong></p>
                <p>Beneficio neto: <strong>$${netProfit.toLocaleString(
                  "es-CO",
                )}</strong></p>
            `;
      this.playSound("win");
    } else {
      this.elements.resultTitle.textContent = "PERDISTE";
      this.elements.resultTitle.style.color = "#ff5252";
      this.elements.resultText.innerHTML = `
                <p>Perdiste <strong>$${Math.abs(netProfit).toLocaleString(
                  "es-CO",
                )}</strong></p>
                <p>¡Mejor suerte la próxima vez!</p>
            `;
      this.playSound("lose");
    }

    this.elements.resultMessage.classList.add("show");

    setTimeout(() => {
      this.hideResultMessage();
    }, 4000);
  }

  hideResultMessage() {
    this.elements.resultMessage.classList.remove("show");
  }

  showLoadingOverlay() {
    this.elements.loadingOverlay.classList.add("show");
  }

  hideLoadingOverlay() {
    this.elements.loadingOverlay.classList.remove("show");
  }

  regenerateChipVisuals() {
    const bets = window.gameController.engine.getActiveBets();
    this.clearChipVisuals();

    bets.forEach((bet) => {
      const selector =
        bet.number !== null
          ? `[data-number="${bet.number}"]`
          : `[data-bet="${bet.type}"]`;
      const element = document.querySelector(selector);

      if (element) {
        const chipElement = document.createElement("div");
        chipElement.className = "bet-chip";
        chipElement.style.backgroundColor = this.getChipColor(bet.amount);
        chipElement.textContent = bet.amount;
        element.appendChild(chipElement);
      }
    });
  }

  clearChipVisuals() {
    document.querySelectorAll(".bet-chip").forEach((chip) => {
      chip.remove();
    });
  }

  playSound(type) {
    if (!this.soundEnabled) return;
    // Implementar sonidos aquí si se desea
  }

  disableControls() {
    this.elements.spinBtn.disabled = true;
    this.elements.repeatBtn.disabled = true;
    this.elements.clearBtn.disabled = true;
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.style.pointerEvents = "none";
    });
    document.querySelectorAll(".number-cell, .bet-cell").forEach((cell) => {
      cell.style.pointerEvents = "none";
    });
  }

  enableControls() {
    this.elements.spinBtn.disabled = false;
    this.elements.repeatBtn.disabled = false;
    this.elements.clearBtn.disabled = false;
    document.querySelectorAll(".chip").forEach((chip) => {
      chip.style.pointerEvents = "auto";
    });
    document.querySelectorAll(".number-cell, .bet-cell").forEach((cell) => {
      cell.style.pointerEvents = "auto";
    });
  }
}

// =============================
// CONTROLADOR PRINCIPAL
// =============================

class GameController {
  constructor() {
    this.engine = new RouletteEngine();
    this.wheel = new RouletteWheel();
    this.ui = new RouletteUI();

    this.ui.updateBalance(this.engine.balance);
    this.ui.updateGameStats(this.engine.statistics);

    console.log("🎰 [DEV] Juego de Ruleta Inicializado:", {
      balance: this.engine.balance,
      config: ROULETTE_DATA.config,
      restrictedBetControl: "ACTIVO - Apuestas 3k/5k NUNCA ganan",
      minimumWinControl: "CORREGIDO - Evaluación inteligente implementada",
    });
  }

  async spin() {
    if (this.engine.currentBets.size === 0) {
      this.ui.showNotification(
        "Debes realizar al menos una apuesta",
        "warning",
      );
      return;
    }

    this.ui.disableControls();
    this.ui.showLoadingOverlay();

    // ✅ NUEVO: Log de debug para apuestas restringidas
    if (this.engine._isSingleNumberBetRestricted()) {
      console.log(`🚫 [DEV] SPINNING CON APUESTA RESTRINGIDA:`, {
        bets: Array.from(this.engine.currentBets.entries()),
        guarantee: "PÉRDIDA ASEGURADA AL 100%",
        note: "El sistema forzará un número perdedor",
      });
    }

    const winningNumber = this.engine.spin();

    await this.wheel.spin(winningNumber);

    const result = this.engine.calculateWinnings(winningNumber);

    this.ui.hideLoadingOverlay();
    this.ui.updateBalance(this.engine.balance);
    this.ui.updateActiveBets([]);
    this.ui.updateHistory(this.engine.history);
    this.ui.updateGameStats(this.engine.statistics);
    this.ui.showResult(result, winningNumber);
    this.ui.clearChipVisuals();
    this.ui.enableControls();

    // ✅ NUEVO: Verificación post-spin para apuestas restringidas
    if (this.engine.lastControlAction === "force_lose_always") {
      console.log(`✅ [DEV] APUESTA RESTRINGIDA PROCESADA CORRECTAMENTE:`, {
        winningNumber: winningNumber.number,
        totalWinnings: result.totalWinnings,
        wasExpectedLoss: result.totalWinnings === 0,
        verification:
          result.totalWinnings === 0
            ? "CORRECTO - Pérdida confirmada"
            : "ERROR - Sistema falló",
      });
    }
  }

  placeBet(betType, amount, number = null) {
    return this.engine.placeBet(betType, amount, number);
  }

  repeatLastBets() {
    return this.engine.repeatLastBets();
  }

  clearBets() {
    this.engine.clearBets();
    return true;
  }
}

// =============================
// INICIALIZACIÓN
// =============================

document.addEventListener("DOMContentLoaded", () => {
  window.gameController = new GameController();
});
