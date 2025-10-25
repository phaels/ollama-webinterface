
<img width="2014" height="1127" alt="Bildschirmfoto_20251025_190122" src="https://github.com/user-attachments/assets/484842ca-15ac-4420-b62c-c7d0b05b398e" />

# **Ollama Web Interface - Complete Tutorial**

## **📋 Table of Contents**
1. Introduction
2. Requirements
3. Project Setup
4. Backend Development
5. Frontend Development
6. Testing & Deployment
7. Extensions
8. Troubleshooting

---

## **1. Introduction**

### **What is this project?**
This tutorial will guide you step-by-step through creating a **web-based chat interface** for Ollama. Instead of using the command line, you can interact with your local LLMs (Large Language Models) via a modern web browser.

**Support my open source work on PayPal:** m.imle@gmx.net

### **Key Features**
- ✅ **Model selection** from all installed Ollama models
- ✅ **Real-time chat** with local LLMs
- ✅ **History** of the last 10 conversations
- ✅ **Responsive design** with Bootstrap 5
- ✅ **Auto-refresh** during processing
- ✅ **Error handling** and status display

### **Technology Stack 🛠️**

| **Area** | **Technology** |
|----------|----------------|
| **Backend** | Node.js + Express.js |
| **Template Engine** | EJS (Embedded JavaScript) |
| **Frontend** | Bootstrap 5 + jQuery |
| **Icons** | Bootstrap Icons |
| **AI Engine** | Ollama (local) |

---

## **2. Requirements**

### **2.1 Ollama Installation**

