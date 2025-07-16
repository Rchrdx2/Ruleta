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
        {number: 0, color: "green"},
        {number: 32, color: "red"}, {number: 15, color: "black"}, {number: 19, color: "red"}, {number: 4, color: "black"},
        {number: 21, color: "red"}, {number: 2, color: "black"}, {number: 25, color: "red"}, {number: 17, color: "black"},
        {number: 34, color: "red"}, {number: 6, color: "black"}, {number: 27, color: "red"}, {number: 13, color: "black"},
        {number: 36, color: "red"}, {number: 11, color: "black"}, {number: 30, color: "red"}, {number: 8, color: "black"},
        {number: 23, color: "red"}, {number: 10, color: "black"}, {number: 5, color: "red"}, {number: 24, color: "black"},
        {number: 16, color: "red"}, {number: 33, color: "black"}, {number: 1, color: "red"}, {number: 20, color: "black"},
        {number: 14, color: "red"}, {number: 31, color: "black"}, {number: 9, color: "red"}, {number: 22, color: "black"},
        {number: 18, color: "red"}, {number: 29, color: "black"}, {number: 7, color: "red"}, {number: 28, color: "black"},
        {number: 12, color: "red"}, {number: 35, color: "black"}, {number: 3, color: "red"}, {number: 26, color: "black"}
    ],
    betTypes: {
        straight: {name: "Número", payout: 35},
        red: {name: "Rojo", payout: 1},
        black: {name: "Negro", payout: 1},
        odd: {name: "Impar", payout: 1},
        even: {name: "Par", payout: 1},
        low: {name: "1-18", payout: 1},
        high: {name: "19-36", payout: 1},
        dozen1: {name: "1ª Docena", payout: 2},
        dozen2: {name: "2ª Docena", payout: 2},
        dozen3: {name: "3ª Docena", payout: 2},
        column1: {name: "1ª Columna", payout: 2},
        column2: {name: "2ª Columna", payout: 2},
        column3: {name: "3ª Columna", payout: 2}
    },
    chipValues: [1, 5, 25, 100],
    config: {
        initialBalance: 1000,
        minBet: 1,
        maxBet: 500,
        spinDuration: 4000
    }
};

// =============================
// MOTOR DE JUEGO - ROULETTE ENGINE
// =============================

/**
 * Clase principal que maneja toda la lógica del juego de ruleta
 * Responsable de: validación de apuestas, cálculos de pagos, gestión de balance
 */
class RouletteEngine {
    constructor() {
        this.balance = ROULETTE_DATA.config.initialBalance;
        this.currentBets = new Map(); // Mapa de apuestas activas
        this.lastBets = new Map(); // Para repetir apuestas
        this.history = []; // Historial de números ganadores
        this.statistics = {
            totalSpins: 0,
            totalWins: 0,
            totalProfit: 0
        };
    }

    /**
     * Coloca una apuesta en la mesa
     * @param {string} betType - Tipo de apuesta (straight, red, black, etc.)
     * @param {number} amount - Cantidad a apostar
     * @param {number} number - Número específico (para apuestas directas)
     * @returns {boolean} - True si la apuesta fue exitosa
     */
    placeBet(betType, amount, number = null) {
        // Validar balance disponible
        if (this.balance < amount) {
            console.warn('Balance insuficiente para esta apuesta');
            return false;
        }

        // Validar límites de apuesta
        if (amount < ROULETTE_DATA.config.minBet || amount > ROULETTE_DATA.config.maxBet) {
            console.warn('Apuesta fuera de los límites permitidos');
            return false;
        }

        // Crear clave única para la apuesta
        const betKey = number !== null ? `${betType}-${number}` : betType;
        
        // Acumular apuesta si ya existe
        if (this.currentBets.has(betKey)) {
            const existingBet = this.currentBets.get(betKey);
            existingBet.amount += amount;
        } else {
            this.currentBets.set(betKey, {
                type: betType,
                amount: amount,
                number: number,
                payout: ROULETTE_DATA.betTypes[betType].payout
            });
        }

        this.balance -= amount;
        return true;
    }

