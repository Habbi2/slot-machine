import confetti from 'canvas-confetti';

// Pixel-style confetti options
const pixelDefaults = {
  scalar: 2,
  shapes: ['square' as const],
  colors: ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FF6600'],
};

// Jackpot celebration - big confetti burst
export function fireJackpot() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      ...pixelDefaults,
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
    });
    confetti({
      ...pixelDefaults,
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();

  // Big center burst
  confetti({
    ...pixelDefaults,
    particleCount: 100,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    startVelocity: 45,
  });
}

// Small win celebration - subtle confetti
export function fireSmallWin() {
  confetti({
    ...pixelDefaults,
    particleCount: 30,
    spread: 60,
    origin: { x: 0.5, y: 0.6 },
    startVelocity: 25,
  });
}

// Coin shower for consolation prize
export function fireCoin() {
  confetti({
    ...pixelDefaults,
    particleCount: 5,
    spread: 30,
    origin: { x: 0.5, y: 0.5 },
    startVelocity: 15,
    colors: ['#FFD700', '#FFA500'],
  });
}
