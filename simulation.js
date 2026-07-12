/**
 * HELIOS - Simulation Rendering Engine (Phase 5 - Magnetic Reconnection Complete)
 * Manages canvas dimensions, renders deep-space background assets,
 * maintains continuous loops animating the Sun and its plasma corona,
 * and simulates magnetic field stress buildup & localized reconnection states.
 */
class Simulation {
    /**
     * @param {string} canvasId - Element ID of the HTML5 canvas
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.magneticFieldLines = [];
        this.particles = [];
        this.time = 0;
        this.isPaused = true;

        // Interactive State Machine Properties
        this.state = 'STABLE';     // 'STABLE', 'BUILDUP', 'RECONNECTING', 'COOLING'
        this.storedEnergy = 0.0;   // Measured in Megajoules (MJ) - Trigger threshold = 95.0 MJ
        this.stressLevel = 0.0;    // Percentage rating (0% to 100%)
        this.reconnectionTimer = 0; // ~150 frames duration (2.5 seconds)
        this.coolingTimer = 0;      // ~180 frames (3 seconds)
        this.needsRelease = false;  // Prevents auto-trigger loop; requires slider reset
        // Automatic magnetic stress build-up
        this.autoTwist = 0.0;
        this.autoBuildRate = 0.006;

        // Pre-allocated coordinate point object to avoid garbage collection thrashing in the render loop
        this.tempPoint = { x: 0, y: 0 };

        // Cache DOM elements for interactive user controls
        this.densitySlider = document.getElementById('slider-density');
        this.tempSlider = document.getElementById('slider-temperature');
        this.fieldStrengthSlider = document.getElementById('slider-field-strength');
        this.twistSlider = document.getElementById('slider-twist');

        // Context-aware bindings
        this.resizeCanvas = this.resizeCanvas.bind(this);
        
        // Bind window resize events and trigger layout generation
        window.addEventListener('resize', this.resizeCanvas);
        this.resizeCanvas();

        // Procedurally generate the persistent scientific magnetic field structure
        this.generateMagneticField();

        // Initialize plasma particles along active field lines
        this.generateParticles();
    }

    /**
     * Resizes the canvas to match its client bounding box dynamically.
     */
    resizeCanvas() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        
        // Regenerate background star assets to match updated coordinates
        this.createStars();
    }

    /**
     * Generates persistent stars with slightly varied sizes and brightness indices.
     */
    createStars() {
        this.stars = [];
        // Adjust star density proportional to area size
        const starDensity = 0.00018; 
        const starCount = Math.floor(this.canvas.width * this.canvas.height * starDensity);

        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 1.3 + 0.3,
                opacity: Math.random() * 0.7 + 0.3
            });
        }
    }

    /**
     * Generates a dense, organic, and interconnected magnetic flux network.
     * Structurally distributed across localized active region dipoles with depth and color variation.
     */
    generateMagneticField() {
        this.magneticFieldLines = [];
        const lineCount = 115; // High-impact density

        // 4 evenly distributed active regions around the circular Sun
        const activeRegions = [
            -135 * Math.PI / 180, // AR 1: Upper Left (Index 0)
            -105 * Math.PI / 180, // AR 2: Upper Center-Left (Index 1) <-- Selected Stressed Active Region
            45 * Math.PI / 180,   // AR 3: Lower Right (Index 2)
            135 * Math.PI / 180   // AR 4: Lower Left (Index 3)
        ];

        for (let i = 0; i < lineCount; i++) {
            const randType = Math.random();
            const phase = Math.random() * Math.PI * 2;
            
            // Raised base opacity ranges for bold visual impact
            const baseOpacity = Math.random() * 0.35 + 0.45; 
            const width = Math.random() * 0.75 + 0.45;       // Sturdy, legible strokes
            
            // Simulates 3D depth mapping (0.0 = background, 1.0 = foreground)
            const depth = Math.random();

            // Color distribution: 70% soft white (0), 20% pale cyan (1), 10% warm amber (2)
            const colorRoll = Math.random();
            const colorType = colorRoll < 0.70 ? 0 : (colorRoll < 0.90 ? 1 : 2);

            // Curve tilt bias
            const curveIntensity = (Math.random() * 0.16 + 0.04) * (Math.random() < 0.5 ? 1 : -1);

            // Procedurally tag approximately 18% of magnetic loops as active plasma pathways
            const isPlasmaActive = Math.random() < 0.18;
            const particleDensityFactor = Math.random() * 0.8 + 0.3; // Scale factor for particle count
            const flowSpeedBase = (Math.random() * 0.0012 + 0.0006) * (Math.random() < 0.5 ? 1 : -1);

            if (randType < 0.12) {
                // 1. OPEN STREAMERS (Polar magnetic streamers)
                const polarAngle = Math.random() < 0.5 
                    ? -90 * Math.PI / 180 + (Math.random() - 0.5) * 0.45
                    : 90 * Math.PI / 180 + (Math.random() - 0.5) * 0.45;

                this.magneticFieldLines.push({
                    isOpen: true,
                    arIndex: -1, // Polar/Non-AR
                    angle: polarAngle,
                    lengthFactor: Math.random() * 0.9 + 0.4, 
                    opacity: baseOpacity * 0.50,
                    width: width * 0.8,
                    curveIntensity: curveIntensity,
                    depth: depth,
                    colorType: colorType,
                    phase: phase,
                    isPlasmaActive: isPlasmaActive,
                    particleDensityFactor: particleDensityFactor,
                    flowSpeedBase: flowSpeedBase
                });

            } else if (randType < 0.90) {
                // 2. COMPACT LOCAL ACTIVE REGION LOOPS (Highly dense, nestled in ARs)
                const center = activeRegions[Math.floor(Math.random() * activeRegions.length)];
                const startAngle = center + (Math.random() - 0.5) * 0.32; 
                
                // Track associated active region group index
                const arIndex = activeRegions.indexOf(center);

                // Keep spans compact inside the AR, with a mix of tiny and medium-sized local loops
                const isMediumLocal = Math.random() < 0.25;
                const loopSpan = isMediumLocal ? (Math.random() * 0.12 + 0.12) : (Math.random() * 0.08 + 0.03); 
                const endAngle = startAngle + (Math.random() < 0.5 ? loopSpan : -loopSpan);
                const heightFactor = isMediumLocal ? (Math.random() * 0.15 + 0.30) : (Math.random() * 0.14 + 0.14); 

                this.magneticFieldLines.push({
                    isOpen: false,
                    arIndex: arIndex,
                    startAngle: startAngle,
                    endAngle: endAngle,
                    heightFactor: heightFactor,
                    opacity: baseOpacity,
                    width: width,
                    curveIntensity: curveIntensity,
                    depth: depth,
                    colorType: colorType,
                    phase: phase,
                    isPlasmaActive: isPlasmaActive,
                    particleDensityFactor: particleDensityFactor,
                    flowSpeedBase: flowSpeedBase
                });

            } else {
                // 3. LARGE OVERARCHING GLOBAL LOOPS (Connecting distant regions)
                const arIdx1 = Math.floor(Math.random() * activeRegions.length);
                let arIdx2 = Math.floor(Math.random() * activeRegions.length);
                if (arIdx1 === arIdx2) arIdx2 = (arIdx1 + 1) % activeRegions.length;

                const startAngle = activeRegions[arIdx1] + (Math.random() - 0.5) * 0.12;
                const endAngle = activeRegions[arIdx2] + (Math.random() - 0.5) * 0.12;
                const heightFactor = Math.random() * 0.30 + 0.60; 

                this.magneticFieldLines.push({
                    isOpen: false,
                    arIndex: -2, // Global loops linking AR bounds
                    startAngle: startAngle,
                    endAngle: endAngle,
                    heightFactor: heightFactor,
                    opacity: baseOpacity * 1.15, 
                    width: width * 1.1,
                    curveIntensity: curveIntensity,
                    depth: depth,
                    colorType: colorType,
                    phase: phase,
                    isPlasmaActive: isPlasmaActive,
                    particleDensityFactor: particleDensityFactor,
                    flowSpeedBase: flowSpeedBase
                });
            }
        }

        // Sort lines by depth (background first, foreground last) for clean rendering order
        this.magneticFieldLines.sort((a, b) => a.depth - b.depth);
    }

    /**
     * Initializes the static array of plasma particles distributed along active field lines.
     */
    generateParticles() {
        this.particles = [];
        
        // Loop through all generated field lines to construct particles
        this.magneticFieldLines.forEach((line, lineIndex) => {
            if (!line.isPlasmaActive) return;

            // Generate an organized pool of particles based on loop parameters
            const baseCount = Math.floor(22 * line.particleDensityFactor);
            for (let p = 0; p < baseCount; p++) {
                // Introduce organic, slight spacing variations along each line to create clumps and gaps
                const spacingJitter = (Math.random() * 0.16 - 0.08);
                let startT = (p / baseCount) + spacingJitter;
                if (startT < 0.0) startT += 1.0;
                if (startT > 1.0) startT -= 1.0;

                this.particles.push({
                    lineIndex: lineIndex,
                    t: startT,
                    // Tighten speed factor variation so particles on the same line move cohesively together
                    speedFactor: 1.0 + (Math.random() * 0.08 - 0.04), 
                    size: Math.random() * 1.8 + 1.2,
                    // Small brightness variation (approximately ±10%)
                    brightness: 0.90 + (Math.random() * 0.20 - 0.10),
                    phaseOffset: Math.random() * Math.PI * 2
                });
            }
        });
    }

    /**
     * Resets simulation clocks and regenerates layout maps.
     */
    reset() {
        this.time = 0;
        this.isPaused = true;

        this.state = 'STABLE';
        this.storedEnergy = 0;
        this.stressLevel = 0;
        this.autoTwist = 0;
        this.reconnectionTimer = 0;
        this.coolingTimer = 0;
        this.needsRelease = false;

        // Reset sliders
        this.fieldStrengthSlider.value = 5.0;
        this.twistSlider.value = 0.0;
        this.densitySlider.value = 1.0;
        this.tempSlider.value = 1.5;

        // Update labels
        document.getElementById("val-field-strength").textContent = "5.0 T";
        document.getElementById("val-twist").textContent = "0.00 rad";
        document.getElementById("val-density").textContent = "1.0 × 10¹⁵ m⁻³";
        document.getElementById("val-temperature").textContent = "1.5 MK";

        this.generateMagneticField();
        this.generateParticles();
        this.time = 96;
        this.render() 
    }

    /**
     * Evaluates precise coordinates along a quadratic or cubic Bezier path.
     * Avoids object instantiations by writing results directly to this.tempPoint.
     */
    evaluateCurvePoint(line, t, cx, cy, r, spaceTimeWave, ar1HeightOverride, ar1ShearOffset) {
        if (line.isOpen) {
            // Quadratic Bezier (streamer paths)
            const angle = line.angle + spaceTimeWave;
            const length = r + (r * line.lengthFactor);

            const x1 = cx + r * Math.cos(angle);
            const y1 = cy + r * Math.sin(angle);

            const x2 = cx + length * Math.cos(angle + line.curveIntensity);
            const y2 = cy + length * Math.sin(angle + line.curveIntensity);

            const cpx = cx + (r + length * 0.45) * Math.cos(angle + line.curveIntensity * 0.4);
            const cpy = cy + (r + length * 0.45) * Math.sin(angle + line.curveIntensity * 0.4);

            const mt = 1 - t;
            this.tempPoint.x = mt * mt * x1 + 2 * mt * t * cpx + t * t * x2;
            this.tempPoint.y = mt * mt * y1 + 2 * mt * t * cpy + t * t * y2;
        } else {
            // Cubic Bezier (loop paths)
            // Apply buildup angular twist distortions only inside the selected stressed active region (Index 1)
            const shear = (line.arIndex === 1) ? ar1ShearOffset : 0.0;

            const startAngle = line.startAngle + spaceTimeWave + shear;
            const endAngle = line.endAngle + spaceTimeWave - shear;

            const x1 = cx + r * Math.cos(startAngle);
            const y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle);
            const y2 = cy + r * Math.sin(endAngle);

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const rx = mx - cx;
            const ry = my - cy;
            const rLen = Math.sqrt(rx * rx + ry * ry) || 1;
            const ux = rx / rLen;
            const uy = ry / rLen;

            const spanRatio = dist / (2 * r);
            let archHeight = dist * line.heightFactor * (1.15 - spanRatio * 0.35);

            // --- Phase 5: Dynamic Stressed Loop Morphing ---
            if (line.arIndex === 1) { // Apply geometric Snapping override to AR 2 loops
                archHeight *= ar1HeightOverride;
            }

            // Viewport bounds clipping protection
            const distToTop = my;
            const distToLeft = mx;
            const distToRight = this.canvas.width - mx;
            const maxSafeHeight = Math.min(distToTop, distToLeft, distToRight) - 20;

            if (archHeight > maxSafeHeight && maxSafeHeight > 0) {
                archHeight = maxSafeHeight;
            }

            const asymFactor = line.curveIntensity * dist;

            const cp1x = x1 + ux * archHeight + (mx - x1) * 0.08 + ux * asymFactor;
            const cp1y = y1 + uy * archHeight + (my - y1) * 0.08 + uy * asymFactor;
            const cp2x = x2 + ux * archHeight + (mx - x2) * 0.08 - ux * asymFactor;
            const cp2y = y2 + uy * archHeight + (my - y2) * 0.08 - uy * asymFactor;

            const mt = 1 - t;
            const mt2 = mt * mt;
            const t2 = t * t;

            this.tempPoint.x = mt2 * mt * x1 + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t2 * t * x2;
            this.tempPoint.y = mt2 * mt * y1 + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t2 * t * y2;
        }
    }

    /**
     * Interpolates smooth RGB color strings based on temperature settings.
     * Prevents orange/red color bleeding to reserve them for reconnection states.
     */
    getParticleColor(tempVal) {
        let r, g, b;
        if (tempVal < 2.0) {
            // Interpolate from Soft White (245, 245, 250) to Pale Cyan (175, 238, 250)
            const t = (tempVal - 0.5) / 1.5; 
            r = Math.floor(245 + (175 - 245) * t);
            g = Math.floor(245 + (238 - 245) * t);
            b = Math.floor(250 + (250 - 250) * t);
        } else {
            // Interpolate from Pale Cyan (175, 238, 250) to Warm Yellow (254, 215, 80)
            const t = (tempVal - 2.0) / 3.0; 
            r = Math.floor(175 + (254 - 175) * t);
            g = Math.floor(238 + (215 - 238) * t);
            b = Math.floor(250 + (80 - 250) * t);
        }
        return `${r}, ${g}, ${b}`;
    }

    /**
     * Updates simulation running metrics & drives the structural magnetic state machine.
     * @param {number} timestamp - Request animation frame continuous milliseconds
     */
    update(timestamp) {
        this.time = timestamp;

        if (this.isPaused) return;

        // Query user interaction controls from sliders (Twist value range: 0.0 to 3.14 rad)
        const buildRate = this.twistSlider
            ? parseFloat(this.twistSlider.value)
            : 1.5;

        // Core State Machine execution logic
        if (this.state === 'STABLE' && !this.isPaused) {
            this.state = 'BUILDUP';
        }

        if (this.state === 'BUILDUP') {
            // Lock release reset mechanism; user must pull twist down below 0.15 rad to trigger next build
            this.autoTwist += buildRate * this.autoBuildRate;
            if(this.autoTwist > Math.PI)
                this.autoTwist = Math.PI;
            this.storedEnergy =
                (this.autoTwist / Math.PI) * 100;
            this.stressLevel = this.storedEnergy;
            if(this.storedEnergy >= 95){
                this.state="RECONNECTING";
                this.reconnectionTimer=150;
            }

        } else if (this.state === 'RECONNECTING') {
            this.reconnectionTimer--;
            this.autoTwist = Math.PI;
            // Generate minor energetic fluctuations during magnetic loop snapping phase
            this.storedEnergy = 95.0 + Math.sin(this.reconnectionTimer * 0.12) * 4.0;
            this.stressLevel = 100.0;

            if (this.reconnectionTimer <= 0) {
                this.state = 'COOLING';
                this.coolingTimer = 180; // 3 seconds thermal cooling duration
            }

        } else if (this.state === 'COOLING') {
            this.coolingTimer--;

            // Decay stored energy cleanly towards baseline
            const decayFactor = this.coolingTimer / 180;
            this.storedEnergy = decayFactor * 95.0;
            this.stressLevel = decayFactor * 95.0;

            if (this.coolingTimer <= 0) {
                this.autoTwist = 0;
                this.storedEnergy = 0.0;
                this.stressLevel = 0.0;
                // Require slider release below 0.15 rad to permit another buildup cycle
                this.state="STABLE";
            }
        }
    }

    /**
     * Handles drawing updates on each animation frame.
     */
    render() {
        // Clear previous frames
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw static deep space black backdrop
        this.ctx.fillStyle = '#030407';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Draw generated static field of stars
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Coordinates: Slightly offset below the true center of the frame
        const sunX = this.canvas.width / 2;
        const sunY = this.canvas.height / 2 + (this.canvas.height * 0.04);
        const sunRadius = 78;

        // Modulate variables procedurally with decoupled sin/cos frequencies
        let pulseFactor = Math.sin(this.time * 0.0015) * 0.035 + 1.0;
        let shimmerOuter = Math.sin(this.time * 0.0022) * 0.12 + 0.88;
        let shimmerInner = Math.cos(this.time * 0.0031) * 0.08 + 0.92;
        // Overall appearance controls  
        let coronaBrightness = 1.0;
        let glowBrightness = 1.0;
        let sunBrightness = 1.0;
        let coronaScale = 1.0;
        if (this.state === "BUILDUP") {
            const u = this.stressLevel / 100;
            coronaBrightness = 1.0 + u * 0.25;
            glowBrightness = 1.0 + u * 0.12;
            coronaScale = 1.0 + u * 0.08;
        }
        else if (this.state === "RECONNECTING") {
            const u = (150 - this.reconnectionTimer) / 150;
            coronaBrightness = 1.45 - u * 0.20;
            glowBrightness = 1.40 - u * 0.10;
            sunBrightness = 1.08;
            coronaScale = 1.15;
        }
        else if (this.state === "COOLING") {
            const u = this.coolingTimer / 180;
            coronaBrightness = 0.70 + u * 0.30;
            glowBrightness = 0.75 + u * 0.25;
            sunBrightness = 0.94 + u * 0.06;
            coronaScale = 0.90 + u * 0.10;
        }

        // 3. Draw Outer Shimmering Corona
        const outerCoronaRadius =
            sunRadius *
            3.6 *
            shimmerOuter *
            coronaScale;
        const outerGrad = this.ctx.createRadialGradient(
            sunX, sunY, sunRadius * 0.6,
            sunX, sunY, outerCoronaRadius
        );
        outerGrad.addColorStop(
            0,
            `rgba(255,120,0,${0.45 * coronaBrightness})`
        );

        outerGrad.addColorStop(
            0.3,
            `rgba(255,70,0,${0.20 * coronaBrightness})`
        );

        outerGrad.addColorStop(
            0.7,
            `rgba(255,30,0,${0.04 * coronaBrightness})`
        );
        outerGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');

        this.ctx.fillStyle = outerGrad;
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, outerCoronaRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 4. Draw Inner Plasma Corona
        const innerCoronaRadius =
            sunRadius *
            1.9 *
            shimmerInner *
            coronaScale;
        const innerGrad = this.ctx.createRadialGradient(
            sunX, sunY, sunRadius * 0.8,
            sunX, sunY, innerCoronaRadius
        );
        innerGrad.addColorStop(
            0,
            `rgba(255,200,0,${0.65 * coronaBrightness})`
        );

        innerGrad.addColorStop(
            0.5,
            `rgba(255,100,0,${0.22 * coronaBrightness})`
        );
        innerGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');

        this.ctx.fillStyle = innerGrad;
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, innerCoronaRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 5. Draw Sun Outer Glow
        const glowRadius =
            sunRadius *
            1.25 *
            pulseFactor *
            coronaScale;
        const glowGrad = this.ctx.createRadialGradient(
            sunX, sunY, sunRadius * 0.9,
            sunX, sunY, glowRadius
        );
        glowGrad.addColorStop(
            0,
            `rgba(255,235,100,${1.0 * glowBrightness})`
        );

        glowGrad.addColorStop(
            0.5,
            `rgba(255,120,0,${0.50 * glowBrightness})`
        );
        glowGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');

        this.ctx.fillStyle = glowGrad;
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 6. Draw Solid-style Glowing Sun Body
        const activeSunRadius = sunRadius * pulseFactor;
        const sunBodyGrad = this.ctx.createRadialGradient(
            sunX, sunY, 0,
            sunX, sunY, activeSunRadius
        );
        if (this.state === "COOLING")
            sunBodyGrad.addColorStop(0, "#fff6e8");
        else
            sunBodyGrad.addColorStop(0, "#ffffff");
        sunBodyGrad.addColorStop(0.2, '#fff2aa');
        sunBodyGrad.addColorStop(0.6, '#ffaa00');
        sunBodyGrad.addColorStop(0.95, '#e63e00');
        sunBodyGrad.addColorStop(1, '#940000'); // Dynamic cooler limb

        this.ctx.fillStyle = sunBodyGrad;
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, activeSunRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 7. Draw Dense Coronal Magnetic Field Network (Phase 3 & 5 updates)
        this.renderScientificMagneticField(sunX, sunY, activeSunRadius);

        // 8. Draw Stable Flowing Coronal Plasma Particles (Phase 4 & 5 updates)
        this.renderPlasmaParticles(sunX, sunY, activeSunRadius);

        // 9. Draw Localized Reconnection Hot Flash Event
        this.renderReconnectionFlash(sunX, sunY, activeSunRadius);
    }

    /**
     * Renders open streamers and closed loop networks using highly optimized,
     * viewport-safe curves with atmospheric depth and color variations.
     * @param {number} cx - Center X of the Sun
     * @param {number} cy - Center Y of the Sun
     * @param {number} r - Dynamic active radius of the Sun body
     */
    renderScientificMagneticField(cx, cy, r) {
        const timeScale = this.time * 0.00015;

        // Dynamic modifications for AR 2 loops based on state machine
        let ar1HeightOverride = 1.0;
        let ar1ShearOffset = 0.0;
        let brightnessBoost = 1.0;

        if (this.state === 'RECONNECTING') {
            const progress = (150 - this.reconnectionTimer) / 150;
            ar1HeightOverride = Math.max(0.02, 1.0 - Math.sin(progress * Math.PI) * 0.85); 
            brightnessBoost = 4.8 * (1.0 - progress*0.25);
        } else if (this.state === 'COOLING') {
            const progress = this.coolingTimer / 180;
            ar1HeightOverride = 0.35 + (1.0 - progress) * 0.65;
            brightnessBoost = 1.0 + progress * 0.50;
        } else if (this.state === 'BUILDUP') {
            brightnessBoost = 1.0 + (this.stressLevel / 100.0) * 1.8;
            const twistAnimation =
                Math.sin(this.autoTwist * 3.5) * 0.08;
            ar1ShearOffset =
                (this.stressLevel / 100.0) * 0.12
                + twistAnimation;
        }

        this.magneticFieldLines.forEach(line => {
            this.ctx.save();

            // Find representative spatial angle of the magnetic structure
            const midAngle = line.isOpen ? line.angle : (line.startAngle + line.endAngle) / 2;

            // Space-Time traveling wave: groups neighboring loops into a shared physical wave
            const spaceTimeWave = Math.sin(timeScale + midAngle * 4.0) * 0.010 + 
                                 Math.cos(timeScale * 0.6 + midAngle * 1.5) * 0.005;

            // Compute atmospheric depth multipliers (scaling background lines to be thinner & dimmer)
            const depthWidthFactor = 0.40 + 0.60 * line.depth;
            const depthOpacityFactor = 0.35 + 0.65 * line.depth;

            // Intensify only loops in AR 2 (Index 1) during buildup/reconnection phases
            const arScale = (line.arIndex === 1) ? brightnessBoost : 1.0;

            const activeWidth = line.width * depthWidthFactor;
            const activeOpacity = line.opacity * depthOpacityFactor * arScale;

            // Map color styles based on classifications (White, Cyan, Warm Amber/Yellow)
            let outerColor, innerColor;
            if (line.colorType === 1) { // 1. Pale Cyan
                outerColor = `rgba(14, 165, 233, ${activeOpacity * 0.24})`;
                innerColor = `rgba(224, 242, 254, ${activeOpacity * 0.95})`;
            } else if (line.colorType === 2) { // 2. Warm Amber/Yellow
                outerColor = `rgba(217, 119, 6, ${activeOpacity * 0.28})`;
                innerColor = `rgba(254, 243, 199, ${activeOpacity * 0.95})`;
            } else { // 3. Soft Cosmic White
                outerColor = `rgba(180, 205, 230, ${activeOpacity * 0.22})`;
                innerColor = `rgba(248, 250, 252, ${activeOpacity * 0.98})`;
            }

            if (line.isOpen) {
                // --- RENDER CURVED CORONAL STREAMERS ---
                const angle = line.angle + spaceTimeWave;
                const length = r + (r * line.lengthFactor);

                const x1 = cx + r * Math.cos(angle);
                const y1 = cy + r * Math.sin(angle);

                const x2 = cx + length * Math.cos(angle + line.curveIntensity);
                const y2 = cy + length * Math.sin(angle + line.curveIntensity);

                const cpx = cx + (r + length * 0.45) * Math.cos(angle + line.curveIntensity * 0.4);
                const cpy = cy + (r + length * 0.45) * Math.sin(angle + line.curveIntensity * 0.4);

                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.quadraticCurveTo(cpx, cpy, x2, y2);
                this.ctx.strokeStyle = outerColor;
                this.ctx.lineWidth = Math.max(activeWidth * 1.5, 1.5);
                this.ctx.stroke();

            } else {
                // --- RENDER CLOSED MAGNETIC LOOPS ---
                const startAngle = line.startAngle + spaceTimeWave + ((line.arIndex === 1) ? ar1ShearOffset : 0.0);
                const endAngle = line.endAngle + spaceTimeWave - ((line.arIndex === 1) ? ar1ShearOffset : 0.0);

                const x1 = cx + r * Math.cos(startAngle);
                const y1 = cy + r * Math.sin(startAngle);
                const x2 = cx + r * Math.cos(endAngle);
                const y2 = cy + r * Math.sin(endAngle);

                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2;
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const rx = mx - cx;
                const ry = my - cy;
                const rLen = Math.sqrt(rx * rx + ry * ry) || 1;
                const ux = rx / rLen;
                const uy = ry / rLen;

                const spanRatio = dist / (2 * r);
                let archHeight = dist * line.heightFactor * (1.15 - spanRatio * 0.35);

                // Morph stressed active region loops
                if (line.arIndex === 1) {
                    archHeight *= ar1HeightOverride;
                }

                // --- VIEWPORT CLIPPING PROTECTION ---
                const distToTop = my;
                const distToLeft = mx;
                const distToRight = this.canvas.width - mx;
                const maxSafeHeight = Math.min(distToTop, distToLeft, distToRight) - 20;

                if (archHeight > maxSafeHeight && maxSafeHeight > 0) {
                    archHeight = maxSafeHeight;
                }

                const asymFactor = line.curveIntensity * dist;

                const cp1x = x1 + ux * archHeight + (mx - x1) * 0.08 + ux * asymFactor;
                const cp1y = y1 + uy * archHeight + (my - y1) * 0.08 + uy * asymFactor;
                const cp2x = x2 + ux * archHeight + (mx - x2) * 0.08 - ux * asymFactor;
                const cp2y = y2 + uy * archHeight + (my - y2) * 0.08 - uy * asymFactor;

                // --- WARM FOOTPOINT HEATING HIGHLIGHTS (Applied at the base) ---
                if (line.depth >= 0.35) { // Only foreground loops show localized base heating
                    const fpGlowRadius = activeWidth * 7.5;
                    const heatingMultiplier = (line.arIndex === 1) ? arScale : 1.0;
                    
                    const fpGrad1 = this.ctx.createRadialGradient(x1, y1, 0, x1, y1, fpGlowRadius);
                    fpGrad1.addColorStop(0, `rgba(249, 115, 22, ${0.75 * heatingMultiplier})`); // Hot Orange
                    fpGrad1.addColorStop(1, 'rgba(249, 115, 22, 0)');
                    this.ctx.fillStyle = fpGrad1;
                    this.ctx.beginPath();
                    this.ctx.arc(x1, y1, fpGlowRadius, 0, Math.PI * 2);
                    this.ctx.fill();

                    const fpGrad2 = this.ctx.createRadialGradient(x2, y2, 0, x2, y2, fpGlowRadius);
                    fpGrad2.addColorStop(0, `rgba(249, 115, 22, ${0.75 * heatingMultiplier})`); // Hot Orange
                    fpGrad2.addColorStop(1, 'rgba(249, 115, 22, 0)');
                    this.ctx.fillStyle = fpGrad2;
                    this.ctx.beginPath();
                    this.ctx.arc(x2, y2, fpGlowRadius, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                // Pass 1: Soft atmospheric background glow
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
                this.ctx.strokeStyle = outerColor;
                this.ctx.lineWidth = activeWidth * 5;
                this.ctx.stroke();

                // Pass 2: Delicate glowing core
                this.ctx.strokeStyle = innerColor;
                this.ctx.lineWidth = activeWidth;
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    /**
     * Renders flowing plasma particles along the pre-computed magnetic paths.
     */
    renderPlasmaParticles(cx, cy, r) {
        // Read real-time control metrics from DOM sliders
        const densityVal = this.densitySlider ? parseFloat(this.densitySlider.value) : 1.0;
        const tempVal = this.tempSlider ? parseFloat(this.tempSlider.value) : 1.5;
        const fieldStrengthVal = this.fieldStrengthSlider ? parseFloat(this.fieldStrengthSlider.value) : 5.0;

        const timeScale = this.time * 0.00015;

        // Apply interactive physical adjustments based on controls
        let speedMultiplier = fieldStrengthVal * 0.20; // 5.0 T mapped to exactly 1.0x
        let brightnessMultiplier = 0.75 + (fieldStrengthVal / 10.0) * 0.5;

        // Dynamic State-based speed scaling and color morphs
        let ar1SpeedScale = 1.0;
        let ar1HeightOverride = 1.0;
        let ar1ShearOffset = 0.0;
        let ar1ColorOverride = false;

        if (this.state === 'BUILDUP') {
            ar1SpeedScale = 1.0 + (this.stressLevel / 100.0) * 0.50;
            brightnessMultiplier *= (1.0 + (this.stressLevel / 100.0) * 0.40);
            ar1ShearOffset = (this.stressLevel / 100.0) * 0.035;
        } else if (this.state === 'RECONNECTING') {
            const u = (150 - this.reconnectionTimer) / 150;
            ar1SpeedScale = 9.0 * (1.0 - Math.abs(u - 0.5) * 0.60); // Explosive snapping acceleration
            ar1HeightOverride = 1.0 - Math.sin(u * Math.PI) * 0.70;
            ar1ColorOverride = true; // Super-heat plasma flow colors inside AR 2
            brightnessMultiplier *= 4.0;
        } else if (this.state === 'COOLING') {
            const v = this.coolingTimer / 180;
            ar1SpeedScale = 1.0 + v * 1.20;
            brightnessMultiplier *= (1.0 + v * 0.60);
            ar1HeightOverride = 0.35 + (1.0 - v) * 0.65;
        }

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';

        let activeCount = 0;
        let speedAccumulator = 0;
        let tempAccumulator = 0;

        this.particles.forEach((p, idx) => {
            // Decimate active particles logically based on the density slider setting to avoid GC allocations
            const moduloKey = idx % 100;
            const threshold = moduloKey / 20; 
            if (threshold >= densityVal) return;

            const line = this.magneticFieldLines[p.lineIndex];
            if (!line) return;

            // Increment normalized parameter of loop trajectory, wrapping smoothly back to 0.0 on overshoot
            if (!this.isPaused) {
                const affectedSpeed = (line.arIndex === 1) ? ar1SpeedScale : 1.0;
                p.t += line.flowSpeedBase * speedMultiplier * p.speedFactor * affectedSpeed;
                if (p.t > 1.0) p.t -= 1.0;
                if (p.t < 0.0) p.t += 1.0;
            }

            // Find matching global wave offsets for spatial consistency
            const midAngle = line.isOpen ? line.angle : (line.startAngle + line.endAngle) / 2;
            const spaceTimeWave = Math.sin(timeScale + midAngle * 4.0) * 0.010 + 
                                 Math.cos(timeScale * 0.6 + midAngle * 1.5) * 0.005;

            // Evaluate Bezier path coordinate (stores position in pre-allocated tempPoint structure)
            this.evaluateCurvePoint(line, p.t, cx, cy, r, spaceTimeWave, ar1HeightOverride, ar1ShearOffset);
            const px = this.tempPoint.x;
            const py = this.tempPoint.y;

            // Compute particle size with subtle breathing oscillations
            const sizeOscillation = 0.8 + 0.4 * Math.sin(timeScale * 2.5 + p.phaseOffset);
            
            // Enhanced depth-based size scaling: background loops have thinner and softer plasma
            const activeSize = p.size * sizeOscillation * (0.45 + 0.55 * line.depth);

            // Brightness fluctuations using slow, stable procedural noise (preventing harsh flickering)
            const slowNoise = Math.sin(timeScale * 0.4 + p.phaseOffset) * 0.08 + 
                              Math.cos(timeScale * 0.2 + p.phaseOffset * 1.5) * 0.04;
            const activeBrightness = p.brightness + slowNoise;

            // Enhanced depth-based opacity scaling (dimmer and softer in the background)
            const activeOpacity = line.opacity * activeBrightness * brightnessMultiplier * (0.30 + 0.70 * line.depth);

            // Individual particle temperature variation mapped off the global slider
            // Uses phase offset as a deterministic seed to prevent color flickering/jittering
            let particleTemp = Math.max(0.5, Math.min(5.0, tempVal + Math.sin(p.phaseOffset * 2) * 0.7));
            
            if (line.arIndex === 1 && ar1ColorOverride) {
                // Dynamically force white-yellow temperature shift during reconnection phase
                particleTemp = 4.8;
            }
            const colorStr = this.getParticleColor(particleTemp);

            // Generate soft radial plasma gradient
            const grad = this.ctx.createRadialGradient(px, py, 0, px, py, activeSize * 2.8);
            grad.addColorStop(0, `rgba(${colorStr}, ${activeOpacity})`);
            grad.addColorStop(0.3, `rgba(${colorStr}, ${activeOpacity * 0.4})`);
            grad.addColorStop(1, `rgba(${colorStr}, 0)`);

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(px, py, activeSize * 2.8, 0, Math.PI * 2);
            this.ctx.fill();

            // Track live statistics for real-time telemetry panel
            activeCount++;
            // Map arbitrary curve step values to a simulated physical scale in km/s
            const lineFactorSpeed = (line.arIndex === 1) ? ar1SpeedScale : 1.0;
            const speedKms = Math.abs(line.flowSpeedBase * speedMultiplier * p.speedFactor * lineFactorSpeed * 165000);
            speedAccumulator += speedKms;
            tempAccumulator += particleTemp;
        });

        this.ctx.restore();

        // Throttle DOM performance updates slightly to prevent layout thrashing
        if (Math.floor(this.time / 16) % 6 === 0) {
            const domParticles = document.getElementById('data-particles');
            const domSpeed = document.getElementById('data-speed');
            const domTemp = document.getElementById('data-temp');
            const domState = document.getElementById('data-state');
            const domEnergy = document.getElementById('data-energy');
            const domStress = document.getElementById('data-stress');

            if (domParticles) domParticles.textContent = activeCount;
            if (domSpeed) {
                domSpeed.textContent = activeCount > 0 
                    ? (speedAccumulator / activeCount).toFixed(1) + " km/s" 
                    : "0.0 km/s";
            }
            if (domTemp) {
                domTemp.textContent = activeCount > 0 
                    ? (tempAccumulator / activeCount).toFixed(2) + " MK" 
                    : "0.00 MK";
            }
            if (domEnergy) domEnergy.textContent = `${this.storedEnergy.toFixed(2)} MJ`;
            if (domStress) domStress.textContent = `${this.stressLevel.toFixed(1)}%`;

            if (domState) {
                if (this.state === 'STABLE') {
                    domState.textContent = 'STABLE';
                    domState.className = 'data-value state-stable';
                    domState.style.color = '#f7f172';
                } else if (this.state === 'BUILDUP') {
                    domState.textContent = 'ENERGY BUILD-UP';
                    domState.className = 'data-value state-stable';
                    domState.style.color = '#fbd84d';
                } else if (this.state === 'RECONNECTING') {
                    domState.textContent = 'RECONNECTING';
                    domState.className = 'data-value state-stable';
                    domState.style.color = '#ffcd03';
                } else if (this.state === 'COOLING') {
                    domState.textContent = 'COOLING';
                    domState.className = 'data-value state-stable';
                    domState.style.color = '#c49d00';
                }
            }
        }
    }


    /**
     * Renders a highly localized, white-hot heat flash at the heart of the reconnecting active region.
     */
    renderReconnectionFlash(cx, cy, r) {
        if (this.state !== 'RECONNECTING') return;

        const progress = (150 - this.reconnectionTimer) / 150;
        if (progress > 0.65) return; // Flares in the first 65% of the snapping phase

        // Coordinates at Active Region 2 center: -105 degrees
        const angle = -105 * Math.PI / 180;
        const flashX = cx + r * Math.cos(angle);
        const flashY = cy + r * Math.sin(angle);

        // Flash expansion and dimming curve calculations
        const intensity = Math.max(0, 1.0 - progress / 0.65);
        const flashRadius = r * 3.2 * intensity;

        const grad = this.ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashRadius);
        grad.addColorStop(0.00, `rgba(255,255,255,1.0)`);
        grad.addColorStop(0.08, `rgba(255,255,255,0.98)`);
        grad.addColorStop(0.22, `rgba(255,240,150,0.95)`);
        grad.addColorStop(0.45, `rgba(255,180,50,0.65)`);
        grad.addColorStop(0.75, `rgba(255,80,0,0.20)`);
        grad.addColorStop(1.00, `rgba(255,80,0,0)`);

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(flashX, flashY, flashRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    /**
     * Starts the continuous requestAnimationFrame loop.
     */
    start() {
        const frameLoop = (timestamp) => {
            this.update(timestamp);
            this.render();
            requestAnimationFrame(frameLoop);
        };
        requestAnimationFrame(frameLoop);
    }
}