    /**
     * Gira la ruleta y determina el número ganador
     * @returns {Object} - Objeto con el número ganador y su color
     */
    spin() {
        // Generar número aleatorio
        const randomIndex = Math.floor(Math.random() * ROULETTE_DATA.numbers.length);
        const winningNumber = ROULETTE_DATA.numbers[randomIndex];
        
        // Agregar al historial
        this.history.unshift(winningNumber);
        if (this.history.length > 10) {
            this.history.pop();
        }

        // Actualizar estadísticas
        this.statistics.totalSpins++;
        
        return winningNumber;
    }

    /**
     * Calcula las ganancias basadas en el número ganador
     * @param {Object} winningNumber - Número ganador
     * @returns {Object} - Resultados de todas las apuestas
     */
    calculateWinnings(winningNumber) {
        let totalWinnings = 0;
        let winningBets = [];
        let losingBets = [];

        this.currentBets.forEach((bet, betKey) => {
            const isWinning = this.checkWinningBet(bet, winningNumber);
            
            if (isWinning) {
                const winAmount = bet.amount * (bet.payout + 1); // +1 para incluir la apuesta original
                totalWinnings += winAmount;
                winningBets.push({
                    ...bet,
                    winAmount: winAmount,
                    key: betKey
                });
            } else {
                losingBets.push({
                    ...bet,
                    key: betKey
                });
            }
        });

        // Actualizar balance y estadísticas
        this.balance += totalWinnings;
        if (totalWinnings > 0) {
            this.statistics.totalWins++;
        }

        const totalBetAmount = Array.from(this.currentBets.values())
            .reduce((sum, bet) => sum + bet.amount, 0);
        this.statistics.totalProfit += (totalWinnings - totalBetAmount);

        // Guardar apuestas para repetir
        this.lastBets = new Map(this.currentBets);
        
        // Limpiar apuestas actuales
        this.currentBets.clear();

        return {
            totalWinnings,
            winningBets,
            losingBets,
            netProfit: totalWinnings - totalBetAmount
        };
    }

    /**
     * Verifica si una apuesta es ganadora
     * @param {Object} bet - Apuesta a verificar
     * @param {Object} winningNumber - Número ganador
     * @returns {boolean} - True si la apuesta es ganadora
     */
    checkWinningBet(bet, winningNumber) {
        const num = winningNumber.number;
        const color = winningNumber.color;

        switch (bet.type) {
            case 'straight':
                return bet.number === num;
            case 'red':
                return color === 'red';
            case 'black':
                return color === 'black';
            case 'odd':
                return num !== 0 && num % 2 === 1;
            case 'even':
                return num !== 0 && num % 2 === 0;
            case 'low':
                return num >= 1 && num <= 18;
            case 'high':
                return num >= 19 && num <= 36;
            case 'dozen1':
                return num >= 1 && num <= 12;
            case 'dozen2':
                return num >= 13 && num <= 24;
            case 'dozen3':
                return num >= 25 && num <= 36;
            case 'column1':
                return num !== 0 && num % 3 === 1;
            case 'column2':
                return num !== 0 && num % 3 === 2;
            case 'column3':
                return num !== 0 && num % 3 === 0;
            default:
                return false;
        }
    }

    /**
     * Repite las últimas apuestas
     * @returns {boolean} - True si se pudieron repetir las apuestas
     */
    repeatLastBets() {
        if (this.lastBets.size === 0) return false;

        const totalAmount = Array.from(this.lastBets.values())
            .reduce((sum, bet) => sum + bet.amount, 0);

        if (this.balance < totalAmount) {
            console.warn('Balance insuficiente para repetir apuestas');
            return false;
        }

        this.lastBets.forEach((bet, betKey) => {
            this.currentBets.set(betKey, { ...bet });
        });

        this.balance -= totalAmount;
        return true;
    }

    /**
     * Limpia todas las apuestas actuales
     */
    clearBets() {
        const totalAmount = Array.from(this.currentBets.values())
            .reduce((sum, bet) => sum + bet.amount, 0);
        
        this.balance += totalAmount;
        this.currentBets.clear();
    }

    /**
     * Obtiene el total apostado actualmente
     * @returns {number} - Total apostado
     */
    getTotalBet() {
        return Array.from(this.currentBets.values())
            .reduce((sum, bet) => sum + bet.amount, 0);
    }

