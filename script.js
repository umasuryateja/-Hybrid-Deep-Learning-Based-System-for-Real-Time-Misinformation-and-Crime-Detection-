class ChatBot {
    constructor() {
        this.messageContainer = document.getElementById('chat-messages');
        this.textInput = document.getElementById('text-input');
        this.fileInput = document.getElementById('file-input');
        this.filePreview = document.getElementById('file-preview');
        this.uploadProgress = document.querySelector('.upload-progress');
        this.uploadProgressBar = document.querySelector('.upload-progress-bar');
        this.isRecording = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle enter key in text input
        this.textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Handle file input changes
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // Emoji picker
        document.querySelector('.emoji-picker-btn').addEventListener('click', () => {
            this.toggleEmojiPicker();
        });
    }

    showTypingIndicator() {
        const typing = document.createElement('div');
        typing.className = 'message bot-message typing-indicator';
        typing.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        this.messageContainer.appendChild(typing);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = this.messageContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async sendMessage() {
        const text = this.textInput.value.trim();
        const files = this.fileInput.files;

        if (!text && !files.length) return;

        // Add user message to chat
        if (text) {
            this.addMessage(text, 'user');
            this.textInput.value = '';
        }

        if (files.length) {
            const file = files[0];
            this.addMessage(file, 'user', true);
            this.showUploadProgress();
            await this.processImage(file);
            this.hideUploadProgress();
            this.fileInput.value = '';
            this.filePreview.innerHTML = '';
        } else if (text) {
            this.showTypingIndicator();
            await this.processText(text);
            this.removeTypingIndicator();
        }

        this.scrollToBottom();
    }

    showUploadProgress() {
        this.uploadProgress.style.display = 'block';
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            this.uploadProgressBar.style.width = `${progress}%`;
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.hideUploadProgress();
                }, 500);
            }
        }, 100);
    }

    hideUploadProgress() {
        this.uploadProgress.style.display = 'none';
        this.uploadProgressBar.style.width = '0%';
    }

    async processImage(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/predict-image', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            let message = `Image Analysis Result: ${result.prediction}`;
            if (result.prediction === 'Unsafe') {
                message += '\n⚠️ Warning: Potential security threat detected!';
            }
            
            this.addMessage(message, 'bot');
        } catch (error) {
            this.addMessage('Sorry, there was an error processing the image.', 'bot');
            console.error('Error:', error);
        }
    }

    async processText(text) {
        try {
            const response = await fetch('/predict-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            const result = await response.json();
            
            let message = `Analysis Result: ${result.prediction}\n`;
            message += `Confidence: ${(result.confidence * 100).toFixed(2)}%`;
            
            this.addMessage(message, 'bot');
        } catch (error) {
            this.addMessage('Sorry, there was an error processing your text.', 'bot');
            console.error('Error:', error);
        }
    }

    addMessage(content, sender, isImage = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (isImage) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(content);
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '8px';
            img.onload = () => URL.revokeObjectURL(img.src);
            messageContent.appendChild(img);
        } else {
            messageContent.textContent = content;
        }

        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        messageContent.appendChild(timestamp);

        // Add message actions
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        actions.innerHTML = `
            <button class="action-button" onclick="copyMessage(this)">
                <i class="far fa-copy"></i> Copy
            </button>
            ${sender === 'user' ? `
                <button class="action-button" onclick="editMessage(this)">
                    <i class="far fa-edit"></i> Edit
                </button>
            ` : ''}
            <button class="action-button" onclick="deleteMessage(this)">
                <i class="far fa-trash-alt"></i> Delete
            </button>
        `;
        messageContent.appendChild(actions);
        
        messageDiv.appendChild(messageContent);
        this.messageContainer.appendChild(messageDiv);
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Clear previous preview
        this.filePreview.innerHTML = '';

        // Create preview if it's an image
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src);
            this.filePreview.appendChild(img);
        }
    }

    scrollToBottom() {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }
}

// Theme toggle
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.classList.toggle('fa-moon');
    themeIcon.classList.toggle('fa-sun');
}

// Voice input
function toggleVoiceInput() {
    const voiceBtn = document.querySelector('.voice-input-btn');
    if (!window.chatBot.isRecording) {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                window.chatBot.isRecording = true;
                voiceBtn.classList.add('recording');
            };

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                document.getElementById('text-input').value = text;
            };

            recognition.onend = () => {
                window.chatBot.isRecording = false;
                voiceBtn.classList.remove('recording');
            };

            recognition.start();
        } else {
            alert('Speech recognition is not supported in your browser.');
        }
    } else {
        window.chatBot.isRecording = false;
        voiceBtn.classList.remove('recording');
    }
}

// Message actions
function copyMessage(button) {
    const messageText = button.closest('.message-content').textContent;
    navigator.clipboard.writeText(messageText).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    });
}

function editMessage(button) {
    const messageContent = button.closest('.message-content');
    const text = messageContent.childNodes[0].textContent;
    document.getElementById('text-input').value = text;
    document.getElementById('text-input').focus();
}

function deleteMessage(button) {
    const message = button.closest('.message');
    message.style.opacity = '0';
    setTimeout(() => {
        message.remove();
    }, 300);
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatBot = new ChatBot();
});

// Global send message function (called from HTML)
function sendMessage() {
    window.chatBot.sendMessage();
}
