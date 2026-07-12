/**
 * HELIOS - Interactive Solar Magnetic Reconnection Simulator
 * Phase 5A Integration: UI, Sliders & State Controls Mapping
 */
let graphStarted = false;
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize static slider labels and control button placeholders
    initializeSliders();

    // 2. Initialize and start the rendering engine
    const simInstance = new Simulation('simulation-canvas');
    simInstance.start();
    const energyGraph = new EnergyGraph('energy-graph', simInstance);
    setInterval(() => {
        if (graphStarted && !simInstance.isPaused) {
            energyGraph.addPoint(simInstance.storedEnergy);
        }
    }, 33);

    // 3. Connect buttons directly to simulation execution states
    initializeButtons(simInstance, energyGraph);
});

/**
 * Syncs the visual textual displays of sliders with real-time UI interactions.
 */
function initializeSliders() {
    const sliders = [
        { id: 'slider-field-strength', outputId: 'val-field-strength', format: (val) => `${parseFloat(val).toFixed(1)} T` },
        { id: 'slider-twist', outputId: 'val-twist', format: (val) => `${parseFloat(val).toFixed(2)} rad` },
        { id: 'slider-density', outputId: 'val-density', format: (val) => `${parseFloat(val).toFixed(1)} × 10¹⁵ m⁻³` },
        { id: 'slider-temperature', outputId: 'val-temperature', format: (val) => `${parseFloat(val).toFixed(1)} MK` }
    ];

    sliders.forEach(slider => {
        const inputEl = document.getElementById(slider.id);
        const outputEl = document.getElementById(slider.outputId);

        if (inputEl && outputEl) {
            outputEl.textContent = slider.format(inputEl.value);

            // Register drag listener for responsive UI feedback
            inputEl.addEventListener('input', (e) => {
                outputEl.textContent = slider.format(e.target.value);
            });
        }
    });
}

/**
 * Connects UI button commands directly to active Simulation parameters.
 * @param {Simulation} simInstance - The active rendering engine instance
 */
function initializeButtons(simInstance, energyGraph) {
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            simInstance.isPaused = false;
            graphStarted = true;
            console.log(graphStarted);
            console.log('HELIOS: Simulation running.');
        });
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            simInstance.isPaused = true;
            console.log('HELIOS: Simulation paused.');
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            graphStarted = false;
            simInstance.reset();
            energyGraph.reset();
            console.log('HELIOS: Simulation reset.');
        });
    }
}