**Windows:**
1. Visit [https://ollama.ai](https://ollama.ai/)
2. Download `OllamaSetup.exe`
3. Complete the installation
4. Open PowerShell and test:

```powershell
ollama --version
```

**macOS:**
```bash
# Installation via Homebrew
brew install ollama

# Or download from website
```

**Linux:**
```bash
# Installation Script
curl -fsSL https://ollama.ai/install.sh | sh
```

### **2.2 Download Models**

Download at least one model (in the terminal):

```bash
# Popular models (choose one):
ollama pull llama2:7b         # 3.8 GB - Good for beginners
ollama pull gemma:2b          # 1.6 GB - Very fast
ollama pull mistral:7b        # 4.4 GB - Very good quality
ollama pull codellama:7b      # 3.8 GB - For Programming

# Check installed models:
ollama list
```

### **2.3 Node.js Installation**

1. Visit [https://nodejs.org](https://nodejs.org/)
2. Download the **LTS version** (recommended: 18.x or higher)
3. Install Node.js
4. Check the installation:

```bash
node --version
```

**Expected output:**
```text
v18.17.0
```

---

## **3. Project Setup**

### **3.1 Create Project Directory**

**Windows (PowerShell):**
```powershell
# Create project folder
mkdir ollama-webinterface
cd ollama-webinterface

# Create directory structure
New-Item -ItemType Directory -Path views\pages
New-Item -ItemType Directory -Path views\partials
New-Item -ItemType Directory -Path public\css
New-Item -ItemType Directory -Path public\js
```

**macOS/Linux:**
```bash
# Create project folder
mkdir ollama-webinterface
cd ollama-webinterface

# Create directory structure
mkdir -p views/pages views/partials public/css public/js
```

### **3.2 Project Structure**

```text
ollama-webinterface/
│
├── server.js              # Main server file
├── package.json           # Node.js configuration
│
├── views/                 # EJS Templates
│   ├── pages/
│   │   ├── index.ejs      # Main page
│   │   ├── status.ejs     # Status page
│   │   └── error.ejs      # Error page
│   └── partials/
│       ├── head.ejs       # HTML Head
│       ├── header.ejs     # Navigation
│       └── footer.ejs     # Footer
│
└── public/                # Static files
    ├── css/
    └── js/
```

### **3.3 Initialize Node.js Project**

```bash
# Create Package.json
npm init -y
```

### **3.4 Installing Dependencies**

```bash
# Main dependencies
npm install express ejs ollama

# Development dependencies (optional)
npm install --save-dev nodemon
```

**Explanation of the packages:**
- **express**: Web framework for Node.js
- **ejs**: Template engine for dynamic HTML pages
- **ollama**: Official JavaScript client for Ollama
- **nodemon**: Auto-restart on code changes

### **3.5 Customize package.json**

Open `package.json` and replace the contents:

```json
{
  "name": "ollama-webinterface",
  "version": "2.1.0",
  "description": "Web interface for Ollama with chat functions",
  "main": "server.js",
  "type": "module",
  "window": {
    "title": "Ollama Chat Interface",
    "toolbar": true,
    "width": 1200,
    "height": 800,
    "icon": "icon.png",
    "position": "center"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "desktop": "nw ."
  },
  "keywords": [
    "ollama",
    "ai",
    "chat",
    "web-interface",
    "llm",
    "desktop"
  ],
  "author": "Imle, Martin",
  "license": "MIT",
  "dependencies": {
    "express": "^4.19.2",
    "ejs": "^3.1.10",
    "ollama": "^0.5.9"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## **4. Backend Development**

### **4.1 Server Configuration (server.js)**

Create the file `server.js` in the root directory:

```javascript
import ollama from 'ollama';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import os from 'os';

// ES Module Compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 8080;

// Global state variables
let modelResponse = "";
let isProcessing = false;
let errorMessage = "";
let availableModels = [];
let chatHistory = [];
let ollamaStatus = 'unknown';
let currentModel = '';

/**
 * Loads all available Ollama models at startup
 */
async function loadAvailableModels() {
    try {
        console.log('🔄 Loading available models...');
        const response = await ollama.list();

        if (response && response.models) {
            availableModels = response.models.map(model => model.name);
            ollamaStatus = 'connected';
            if (!currentModel && availableModels.length > 0) {
                currentModel = availableModels[0];
            }
            console.log('✅ Available models loaded:', availableModels);
        } else {
            availableModels = ['llama2'];
            ollamaStatus = 'no_models';
            if (!currentModel) {
                currentModel = 'llama2';
            }
            console.log('⚠️  No models found, use fallback');
        }
    } catch (error) {
        console.log('❌ Error loading models:', error.message);
        availableModels = ['llama2'];
        ollamaStatus = 'disconnected';
        if (!currentModel) {
            currentModel = 'llama2';
        }
    }
}

/**
 * Calls the LLM with a prompt
 */
async function invokeLLM(model, prompt) {
    console.log(`\n----- NEW REQUEST -----`);
    console.log(`Model: ${model}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    console.log(`-------------------------\n`);

    isProcessing = true;
    errorMessage = "";
    modelResponse = "";

    try {
        console.log(`🔄 Processing request...`);

        const response = await ollama.chat({
            model: model,
            messages: [{ role: 'user', content: prompt }],
        });

        console.log(`✅ Response received (${response.message.content.length} characters)`);
        
        // OUTPUT FULL RESPONSE IN CONSOLE
        console.log(`\n----- AI RESPONSE -----`);
        console.log(response.message.content);
        console.log(`----------------------\n`);
        
        modelResponse = response.message.content;

        // Add to history
        const historyItem = {
            model: model,
            prompt: prompt,
            response: response.message.content,
            timestamp: new Date().toISOString()
        };

        chatHistory.unshift(historyItem);

        // Keep only the last 10 entries
        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(0, 10);
        }

        isProcessing = false;

    } catch (error) {
        console.log(`❌ Request failed:`, error);
        errorMessage = `Error: ${error.message}`;
        isProcessing = false;
    }
}

/**
 * Helper function to determine the local IP
 */
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// EJS Template Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Routes

/**
 * Main Route - Shows the chat interface
 */
app.get('/', (req, res) => {
    const templateData = {
        models: availableModels || [],
        response: modelResponse || "",
        isProcessing: isProcessing || false,
        error: errorMessage || "",
        history: chatHistory || [],
        currentModel: currentModel || (availableModels.length > 0 ? availableModels[0] : '')
    };

    res.render('pages/index', templateData);
});

/**
 * Processes chat requests
 */
app.post('/query', async (req, res) => {
    const { prompt, model } = req.body;

    // Input Validation
    if (!prompt || !model) {
        errorMessage = 'Please enter a question and select a model.';
        return res.redirect('/');
    }

    if (prompt.length > 5000) {
        errorMessage = 'The question is too long (max. 5000 characters).';
        return res.redirect('/');
    }

    currentModel = model;

    await invokeLLM(model, prompt);
    res.redirect('/');
});

/**
 * Status page - Displays system information
 */
app.get('/status', (req, res) => {
    const templateData = {
        models: availableModels || [],
        history: chatHistory || [],
        isProcessing: isProcessing || false,
        ollamaStatus: ollamaStatus,
        currentModel: currentModel,
        systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: Math.floor(process.uptime()),
            memory: process.memoryUsage()
        }
    };

    res.render('pages/status', templateData);
});

/**
 * API Health Endpoint (for JSON)
 */
app.get('/api/health', async (req, res) => {
    try {
        const models = await ollama.list();
        const healthData = {
            status: 'healthy',
            ollama: 'connected',
            models: models.models?.length || 0,
            timestamp: new Date().toISOString(),
            currentModel: currentModel,
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                uptime: Math.floor(process.uptime()),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
                }
            },
            application: {
                chatHistory: chatHistory.length,
                isProcessing: isProcessing,
                availableModels: availableModels.length
            }
        };

        res.json(healthData);
    } catch (error) {
        const errorData = {
            status: 'error',
            ollama: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString(),
            application: {
                chatHistory: chatHistory.length,
                isProcessing: isProcessing,
                availableModels: availableModels.length,
                currentModel: currentModel
            }
        };

        res.status(500).json(errorData);
    }
});

/**
 * API endpoint for status checks (during processing)
 */
app.get('/api/status', (req, res) => {
    res.json({
        isProcessing: isProcessing,
        response: modelResponse,
        error: errorMessage,
        historyCount: chatHistory.length,
        currentModel: currentModel
    });
});

/**
 * Deletes chat history
 */
app.post('/clear-history', (req, res) => {
    chatHistory = [];
    modelResponse = "";
    errorMessage = "";
    res.redirect('/');
});

/**
 * Sets the current model
 */
app.post('/set-model', (req, res) => {
    const { model } = req.body;
    if (model && availableModels.includes(model)) {
        currentModel = model;
        console.log(`✅ Current model set to: ${model}`);
    }
    res.redirect('/');
});

/**
 * Test route for Ollama connection
 */
app.get('/api/test-ollama', async (req, res) => {
    try {
        const models = await ollama.list();
        res.json({
            success: true,
            message: 'Ollama is reachable',
            models: models.models?.length || 0,
            modelList: models.models?.map(m => m.name) || [],
            currentModel: currentModel
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ollama is unavailable',
            error: error.message
        });
    }
});

/**
 * Error handling for routes not found
 */
app.use((req, res) => {
    res.status(404).render('pages/error', {
        title: '404 - Page not found',
        message: `The requested page "${req.url}" does not exist.`,
        suggestion: 'Check the URL or return to the homepage.'
    });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).render('pages/error', {
        title: '500 - Server Error',
        message: 'An unexpected error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const server = createServer(app);

server.listen(PORT, async () => {
    console.log(`\n🚀 Ollama Web Interface started!`);
    console.log(`📍 Local:  http://localhost:${PORT}`);
    console.log(`🌐 Network: http://${getLocalIP()}:${PORT}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString('en-US')}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 Default Model: ${currentModel || 'Setting...'}`);
    console.log(`----------------------------------------`);

    // Test Ollama connection and load models
    try {
        await loadAvailableModels();
        console.log(`✅ System initialized - Current model: ${currentModel}`);
    } catch (error) {
        console.log('❌ Error during initialization:', error.message);
    }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;
```

### **4.2 Error Template**

Create `views/pages/error.ejs` for error pages:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <%- include('../partials/head'); %>
    <title><%= title %></title>
</head>
<body class="container">
    <header>
        <%- include('../partials/header'); %>
    </header>

    <main class="my-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card shadow">
                    <div class="card-header bg-danger text-white">
                        <h3 class="card-title mb-0">
                            <i class="bi bi-exclamation-triangle"></i> <%= title %>
                        </h3>
                    </div>
                    <div class="card-body text-center py-5">
                        <i class="bi bi-emoji-frown display-1 text-muted"></i>
                        <h4 class="mt-3">Oops! Something went wrong</h4>
                        <p class="text-muted"><%= message %></p>
                        <% if (suggestion) { %>
                            <p class="text-muted"><small><%= suggestion %></small></p>
                        <% } %>
                        <a href="/" class="btn btn-primary mt-3">
                            <i class="bi bi-house"></i> Back to homepage
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer>
        <%- include('../partials/footer'); %>
    </footer>
</body>
</html>
```

---

## **5. Frontend Development**

### **5.1 HTML Head Template**

Create `views/partials/head.ejs`:

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ollama Chat Interface</title>

<!-- Bootstrap 5 CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Bootstrap Icons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">

<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- Custom Styles -->
<style>
    :root {
        --primary-color: #0d6efd;
        --success-color: #198754;
        --warning-color: #ffc107;
        --danger-color: #dc3545;
    }
    
    body {
        background-color: #f8f9fa;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    
    .card {
        border: none;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        transition: box-shadow 0.15s ease-in-out;
    }
    
    .card:hover {
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }
    
    .response-content {
        white-space: pre-wrap;
        line-height: 1.6;
        font-size: 1rem;
    }
    
    .history-item {
        border-left: 3px solid var(--primary-color);
        transition: all 0.2s ease;
    }
    
    .history-item:hover {
        border-left-color: var(--success-color);
        background-color: #f8f9fa;
    }
    
    /* Auto-resize textarea */
    .auto-resize {
        resize: none;
        overflow: hidden;
        min-height: 120px;
    }
    
    /* Loading animation */
    .spinner-border-sm {
        width: 1rem;
        height: 1rem;
    }
    
    /* Mobile optimizations */
    @media (max-width: 768px) {
        .container {
            padding-left: 10px;
            padding-right: 10px;
        }
        
        .card-body {
            padding: 1rem;
        }
        
        .btn-lg {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
        }
    }
    
    /* Custom scrollbar for history */
    .history-container {
        scrollbar-width: thin;
        scrollbar-color: #c1c1c1 #f1f1f1;
    }
    
    .history-container::-webkit-scrollbar {
        width: 6px;
    }
    
    .history-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    
    .history-container::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }
    
    .history-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
</style>
```

### **5.2 Header Template**

Create `views/partials/header.ejs`:

```html
<nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container">
        <a class="navbar-brand d-flex align-items-center" href="/">
            <i class="bi bi-robot me-2"></i>
            <span class="fw-bold">Ollama Chat</span>
            <span class="badge bg-primary ms-2">v2.1</span>
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link active" href="/">
                        <i class="bi bi-house me-1"></i> Home
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/status">
                        <i class="bi bi-heart-pulse me-1"></i> Status
                    </a>
                </li>
            </ul>
            
            <div class="navbar-text">
                <small class="text-light">
                    <i class="bi bi-cpu me-1"></i>
                    <span id="model-count"><%= models.length %></span> Models available
                </small>
            </div>
        </div>
    </div>
</nav>
```

### **5.3 Footer Template**

Create `views/partials/footer.ejs`:

```html
<footer class="bg-dark text-white mt-5">
    <div class="container py-4">
        <div class="row">
            <div class="col-md-6">
                <h5 class="d-flex align-items-center">
                    <i class="bi bi-robot me-2"></i> Ollama Chat Interface
                </h5>
                <p class="mb-0 text-light">
                    A user-friendly web interface for local LLMs with Ollama.
                </p>
            </div>
            <div class="col-md-6 text-md-end">
                <p class="mb-1">
                    <i class="bi bi-code-slash"></i> 
                    Powered by Ollama, Express.js, EJS & Bootstrap 5
                </p>
                <small class="text-muted">
                    Version 2.1 &copy; 2025 - 
                    <span id="current-year"><%= new Date().getFullYear() %></span>
                </small>
            </div>
        </div>
    </div>
</footer>
```

### **5.4 Main Page (index.ejs)**

Create `views/pages/index.ejs`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <%- include('../partials/head'); %>
</head>
<body class="container">
    <header>
        <%- include('../partials/header'); %>
    </header>

    <main>
        <script>
            $(document).ready(function() {
                // Initialize model display
                updateModelDisplay();
                
                // Model selection change handler
                $('#model').on('change', function() {
                    const selectedModel = $(this).val();
                    updateModelDisplay(selectedModel);
                });
                
                // Auto-resize textarea
                $('textarea').on('input', function() {
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';
                });
                
                // Submit form with Ctrl+Enter
                $('#prompt').on('keydown', function(e) {
                    if (e.ctrlKey && e.key === 'Enter') {
                        $(this).closest('form').submit();
                    }
                });
                
                // Character counter
                $('#prompt').on('input', function() {
                    const length = $(this).val().length;
                    $('#char-count').text(length + '/5000 characters');
                    if (length > 4500) {
                        $('#char-count').addClass('text-danger');
                    } else {
                        $('#char-count').removeClass('text-danger');
                    }
                });
                
                // Auto-refresh while processing
                <% if (isProcessing) { %>
                let refreshCount = 0;
                const maxRefreshAttempts = 120;
                
                function checkStatus() {
                    refreshCount++;
                    if (refreshCount >= maxRefreshAttempts) {
                        console.log('Max refresh attempts reached');
                        showError('Timeout: Processing is taking too long.');
                        return;
                    }
                    
                    $.get('/api/status', function(data) {
                        if (!data.isProcessing) {
                            location.reload();
                        } else {
                            updateProcessingStatus(refreshCount, maxRefreshAttempts);
                            setTimeout(checkStatus, 2000);
                        }
                    }).fail(function() {
                        setTimeout(checkStatus, 2000);
                    });
                }
                
                function updateProcessingStatus(current, max) {
                    const minutes = Math.floor((current * 2) / 60);
                    const seconds = (current * 2) % 60;
                    const statusText = `Waiting for response... (${minutes}:${seconds.toString().padStart(2, '0')})`;
                    $('.alert-warning strong').text(statusText);
                }
                
                function showError(message) {
                    $('.alert-warning')
                        .removeClass('alert-warning')
                        .addClass('alert-danger')
                        .html('<i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Error:</strong> ' + message);
                }
                
                setTimeout(checkStatus, 2000);
                <% } %>
                
                // Focus on prompt field
                $('#prompt').focus();
            });
            
            function updateModelDisplay(selectedModel = null) {
                const model = selectedModel || $('#model').val();
                if (model) {
                    $('#selected-model-info').html('Current: <strong>' + model + '</strong>');
                } else {
                    $('#selected-model-info').html('No model selected');
                }
            }
        </script>

        <div class="row">
            <div class="col-lg-8 col-md-12">
                <!-- Chat Interface Card -->
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0 d-flex align-items-center">
                            <i class="bi bi-robot me-2"></i> Chat Interface
                            <span class="badge bg-light text-primary ms-2">Beta</span>
                        </h4>
                    </div>
                    <div class="card-body">
                        <form action="/query" method="POST" id="chat-form">
                            <!-- Model Selection -->
                            <div class="mb-4">
                                <label for="model" class="form-label fw-semibold">
                                    <i class="bi bi-cpu me-1"></i> Select AI Model:
                                </label>
                                <select class="form-select form-select-lg" id="model" name="model" required>
                                    <option value="">-- Please select model --</option>
                                    <% models.forEach(function(model) { %>
                                        <option value="<%= model %>" <%= model === currentModel ? 'selected' : '' %>>
                                            <%= model %>
                                        </option>
                                    <% }); %>
                                </select>
                                <div class="form-text d-flex justify-content-between">
                                    <span>
                                        <i class="bi bi-info-circle me-1"></i>
                                        <%= models.length %> Model(s) available
                                    </span>
                                    <span id="selected-model-info" class="text-muted">
                                        <% if (currentModel) { %>Current: <%= currentModel %><% } %>
                                    </span>
                                </div>
                            </div>

                            <!-- Prompt Input -->
                            <div class="mb-4">
                                <label for="prompt" class="form-label fw-semibold">
                                    <i class="bi bi-pencil-square me-1"></i> Your message:
                                </label>
                                <textarea
                                    class="form-control form-control-lg auto-resize"
                                    id="prompt"
                                    name="prompt"
                                    rows="4"
                                    placeholder="Ask a question or describe your concern..."
                                    required
                                    maxlength="5000"
                                ></textarea>
                                <div class="form-text d-flex justify-content-between mt-1">
                                    <span>
                                        <i class="bi bi-keyboard me-1"></i>
                                        Ctrl+Enter to send
                                    </span>
                                    <span id="char-count">0/5000 characters</span>
                                </div>
                            </div>

                            <!-- Submit Buttons -->
                            <div class="d-grid gap-2 d-md-flex">
                                <button type="submit"
                                        class="btn btn-primary btn-lg flex-fill"
                                        <%= isProcessing ? 'disabled' : '' %>>
                                    <i class="bi bi-send-fill me-2"></i>
                                    <%= isProcessing ? 'Processing...' : 'Submit' %>
                                </button>
                                <button type="button"
                                        class="btn btn-outline-secondary btn-lg"
                                        onclick="location.reload()"
                                        title="Refresh page">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Processing Alert -->
                <% if (isProcessing) { %>
                <div class="alert alert-warning alert-dismissible fade show" role="alert">
                    <div class="d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm me-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <div class="flex-fill">
                            <strong class="d-block">
                                <i class="bi bi-hourglass-split me-1"></i> AI generating response...
                            </strong>
                            <small class="d-block text-muted">
                                Model used: <strong><%= currentModel %></strong> •
                                This may take a few seconds.
                            </small>
                        </div>
                    </div>
                </div>
                <% } %>

                <!-- Error Alert -->
                <% if (error) { %>
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
                        <div class="flex-fill">
                            <h5 class="alert-heading mb-1">Error during processing</h5>
                            <p class="mb-0"><%= error %></p>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                </div>
                <% } %>

                <!-- Response Display -->
                <% if (response && !isProcessing) { %>
                <div class="card border-success shadow-sm mb-4">
                    <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-check-circle-fill me-2"></i> Last Answer
                        </h5>
                        <small class="opacity-75">
                            <i class="bi bi-clock me-1"></i>
                            <%= new Date().toLocaleTimeString('en-US') %>
                        </small>
                    </div>
                    <div class="card-body">
                        <div class="response-content"><%= response %></div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <small class="text-muted">
                            <i class="bi bi-info-circle me-1"></i>
                            Generated with <strong><%= currentModel %></strong> •
                            <%= response.length %> characters •
                            <a href="#" onclick="document.getElementById('prompt').focus(); return false;" class="text-decoration-none">
                                <i class="bi bi-arrow-return-left"></i> Ask another question
                            </a>
                        </small>
                    </div>
                </div>
                <% } %>
            </div>

            <!-- Sidebar: History & System Info -->
            <div class="col-lg-4 col-md-12">
                <!-- Chat History Card -->
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-clock-history me-2"></i> Chat History
                        </h5>
                        <% if (history.length > 0) { %>
                        <form action="/clear-history" method="POST" class="m-0">
                            <button type="submit"
                                    class="btn btn-sm btn-outline-light"
                                    title="Delete history"
                                    onclick="return confirm('Do you really want to delete all history?')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </form>
                        <% } %>
                    </div>

                    <div class="card-body p-0">
                        <div class="history-container" style="max-height: 600px; overflow-y: auto;">
                            <% if (history.length === 0) { %>
                            <div class="text-center py-5 text-muted">
                                <i class="bi bi-chat-left-dots display-4 d-block mb-3"></i>
                                <p class="mb-0">No conversations yet</p>
                                <small>Ask your first question!</small>
                            </div>
                            <% } else { %>
                            <div class="list-group list-group-flush">
                                <% history.forEach(function(item, index) { %>
                                <div class="list-group-item history-item px-3 py-3">
                                    <div class="d-flex w-100 justify-content-between align-items-start mb-2">
                                        <span class="badge bg-primary rounded-pill"><%= item.model %></span>
                                        <small class="text-muted">
                                            <%= new Date(item.timestamp).toLocaleTimeString('en-US') %>
                                        </small>
                                    </div>
                                    <p class="mb-2 small text-muted">
                                        <strong>Question:</strong>
                                        <%= item.prompt.length > 80 ? item.prompt.substring(0, 80) + '...' : item.prompt %>
                                    </p>
                                    <details>
                                        <summary class="text-primary small" style="cursor: pointer; list-style: none;">
                                            <i class="bi bi-chevron-down me-1"></i>
                                            <span>Show answer</span>
                                            <small class="text-muted ms-1">
                                                (<%= Math.ceil(item.response.length / 100) %> sec reading time)
                                            </small>
                                        </summary>
                                        <div class="mt-2 p-2 bg-light rounded small"><%= item.response %></div>
                                    </details>
                                </div>
                                <% }); %>
                            </div>
                            <% } %>
                        </div>
                    </div>

                    <% if (history.length > 0) { %>
                    <div class="card-footer bg-transparent">
                        <small class="text-muted">
                            <i class="bi bi-info-circle me-1"></i>
                            <%= history.length %> of 10 entries saved
                        </small>
                    </div>
                    <% } %>
                </div>

                <!-- System Information Card -->
                <div class="card shadow-sm">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0">
                            <i class="bi bi-info-circle me-2"></i> System Information
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row small">
                            <div class="col-6"><strong>Models:</strong></div>
                            <div class="col-6 text-end">
                                <span class="badge bg-primary"><%= models.length %></span>
                            </div>
                            <div class="col-6"><strong>Current Model:</strong></div>
                            <div class="col-6 text-end">
                                <span class="badge bg-success"><%= currentModel || 'None' %></span>
                            </div>
                            <div class="col-6"><strong>History:</strong></div>
                            <div class="col-6 text-end">
                                <span class="badge bg-secondary"><%= history.length %></span>
                            </div>
                            <div class="col-6"><strong>Status:</strong></div>
                            <div class="col-6 text-end">
                                <span class="badge bg-success">Online</span>
                            </div>
                        </div>
                        <hr class="my-2">
                        <div class="text-center">
                            <a href="/status" class="btn btn-outline-info btn-sm">
                                <i class="bi bi-heart-pulse me-1"></i> Detailed Status
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer>
        <%- include('../partials/footer'); %>
    </footer>

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

### **5.5 Status Page**

Create `views/pages/status.ejs`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <%- include('../partials/head'); %>
    <title>System Status - Ollama Chat</title>
    <style>
        .status-card {
            transition: transform 0.2s ease;
        }
        .status-card:hover {
            transform: translateY(-2px);
        }
        .health-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }
        .health-good { background-color: #28a745; }
        .health-warning { background-color: #ffc107; }
        .health-error { background-color: #dc3545; }
    </style>
</head>
<body class="container">
    <header>
        <%- include('../partials/header'); %>
    </header>

    <main class="my-4">
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h1 class="h3 mb-0">
                        <i class="bi bi-heart-pulse text-primary"></i> System Status
                    </h1>
                    <button class="btn btn-outline-primary btn-sm" onclick="refreshStatus()">
                        <i class="bi bi-arrow-clockwise"></i> Refresh
                    </button>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <!-- Ollama Status -->
            <div class="col-md-6">
                <div class="card status-card border-0 shadow-sm">
                    <div class="card-header bg-primary text-white">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-robot"></i> Ollama Status
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <span class="health-indicator <%= ollamaStatus === 'connected' ? 'health-good' : 'health-error' %>"></span>
                            <strong class="me-2">Connection:</strong>
                            <span class="badge bg-<%= ollamaStatus === 'connected' ? 'success' : 'danger' %>">
                                <%= ollamaStatus === 'connected' ? 'Connected' : 'Disconnected' %>
                            </span>
                        </div>
                        <div class="mb-3">
                            <strong>Installed Models:</strong>
                            <span class="badge bg-secondary ms-2"><%= models.length %></span>
                        </div>
                        <div class="mb-3">
                            <strong>Current Model:</strong>
                            <span class="badge bg-info ms-2"><%= currentModel || 'None' %></span>
                        </div>
                        <div class="mb-3">
                            <strong>Available Models:</strong>
                            <div class="mt-2">
                                <% if (models.length > 0) { %>
                                    <% models.forEach(function(model) { %>
                                        <span class="badge bg-light text-dark border me-1 mb-1"><%= model %></span>
                                    <% }); %>
                                <% } else { %>
                                    <span class="text-muted">No models found</span>
                                <% } %>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Information -->
            <div class="col-md-6">
                <div class="card status-card border-0 shadow-sm">
                    <div class="card-header bg-info text-white">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-cpu"></i> System Information
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>Node.js Version:</strong>
                            <span class="badge bg-secondary ms-2"><%= systemInfo.nodeVersion %></span>
                        </div>
                        <div class="mb-3">
                            <strong>Platform:</strong>
                            <span class="badge bg-secondary ms-2"><%= systemInfo.platform %></span>
                        </div>
                        <div class="mb-3">
                            <strong>Uptime:</strong>
                            <span class="text-muted ms-2">
                                <%= Math.floor(systemInfo.uptime / 60) %> minutes
                            </span>
                        </div>
                        <div class="mb-3">
                            <strong>Memory Usage:</strong>
                            <div class="mt-1">
                                <small class="text-muted">
                                    Heap Used: <%= Math.round(systemInfo.memory.heapUsed / 1024 / 1024) %> MB /
                                    Total: <%= Math.round(systemInfo.memory.heapTotal / 1024 / 1024) %> MB
                                </small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <strong>Chat History:</strong>
                            <span class="badge bg-secondary ms-2"><%= history.length %> / 10</span>
                        </div>
                        <div class="mb-3">
                            <strong>Current Processing:</strong>
                            <span class="badge <%= isProcessing ? 'bg-warning' : 'bg-success' %> ms-2">
                                <%= isProcessing ? 'Active' : 'Inactive' %>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- API Health Check -->
            <div class="col-12">
                <div class="card status-card border-0 shadow-sm">
                    <div class="card-header bg-secondary text-white">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-plug"></i> API Health Check
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <button class="btn btn-outline-primary me-2" onclick="testAPI()">
                                <i class="bi bi-play-circle"></i> Run API Test
                            </button>
                            <button class="btn btn-outline-success" onclick="viewRawJSON()">
                                <i class="bi bi-code-slash"></i> Show Raw Data
                            </button>
                        </div>
                        <div id="api-result" class="mt-3" style="display: none;">
                            <pre class="bg-light p-3 rounded border"><code id="api-result-content">Waiting for result...</code></pre>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="col-12">
                <div class="card status-card border-0 shadow-sm">
                    <div class="card-header bg-warning text-dark">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-lightning"></i> Quick Actions
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex gap-2 flex-wrap">
                            <a href="/" class="btn btn-outline-primary">
                                <i class="bi bi-arrow-left"></i> Back to Chat
                            </a>
                            <form action="/clear-history" method="POST" class="d-inline">
                                <button type="submit" class="btn btn-outline-danger" 
                                        onclick="return confirm('Do you really want to delete all history?')">
                                    <i class="bi bi-trash"></i> Clear History
                                </button>
                            </form>
                            <button class="btn btn-outline-info" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer>
        <%- include('../partials/footer'); %>
    </footer>

    <script>
        function refreshStatus() {
            location.reload();
        }

        function testAPI() {
            const resultElement = document.getElementById('api-result-content');
            const apiResult = document.getElementById('api-result');
            
            resultElement.textContent = 'Testing API...';
            apiResult.style.display = 'block';
            
            fetch('/api/health')
                .then(response => response.json())
                .then(data => {
                    resultElement.textContent = JSON.stringify(data, null, 2);
                })
                .catch(error => {
                    resultElement.textContent = 'Error: ' + error.message;
                });
        }

        function viewRawJSON() {
            testAPI(); // Same implementation
        }

        // Update server time every second
        function updateServerTime() {
            const now = new Date();
            const timeElement = document.getElementById('server-time');
            if (timeElement) {
                timeElement.textContent = now.toLocaleString('en-US');
            }
        }
        setInterval(updateServerTime, 1000);
    </script>
</body>
</html>
```

---

## **6. Testing & Deployment**

### **6.1 Start Ollama Service**

**Terminal 1 - Ollama Service:**

```bash
# Make sure Ollama is running
ollama serve
```

**Expected output:**
```text
time=2025-01-20T10:00:00.000Z level=INFO source=images.go:697 msg="total blobs: 10"
time=2025-01-20T10:00:00.100Z level=INFO source=routes.go:1043 msg="Listening on [::]:11434"
```

### **6.2 Start the Web Server**

**Terminal 2 - Web Interface:**

```bash
# Development with auto-reload
npm run dev

# Or production
npm start
```

**Success message:**
```text
🚀 Ollama Web Interface started!
📍 Local:  http://localhost:8080
🌐 Network: http://192.168.1.100:8080
⏰ Started at: 20.01.2025, 10:00:00
----------------------------------------
🔄 Loading available models...
✅ Available models loaded: ['llama2', 'gemma:2b', 'mistral']
✅ System initialized - Current model: llama2
```

### **6.3 Browser Test**

Open your browser and navigate to: **http://localhost:8080**

### **6.4 Health Check**

Test system status: **http://localhost:8080/api/health**

**Expected response:**
```json
{
  "status": "healthy",
  "ollama": "connected",
  "models": 3,
  "timestamp": "2025-01-20T10:00:00.000Z",
  "currentModel": "llama2",
  "system": {
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "uptime": 120,
    "memory": {
      "used": 45,
      "total": 128
    }
  }
}
```

### **6.5 Deployment Options**

#### **Option 1: PM2 (Production)**

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start server.js --name "ollama-web"

# Set up autostart
pm2 startup
pm2 save

# Monitor
pm2 monit

# Logs
pm2 logs ollama-web
```

#### **Option 2: Docker**

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 8080
USER node

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  ollama-web:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - OLLAMA_HOST=http://host.docker.internal:11434
      - NODE_ENV=production
    restart: unless-stopped
```

**Build and run:**
```bash
docker-compose up -d
```

#### **Option 3: Environment Variables**

Create `.env` file:

```env
PORT=8080
OLLAMA_HOST=http://localhost:11434
NODE_ENV=production
MAX_CHAT_HISTORY=10
REQUEST_TIMEOUT=300000
```

Install dotenv:
```bash
npm install dotenv
```

Add to `server.js` (top):
```javascript
import dotenv from 'dotenv';
dotenv.config();
```

---

## **7. Extensions**

### **7.1 Streaming Responses (Real-Time)**

Add to `server.js`:

```javascript
app.post('/stream-query', async (req, res) => {
    const { prompt, model } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
        const response = await ollama.chat({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            stream: true
        });
        
        for await (const part of response) {
            res.write(`data: ${JSON.stringify(part.message)}\n\n`);
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});
```

### **7.2 Multiple Chat Sessions**

Extended history function:

```javascript
let chatSessions = {};

app.post('/new-session', (req, res) => {
    const sessionId = Date.now().toString();
    chatSessions[sessionId] = {
        history: [],
        createdAt: new Date(),
        title: 'New Conversation',
        model: currentModel
    };
    res.json({ sessionId });
});

app.get('/sessions', (req, res) => {
    const sessions = Object.entries(chatSessions).map(([id, data]) => ({
        id,
        title: data.title,
        messageCount: data.history.length,
        createdAt: data.createdAt
    }));
    res.json({ sessions });
});
```

### **7.3 Markdown Support**

**Installation:**
```bash
npm install marked
```

**Integration in server.js:**
```javascript
import { marked } from 'marked';

// Configure marked
marked.setOptions({
    breaks: true,
    gfm: true
});

// In the invokeLLM function
modelResponse = marked.parse(response.message.content);
```

### **7.4 Export Conversations**

Add to `server.js`:

```javascript
app.get('/export/:format', (req, res) => {
    const format = req.params.format; // 'json' or 'txt'
    
    if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="chat-history.json"');
        res.send(JSON.stringify(chatHistory, null, 2));
    } else if (format === 'txt') {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="chat-history.txt"');
        
        let content = 'OLLAMA CHAT HISTORY\n';
        content += '='.repeat(50) + '\n\n';
        
        chatHistory.forEach((item, index) => {
            content += `Conversation ${index + 1}\n`;
            content += `Model: ${item.model}\n`;
            content += `Time: ${new Date(item.timestamp).toLocaleString()}\n`;
            content += `Question: ${item.prompt}\n`;
            content += `Answer: ${item.response}\n`;
            content += '-'.repeat(50) + '\n\n';
        });
        
        res.send(content);
    }
});
```

---

## **8. Troubleshooting**

### **❌ Common Problems & Solutions**

| **Problem** | **Solution** |
|-------------|--------------|
| **"Cannot find module 'ollama'"** | `npm install ollama` |
| **"Connection refused"** | Run `ollama serve` in separate terminal |
| **No models available** | `ollama pull llama2` |
| **Port 8080 occupied** | Change `PORT` in server.js or use env variable |
| **Page does not load** | Check firewall settings, disable VPN |
| **Model very slow** | Use smaller models (`gemma:2b`) |
| **"SyntaxError: Cannot use import statement"** | Add `"type": "module"` to package.json |
| **ERR_MODULE_NOT_FOUND** | Run `npm install` again |

### **🔍 Debugging Commands**

```bash
# Check Ollama status
ollama list
ollama ps

# Check if Ollama is running
curl http://localhost:11434/api/tags

# Node.js processes
netstat -tulpn | grep :8080
lsof -i :8080

# Check dependencies
npm list
npm audit

# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check logs
tail -f ~/.ollama/logs/server.log
```

### **📊 Performance Optimization**

**For slow systems:**

```bash
# Use smaller models
ollama pull gemma:2b          # 1.6 GB
ollama pull llama2:7b          # 3.8 GB

# Check GPU support
ollama serve --help | grep gpu

# Monitor resource usage
htop
nvidia-smi  # For NVIDIA GPUs
```

**Optimize Node.js:**

```bash
# Increase memory limit
node --max-old-space-size=4096 server.js

# Enable production mode
NODE_ENV=production npm start
```

### **🔒 Security Best Practices**

**1. Add Rate Limiting:**

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

app.use('/query', limiter);
```

**2. Add Helmet for Security Headers:**

```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

**3. Enable CORS (if needed):**

```bash
npm install cors
```

```javascript
import cors from 'cors';
app.use(cors({ origin: 'http://localhost:8080' }));
```

### **Support Resources:**

- [Ollama Documentation](https://ollama.ai/docs)
- [Express.js Guide](https://expressjs.com/)
- [Bootstrap Docs](https://getbootstrap.com/)
- [EJS Documentation](https://ejs.co/)
- [Node.js Docs](https://nodejs.org/docs)
- [Community Forum](https://github.com/ollama/ollama/discussions)

---

## **📋 Quick Reference**

### **Essential Commands**

```bash
# Start Ollama
ollama serve

# Pull a model
ollama pull llama2

# List models
ollama list

# Start web interface (development)
npm run dev

# Start web interface (production)
npm start

# Check health
curl http://localhost:8080/api/health
```

### **Project Structure Checklist**

```
✅ package.json (with "type": "module")
✅ server.js
✅ views/
   ✅ pages/
      ✅ index.ejs
      ✅ status.ejs
      ✅ error.ejs
   ✅ partials/
      ✅ head.ejs
      ✅ header.ejs
      ✅ footer.ejs
✅ public/
   ✅ css/ (optional)
   ✅ js/ (optional)
```

---

## **🎯 Summary of Corrections**

| **File** | **Issue** | **Fix** |
|----------|-----------|---------|
| `package.json` | Missing ES module declaration | Added `"type": "module"` |
| `package.json` | Outdated dependencies | Updated to latest versions |
| `server.js` | Typo: `promptly` instead of `prompt` | Fixed variable name |
| `server.js` | PORT inconsistency | Standardized to 8080 |
| `index.ejs` | Duplicate JavaScript code | Removed duplicates |
| `status.ejs` | Unused systemInfo variable | Now properly displayed |

---

**✅ Tutorial Version 2.1

**MIT License**

**Author:** Martin Imle  
**Support:** m.imle@gmx.net (PayPal)
