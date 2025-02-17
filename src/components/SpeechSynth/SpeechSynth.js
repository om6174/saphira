import { invoke } from "@tauri-apps/api/core";
import eventBus from "../eventBus";

let audioContext;
let analyser;
let dataArray;

export const initializeAudioElements = () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
};

export const updateCanvasLineColor = (theme) => {
    const canvas = document.getElementById('waveform');
    if (!canvas) {
        return;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);

    ctx.lineWidth = 2;
    ctx.stroke();

    // Update the canvas line color based on the current theme
    if (theme === 'light') {
        ctx.strokeStyle = "black";
    } else {
        ctx.strokeStyle = "white";
    }
    ctx.lineWidth = 2;
    ctx.stroke();
};


export const speakWithDefaultVoice = async (dialogue, autoListen) => {
    try {
        const result = await invoke('generate_speech', { dialogue });
        const audio = new Audio(URL.createObjectURL(new Blob([new Uint8Array(result)], { type: 'audio/wav' })));
        let x = 0;

        // Canvas setup
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        let w = canvas.width = canvas.offsetWidth;
        let h = canvas.height = 200;
        const isLightTheme = document.body.classList.contains('light');

        // Initialize audio
        const initializeAudio = () => {
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
        };

        // Draw the colored waves
        const drawLines = (x, amplitudes) => {
            ctx.clearRect(0, 0, w, h); // Clear the canvas
            // Draw red, green, and blue waves
            ['red', 'green', 'blue'].forEach((color, index) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.fillStyle = `rgba(${color === 'red' ? '255,0,0' : color === 'green' ? '0,255,0' : '0,0,255'}, 0.5)`;

                const phaseShift = index === 1 ? (160 / w) * 2 * Math.PI : index === 2 ? (-80 / w) * 2 * Math.PI : 0;

                for (let i = 0; i < w; i++) {
                    const amplitude = amplitudes[index];
                    const y = (h / 2) + amplitude * Math.sin(i * 0.01 + x * 0.05 + phaseShift);
                    ctx.lineTo(i, y);

                }

                // Close and fill the wave
                ctx.lineTo(w, h / 2);
                ctx.lineTo(0, h / 2);
                ctx.closePath();
                ctx.fill();
                //ctx.stroke();
            });
        };

        // Animation loop
        const animateWobble = () => {
            const interval = setInterval(() => {
                analyser.getByteFrequencyData(dataArray);

                // Calculate average amplitude
                const total = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
                const maxAmplitude = h * 2.5;
                const amplitudes = [
                    (total / 255) * maxAmplitude,        // Red
                    (total / 255) * -maxAmplitude,       // Green
                    (total / 255) * maxAmplitude / 1.5   // Blue
                ];

                drawLines(x++, amplitudes);

                if (audio.paused || audio.ended) {
                    clearInterval(interval);

                    // Draw the white base line after the animation ends
                    ctx.clearRect(0, 0, w, h);
                    ctx.beginPath();
                    ctx.moveTo(0, h / 2);
                    ctx.lineTo(w, h / 2);
                    if (isLightTheme)
                        ctx.strokeStyle = "black";
                    else
                        ctx.strokeStyle = "white";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    if (autoListen) {
                        eventBus.$emit("startListening")
                    }
                }
            }, 10);
        };

        // Play audio and start animation
        audio.onplay = () => {
            initializeAudio();
            animateWobble();
        };

        // Draw the white base line after the audio ends
        audio.onended = () => {
            ctx.clearRect(0, 0, w, h);
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            if (isLightTheme)
                ctx.strokeStyle = "black";
            else
                ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        audio.play();

    } catch (error) {
        console.error("Error generating speech:", error);
    }
};
