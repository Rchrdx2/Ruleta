// === LÓGICA DEL BOTÓN DE AYUDA FLOTANTE ===
document.addEventListener('DOMContentLoaded', () => {
  const helpFab = document.getElementById('helpFab');
  const helpModal = document.getElementById('helpModal');
  const closeHelpModal = document.getElementById('closeHelpModal');
  if (helpFab && helpModal && closeHelpModal) {
    helpFab.addEventListener('click', () => {
      helpModal.classList.add('active');
    });
    closeHelpModal.addEventListener('click', () => {
      helpModal.classList.remove('active');
    });
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('active');
    });
  }
});
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
    straight: { name: "Número", payout: 18 }, // Pago reducido de 20 a 18
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
  // --- ANTI-RACHAS ---
  _updateStreaks(isWin) {
    if (isWin) {
      this.consecutiveWins = (this.consecutiveWins || 0) + 1;
      this.consecutiveLosses = 0;
    } else {
      this.consecutiveLosses = (this.consecutiveLosses || 0) + 1;
      this.consecutiveWins = 0;
    }
  }

  _shouldBreakStreak() {
    // Si hay 4+ victorias o derrotas seguidas, activar anti-rachas
    const maxStreak = 4;
    return (this.consecutiveWins >= maxStreak || this.consecutiveLosses >= maxStreak);
  }

  _forceBreakStreak(currentResult) {
    // Si el jugador está en racha de victorias, forzar derrota. Si está en racha de derrotas, forzar victoria.
    if (this.consecutiveWins >= 4) {
      return false; // Forzar derrota
    }
    if (this.consecutiveLosses >= 4) {
      return true; // Forzar victoria
    }
    return currentResult;
  }
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

  // MÉTODO: Detectar si las apuestas actuales son repetición de las anteriores
  _isRepeatedBets() {
    if (this.lastBets.size === 0 || this.currentBets.size === 0) {
      return false;
    }
    
    if (this.lastBets.size !== this.currentBets.size) {
      return false;
    }
    
    // Verificar si todas las apuestas son idénticas
    for (const [key, bet] of this.currentBets) {
      const lastBet = this.lastBets.get(key);
      if (!lastBet || lastBet.amount !== bet.amount || lastBet.type !== bet.type) {
        return false;
      }
    }
    
    return true;
  }

  // MÉTODO: Helper para seleccionar de opciones
  _selectFromOptions(options) {
    if (!options.length) return null;
    const idx = Math.floor(Math.random() * options.length);
    return options[idx];
  }

  // MÉTODO: Obtener el rango numérico de un número
  _getNumberRange(number) {
    if (number === 0) return '0';
    if (number >= 1 && number <= 9) return '1-9';
    if (number >= 10 && number <= 18) return '10-18';
    if (number >= 19 && number <= 27) return '19-27';
    if (number >= 28 && number <= 36) return '28-36';
    return 'unknown';
  }

  // MÉTODO: Obtener frecuencia de un rango en el historial reciente
  _getRangeFrequency(targetRange) {
    const recentHistory = this.history.slice(0, 6);
    return recentHistory.filter(h => {
      const range = this._getNumberRange(h.number);
      return range === targetRange;
    }).length;
  }

  // MÉTODO: Detectar rachas de colores y prevenir explotación
  _detectColorStreak() {
    if (this.history.length < 2) return { streak: 0, color: null, shouldForceChange: false };
    
    const recentColors = this.history.slice(0, 6).map(h => h.color);
    const lastColor = recentColors[0];
    
    // Contar consecutivos del mismo color
    let streak = 0;
    for (const color of recentColors) {
      if (color === lastColor && color !== 'green') {
        streak++;
      } else {
        break;
      }
    }
    
    // Detectar si hay una apuesta predominante en un color
    const hasColorBet = this.currentBets.has('red') || this.currentBets.has('black');
    const colorBetAmount = Math.max(
      this.currentBets.get('red')?.amount || 0,
      this.currentBets.get('black')?.amount || 0
    );
    
    // Forzar cambio si hay racha + apuesta fuerte en ese color
    const shouldForceChange = (streak >= 2 && hasColorBet && colorBetAmount >= 3000) || streak >= 4;
    
    return { 
      streak, 
      color: lastColor, 
      shouldForceChange,
      hasStrongColorBet: colorBetAmount >= 3000
    };
  }

  // MÉTODO: Sistema anti-explotación para apuestas simples
  _applyAntiExploitLogic(numbers, isWinningGeneration = false) {
    const colorStreak = this._detectColorStreak();
    const processedNumbers = [];
    
    // Si hay racha de color + apuesta fuerte, forzar balance
    if (colorStreak.shouldForceChange) {
      const oppositeColor = colorStreak.color === 'red' ? 'black' : 'red';
      
      numbers.forEach(numberData => {
        let weight = 1.0;
        
        // Fuerte penalización para continuar la racha cuando hay apuesta grande
        if (numberData.color === colorStreak.color && colorStreak.hasStrongColorBet) {
          weight = 0.1; // Casi imposible continuar racha con apuesta fuerte
        }
        // Bonus para romper la racha
        else if (numberData.color === oppositeColor) {
          weight = 3.0; // Fuerte bonus para color opuesto
        }
        // Verde como interructor neutral
        else if (numberData.color === 'green') {
          weight = 1.5; // Bonus moderado para verde
        }
        
        // Aplicar peso
        const copies = Math.max(1, Math.floor(weight * 4));
        for (let i = 0; i < copies; i++) {
          processedNumbers.push(numberData);
        }
      });
    } else {
      // Aplicar lógica normal de distribución
      numbers.forEach(numberData => {
        let weight = 1.0;
        
        // Penalización moderada por repetición de color reciente
        const recentColors = this.history.slice(0, 4).map(h => h.color);
        const sameColorCount = recentColors.filter(c => c === numberData.color).length;
        
        if (sameColorCount >= 3) {
          weight = 0.4;
        } else if (sameColorCount >= 2) {
          weight = 0.7;
        }
        
        // Penalización por número específico repetido
        const numberAppearances = this.history.slice(0, 3).filter(
          h => h.number === numberData.number
        ).length;
        
        if (numberAppearances > 0) {
          weight = weight * (0.5 / (numberAppearances + 1));
        }
        
        const copies = Math.max(1, Math.floor(weight * 3));
        for (let i = 0; i < copies; i++) {
          processedNumbers.push(numberData);
        }
      });
    }
    
    return processedNumbers.length > 0 ? processedNumbers : numbers;
  }

  // MÉTODO PRINCIPAL MODIFICADO: Control con restricciones específicas y mejor distribución
  _getControlAction() {
    const config = ROULETTE_DATA.config.balanceControl;

    if (!config.enabled) return null;

    const isRepeated = this._isRepeatedBets();
    const baseRandomChance = isRepeated ? 0.6 : 0.3;

    // NUEVO: Si solo hay apuestas a números (straight), reducir la probabilidad de ganar
    const onlyStraightBets = Array.from(this.currentBets.values()).every(bet => bet.type === "straight");
    if (onlyStraightBets && this.currentBets.size > 0) {
      // 40% de probabilidad de forzar derrota si solo hay apuestas a números
      if (Math.random() < 0.4) return "force_lose_hard";
    }

    // Control específico para apuestas únicas de números 3k/5k
    if (this._isSingleNumberBetRestricted()) {
      return null;
    }

    if (isRepeated && Math.random() < baseRandomChance) {
      return null;
    }

    if (this.luckStreak > 0) {
      this.luckStreak--;
      return isRepeated && Math.random() < 0.3 ? null : "favor_win";
    }

    if (this._shouldTriggerLuckStreak() && (!isRepeated || Math.random() < 0.5)) {
      this.luckStreak = 4;
      return "luck_streak";
    }

    if (this.balance >= config.absoluteMaxBalance - 10000) {
      return "force_lose_hard";
    }

    if (this.balance >= 75000 && this.balance < 95000) {
      const finalPush = (this.balance - 75000) / 20000;
      let winProbability = 0.5 + finalPush * 0.3;
      if (isRepeated) winProbability *= 0.7;
      if (Math.random() < winProbability) return "favor_win";
    }

    if (this.balance >= 60000 && this.balance < 75000) {
      const growthBoost = (this.balance - 60000) / 15000;
      let winProbability = 0.45 + growthBoost * 0.25;
      if (isRepeated) winProbability *= 0.6;
      if (Math.random() < winProbability) return "favor_win";
    }

    if (this.balance <= config.minBalance) {
      return "force_win";
    }

    if (this.balance >= config.maxBalance) {
      return "force_lose";
    }

    const lowerTransition = config.minBalance + config.transitionZone;
    const upperTransition = config.maxBalance - config.transitionZone;

    if (this.balance < lowerTransition) {
      const intensity =
        (lowerTransition - this.balance) / config.transitionZone;
      let winProbability = config.naturalProbability + intensity * 0.5;
      if (isRepeated) winProbability *= 0.7;
      return Math.random() < winProbability ? "favor_win" : null;
    }

    if (this.balance > upperTransition) {
      const intensity =
        (this.balance - upperTransition) / config.transitionZone;
      let lossProbability = config.naturalProbability + intensity * 0.5;
      if (isRepeated) lossProbability *= 0.7;
      return Math.random() < lossProbability ? "favor_lose" : null;
    }

    if (this.consecutiveLosses >= 3 && this.balance < config.initialBalance) {
      const winChance = isRepeated ? 0.5 : 0.7;
      return Math.random() < winChance ? "favor_win" : null;
    }

    if (this.consecutiveWins >= 3 && this.balance > config.initialBalance) {
      const loseChance = isRepeated ? 0.2 : 0.35;
      return Math.random() < loseChance ? "favor_lose" : null;
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

  // MÉTODO MEJORADO: Generar número ganador con protección anti-explotación
  _generateWinningNumber() {
    if (this.currentBets.size === 0) {
      return this._generateRandomNumber();
    }

    const winningOptions = [];

    this.currentBets.forEach((bet, betKey) => {
      if (bet.type === "straight") {
        // Prioridad base para apuestas directas
        let priority = bet.payout * bet.amount;
        
        // Aplicar distribución equilibrada por rangos
        const numberRange = this._getNumberRange(bet.number);
        const rangeFrequency = this._getRangeFrequency(numberRange);
        
        // Penalizar si el rango está sobrerepresentado
        if (rangeFrequency >= 3) {
          priority = priority * 0.3;
        } else if (rangeFrequency >= 2) {
          priority = priority * 0.6;
        } else if (rangeFrequency === 0) {
          priority = priority * 1.3; // Bonus para rangos no representados
        }
        
        // Penalización adicional por número específico
        const recentAppearances = this.history.slice(0, 5).filter(
          h => h.number === bet.number
        ).length;
        
        if (recentAppearances > 0) {
          priority = priority * (0.4 / (recentAppearances + 1));
        }

        winningOptions.push({
          number: bet.number,
          priority: priority,
          bet: bet,
        });
      } else {
        const validNumbers = this._getValidNumbersForBet(bet);
        validNumbers.forEach((num) => {
          let priority = bet.payout * bet.amount;
          
          // Aplicar distribución equilibrada por rangos
          const numberRange = this._getNumberRange(num);
          const rangeFrequency = this._getRangeFrequency(numberRange);
          
          if (rangeFrequency >= 2) {
            priority = priority * 0.5;
          } else if (rangeFrequency === 0) {
            priority = priority * 1.2;
          }
          
          // Penalización por repetición individual
          const recentAppearances = this.history.slice(0, 4).filter(
            h => h.number === num
          ).length;
          
          if (recentAppearances > 0) {
            priority = priority * (0.6 / (recentAppearances + 1));
          }
          
          // Balancear colores
          const recentColors = this.history.slice(0, 4).map(h => h.color);
          const targetNumber = ROULETTE_DATA.numbers.find(n => n.number === num);
          if (targetNumber) {
            const sameColorCount = recentColors.filter(c => c === targetNumber.color).length;
            if (sameColorCount >= 2) {
              priority = priority * 0.6;
            }
          }

          winningOptions.push({
            number: num,
            priority: priority,
            bet: bet,
          });
        });
      }
    });

    if (winningOptions.length === 0) {
      return this._generateRandomNumber();
    }

    // Crear pool basado en prioridades ajustadas
    const priorityPool = [];
    winningOptions.forEach(option => {
      const adjustedPriority = option.priority * (Math.random() * 0.6 + 0.7);
      const copies = Math.max(1, Math.floor(adjustedPriority / 1000)); // Escalar prioridades
      
      for (let i = 0; i < copies; i++) {
        const numberData = ROULETTE_DATA.numbers.find(n => n.number === option.number);
        if (numberData) {
          priorityPool.push(numberData);
        }
      }
    });

    // Aplicar sistema anti-explotación al pool de números ganadores
    const finalPool = this._applyAntiExploitLogic(priorityPool, true);

    // Selección final
    if (finalPool.length > 0) {
      return finalPool[Math.floor(Math.random() * finalPool.length)];
    }

    // Fallback: selección tradicional por prioridad
    winningOptions.sort((a, b) => (b.priority * Math.random()) - (a.priority * Math.random()));
    const selectedOption = winningOptions[0];
    
    return ROULETTE_DATA.numbers.find(
      (n) => n.number === selectedOption.number,
    );
  }

  // MÉTODO: Generar número perdedor con protección anti-explotación
  _generateLosingNumber() {
    const config = ROULETTE_DATA.config.balanceControl;

    if (this.currentBets.size === 0) {
      return this._generateRandomNumber();
    }

    // Filtrar números que no generan ganancias
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

    // Aplicar distribución equilibrada por rangos a números perdedores
    const ranges = [
      { min: 0, max: 0, numbers: losingNumbers.filter(n => n.number === 0) },
      { min: 1, max: 9, numbers: losingNumbers.filter(n => n.number >= 1 && n.number <= 9) },
      { min: 10, max: 18, numbers: losingNumbers.filter(n => n.number >= 10 && n.number <= 18) },
      { min: 19, max: 27, numbers: losingNumbers.filter(n => n.number >= 19 && n.number <= 27) },
      { min: 28, max: 36, numbers: losingNumbers.filter(n => n.number >= 28 && n.number <= 36) }
    ];

    const recentHistory = this.history.slice(0, 6);
    const balancedLosingPool = [];

    ranges.forEach(range => {
      if (range.numbers.length === 0) return;
      
      // Analizar frecuencia del rango en historial reciente
      const rangeCount = recentHistory.filter(h => 
        h.number >= range.min && h.number <= range.max
      ).length;
      
      // Peso base del rango (favorece rangos menos utilizados)
      let rangeWeight = 1.0;
      if (rangeCount >= 2) {
        rangeWeight = 0.4; // Penalizar rangos sobrerepresentados
      } else if (rangeCount === 0) {
        rangeWeight = 1.4; // Bonus para rangos no representados
      }
      
      range.numbers.forEach(numberData => {
        let numberWeight = rangeWeight;
        
        // Penalización individual por número
        const specificAppearances = recentHistory.filter(
          h => h.number === numberData.number
        ).length;
        
        if (specificAppearances > 0) {
          numberWeight = numberWeight * (0.4 / (specificAppearances + 1));
        }
        
        // Penalización por color
        const recentColors = recentHistory.map(h => h.color);
        const sameColorCount = recentColors.filter(c => c === numberData.color).length;
        if (sameColorCount >= 2) {
          numberWeight = numberWeight * 0.6;
        }
        
        // Agregar al pool balanceado inicial
        const copies = Math.max(1, Math.floor(numberWeight * 3));
        for (let i = 0; i < copies; i++) {
          balancedLosingPool.push(numberData);
        }
      });
    });

    // Aplicar sistema anti-explotación a los números perdedores
    const finalLosingPool = this._applyAntiExploitLogic(
      balancedLosingPool.length > 0 ? balancedLosingPool : losingNumbers, 
      false
    );

    return finalLosingPool.length > 0 
      ? finalLosingPool[Math.floor(Math.random() * finalLosingPool.length)]
      : losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
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

  // MÉTODO: Generar número aleatorio con protección anti-explotación
  _generateRandomNumber() {
    // Si no hay historial, usar selección completamente aleatoria
    if (this.history.length === 0) {
      const randomIndex = Math.floor(
        Math.random() * ROULETTE_DATA.numbers.length,
      );
      return ROULETTE_DATA.numbers[randomIndex];
    }
    
    // Definir rangos para distribución equilibrada
    const ranges = [
      { min: 0, max: 0, numbers: ROULETTE_DATA.numbers.filter(n => n.number === 0) },
      { min: 1, max: 9, numbers: ROULETTE_DATA.numbers.filter(n => n.number >= 1 && n.number <= 9) },
      { min: 10, max: 18, numbers: ROULETTE_DATA.numbers.filter(n => n.number >= 10 && n.number <= 18) },
      { min: 19, max: 27, numbers: ROULETTE_DATA.numbers.filter(n => n.number >= 19 && n.number <= 27) },
      { min: 28, max: 36, numbers: ROULETTE_DATA.numbers.filter(n => n.number >= 28 && n.number <= 36) }
    ];
    
    // Analizar frecuencia reciente por rangos
    const recentHistory = this.history.slice(0, 8);
    const balancedPool = [];
    
    ranges.forEach(range => {
      if (range.numbers.length === 0) return;
      
      const rangeCount = recentHistory.filter(h => 
        h.number >= range.min && h.number <= range.max
      ).length;
      
      // Peso base del rango
      let rangeWeight = 1.0;
      if (rangeCount >= 3) {
        rangeWeight = 0.2;
      } else if (rangeCount >= 2) {
        rangeWeight = 0.5;
      } else if (rangeCount === 0) {
        rangeWeight = 1.5;
      }
      
      // Procesar números del rango con pesos individuales
      range.numbers.forEach(numberData => {
        let numberWeight = rangeWeight;
        
        // Penalización por repetición específica
        const specificAppearances = recentHistory.filter(
          h => h.number === numberData.number
        ).length;
        
        if (specificAppearances > 0) {
          numberWeight = numberWeight * (0.3 / (specificAppearances + 1));
        }
        
        // Penalización por color repetido
        const recentColors = recentHistory.map(h => h.color);
        const sameColorCount = recentColors.filter(c => c === numberData.color).length;
        if (sameColorCount >= 3) {
          numberWeight = numberWeight * 0.4;
        } else if (sameColorCount >= 2) {
          numberWeight = numberWeight * 0.7;
        }
        
        // Agregar al pool inicial
        const copies = Math.max(1, Math.floor(numberWeight * 3));
        for (let i = 0; i < copies; i++) {
          balancedPool.push(numberData);
        }
      });
    });
    
    // Aplicar sistema anti-explotación al pool balanceado
    const finalPool = this._applyAntiExploitLogic(balancedPool, false);
    
    // Selección final aleatoria
    return finalPool[Math.floor(Math.random() * finalPool.length)];
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

    // Verificar si se alcanzó la meta de 100k
    const hasReached100k = this.balance >= 100000;

    return {
      totalWinnings,
      winningBets,
      losingBets,
      netProfit: totalWinnings - totalBetAmount,
      hasReached100k, // Nueva propiedad para indicar si se alcanzó la meta
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
  // --- SORTEO CON ANTI-RACHAS ---
  getSpinResult(bets) {
    // Lógica original para determinar si el jugador gana
    // Suponiendo que bets es un array de apuestas activas
    // y que existe un método original para determinar el resultado (simulación)
    let playerWins = false;
    let winningNumber = this._getRandomNumber();
    // Revisar si alguna apuesta es ganadora
    for (const bet of bets) {
      if (this.checkWinningBet(bet, winningNumber)) {
        playerWins = true;
        break;
      }
    }
    // Aplicar anti-rachas si corresponde
    if (this._shouldBreakStreak()) {
      playerWins = this._forceBreakStreak(playerWins);
      // Si se forzó el resultado, buscar un número que cumpla la condición
      let tries = 0;
      while (tries < 50) {
        const candidate = this._getRandomNumber();
        let win = false;
        for (const bet of bets) {
          if (this.checkWinningBet(bet, candidate)) {
            win = true;
            break;
          }
        }
        if (win === playerWins) {
          winningNumber = candidate;
          break;
        }
        tries++;
      }
    }
    // Actualizar rachas
    this._updateStreaks(playerWins);
    return winningNumber;
  }

  _getRandomNumber() {
    // Devuelve un objeto {number, color} aleatorio de ROULETTE_DATA.numbers
    const idx = Math.floor(Math.random() * ROULETTE_DATA.numbers.length);
    return ROULETTE_DATA.numbers[idx];
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

  // MÉTODO: Reiniciar el juego completamente
  restartGame() {
    this.balance = ROULETTE_DATA.config.initialBalance;
    this.currentBets = new Map();
    this.lastBets = new Map();
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
      congratulationsModal: document.getElementById("congratulationsModal"),
      finalBalance: document.getElementById("finalBalance"),
      finalSpins: document.getElementById("finalSpins"),
      finalProfit: document.getElementById("finalProfit"),
      restartGameBtn: document.getElementById("restartGameBtn"),
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

    this.elements.restartGameBtn.addEventListener("click", () => {
      this.restartGame();
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
        element.appendChild(chipElement);
      }

      const currentAmount = parseInt(chipElement.textContent) || 0;
      const newAmount = currentAmount + this.selectedChipValue;
      chipElement.textContent = newAmount;
      
      // Actualizar el color basado en el nuevo monto total
      let chipColor;
      if (newAmount >= 5000) {
        chipColor = this.getChipColor(5000);
      } else if (newAmount >= 3000) {
        chipColor = this.getChipColor(3000);
      } else {
        chipColor = this.getChipColor(1000);
      }
      chipElement.style.backgroundColor = chipColor;
    }
  }

  getChipColor(value) {
    const colors = {
      1000: "#ffd700", // Dorado
      3000: "#dc143c", // Rojo carmesí
      5000: "#000000", // Negro
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

  showCongratulationsModal(stats) {
    // Actualizar las estadísticas finales
    this.elements.finalBalance.textContent = `$${stats.balance.toLocaleString("es-CO")} COP`;
    this.elements.finalSpins.textContent = stats.totalSpins;
    this.elements.finalProfit.textContent = `$${stats.totalProfit.toLocaleString("es-CO")} COP`;
    
    // Mostrar el modal
    this.elements.congratulationsModal.classList.add("show");
    
    // Reproducir sonido de celebración (opcional)
    this.playSound("celebration");
  }

  hideCongratulationsModal() {
    this.elements.congratulationsModal.classList.remove("show");
  }

  restartGame() {
    // Ocultar el modal
    this.hideCongratulationsModal();
    
    // Reiniciar el juego a través del controlador
    window.gameController.restartGame();
    
    // Mostrar notificación de nuevo juego
    this.showNotification("¡Nuevo juego iniciado! ¡Buena suerte!", "success");
  }

  disableGameControls() {
    this.elements.spinBtn.disabled = true;
    this.elements.repeatBtn.disabled = true;
    this.elements.clearBtn.disabled = true;
    
    // Deshabilitar también las fichas y celdas de apuesta
    document.querySelectorAll(".chip, .number-cell, .bet-cell").forEach(element => {
      element.style.pointerEvents = "none";
      element.style.opacity = "0.5";
    });
  }

  enableGameControls() {
    this.elements.spinBtn.disabled = false;
    this.elements.repeatBtn.disabled = false;
    this.elements.clearBtn.disabled = false;
    
    // Rehabilitar fichas y celdas de apuesta
    document.querySelectorAll(".chip, .number-cell, .bet-cell").forEach(element => {
      element.style.pointerEvents = "auto";
      element.style.opacity = "1";
    });
  }

  clearBetChips() {
    document.querySelectorAll(".bet-chip").forEach((chip) => {
      chip.remove();
    });
  }

  // Nueva función para mostrar todas las fichas basadas en las apuestas actuales
  displayAllBetChips(bets) {
    // Primero limpiar todas las fichas existentes
    this.clearBetChips();
    
    // Luego mostrar las fichas para cada apuesta activa
    bets.forEach((bet) => {
      this.displayBetChip(bet.type, bet.number, bet.amount);
    });
  }

  // Función auxiliar para mostrar una ficha individual
  displayBetChip(betType, number, amount) {
    const selector = number !== null ? `[data-number="${number}"]` : `[data-bet="${betType}"]`;
    const element = document.querySelector(selector);

    if (element) {
      // Remover ficha existente si la hay
      const existingChip = element.querySelector(".bet-chip");
      if (existingChip) {
        existingChip.remove();
      }

      // Crear nueva ficha
      const chipElement = document.createElement("div");
      chipElement.className = "bet-chip";
      
      // Determinar el color basado en el monto (usar el monto más común para el color)
      let chipColor;
      if (amount >= 5000) {
        chipColor = this.getChipColor(5000);
      } else if (amount >= 3000) {
        chipColor = this.getChipColor(3000);
      } else {
        chipColor = this.getChipColor(1000);
      }
      
      chipElement.style.backgroundColor = chipColor;
      chipElement.textContent = amount;
      element.appendChild(chipElement);
    }
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

      // Verificar si se alcanzó la meta de 100k
      if (result.hasReached100k) {
        // Deshabilitar controles del juego
        this.ui.disableGameControls();
        
        // Mostrar el modal de felicitaciones después de un breve delay
        setTimeout(() => {
          this.ui.hideCongratulationsModal(); // Asegurar que esté oculto primero
          this.ui.showCongratulationsModal({
            balance: this.engine.balance,
            totalSpins: this.engine.statistics.totalSpins,
            totalProfit: this.engine.statistics.totalProfit,
          });
        }, 2000); // 2 segundos después del resultado
      }
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
      // Mostrar las fichas visualmente en la mesa
      this.ui.displayAllBetChips(this.engine.getActiveBets());
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

  restartGame() {
    // Reiniciar el motor del juego
    this.engine.restartGame();
    
    // Limpiar la interfaz
    this.ui.clearBetChips();
    this.ui.hideResultMessage();
    
    // Rehabilitar controles
    this.ui.enableGameControls();
    
    // Actualizar la interfaz
    this.updateUI();
    
    // Resetear la ruleta
    this.wheel.resetBall();
    
    // Seleccionar la ficha de 1000 por defecto
    this.ui.selectChip(1000);
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
    background-color: #ffd700 !important; /* Dorado para éxito */
    color: black !important; /* Texto negro para mejor contraste */
  }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", () => {
  window.gameController = new GameController();
});