    /**
     * Obtiene todas las apuestas activas
     * @returns {Array} - Array de apuestas activas
     */
    getActiveBets() {
        return Array.from(this.currentBets.entries()).map(([key, bet]) => ({
            key,
            ...bet
        }));
    }
}

// =============================
// SISTEMA DE ANIMACIÓN - ROULETTE WHEEL
// =============================

/**
 * Clase responsable de las animaciones de la ruleta
 * Maneja: rotación de la rueda, movimiento de la bola, efectos visuales
 */
class RouletteWheel {
    constructor() {
        this.wheelElement = document.getElementById('rouletteWheel');
        this.ballElement = document.getElementById('ball');
        this.isSpinning = false;
        this.currentRotation = 0;
    }

    /**
     * Inicia la animación de giro de la ruleta
     * @param {Object} winningNumber - Número ganador
     * @param {number} duration - Duración de la animación en ms
     * @returns {Promise} - Promesa que se resuelve cuando termina la animación
     */
    spin(winningNumber, duration = ROULETTE_DATA.config.spinDuration) {
        return new Promise((resolve) => {
            if (this.isSpinning) return;

            this.isSpinning = true;
            
            // Calcular rotación final basada en el número ganador
            const numberIndex = ROULETTE_DATA.numbers.findIndex(n => n.number === winningNumber.number);
            const degreesPerNumber = 360 / ROULETTE_DATA.numbers.length;
            const targetRotation = (numberIndex * degreesPerNumber) + (Math.random() * degreesPerNumber);
            
            // Agregar rotaciones completas para efecto visual
            const totalRotation = this.currentRotation + 1800 + targetRotation;
            
            // Aplicar animación a la rueda
            this.wheelElement.style.transform = `rotate(${totalRotation}deg)`;
            
            // Animar la bola
            this.animateBall(targetRotation, duration);
            
            // Actualizar rotación actual
            this.currentRotation = totalRotation % 360;
            
            // Resolver promesa cuando termine la animación
            setTimeout(() => {
                this.isSpinning = false;
                resolve();
            }, duration);
        });
    }

    /**
     * Anima el movimiento de la bola
     * @param {number} finalPosition - Posición final de la bola
     * @param {number} duration - Duración de la animación
     */
    animateBall(finalPosition, duration) {
        const startTime = Date.now();
        const initialRadius = 130;
        const finalRadius = 80;
        
        const animateBallStep = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Función de easing para desaceleración realista
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            // Calcular posición de la bola
            const currentRadius = initialRadius - (initialRadius - finalRadius) * easeOut;
            const angle = (progress * 720 + finalPosition) * Math.PI / 180;
            
            const x = Math.cos(angle) * currentRadius;
            const y = Math.sin(angle) * currentRadius;
            
            this.ballElement.style.transform = `translate(${x}px, ${y}px)`;
            
            if (progress < 1) {
                requestAnimationFrame(animateBallStep);
            }
        };
        
        requestAnimationFrame(animateBallStep);
    }

    /**
     * Resetea la posición de la bola
     */
    resetBall() {
        this.ballElement.style.transform = 'translate(0, 0)';
    }
}

// =============================
// INTERFAZ DE USUARIO - ROULETTE UI
// =============================

/**
 * Clase responsable de la interfaz de usuario
 * Maneja: actualización de elementos DOM, eventos de usuario, feedback visual
 */
class RouletteUI {
    constructor() {
        this.selectedChipValue = 1;
        this.elements = this.initializeElements();
        this.initializeEventListeners();
        this.generateBettingTable();
    }

