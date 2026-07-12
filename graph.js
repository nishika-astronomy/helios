class EnergyGraph {
    constructor(canvasId, simulation) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.simulation = simulation;
        // Initialize FIRST
        this.maxPoints = 90;
        this.data = [];
        // THEN resize (which calls draw())
        this.resize();
        window.addEventListener("resize", () => this.resize());
        this.draw();
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        this.draw();
    }

    addPoint(value){
        this.data.push(value);
        if(this.data.length>this.maxPoints){
            this.data.shift();
        }
        this.draw();
    }

    reset(){
    this.data=[];
    this.draw();
    }

    draw(){
        const ctx=this.ctx;
        const w=this.canvas.width;
        const h=this.canvas.height;
        ctx.fillStyle="#020306";
        ctx.fillRect(0,0,w,h);
        // Grid
        ctx.strokeStyle="rgba(255,255,255,0.06)";
        ctx.lineWidth=1;
        for(let x=40;x<w;x+=50){
            ctx.beginPath();
            ctx.moveTo(x,0);
            ctx.lineTo(x,h);
            ctx.stroke();
        }
        for(let y=20;y<h;y+=30){
            ctx.beginPath();
            ctx.moveTo(0,y);
            ctx.lineTo(w,y);
            ctx.stroke();
        }

        // Axes
        ctx.strokeStyle="rgba(0,255,255,0.55)";
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(55,10);
        ctx.lineTo(55,h-25);
        ctx.lineTo(w-10,h-25);
        ctx.stroke();
        
        ctx.strokeStyle="#00F5FF";
        ctx.lineWidth=2.8;
        ctx.shadowColor = "#00F5FF";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        const plotWidth=w-100;
        const plotHeight=h-40;
        this.data.forEach((value,index)=>{
            const x =
                55 + (index / (this.maxPoints - 1)) * plotWidth;
            const y=(h-25)-(value/100)*plotHeight;
            if(index===0){
                ctx.moveTo(x,y);
            }else{
            ctx.lineTo(x,y);
        }
    });
    // Soft glow
    ctx.shadowColor = "#00F5FF";
    ctx.shadowBlur = 16;
    ctx.stroke();

    // Bright crisp line
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#7DF9FF";
    ctx.stroke();

    // ===== Y Axis Scale =====
    ctx.fillStyle = "#027379";
    ctx.font = "11px Inter";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const yLabels = [0,20,40,60,80,100];
    yLabels.forEach(value=>{
        const y =
            (h-25) - (value/100)*(h-40);

        // tick
        ctx.strokeStyle="rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.moveTo(35,y);
        ctx.lineTo(40,y);
        ctx.stroke();
        // text
        ctx.fillText(value,20,y);
    });

    if (this.data.length === 0) {
        // Origin cursor
        const cursorX = 40;
        const cursorY = h - 25;
        ctx.beginPath();
        switch (this.simulation.state) {
        case "STABLE":
            ctx.fillStyle = "#f7f172";
                ctx.shadowColor = "#f7f172";
                break;
            case "BUILDUP":
                ctx.fillStyle = "#fbd84d";
                ctx.shadowColor = "#fbd84d";
                break;
            case "RECONNECTING":
                ctx.fillStyle = "#ffcd03";
                ctx.shadowColor = "#ffcd03";
                break;
            case "COOLING":
                ctx.fillStyle = "#c49d00";
                ctx.shadowColor = "#c49d00";
                break;
        }
        ctx.shadowBlur = 18;
        ctx.arc(cursorX, cursorY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        return;
    }

    // ===== Live Cursor =====
    const lastIndex = this.data.length - 1;

    const cursorX =
        55 + (lastIndex / (this.maxPoints - 1)) * plotWidth;

    const cursorY =
        (h - 25) -
        (this.data[lastIndex] / 100) * plotHeight;

    // ===== Dynamic Cursor Colour =====
    switch (this.simulation.state) {

        case "STABLE":
            ctx.fillStyle = "#f7f172";
            ctx.shadowColor = "#f7f172";
            break;

        case "BUILDUP":
            ctx.fillStyle = "#fbd84d";
            ctx.shadowColor = "#fbd84d";
            break;

        case "RECONNECTING":
            ctx.fillStyle = "#ffcd03";
            ctx.shadowColor = "#ffcd03";
            break;

        case "COOLING":
            ctx.fillStyle = "#c49d00";
            ctx.shadowColor = "#c49d00";
            break;

        default:
            ctx.fillStyle = "#00F5FF";
            ctx.shadowColor = "#00F5FF";
    }

    ctx.beginPath();
    ctx.shadowBlur = 22;
    ctx.arc(cursorX, cursorY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    }
}

window.EnergyGraph = EnergyGraph;