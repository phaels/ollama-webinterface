import ollama from 'ollama';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import os from 'os';

// ES Module Kompatibilität
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express App initialisieren
const app = express();
const PORT = process.env.PORT || 8080;  // GEÄNDERT: Port 3000 → 8080

// Globale Zustandsvariablen
let modelResponse = "";
let isProcessing = false;
let errorMessage = "";
let availableModels = [];
let chatHistory = [];
let ollamaStatus = 'unknown';
let currentModel = ''; // NEU: Aktuelles Model speichern

/**
 * Lädt alle verfügbaren Ollama-Models beim Start
 */
async function loadAvailableModels() {
    try {
        console.log('🔄 Lade verfügbare Models...');
        const response = await ollama.list();

        if (response && response.models) {
            availableModels = response.models.map(model => model.name);
            ollamaStatus = 'connected';
            // Setze Standard-Model, falls noch keins ausgewählt
            if (!currentModel && availableModels.length > 0) {
                currentModel = availableModels[0];
            }
            console.log('✅ Verfügbare Models geladen:', availableModels);
        } else {
            availableModels = ['llama2'];
            ollamaStatus = 'no_models';
            if (!currentModel) {
                currentModel = 'llama2';
            }
            console.log('⚠️  Keine Models gefunden, verwende Fallback');
        }
    } catch (error) {
        console.log('❌ Fehler beim Laden der Models:', error.message);
        availableModels = ['llama2'];
        ollamaStatus = 'disconnected';
        if (!currentModel) {
            currentModel = 'llama2';
        }
    }
}

/**
 * Ruft das LLM mit einem Prompt auf
 */
async function invokeLLM(model, prompt) {
    console.log(`\n----- NEUE ANFRAGE -----`);
    console.log(`Model: ${model}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    console.log(`-------------------------\n`);

    isProcessing = true;
    errorMessage = "";
    modelResponse = "";

    try {
        console.log(`🔄 Verarbeite Anfrage...`);

        const response = await ollama.chat({
            model: model,
            messages: [{ role: 'user', content: prompt }],
        });

        console.log(`✅ Antwort erhalten (${response.message.content.length} Zeichen)`);

        // VOLLSTÄNDIGE ANTWORT IN DER CONSOLE AUSGEBEN
        console.log(`\n----- KI ANTWORT -----`);
        console.log(response.message.content);
        console.log(`----------------------\n`);

        modelResponse = response.message.content;

        // Zur Historie hinzufügen
        const historyItem = {
            model: model,
            prompt: prompt,
            response: response.message.content,
            timestamp: new Date().toISOString()
        };

        chatHistory.unshift(historyItem);

        // Nur die letzten 10 Einträge behalten
        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(0, 10);
        }

        isProcessing = false;

    } catch (error) {
        console.log(`❌ Anfrage fehlgeschlagen:`, error);
        errorMessage = `Fehler: ${error.message}`;
        isProcessing = false;
    }
}

/**
 * Hilfsfunktion zur Ermittlung der lokalen IP
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
 * Hauptroute - Zeigt die Chat-Oberfläche
 */
app.get('/', (req, res) => {
    // Sicherstellen, dass alle Variablen definiert sind
    const templateData = {
        models: availableModels || [],
        response: modelResponse || "",
        isProcessing: isProcessing || false,
        error: errorMessage || "",
        history: chatHistory || [],
        currentModel: currentModel || (availableModels.length > 0 ? availableModels[0] : '') // WICHTIG: currentModel übergeben
    };

    res.render('pages/index', templateData);
});

/**
 * Verarbeitet Chat-Anfragen
 */
app.post('/query', async (req, res) => {
    const { prompt, model } = req.body;

    // Input Validation
    if (!prompt || !model) {
        errorMessage = 'Bitte geben Sie eine Frage ein und wählen Sie ein Model aus.';
        return res.redirect('/');
    }

    if (prompt.length > 5000) {
        errorMessage = 'Die Frage ist zu lang (max. 5000 Zeichen).';
        return res.redirect('/');
    }

    // NEU: Aktuelles Model speichern
    currentModel = model;

    await invokeLLM(model, prompt);
    res.redirect('/');
});

/**
 * Status-Seite - Zeigt Systeminformationen
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
 * API Health Endpoint (für JSON)
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
 * API Endpoint für Status-Checks (während der Verarbeitung)
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
 * Löscht den Chat-Verlauf
 */
app.post('/clear-history', (req, res) => {
    chatHistory = [];
    modelResponse = "";
    errorMessage = "";
    res.redirect('/');
});

/**
 * Setzt das aktuelle Model
 */
app.post('/set-model', (req, res) => {
    const { model } = req.body;
    if (model && availableModels.includes(model)) {
        currentModel = model;
        console.log(`✅ Aktuelles Model gesetzt auf: ${model}`);
    }
    res.redirect('/');
});

/**
 * Test-Route für Ollama-Verbindung
 */
app.get('/api/test-ollama', async (req, res) => {
    try {
        const models = await ollama.list();
        res.json({
            success: true,
            message: 'Ollama ist erreichbar',
            models: models.models?.length || 0,
            modelList: models.models?.map(m => m.name) || [],
                 currentModel: currentModel
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ollama ist nicht erreichbar',
            error: error.message
        });
    }
});

/**
 * Fehlerbehandlung für nicht gefundene Routes
 */
app.use((req, res) => {
    res.status(404).render('pages/error', {
        title: '404 - Seite nicht gefunden',
        message: `Die angeforderte Seite "${req.url}" existiert nicht.`,
        suggestion: 'Überprüfen Sie die URL oder kehren Sie zur Startseite zurück.'
    });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).render('pages/error', {
        title: '500 - Server Fehler',
        message: 'Ein unerwarteter Fehler ist aufgetreten.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Server starten
const server = createServer(app);

server.listen(PORT, async () => {
    console.log(`\n🚀 Ollama Web Interface gestartet!`);
    console.log(`📍 Local:  http://localhost:${PORT}`);
    console.log(`🌐 Network: http://${getLocalIP()}:${PORT}`);
    console.log(`⏰ Gestartet um: ${new Date().toLocaleString('de-DE')}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 Standard-Model: ${currentModel || 'Wird gesetzt...'}`);
    console.log(`----------------------------------------`);

    // Ollama-Verbindung testen und Models laden
    try {
        await loadAvailableModels();
        console.log(`✅ System initialisiert - Aktuelles Model: ${currentModel}`);
    } catch (error) {
        console.log('❌ Fehler bei der Initialisierung:', error.message);
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
