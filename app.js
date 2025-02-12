class NewspaperCreatorPro {
    constructor() {
        this.workspace = document.getElementById('workspace');
        this.drawingLayer = document.getElementById('drawing-layer');
        this.ctx = this.drawingLayer.getContext('2d');
        this.isDrawing = false;
        this.isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.selectedElement = null;
        
        this.setupCanvas();
        this.setupTouchSpecificBehavior();
        this.bindEvents();
        this.handleResize();
    }

    setupTouchSpecificBehavior() {
        if (this.isIPad) {
            this.workspace.addEventListener('touchmove', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });

            this.setupGestureRecognition();
        }
    }

    setupGestureRecognition() {
        let initialPinchDistance = 0;
        let initialRotation = 0;

        this.workspace.addEventListener('gesturestart', (e) => {
            e.preventDefault();
            initialPinchDistance = e.scale;
            initialRotation = e.rotation;
        });

        this.workspace.addEventListener('gesturechange', (e) => {
            e.preventDefault();
            if (this.selectedElement) {
                const scale = e.scale / initialPinchDistance;
                const rotation = e.rotation - initialRotation;
                this.selectedElement.style.transform = 
                    `scale(${scale}) rotate(${rotation}deg)`;
            }
        });
    }

    handleResize() {
        const resizeObserver = new ResizeObserver(() => {
            this.setupCanvas();
        });
        resizeObserver.observe(this.workspace);
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.workspace.getBoundingClientRect();
        
        this.drawingLayer.width = rect.width * dpr;
        this.drawingLayer.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = 2;
    }

    createDraggableElement(type, content) {
        const element = document.createElement('div');
        element.className = 'draggable';
        element.dataset.type = type;
        
        if (type === 'text') {
            element.contentEditable = true;
            element.textContent = content || 'Tap to edit';
            this.setupTextElementBehavior(element);
        } else if (type === 'image') {
            const img = document.createElement('img');
            img.src = content;
            img.draggable = false;
            element.appendChild(img);
            this.addImageControls(element);
        }

        element.style.left = '50%';
        element.style.top = '50%';
        element.style.transform = 'translate(-50%, -50%)';
        
        this.workspace.appendChild(element);
        this.initializeDragging(element);
        
        return element;
    }

    setupTextElementBehavior(element) {
        element.addEventListener('focus', () => {
            element.classList.add('editing');
            element.style.cursor = 'text';
        });

        element.addEventListener('blur', () => {
            element.classList.remove('editing');
            element.style.cursor = 'move';
        });
    }

    addImageControls(element) {
        const controls = document.createElement('div');
        controls.className = 'image-controls';
        controls.innerHTML = `
            <button class="image-control-btn" data-action="flip">↔️</button>
            <button class="image-control-btn" data-action="rotate">🔄</button>
            <button class="image-control-btn" data-action="brightness">☀️</button>
            <button class="image-control-btn" data-action="delete">🗑️</button>
        `;
        element.appendChild(controls);
        this.initializeImageControls(element);
    }

    initializeDragging(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        let touchTimeout;

        const dragStart = (e) => {
            if (e.type === "touchstart") {
                touchTimeout = setTimeout(() => {
                    element.classList.add('selected');
                    this.selectedElement = element;
                }, 200);

                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === element || e.target.parentNode === element) {
                isDragging = true;
                element.classList.add('dragging');
            }
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                
                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;
                
                requestAnimationFrame(() => {
                    element.style.transform = `translate(${currentX}px, ${currentY}px)`;
                });
            }
        };

        const dragEnd = () => {
            clearTimeout(touchTimeout);
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            element.classList.remove('dragging');
        };

        element.addEventListener("touchstart", dragStart, { passive: true });
        element.addEventListener("touchend", dragEnd);
        element.addEventListener("touchmove", drag, { passive: false });
        element.addEventListener("mousedown", dragStart);
        element.addEventListener("mouseup", dragEnd);
        element.addEventListener("mousemove", drag);
    }

    initializeImageControls(element) {
        const controls = element.querySelector('.image-controls');
        controls.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const img = element.querySelector('img');
            
            switch(action) {
                case 'flip':
                    img.style.transform = img.style.transform.includes('scaleX(-1)') 
                        ? 'scaleX(1)' 
                        : 'scaleX(-1)';
                    break;
                case 'rotate':
                    const currentRotation = parseInt(img.dataset.rotation || 0);
                    const newRotation = currentRotation + 90;
                    img.style.transform = `rotate(${newRotation}deg)`;
                    img.dataset.rotation = newRotation;
                    break;
                case 'brightness':
                    img.style.filter = img.style.filter.includes('brightness')
                        ? ''
                        : 'brightness(1.2)';
                    break;
                case 'delete':
                    element.remove();
                    break;
            }
        });
    }

    handleImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.createDraggableElement('image', event.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    bindEvents() {
        document.getElementById('addText').onclick = () => this.createDraggableElement('text');
        document.getElementById('addImage').onclick = () => this.handleImageUpload();
        document.getElementById('draw').onclick = () => this.toggleDrawing();
        document.getElementById('save').onclick = () => this.saveState();
        document.getElementById('load').onclick = () => this.loadState();

        // Clear selection when tapping workspace
        this.workspace.addEventListener('click', (e) => {
            if (e.target === this.workspace) {
                this.selectedElement = null;
                document.querySelectorAll('.draggable.selected').forEach(el => {
                    el.classList.remove('selected');
                });
            }
        });
    }

    toggleDrawing() {
        this.drawingLayer.classList.toggle('drawing-active');
        if (this.drawingLayer.classList.contains('drawing-active')) {
            this.initializeDrawing();
        }
    }

    initializeDrawing() {
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        const draw = (e) => {
            if (!isDrawing) return;
            
            const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            this.ctx.beginPath();
            this.ctx.moveTo(lastX, lastY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            [lastX, lastY] = [x, y];
        };

        const startDrawing = (e) => {
            isDrawing = true;
            [lastX, lastY] = [
                e.type.includes('touch') ? e.touches[0].clientX : e.clientX,
                e.type.includes('touch') ? e.touches[0].clientY : e.clientY
            ];
        };

        const stopDrawing = () => {
            isDrawing = false;
        };

        this.drawingLayer.addEventListener('mousedown', startDrawing);
        this.drawingLayer.addEventListener('touchstart', startDrawing);
        this.drawingLayer.addEventListener('mousemove', draw);
        this.drawingLayer.addEventListener('touchmove', draw);
        this.drawingLayer.addEventListener('mouseup', stopDrawing);
        this.drawingLayer.addEventListener('touchend', stopDrawing);
    }

    saveState() {
        try {
            const state = {
                elements: Array.from(document.querySelectorAll('.draggable')).map(el => ({
                    type: el.dataset.type,
                    content: el.dataset.type === 'text' ? el.textContent : el.querySelector('img')?.src,
                    style: el.style.cssText,
                    transform: el.style.transform
                })),
                drawing: this.drawingLayer.toDataURL()
            };
            
            localStorage.setItem('newspaperState', JSON.stringify(state));
            alert('Project saved successfully!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save project. Please try again.');
        }
    }

    loadState() {
        try {
            const state = JSON.parse(localStorage.getItem('newspaperState'));
            if (state) {
                this.workspace.innerHTML = '';
                this.ctx.clearRect(0, 0, this.drawingLayer.width, this.drawingLayer.height);
                
                state.elements.forEach(el => {
                    const element = this.createDraggableElement(el.type, el.content);
                    element.style.cssText = el.style;
                });
                
                if (state.drawing) {
                    const img = new Image();
                    img.onload = () => {
                        this.ctx.drawImage(img, 0, 0);
                    };
                    img.src = state.drawing;
                }
            }
        } catch (error) {
            console.error('Load failed:', error);
            alert('Failed to load project. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new NewspaperCreatorPro();
});