    /**
     * Inicializa referencias a elementos DOM
     * @returns {Object} - Objeto con referencias a elementos
     */
    initializeElements() {
        return {
            balance: document.getElementById('balance'),
            selectedChip: document.getElementById('selectedChip'),
            totalBet: document.getElementById('totalBet'),
            activeBets: document.getElementById('activeBets'),
            historyNumbers: document.getElementById('historyNumbers'),
            totalSpins: document.getElementById('totalSpins'),
            totalWins: document.getElementById('totalWins'),
            totalProfit: document.getElementById('totalProfit'),
            spinBtn: document.getElementById('spinBtn'),
            repeatBtn: document.getElementById('repeatBtn'),
            clearBtn: document.getElementById('clearBtn'),
            resultMessage: document.getElementById('resultMessage'),
            resultTitle: document.getElementById('resultTitle'),
            resultText: document.getElementById('resultText'),
            resultNumber: document.getElementById('resultNumber'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };
    }

    /**
     * Inicializa event listeners
     */
    initializeEventListeners() {
        // Selección de fichas
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.selectChip(parseInt(chip.dataset.value));
            });
        });

        // Botones de control
        this.elements.spinBtn.addEventListener('click', () => {
            window.gameController.spin();
        });

        this.elements.repeatBtn.addEventListener('click', () => {
            window.gameController.repeatLastBets();
        });

        this.elements.clearBtn.addEventListener('click', () => {
            window.gameController.clearBets();
        });

        // Cerrar mensaje de resultado
        this.elements.resultMessage.addEventListener('click', () => {
            this.hideResultMessage();
        });
    }

    /**
     * Genera la mesa de apuestas dinámicamente
     */
    generateBettingTable() {
        const numbersGrid = document.getElementById('numbersGrid');
        
        // Generar números del 1 al 36
        for (let i = 1; i <= 36; i++) {
            const numberData = ROULETTE_DATA.numbers.find(n => n.number === i);
            const cell = document.createElement('div');
            cell.className = `number-cell ${numberData.color}`;
            cell.textContent = i;
            cell.dataset.number = i;
            cell.addEventListener('click', () => {
                this.placeBet('straight', i);
            });
            numbersGrid.appendChild(cell);
        }

        // Event listeners para apuestas externas
        document.querySelectorAll('.bet-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const betType = cell.dataset.bet;
                this.placeBet(betType);
            });
        });
    }

    /**
     * Selecciona una ficha
     * @param {number} value - Valor de la ficha
     */
    selectChip(value) {
        this.selectedChipValue = value;
        
        // Actualizar UI
        document.querySelectorAll('.chip').forEach(chip => {
            chip.classList.remove('selected');
        });
        document.querySelector(`[data-value="${value}"]`).classList.add('selected');
        
        this.elements.selectedChip.textContent = `€${value}`;
    }

    /**
     * Coloca una apuesta
     * @param {string} betType - Tipo de apuesta
     * @param {number} number - Número específico (opcional)
     */
    placeBet(betType, number = null) {
        const success = window.gameController.placeBet(betType, this.selectedChipValue, number);
        
        if (success) {
            this.updateBetDisplay(betType, number);
            this.playSound('chipPlace');
        }
    }

    /**
     * Actualiza la visualización de apuestas
     * @param {string} betType - Tipo de apuesta
     * @param {number} number - Número específico
     */
    updateBetDisplay(betType, number) {
        const betKey = number !== null ? `${betType}-${number}` : betType;
        const selector = number !== null ? `[data-number="${number}"]` : `[data-bet="${betType}"]`;
        const element = document.querySelector(selector);
        
        if (element) {
            let chipElement = element.querySelector('.bet-chip');
            if (!chipElement) {
                chipElement = document.createElement('div');
                chipElement.className = 'bet-chip';
                chipElement.style.backgroundColor = this.getChipColor(this.selectedChipValue);
                element.appendChild(chipElement);
            }
            
            const currentAmount = parseInt(chipElement.textContent) || 0;
            chipElement.textContent = currentAmount + this.selectedChipValue;
        }
    }

    /**
     * Obtiene el color de la ficha basado en su valor
     * @param {number} value - Valor de la ficha
     * @returns {string} - Color de la ficha
     */
    getChipColor(value) {
        const colors = {
            1: '#3b82f6',
            5: '#dc2626',
            25: '#059669',
            100: '#7c2d12'
        };
        return colors[value] || '#6b7280';
    }

    /**
     * Actualiza el balance en la UI
     * @param {number} balance - Nuevo balance
     */
    updateBalance(balance) {
        this.elements.balance.textContent = `€${balance.toLocaleString()}`;
    }

    /**
     * Actualiza las apuestas activas
     * @param {Array} bets - Array de apuestas activas
     */
    updateActiveBets(bets) {
        const container = this.elements.activeBets;
        
        if (bets.length === 0) {
            container.innerHTML = '<p class="no-bets">No hay apuestas activas</p>';
            this.elements.totalBet.textContent = '€0';
            return;
        }

        let totalAmount = 0;
        let html = '';
        
        bets.forEach(bet => {
            const betName = bet.number !== null ? 
                `${ROULETTE_DATA.betTypes[bet.type].name} ${bet.number}` : 
                ROULETTE_DATA.betTypes[bet.type].name;
            
            html += `
                <div class="bet-item">
                    <span>${betName}</span>
                    <span>€${bet.amount}</span>
                </div>
            `;
            totalAmount += bet.amount;
        });

        container.innerHTML = html;
        this.elements.totalBet.textContent = `€${totalAmount}`;
    }

    /**
     * Actualiza el historial de números
     * @param {Array} history - Array de números del historial
     */
    updateHistory(history) {
        const container = this.elements.historyNumbers;
        container.innerHTML = '';
        
        history.forEach(numberData => {
            const numberElement = document.createElement('div');
            numberElement.className = `history-number ${numberData.color}`;
            numberElement.textContent = numberData.number;
            container.appendChild(numberElement);
        });
    }

    /**
     * Actualiza las estadísticas
     * @param {Object} stats - Objeto con estadísticas
     */
    updateStatistics(stats) {
        this.elements.totalSpins.textContent = stats.totalSpins;
        this.elements.totalWins.textContent = stats.totalWins;
        this.elements.totalProfit.textContent = `€${stats.totalProfit.toLocaleString()}`;
    }

    /**
     * Muestra el mensaje de resultado
     * @param {Object} winningNumber - Número ganador
     * @param {Object} results - Resultados de las apuestas
     */
    showResultMessage(winningNumber, results) {
        const isWinner = results.totalWinnings > 0;
        
        this.elements.resultTitle.textContent = isWinner ? '¡Felicitaciones!' : 'Mejor suerte la próxima vez';
        this.elements.resultText.textContent = isWinner ? 
            `Has ganado €${results.totalWinnings.toLocaleString()}` : 
            'No has ganado esta vez';
        
        this.elements.resultNumber.textContent = winningNumber.number;
        this.elements.resultNumber.className = `result-number ${winningNumber.color}`;
        
        this.elements.resultMessage.classList.add('show');
        
        // Auto-cerrar después de 3 segundos
        setTimeout(() => {
            this.hideResultMessage();
        }, 3000);
    }

    /**
     * Oculta el mensaje de resultado
     */
    hideResultMessage() {
        this.elements.resultMessage.classList.remove('show');
    }

    /**
     * Muestra el overlay de carga
     */
    showLoadingOverlay() {
        this.elements.loadingOverlay.classList.add('show');
    }

    /**
     * Oculta el overlay de carga
     */
    hideLoadingOverlay() {
        this.elements.loadingOverlay.classList.remove('show');
    }

    /**
     * Limpia las fichas visuales de la mesa
     */
    clearBetChips() {
        document.querySelectorAll('.bet-chip').forEach(chip => {
            chip.remove();
        });
    }

    /**
     * Resalta los números ganadores
     * @param {Array} winningBets - Array de apuestas ganadoras
     */
    highlightWinningBets(winningBets) {
        winningBets.forEach(bet => {
            const selector = bet.number !== null ? 
                `[data-number="${bet.number}"]` : 
                `[data-bet="${bet.type}"]`;
            const element = document.querySelector(selector);
            
            if (element) {
                element.classList.add('winning-number');
                setTimeout(() => {
                    element.classList.remove('winning-number');
                }, 2400);
            }
        });
    }

    /**
     * Reproduce un sonido (simulado)
     * @param {string} soundType - Tipo de sonido
     */
    playSound(soundType) {
        // En una implementación real, aquí se reproducirían sonidos
        console.log(`Reproduciendo sonido: ${soundType}`);
    }
}

