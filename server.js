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
            prompt: prompt,  // ✅ FIXED: was "promptly" before
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
