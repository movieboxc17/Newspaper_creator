class NewspaperCreatorPro {
    constructor() {
        this.workspace = document.getElementById('workspace');
        this.drawingLayer = document.getElementById('drawing-layer');
        this.ctx = this.drawingLayer.getContext('2d');
        this.setupCanvas();
        this.bindEvents();
    }

    setupCanvas() {
        this.drawingLayer.width = window.innerWidth;
        this.drawingLayer.height = window.innerHeight;
    }

    createDraggableElement(type, content) {
        const element = document.createElement('div');
        element.className = 'draggable';
        element.dataset.type = type;
        
        if (type === 'text') {
            element.contentEditable = true;
            element.textContent = content || 'Double tap to edit';
        } else if (type === 'image') {
            const img = document.createElement('img');
            img.src = content;
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

    addImageControls(element) {
        // Add scaling handles
        ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(position => {
            const handle = document.createElement('div');
            handle.className = `scale-handle ${position}`;
            element.appendChild(handle);
            this.initializeScaling(element, handle, position);
        });

        // Add rotation handle
        const rotateHandle = document.createElement('div');
        rotateHandle.className = 'rotate-handle';
        element.appendChild(rotateHandle);
        this.initializeRotation(element, rotateHandle);

        // Add control buttons
        const controls = document.createElement('div');
        controls.className = 'image-controls';
        controls.innerHTML = `
            <button class="image-control-btn" data-action="flip">↔️</button>
            <button class="image-control-btn" data-action="brightness">☀️</button>
            <button class="image-control-btn" data-action="contrast">◐</button>
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

        const dragStart = (e) => {
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === element) {
                isDragging = true;
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

                setTranslate(currentX, currentY, element);
            }
        };

        const dragEnd = () => {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        };

        const setTranslate = (xPos, yPos, el) => {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        };

        element.addEventListener("touchstart", dragStart, false);
        element.addEventListener("touchend", dragEnd, false);
        element.addEventListener("touchmove", drag, false);
        element.addEventListener("mousedown", dragStart, false);
        element.addEventListener("mouseup", dragEnd, false);
        element.addEventListener("mousemove", drag, false);
    }

    initializeScaling(element, handle, position) {
        let startX, startY, startWidth, startHeight;

        const startScale = (e) => {
            e.stopPropagation();
            startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            startWidth = element.offsetWidth;
            startHeight = element.offsetHeight;
            
            document.addEventListener('mousemove', scale);
            document.addEventListener('touchmove', scale);
            document.addEventListener('mouseup', stopScale);
            document.addEventListener('touchend', stopScale);
        };

        const scale = (e) => {
            const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            switch(position) {
                case 'top-left':
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight - deltaY;
                    break;
                case 'top-right':
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight - deltaY;
                    break;
                case 'bottom-left':
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight + deltaY;
                    break;
                case 'bottom-right':
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight + deltaY;
                    break;
            }

            element.style.width = `${Math.max(50, newWidth)}px`;
            element.style.height = `${Math.max(50, newHeight)}px`;
        };

        const stopScale = () => {
            document.removeEventListener('mousemove', scale);
            document.removeEventListener('touchmove', scale);
            document.removeEventListener('mouseup', stopScale);
            document.removeEventListener('touchend', stopScale);
        };

        handle.addEventListener('mousedown', startScale);
        handle.addEventListener('touchstart', startScale);
    }

    initializeRotation(element, handle) {
        let rotation = 0;
        let startAngle = 0;

        const startRotate = (e) => {
            e.stopPropagation();
            const rect = element.getBoundingClientRect();
            const center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            startAngle = Math.atan2(
                e.type.includes('touch') ? e.touches[0].clientY - center.y : e.clientY - center.y,
                e.type.includes('touch') ? e.touches[0].clientX - center.x : e.clientX - center.x
            );
            
            document.addEventListener('mousemove', rotate);
            document.addEventListener('touchmove', rotate);
            document.addEventListener('mouseup', stopRotate);
            document.addEventListener('touchend', stopRotate);
        };

        const rotate = (e) => {
            const rect = element.getBoundingClientRect();
            const center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            
            const currentAngle = Math.atan2(
                e.type.includes('touch') ? e.touches[0].clientY - center.y : e.clientY - center.y,
                e.type.includes('touch') ? e.touches[0].clientX - center.x : e.clientX - center.x
            );
            
            rotation += currentAngle - startAngle;
            element.style.transform = `rotate(${rotation}rad)`;
            startAngle = currentAngle;
        };

        const stopRotate = () => {
            document.removeEventListener('mousemove', rotate);
            document.removeEventListener('touchmove', rotate);
            document.removeEventListener('mouseup', stopRotate);
            document.removeEventListener('touchend', stopRotate);
        };

        handle.addEventListener('mousedown', startRotate);
        handle.addEventListener('touchstart', startRotate);
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
                case 'brightness':
                    img.style.filter = img.style.filter.includes('brightness')
                        ? ''
                        : 'brightness(1.2)';
                    break;
                case 'contrast':
                    img.style.filter = img.style.filter.includes('contrast')
                        ? ''
                        : 'contrast(1.2)';
                    break;
                case 'delete':
                    element.remove();
                    break;
            }
        });
    }

    bindEvents() {
        document.getElementById('addText').onclick = () => this.createDraggableElement('text');
        document.getElementById('addImage').onclick = () => this.handleImageUpload();
        document.getElementById('draw').onclick = () => this.toggleDrawing();
        document.getElementById('save').onclick = () => this.saveState();
        document.getElementById('load').onclick = () => this.loadState();
    }

        handleImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                this.createDraggableElement('image', event.target.result);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    toggleDrawing() {
        this.drawingLayer.classList.toggle('drawing-active');
        this.initializeDrawing();
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
        const state = {
            elements: Array.from(document.querySelectorAll('.draggable')).map(el => ({
                type: el.dataset.type,
                content: el.dataset.type === 'text' ? el.textContent : el.querySelector('img').src,
                style: el.style.cssText
            })),
            drawing: this.drawingLayer.toDataURL()
        };
        localStorage.setItem('newspaperState', JSON.stringify(state));
        alert('Project saved successfully!');
    }

    loadState() {
        const state = JSON.parse(localStorage.getItem('newspaperState'));
        if (state) {
            this.workspace.innerHTML = '';
            state.elements.forEach(el => {
                const element = this.createDraggableElement(el.type, el.content);
                element.style.cssText = el.style;
            });
            
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.drawingLayer.width, this.drawingLayer.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = state.drawing;
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new NewspaperCreatorPro();
});

