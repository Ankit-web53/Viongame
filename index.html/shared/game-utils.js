class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Default volume
        this.masterGain.connect(this.ctx.destination);

        // Pre-generate noise buffer for explosions
        this.noiseBuffer = this.createNoiseBuffer();
    }

    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playTone(freq, type, duration, vol = 0.3) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, vol = 0.5) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        const gain = this.ctx.createGain();

        // Bandpass filter for "crunchier" sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start();
        source.stop(this.ctx.currentTime + duration);
    }

    playSound(name) {
        switch (name) {
            case 'click':
                this.playTone(800, 'sine', 0.1, 0.2);
                break;
            case 'jump':
                // Slide pitch up for jump
                this.playSweep(150, 600, 0.2, 'square');
                break;
            case 'hit':
            case 'crash':
                this.playNoise(0.3, 0.6);
                this.playTone(100, 'sawtooth', 0.3, 0.4); // Bass thud
                break;
            case 'win':
                this.playMelody([
                    { f: 523.25, d: 0.1 }, { f: 659.25, d: 0.1 }, { f: 783.99, d: 0.2 }, { f: 1046.50, d: 0.4 }
                ]);
                break;
            case 'lose':
                this.playSweep(400, 100, 0.5, 'sawtooth');
                break;
            case 'collect':
                this.playTone(1200, 'sine', 0.1, 0.2);
                this.playTone(1800, 'sine', 0.1, 0.1); // Sparkle
                break;
            case 'powerup':
                this.playSweep(300, 1200, 0.4, 'sine');
                break;
        }
    }

    playSweep(startFreq, endFreq, duration, type) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playMelody(notes) {
        let time = this.ctx.currentTime;
        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = note.f;
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + note.d);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + note.d);
            time += note.d;
        });
    }
}

class ScoreManager {
    constructor(gameId) {
        this.gameId = gameId;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem(`viongame_${gameId}_highscore`)) || 0;
    }

    updateScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        return { score: this.score, highScore: this.highScore };
    }

    resetScore() {
        this.score = 0;
        return this.score;
    }

    saveHighScore() {
        localStorage.setItem(`viongame_${this.gameId}_highscore`, this.highScore);
    }

    getHighScore() {
        return this.highScore;
    }
}

class ParticleSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
    }

    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: color,
                size: Math.random() * 3 + 2
            });
        }
    }

    createTrail(x, y, color) {
        this.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.5,
            color: color,
            size: Math.random() * 2 + 1
        });
    }

    update() {
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.size *= 0.95;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                i--;
            }
        }
    }

    draw() {
        for (let p of this.particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;
    }
}

class LevelManager {
    constructor(baseSpeed = 1, speedIncrement = 0.5, levelThreshold = 10) {
        this.baseSpeed = baseSpeed;
        this.speedIncrement = speedIncrement;
        this.levelThreshold = levelThreshold;
        this.currentLevel = 1;
    }

    getSpeed(score) {
        const newLevel = Math.floor(score / this.levelThreshold) + 1;
        if (newLevel > this.currentLevel) {
            this.currentLevel = newLevel;
            return this.baseSpeed + (this.currentLevel - 1) * this.speedIncrement;
        }
        return this.baseSpeed + (this.currentLevel - 1) * this.speedIncrement;
    }

    getLevel() {
        return this.currentLevel;
    }
}

class MobileControls {
    constructor(handlers) {
        this.handlers = handlers; // { up, down, left, right, action }
        this.setupTouchControls();
    }

    setupTouchControls() {
        // Touch swipe detection
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: false });

        // On-screen buttons (if they exist)
        const btnUp = document.getElementById('btn-up');
        const btnDown = document.getElementById('btn-down');
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnAction = document.getElementById('btn-action');
        const btnJump = document.getElementById('btn-jump');

        if (btnUp) btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.handlers.up) this.handlers.up(); });
        if (btnDown) btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.handlers.down) this.handlers.down(); });
        if (btnLeft) btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.handlers.left) this.handlers.left(); });
        if (btnRight) btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.handlers.right) this.handlers.right(); });
        if (btnAction) btnAction.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.handlers.action) this.handlers.action(); });
        if (btnJump) btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.handlers.up) this.handlers.up(); }); // Map jump to up usually
    }

    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const threshold = 30; // Min swipe distance

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal
            if (Math.abs(diffX) > threshold) {
                if (diffX > 0 && this.handlers.right) this.handlers.right();
                else if (diffX < 0 && this.handlers.left) this.handlers.left();
            }
        } else {
            // Vertical
            if (Math.abs(diffY) > threshold) {
                if (diffY > 0 && this.handlers.down) this.handlers.down();
                else if (diffY < 0 && this.handlers.up) this.handlers.up();
            }
        }
    }
}
