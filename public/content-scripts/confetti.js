/**
 * Enhanced Confetti Content Script
 * Creates spectacular confetti animation when usability test ends
 */

// Listen for confetti trigger from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showConfetti") {
        console.log("🎉 Showing enhanced confetti for test completion!");
        showConfetti(message.testData);
        sendResponse({ status: "Enhanced confetti triggered" });
    }
});

function showConfetti(testData = {}) {
    // Create confetti container
    const confettiContainer = document.createElement('div');
    confettiContainer.id = 'herbie-confetti-container';
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999999;
        overflow: hidden;
    `;
    
    // Create enhanced success message overlay
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px 40px;
        border-radius: 20px;
        font-family: 'Arial', sans-serif;
        font-size: 20px;
        font-weight: bold;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(102, 126, 234, 0.3);
        z-index: 1000000;
        animation: successEntrance 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        pointer-events: none;
        border: 2px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
    `;
    
    const taskName = testData.taskName || 'Usability Test';
    const testerName = testData.testerName || 'Tester';
    
    successMessage.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 12px; animation: bounce 1s ease-out;">🎉 Test Completed! 🎉</div>
        <div style="font-size: 18px; font-weight: normal; opacity: 0.9; line-height: 1.4;">
            <div style="margin-bottom: 8px;">📋 Task: <span style="color: #FFD700;">${taskName}</span></div>
            <div style="margin-bottom: 8px;">👤 Tester: <span style="color: #FFD700;">${testerName}</span></div>
        </div>
    `;
    
    // Add enhanced CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes successEntrance {
            0% { 
                transform: translate(-50%, -50%) scale(0.3) rotate(-10deg); 
                opacity: 0; 
            }
            50% { 
                transform: translate(-50%, -50%) scale(1.1) rotate(5deg); 
                opacity: 1; 
            }
            100% { 
                transform: translate(-50%, -50%) scale(1) rotate(0deg); 
                opacity: 1; 
            }
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes confettiFall {
            0% { 
                transform: translateY(-100vh) translateX(0) rotate(0deg) scale(1); 
                opacity: 1; 
            }
            100% { 
                transform: translateY(100vh) translateX(var(--drift)) rotate(var(--rotation)) scale(0.5); 
                opacity: 0; 
            }
        }
        
        @keyframes sparkle {
            0%, 100% { 
                transform: scale(0) rotate(0deg); 
                opacity: 0; 
            }
            50% { 
                transform: scale(1) rotate(180deg); 
                opacity: 1; 
            }
        }
        
        @keyframes successFadeOut {
            0% { 
                opacity: 1; 
                transform: translate(-50%, -50%) scale(1); 
            }
            100% { 
                opacity: 0; 
                transform: translate(-50%, -50%) scale(0.8) rotate(5deg); 
            }
        }
        
        @keyframes float {
            0%, 100% { 
                transform: translateY(0px) rotate(0deg) scale(1); 
                opacity: 1; 
            }
            25% { 
                transform: translateY(-15px) rotate(5deg) scale(1.1); 
                opacity: 0.8; 
            }
            50% { 
                transform: translateY(-30px) rotate(-5deg) scale(1.2); 
                opacity: 0.6; 
            }
            75% { 
                transform: translateY(-15px) rotate(3deg) scale(1.1); 
                opacity: 0.8; 
            }
        }
        
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Add to DOM
    document.body.appendChild(confettiContainer);
    document.body.appendChild(successMessage);
    
    // Enhanced confetti configuration
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#FF8A65', '#81C784',
        '#FFD54F', '#E57373', '#64B5F6', '#AED581', '#FFB74D'
    ];
    
    const shapes = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
    
    // Create spectacular confetti bursts
    createInitialBurst(confettiContainer, colors, shapes);
    
    // Create continuous smaller bursts
    for (let burst = 0; burst < 5; burst++) {
        setTimeout(() => {
            createConfettiBurst(confettiContainer, colors, shapes, burst);
        }, burst * 300);
    }
    
    // Add floating particles
    setTimeout(() => {
        addFloatingParticles(confettiContainer);
    }, 500);
    
    // Add sparkle effects
    setTimeout(() => {
        addSparkleEffect(confettiContainer);
    }, 1000);
    
    // Remove success message after 4 seconds
    setTimeout(() => {
        successMessage.style.animation = 'successFadeOut 0.8s ease-in forwards';
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
            }
        }, 800);
    }, 4000);
    
    // Clean up everything after 8 seconds
    setTimeout(() => {
        cleanup();
    }, 8000);
    
    function cleanup() {
        if (confettiContainer.parentNode) {
            confettiContainer.parentNode.removeChild(confettiContainer);
        }
        if (successMessage.parentNode) {
            successMessage.parentNode.removeChild(successMessage);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }
}

function createInitialBurst(container, colors, shapes) {
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            createConfettiPiece(container, colors, shapes, {
                leftPosition: 40 + Math.random() * 20, // Center burst
                size: Math.random() * 8 + 6, // Larger pieces
                animationDuration: Math.random() * 3 + 2,
                animationDelay: Math.random() * 0.5
            });
        }, i * 10); // Staggered creation
    }
}

function createConfettiBurst(container, colors, shapes, burstIndex) {
    const confettiCount = 60;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            createConfettiPiece(container, colors, shapes, {
                leftPosition: Math.random() * 100,
                size: Math.random() * 6 + 4,
                animationDuration: Math.random() * 2.5 + 2,
                animationDelay: Math.random() * 1
            });
        }, i * 15);
    }
}

function createConfettiPiece(container, colors, shapes, options) {
    const confettiPiece = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const drift = (Math.random() - 0.5) * 200; // Horizontal drift
    const rotation = Math.random() * 720 + 360; // Multiple rotations
    
    confettiPiece.style.cssText = `
        position: absolute;
        top: -20px;
        left: ${options.leftPosition}%;
        width: ${options.size}px;
        height: ${options.size}px;
        background: ${color};
        animation: confettiFall ${options.animationDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${options.animationDelay}s forwards;
        z-index: 999999;
        --drift: ${drift}px;
        --rotation: ${rotation}deg;
    `;
    
    // Apply enhanced shapes
    applyShape(confettiPiece, shape, options.size, color);
    
    container.appendChild(confettiPiece);
    
    // Remove individual pieces after animation
    setTimeout(() => {
        if (confettiPiece.parentNode) {
            confettiPiece.parentNode.removeChild(confettiPiece);
        }
    }, (options.animationDuration + options.animationDelay) * 1000);
}

function applyShape(element, shape, size, color) {
    switch (shape) {
        case 'circle':
            element.style.borderRadius = '50%';
            break;
        case 'triangle':
            element.style.width = '0';
            element.style.height = '0';
            element.style.borderLeft = `${size/2}px solid transparent`;
            element.style.borderRight = `${size/2}px solid transparent`;
            element.style.borderBottom = `${size}px solid ${color}`;
            element.style.background = 'transparent';
            break;
        case 'star':
            element.style.background = color;
            element.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            break;
        case 'heart':
            element.style.background = color;
            element.style.transform = 'rotate(-45deg)';
            element.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
            element.innerHTML = `<div style="width: ${size}px; height: ${size}px; background: ${color}; border-radius: 50%; position: absolute; left: ${size/2}px; top: 0;"></div>`;
            break;
        case 'diamond':
            element.style.background = color;
            element.style.transform = 'rotate(45deg)';
            break;
        default: // square
            break;
    }
}

function addFloatingParticles(container) {
    const particles = ['⭐', '🎊', '🎉', '✨', '🌟', '💫', '🎈', '🏆', '🥳', '🌈'];
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        particle.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 15 + 20}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 4 + 3}s ease-in-out infinite;
            z-index: 999999;
            pointer-events: none;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        `;
        
        container.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 7000);
    }
}

function addSparkleEffect(container) {
    for (let i = 0; i < 30; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: radial-gradient(circle, #fff, #FFD700);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: sparkle ${Math.random() * 2 + 1}s ease-in-out infinite;
            z-index: 999999;
            pointer-events: none;
            box-shadow: 0 0 6px #FFD700;
        `;
        
        container.appendChild(sparkle);
        
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 5000);
    }
}

console.log('🎉 Enhanced confetti content script loaded and ready for spectacular celebrations!');