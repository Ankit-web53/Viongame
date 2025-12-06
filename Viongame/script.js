// Main script for homepage
document.addEventListener('DOMContentLoaded', () => {
    console.log('Viongame Loaded');

    // Add simple hover sound effect to cards if user has interacted
    const cards = document.querySelectorAll('.game-card');

    // We can't autoplay audio without interaction, so we'll just log for now
    // or initialize audio context on first click anywhere

    let audioCtx;

    document.body.addEventListener('click', () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }, { once: true });
});