// =============================
// CONTROLADOR PRINCIPAL - GAME CONTROLLER
// =============================

/**
 * Clase controladora principal que orquesta el juego
 * Coordina: motor de juego, animaciones, interfaz de usuario
 */
class GameController {
    constructor() {
        this.engine = new RouletteEngine();
        this.wheel = new RouletteWheel();
        this.ui = new RouletteUI();
        this.isGameActive = false;
        
        this.initializeGame();
    }

    /**
     * Inicializa el juego
     */
    initializeGame() {
        this.updateUI();
        console.log('Juego de Ruleta Europea iniciado');
        console.log('Arquitectura modular implementada correctamente');
    }

    /**
     * Coloca una apuesta
     * @param {string} betType - Tipo de apuesta
     * @param {number} amount - Cantidad a apostar
     * @param {number} number - Número específico (opcional)
     * @returns {boolean} - True si la apuesta fue exitosa
     */
    placeBet(betType, amount, number = null) {
        if (this.isGameActive) {
            console.warn('No se pueden colocar apuestas mientras la ruleta está girando');
            return false;
        }

        const success = this.engine.placeBet(betType, amount, number);
        
        if (success) {
            this.updateUI();
        }
        
        return success;
    }

    /**
     * Gira la ruleta
     */
    async spin() {
        if (this.isGameActive) return;
        
        // Verificar que hay apuestas
        if (this.engine.currentBets.size === 0) {
            alert('Debes colocar al menos una apuesta antes de girar');
            return;
        }

        this.isGameActive = true;
        
        // Mostrar overlay de carga
        this.ui.showLoadingOverlay();
        
        try {
            // Generar número ganador
            const winningNumber = this.engine.spin();
            
            // Animar la ruleta
            await this.wheel.spin(winningNumber);
            
            // Ocultar overlay de carga
            this.ui.hideLoadingOverlay();
            
            // Calcular resultados
            const results = this.engine.calculateWinnings(winningNumber);
            
            // Actualizar UI
            this.updateUI();
            
            // Mostrar resultados
            this.ui.showResultMessage(winningNumber, results);
            
            // Resaltar apuestas ganadoras
            if (results.winningBets.length > 0) {
                this.ui.highlightWinningBets(results.winningBets);
                this.ui.playSound('win');
            } else {
                this.ui.playSound('lose');
            }
            
            // Limpiar fichas visuales
            this.ui.clearBetChips();
            
        } catch (error) {
            console.error('Error durante el giro:', error);
            this.ui.hideLoadingOverlay();
        }
        
        this.isGameActive = false;
    }

