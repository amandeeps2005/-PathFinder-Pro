// PathFinder Pro - Particle Background System
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.connections = [];
        this.mousePosition = { x: 0, y: 0 };
        
        this.settings = {
            particleCount: 80,
            maxDistance: 120,
            particleSpeed: 0.5,
            particleSize: 2,
            connectionOpacity: 0.3,
            particleOpacity: 0.6,
            colors: {
                particles: '#00d4ff',
                connections: '#00d4ff',
                mouseEffect: '#ff6b6b'
            }
        };
        
        this.init();
        this.bindEvents();
        this.animate();
    }

    init() {
        this.resizeCanvas();
        this.createParticles();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.settings.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.settings.particleSpeed,
                vy: (Math.random() - 0.5) * this.settings.particleSpeed,
                size: Math.random() * this.settings.particleSize + 1,
                opacity: Math.random() * this.settings.particleOpacity + 0.3,
                pulsePhase: Math.random() * Math.PI * 2,
                originalSize: 0
            });
        }
        
        // Set original sizes
        this.particles.forEach(particle => {
            particle.originalSize = particle.size;
        });
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.createParticles();
        });

        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });

        document.addEventListener('mouseleave', () => {
            this.mousePosition.x = -1000;
            this.mousePosition.y = -1000;
        });
    }

    updateParticles() {
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.vx *= -1;
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.vy *= -1;
            }
            
            // Keep particles within bounds
            particle.x = Math.max(0, Math.min(particle.x, this.canvas.width));
            particle.y = Math.max(0, Math.min(particle.y, this.canvas.height));
            
            // Update pulse animation
            particle.pulsePhase += 0.02;
            particle.size = particle.originalSize + Math.sin(particle.pulsePhase) * 0.5;
            
            // Mouse interaction
            const mouseDistance = this.getDistance(
                particle.x, particle.y,
                this.mousePosition.x, this.mousePosition.y
            );
            
            if (mouseDistance < 100) {
                const force = (100 - mouseDistance) / 100;
                particle.size = particle.originalSize + force * 2;
                particle.opacity = Math.min(1, particle.opacity + force * 0.3);
                
                // Subtle attraction to mouse
                const angle = Math.atan2(
                    this.mousePosition.y - particle.y,
                    this.mousePosition.x - particle.x
                );
                particle.vx += Math.cos(angle) * force * 0.01;
                particle.vy += Math.sin(angle) * force * 0.01;
            } else {
                particle.opacity = Math.max(0.3, particle.opacity - 0.01);
            }
            
            // Limit velocity
            const maxVelocity = this.settings.particleSpeed * 2;
            particle.vx = Math.max(-maxVelocity, Math.min(particle.vx, maxVelocity));
            particle.vy = Math.max(-maxVelocity, Math.min(particle.vy, maxVelocity));
        });
    }

    findConnections() {
        this.connections = [];
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const distance = this.getDistance(
                    this.particles[i].x, this.particles[i].y,
                    this.particles[j].x, this.particles[j].y
                );
                
                if (distance < this.settings.maxDistance) {
                    const opacity = (this.settings.maxDistance - distance) / this.settings.maxDistance;
                    this.connections.push({
                        from: this.particles[i],
                        to: this.particles[j],
                        opacity: opacity * this.settings.connectionOpacity
                    });
                }
            }
        }
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    drawParticles() {
        this.particles.forEach(particle => {
            // Create gradient for particle
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            
            // Check if particle is near mouse for special effect
            const mouseDistance = this.getDistance(
                particle.x, particle.y,
                this.mousePosition.x, this.mousePosition.y
            );
            
            if (mouseDistance < 100) {
                const force = (100 - mouseDistance) / 100;
                gradient.addColorStop(0, `rgba(255, 107, 107, ${particle.opacity})`);
                gradient.addColorStop(0.5, `rgba(0, 212, 255, ${particle.opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
            } else {
                gradient.addColorStop(0, `rgba(0, 212, 255, ${particle.opacity})`);
                gradient.addColorStop(0.5, `rgba(0, 212, 255, ${particle.opacity * 0.5})`);
                gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow effect
            this.ctx.shadowColor = this.settings.colors.particles;
            this.ctx.shadowBlur = particle.size * 2;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    drawConnections() {
        this.connections.forEach(connection => {
            // Create gradient for connection line
            const gradient = this.ctx.createLinearGradient(
                connection.from.x, connection.from.y,
                connection.to.x, connection.to.y
            );
            
            gradient.addColorStop(0, `rgba(0, 212, 255, ${connection.opacity})`);
            gradient.addColorStop(0.5, `rgba(0, 212, 255, ${connection.opacity * 0.5})`);
            gradient.addColorStop(1, `rgba(0, 212, 255, ${connection.opacity})`);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(connection.from.x, connection.from.y);
            this.ctx.lineTo(connection.to.x, connection.to.y);
            this.ctx.stroke();
        });
    }

    drawMouseEffect() {
        if (this.mousePosition.x < 0 || this.mousePosition.y < 0) return;
        
        // Draw mouse attraction area
        const gradient = this.ctx.createRadialGradient(
            this.mousePosition.x, this.mousePosition.y, 0,
            this.mousePosition.x, this.mousePosition.y, 100
        );
        
        gradient.addColorStop(0, 'rgba(255, 107, 107, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.mousePosition.x, this.mousePosition.y, 100, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw connections from mouse to nearby particles
        this.particles.forEach(particle => {
            const distance = this.getDistance(
                particle.x, particle.y,
                this.mousePosition.x, this.mousePosition.y
            );
            
            if (distance < 150) {
                const opacity = (150 - distance) / 150 * 0.3;
                
                this.ctx.strokeStyle = `rgba(255, 107, 107, ${opacity})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(this.mousePosition.x, this.mousePosition.y);
                this.ctx.lineTo(particle.x, particle.y);
                this.ctx.stroke();
            }
        });
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
        this.clear();
        this.updateParticles();
        this.findConnections();
        this.drawConnections();
        this.drawParticles();
        this.drawMouseEffect();
        
        requestAnimationFrame(() => this.animate());
    }

    // Public methods for controlling the particle system
    setParticleCount(count) {
        this.settings.particleCount = count;
        this.createParticles();
    }

    setConnectionDistance(distance) {
        this.settings.maxDistance = distance;
    }

    setParticleSpeed(speed) {
        this.settings.particleSpeed = speed;
        this.particles.forEach(particle => {
            const currentSpeed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
            if (currentSpeed > 0) {
                particle.vx = (particle.vx / currentSpeed) * speed;
                particle.vy = (particle.vy / currentSpeed) * speed;
            }
        });
    }

    addBurst(x, y, count = 10) {
        // Add temporary burst of particles at specified location
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 2 + 1;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                opacity: 1,
                pulsePhase: Math.random() * Math.PI * 2,
                originalSize: 2,
                lifetime: 60, // frames
                isBurst: true
            });
        }
        
        // Remove burst particles after their lifetime
        setTimeout(() => {
            this.particles = this.particles.filter(p => !p.isBurst);
        }, 2000);
    }

    // Theme methods
    setTheme(theme) {
        switch(theme) {
            case 'cyber':
                this.settings.colors.particles = '#00d4ff';
                this.settings.colors.connections = '#00d4ff';
                this.settings.colors.mouseEffect = '#ff6b6b';
                break;
            case 'matrix':
                this.settings.colors.particles = '#00ff00';
                this.settings.colors.connections = '#00ff00';
                this.settings.colors.mouseEffect = '#ffffff';
                break;
            case 'neon':
                this.settings.colors.particles = '#ff00ff';
                this.settings.colors.connections = '#ff00ff';
                this.settings.colors.mouseEffect = '#00ffff';
                break;
            default:
                this.settings.colors.particles = '#00d4ff';
                this.settings.colors.connections = '#00d4ff';
                this.settings.colors.mouseEffect = '#ff6b6b';
        }
    }
}

// Initialize particle system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.particleSystem = new ParticleSystem('particle-canvas');
    
    // Add some visual flair when algorithms complete
    if (window.pathFinderApp) {
        const originalComplete = window.pathFinderApp.onVisualizationComplete;
        window.pathFinderApp.onVisualizationComplete = function(result) {
            // Add particle burst effect
            window.particleSystem.addBurst(
                window.innerWidth / 2,
                window.innerHeight / 2,
                20
            );
            
            // Call original completion handler
            if (originalComplete) {
                originalComplete.call(this, result);
            }
        };
    }
});