    /**
     * Repite las últimas apuestas
     */
    repeatLastBets() {
        if (this.isGameActive) return;
        
        const success = this.engine.repeatLastBets();
        
        if (success) {
            this.updateUI();
            this.ui.playSound('chipPlace');
            
            // Actualizar visualización de apuestas
            this.engine.getActiveBets().forEach(bet => {
                this.ui.updateBetDisplay(bet.type, bet.number);
            });
        } else {
            alert('No hay apuestas anteriores para repetir o balance insuficiente');
        }
    }

    /**
     * Limpia todas las apuestas
     */
    clearBets() {
        if (this.isGameActive) return;
        
        this.engine.clearBets();
        this.ui.clearBetChips();
        this.updateUI();
    }

    /**
     * Actualiza toda la interfaz de usuario
     */
    updateUI() {
        this.ui.updateBalance(this.engine.balance);
        this.ui.updateActiveBets(this.engine.getActiveBets());
        this.ui.updateHistory(this.engine.history);
        this.ui.updateStatistics(this.engine.statistics);
    }

    /**
     * Obtiene el estado actual del juego
     * @returns {Object} - Estado del juego
     */
    getGameState() {
        return {
            balance: this.engine.balance,
            currentBets: this.engine.getActiveBets(),
            history: this.engine.history,
            statistics: this.engine.statistics,
            isActive: this.isGameActive
        };
    }
}

// =============================
// INICIALIZACIÓN DEL JUEGO
// =============================

/**
 * Inicializa el juego cuando se carga la página
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Crear instancia global del controlador
        window.gameController = new GameController();
        
        console.log('🎰 Juego de Ruleta Europea cargado exitosamente');
        console.log('🏗️ Arquitectura modular implementada:');
        console.log('   - RouletteEngine: Motor de juego');
        console.log('   - RouletteWheel: Sistema de animación');
        console.log('   - RouletteUI: Interfaz de usuario');
        console.log('   - GameController: Controlador principal');
        
    } catch (error) {
        console.error('Error al inicializar el juego:', error);
    }
});

// =============================
// EXPORTACIONES PARA MÓDULOS
// =============================

// Para uso en entornos que soporten módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RouletteEngine,
        RouletteWheel,
        RouletteUI,
        GameController,
        ROULETTE_DATA
    };
}