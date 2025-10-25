### **What is this project?**
This tutorial will guide you step-by-step through creating a **web-based chat interface** for Ollama. Instead of using the command line, you can interact with your local LLMs (Large Language Models) via a modern web browser.
technology: Node.js + Express.js, EJS (Embedded JavaScript), Bootstrap 5 + jQuery, Bootstrap Icons, Ollama (local)
| :- | :- |
|**backend**|Node.js + Express.js|
|**Template Engine**||
|**Frontend**|Bootstrap 5 + jQuery|
|**Icons**|Bootstrap Icons|
|**AI Engine**|Ollama (local)|

# **Ollama Web Interface - Complete Tutorial**
## **📋 Table of Contents**
1. introduction
1. Requirements
1. Project setup
1. Backend development
1. Frontend development
1. Testing & Deployment
1. Extensions
1. Troubleshooting
## **1. Introduction**

Support my open source work on PayPal: m.imle@gmx.net
### **Key Features**
- ` `**Model selection** from all installed Ollama models
- ` `**Real-time chat** with local LLMs
- ` `**History of** the last 10 conversations
- ` `**Responsive design** with Bootstrap 5
- ` `**Auto-refresh** during processing
- ` `**Error handling** and status display
### **Technology stack 🛠️**

## **2. Requirements**
### **2.1 Ollama Installation**
**Windows:**

1. Visit [https://ollama.ai](https://ollama.ai/ "https://ollama.ai/")
1. Download OllamaSetup.exe​
1. Complete the installation
1. Open PowerShell and test:

PowerShell

ollama -- version

**macOS:**

bash

*# Installation via Homebrew*

brew install ollama

*# Or download from website*

**Linux:**

bash

*# Installation Script*

curl -fsSL https://ollama.ai/install.sh | sh
### **2.2 Download models**
Download at least one model (in the terminal):

bash

*# Popular models (choose one):*

ollama pull llama2:7b *# 3.8 GB - Good for beginners*

ollama pull gemma:2b *# 1.6 GB - Very fast*

ollama pull mistral:7b *# 4.4 GB - Very good quality*

ollama pull codellama:7b *# 3.8 GB - For Programming*

*# Check installed models:*

ollama list
### **2.3 Node.js Installation**
1. Visit [https://nodejs.org](https://nodejs.org/ "https://nodejs.org/")
1. Download the **LTS version** (recommended: 18.x or higher)
1. Install Node.js
1. Check the installation:

bash

node --version

**Expected output:**

text

v18.17.0

**3. Project setup**
### **3.1 Create project directory**
**Windows (PowerShell):**

PowerShell

*# Create project folder*

mkdir ollama-webinterface

cd ollama-webinterface

*# Create directory structure*

New Item - ItemType Directory - Path views\pages New-Item - ItemType Directory - Path views\partials New-Item - ItemType Directory - Path public\css New-Item - ItemType Directory - Path public\js

**macOS/Linux:**

bash

*# Create project folder*

mkdir ollama-webinterface

cd ollama-webinterface

*# Create directory structure*

mkdir -p views/pages views/partials public/css public/js
### **3.2 Project structure**
text

ollama-webinterface/

│

├── server.js # Main server file

├── package.json # Node.js configuration

│

├── views/ # EJS Templates

│ ├── pages/

│ │ └── index.ejs # Main page

│ └── partials/

│ ├── head.ejs # HTML Head

│ ├── header.ejs # Navigation

│ └── footer.ejs # Footer

│

└── public/ # Static files

├── css/

└── js/
### **3.3 Initialize Node.js project**
bash

*# Create Package.json*

npm init -y
### **3.4 Installing dependencies**
bash

*# Main dependencies*

npm install express ejs ollama

*# Development dependencies (optional)*

npm install --save-dev nodemon

**Explanation of the packages:**

- express : Web framework for Node.js
- ejs : Template engine for dynamic HTML pages
- ollama : Official JavaScript client for Ollama
- nodemon : Auto-restart on code changes
### **3.5 Customize Package.json**
Open package.json and replace the contents:

json

{

"name": "ollama-webinterface",

"version": "2.0.0",

"description": "Web interface for Ollama with chat functions",

"main": "http://localhost:3000",

"window": {

"title": "Ollama Chat Interface",

"toolbar": true,

width: 1200,

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

"web interface",

"llm",

"desktop"

],

"author": "I mle, Martin",

"license": "MIT",

"dependencies": {

"express": "^4.18.2",

"ejs": "^3.1.9",

"ollama": "^0.5.0"

},

"devDependencies": {

"nodemon": "^3.0.1"

},

"engines": {

"node": ">=18.0.0"

}

}
## **4. Backend development**
### **4.1 Server configuration (server.js)**
Create the file server.js in the root directory:

JavaScript

*import ollama from 'ollama';*

*import express from 'express';*

*import path from 'path';*

*import { fileURLToPath } from 'url';*

*import { createServer } from 'http';*

*import os from 'os';*

*// ES Module Compatibility*

*const \_\_filename = fileURLToPath(import.meta.url);*

*const \_\_dirname = path.dirname(\_\_filename);*

*// Initialize Express App*

*const app = express();*

*const PORT = process.env.PORT || 3000;*

*// Global state variables*

*let modelResponse = "";*

*let isProcessing = false;*

*let errorMessage = "";*

*let availableModels = [];*

*let chatHistory = [];*

*let ollamaStatus = 'unknown';*

*let currentModel = ''; // NEW: Save current model*

*/\*\**

*\* Loads all available Ollama models at startup*

*\*/*

*async function loadAvailableModels() {*

*try {*

*console.log('🔄 Loading available models...');*

*const response = await ollama.list();*

*if (response && response.models) {*

*availableModels = response.models.map(model => model.name);*

*ollamaStatus = 'connected';*

*// Set default model if none is selected*

*if (!currentModel && availableModels.length > 0) {*

*currentModel = availableModels[0];*

*}*

*console.log('✅ Available models loaded:', availableModels);*

*} else {*

*availableModels = ['llama2'];*

*ollamaStatus = 'no\_models';*

*if (!currentModel) {*

*currentModel = 'llama2';*

*}*

*console.log('⚠️ No models found, use fallback');*

*}*

*} catch (error) {*

*console.log('❌ Error loading models:', error.message);*

*availableModels = ['llama2'];*

*ollamaStatus = 'disconnected';*

*if (!currentModel) {*

*currentModel = 'llama2';*

*}*

*}*

*}*

*/\*\**

*\* Calls the LLM with a prompt*

*\*/*

*async function invokeLLM(model, prompt) {*

*console.log(`\n----- NEW REQUEST -----`);*

*console.log(`Model: ${model}`);*

*console.log(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);*

*console.log(`-------------------------\n`);*

*isProcessing = true;*

*errorMessage = "";*

*modelResponse = "";*

*try {*

*console.log(`🔄 Processing request...`);*

*const response = await ollama.chat({*

*model: model,*

*messages: [{ role: 'user', content: prompt }],*

*});*

*console.log(`✅ Response received (${response.message.content.length} characters)`);*
\*\


*// OUTPUT FULL RESPONSE IN CONSOLE*

*console.log(`\n----- AI RESPONSE -----`);*

*console.log(response.message.content);*

*console.log(`----------------------\n`);*
\*\


*modelResponse = response.message.content;*

*// Add to history*

*const historyItem = {*

*model: model,*

*promptly: promptly,*

*response: response.message.content,*

*timestamp: new Date().toISOString()*

*};*

*chatHistory.unshift(historyItem);*

*// Keep only the last 10 entries*

*if (chatHistory.length > 10) {*

*chatHistory = chatHistory.slice(0, 10);*

*}*

*isProcessing = false;*

*} catch (error) {*

*console.log(`❌ Request failed:`, error);*

*errorMessage = `Error: ${error.message}`;*

*isProcessing = false;*

*}*

*}*

*/\*\**

*\* Helper function to determine the local IP*

*\*/*

*function getLocalIP() {*

*const interfaces = os.networkInterfaces();*

*for (const name of Object.keys(interfaces)) {*

*for (const iface of interfaces[name]) {*

*if (iface.family === 'IPv4' && !iface.internal) {*

*return iface.address;*

*}*

*}*

*}*

*return 'localhost';*

*}*

*// EJS Template Engine Setup*

*app.set('view engine', 'ejs');*

*app.set('views', path.join(\_\_dirname, 'views'));*

*// Middleware*

*app.use(express.static(path.join(\_\_dirname, 'public')));*

*app.use(express.urlencoded({ extended: true }));*

*app.use(express.json());*

*// Security Headers*

*app.use((req, res, next) => {*

*res.setHeader('X-Content-Type-Options', 'nosniff');*

*res.setHeader('X-Frame-Options', 'DENY');*

*res.setHeader('X-XSS-Protection', '1; mode=block');*

*next();*

*});*

*// Routes*

*/\*\**

*\* Main Route - Shows the chat interface*

*\*/*

*app.get('/', (req, res) => {*

*// Ensure that all variables are defined*

*const templateData = {*

*models: availableModels || [],*

*response: modelResponse || "",*

*isProcessing: isProcessing || false,*

*error: errorMessage || "",*

*history: chatHistory || [],*

*currentModel: currentModel || (availableModels.length > 0 ? availableModels[0] : '') // IMPORTANT: currentModel passed*

*};*

*res.render('pages/index', templateData);*

*});*

*/\*\**

*\* Processes chat requests*

*\*/*

*app.post('/query', async (req, res) => {*

*const { prompt, model } = req.body;*

*// Input Validation*

*if (!prompt || !model) {*

*errorMessage = 'Please enter a question and select a model.';*

*return res.redirect('/');*

*}*

*if (prompt.length > 5000) {*

*errorMessage = 'The question is too long (max. 5000 characters).';*

*return res.redirect('/');*

*}*

*// NEW: Save current model*

*currentModel = model;*

*await invokeLLM(model, prompt);*

*res.redirect('/');*

*});*

*/\*\**

*\* Status page - Displays system information*

*\*/*

*app.get('/status', (req, res) => {*

*const templateData = {*

*models: availableModels || [],*

*history: chatHistory || [],*

*isProcessing: isProcessing || false,*

*ollamaStatus: ollamaStatus,*

*currentModel: currentModel,*

*systemInfo: {*

*nodeVersion: process.version,*

*platform: process.platform,*

*uptime: Math.floor(process.uptime()),*

*memory: process.memoryUsage()*

*}*

*};*

*res.render('pages/status', templateData);*

*});*

*/\*\**

*\* API Health Endpoint (for JSON)*

*\*/*

*app.get('/api/health', async (req, res) => {*

*try {*

*const models = await ollama.list();*

*const healthData = {*

*status: 'healthy',*

*ollama: 'connected',*

*models: models.models?.length || 0,*

*timestamp: new Date().toISOString(),*

*currentModel: currentModel,*

*system: {*

*nodeVersion: process.version,*

*platform: process.platform,*

*uptime: Math.floor(process.uptime()),*

*memory: {*

*used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),*

*total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)*

*}*

*},*

*application: {*

*chatHistory: chatHistory.length,*

*isProcessing: isProcessing,*

*availableModels: availableModels.length*

*}*

*};*

*res.json(healthData);*

*} catch (error) {*

*const errorData = {*

*status: 'error',*

*ollama: 'disconnected',*

*error: error.message,*

*timestamp: new Date().toISOString(),*

*application: {*

*chatHistory: chatHistory.length,*

*isProcessing: isProcessing,*

*availableModels: availableModels.length,*

*currentModel: currentModel*

*}*

*};*

*res.status(500).json(errorData);*

*}*

*});*

*/\*\**

*\* API endpoint for status checks (during processing)*

*\*/*

*app.get('/api/status', (req, res) => {*

*res.json({*

*isProcessing: isProcessing,*

*response: modelResponse,*

*error: errorMessage,*

*historyCount: chatHistory.length,*

*currentModel: currentModel*

*});*

*});*

*/\*\**

*\* Deletes chat history*

*\*/*

*app.post('/clear-history', (req, res) => {*

*chatHistory = [];*

*modelResponse = "";*

*errorMessage = "";*

*res.redirect('/');*

*});*

*/\*\**

*\* Sets the current model*

*\*/*

*app.post('/set-model', (req, res) => {*

*const { model } = req.body;*

*if (model && availableModels.includes(model)) {*

*currentModel = model;*

*console.log(`✅ Current model set to: ${model}`);*

*}*

*res.redirect('/');*

*});*

*/\*\**

*\* Test route for Ollama connection*

*\*/*

*app.get('/api/test-ollama', async (req, res) => {*

*try {*

*const models = await ollama.list();*

*res.json({*

*success: true,*

*message: 'Ollama is reachable',*

*models: models.models?.length || 0,*

*modelList: models.models?.map(m => m.name) || [],*

*currentModel: currentModel*

*});*

*} catch (error) {*

*res.status(500).json({*

*success: false,*

*message: 'Ollama is unavailable',*

*error: error.message*

*});*

*}*

*});*

*/\*\**

*\* Error handling for routes not found*

*\*/*

*app.use((req, res) => {*

*res.status(404).render('pages/error', {*

*title: '404 - Page not found',*

*message: `The requested page "${req.url}" does not exist.`,*

*suggestion: 'Check the URL or return to the homepage.'*

*});*

*});*

*/\*\**

*\* Global Error Handler*

*\*/*

*app.use((err, req, res, next) => {*

*console.error('❌ Server Error:', err);*

*res.status(500).render('pages/error', {*

*title: '500 - Server Error',*

*message: 'An unexpected error occurred.',*

*error: process.env.NODE\_ENV === 'development' ? err.message: undefined*

*});*

*});*

*// Start server*

*const server = createServer(app);*

*server.listen(PORT, async () => {*

*console.log(`\n🚀 Ollama Web Interface started!`);*

*console.log(`📍 Local: http://localhost:${PORT}`);*

*console.log(`🌐 Network: http://${getLocalIP()}:${PORT}`);*

*console.log(`⏰ Started at: ${new Date().toLocaleString('de-DE')}`);*

*console.log(`🔧 Environment: ${process.env.NODE\_ENV || 'development'}`);*

*console.log(`🤖 Standard-Model: ${currentModel || 'Setting...'}`);*

*console.log(`----------------------------------------`);*

*// Test Ollama connection and load models*

*try {*

*await loadAvailableModels();*

*console.log(`✅ System initialized - Current model: ${currentModel}`);*

*} catch (error) {*

*console.log('❌ Error during initialization:', error.message);*

*}*

*});*

*// Graceful Shutdown*

*process.on('SIGTERM', () => {*

*console.log('SIGTERM received, shutting down gracefully');*

*server.close(() => {*

*console.log('Server closed');*

*process.exit(0);*

*});*

*});*

*process.on('SIGINT', () => {*

*console.log('SIGINT received, shutting down gracefully');*

*server.close(() => {*

*console.log('Server closed');*

*process.exit(0);*

*});*

*});*

*export default app;*
### **4.2 Error Template (optional)**
Create views/pages/error.ejs for error pages:

html

<!DOCTYPE html>

<html lang="de">

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
## **5. Frontend development**
### **5.1 HTML Head Template**
Create views/partials/head.ejs :

html

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



/\* Auto-resize textarea \*/

.auto-resize {

resize: none;

overflow: hidden;

min-height: 120px;

}



/\* Loading animation \*/

.spinner-border-sm {

width: 1rem;

height: 1rem;

}



/\* Mobile optimizations \*/

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



/\* Custom scrollbar for history \*/

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
### **5.2 Header Template**
Create views/partials/header.ejs :

html

<nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">

<div class="container">

<a class="navbar-brand d-flex align-items-center" href="/">

<i class="bi bi-robot me-2"></i>

<span class="fw-bold">Ollama Chat</span>

<span class="badge bg-primary ms-2">v2.0</span>

</a>



<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">

<span class="navbar-toggler-icon"></span>

</button>



<div class="collapse navbar-collapse" id="navbarNav">

<ul class="navbar-nav me-auto">

<li class="nav-item">

<a class="nav-link active" href="/">

<i class="bi bi-house me-1"></i>Home

</a>

</li>

<li class="nav-item">

<a class="nav-link" href="/status">

<i class="bi bi-heart-pulse me-1"></i>Status

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
### **5.3 Footer Template**
Create views/partials/footer.ejs :

html

<footer class="bg-dark text-white mt-5">

<div class="container py-4">

<div class="row">

<div class="col-md-6">

<h5 class="d-flex align-items-center">

<i class="bi bi-robot me-2"></i>Ollama Chat Interface

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

Version 2.0 &copy; 2025 -

<span id="current-year"><%= new Date().getFullYear() %></span>

</small>

</div>

</div>

</div>

</footer>
### **5.4 Main page (index.ejs)**
Create views/pages/index.ejs :

html

<!DOCTYPE html>

<html lang="de">

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

updateModelDisplay();

$('#model').on('change', function() {

const selectedModel = $(this).val();

updateModelDisplay(selectedModel);

});

$('textarea').on('input', function() {

this.style.height = 'auto';

this.style.height = (this.scrollHeight) + 'px';

});

$('#prompt').on('keydown', function(e) {

if (e.ctrlKey && e.key === 'Enter') {

$(this).closest('form').submit();

}

});

$('#prompt').on('input', function() {

const length = $(this).val().length;

$('#char-count').text(length + '/5000 characters');

if (length > 4500) {

$('#char-count').addClass('text-danger');

} else {

$('#char-count').removeClass('text-danger');

}

});

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

const minutes = Math.floor((current \* 2) / 60);

const seconds = (current \* 2) % 60;

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

<div class="card shadow-sm mb-4">

<div class="card-header bg-primary text-white">

<h4 class="mb-0 d-flex align-items-center">

<i class="bi bi-robot me-2"></i>Chat interface

<span class="badge bg-light text-primary ms-2">Beta</span>

</h4>

</div>

<div class="card-body">

<form action="/query" method="POST" id="chat-form">

<div class="mb-4">

<label for="model" class="form-label fw-semibold">

<i class="bi bi-cpu me-1"></i> Select AI Model:

</label>

<select class="form-select form-select-lg" id="model" name="model" required>

<option value="">-- Please select model --</option>

<% models.forEach(function(model) { %>

<option value="<%= model %>"<%= model === currentModel ? 'selected' : '' %>><%= model %></option>

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

\></textarea>

<div class="form-text d-flex justify-content-between mt-1">

<span>

<i class="bi bi-keyboard me-1"></i>

Ctrl+Enter to send

</span>

<span id="char-count">0/5000 characters</span>

</div>

</div>

<div class="d-grid gap-2 d-md-flex">

<button type="submit"

class="btn btn-primary btn-lg flex-fill"

<%= isProcessing ? 'disabled' : '' %>>

<i class="bi bi-send-fill me-2"></i>

<%= isProcessing ? 'Processing...' : 'Submitting' %>

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

<% if (isProcessing) { %>

<div class="alert alert-warning alert-dismissible fade show" role="alert">

<div class="d-flex align-items-center">

<div class="spinner-border spinner-border-sm me-3" role="status">

<span class="visually-hidden">Loading...</span>

</div>

<div class="flex-fill">

<strong class="d-block">

<i class="bi bi-hourglass-split me-1"></i>AI generates response...

</strong>

<small class="d-block text-muted">

Model used: <strong><%= currentModel %></strong> •

This may take a few seconds.

</small>

</div>

</div>

</div>

<% } %>

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

<% if (response && !isProcessing) { %>

<div class="card border-success shadow-sm mb-4">

<div class="card-header bg-success text-white d-flex justify-content-between align-items-center">

<h5 class="mb-0">

<i class="bi bi-check-circle-fill me-2"></i>Last answer

</h5>

<small class="opacity-75">

<i class="bi bi-clock me-1"></i>

<%= new Date().toLocaleTimeString('de-DE') %>

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

<div class="col-lg-4 col-md-12">

<div class="card shadow-sm mb-4">

<div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">

<h5 class="mb-0">

<i class="bi bi-clock-history me-2"></i>Chat history

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

<small class="text-muted"><%= new Date(item.timestamp).toLocaleTimeString('de-DE') %></small>

</div>

<p class="mb-2 small text-muted">

<strong>Question:</strong>

<%= item.prompt.length > 80 ? item.prompt.substring(0, 80) + '...' : item.prompt %>

</p>

<details>

<summary class="text-primary small" style="cursor: pointer; list-style: none;">

<i class="bi bi-chevron-down me-1"></i>

<span>Show answer</span>

<small class="text-muted ms-1">(<%= Math.ceil(item.response.length / 100) %> sec reading time)</small>

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

<div class="card shadow-sm">

<div class="card-header bg-info text-white">

<h6 class="mb-0">

<i class="bi bi-info-circle me-2"></i>System Information

</h6>

</div>

<div class="card-body">

<div class="row small">

<div class="col-6"><strong>Models:</strong></div>

<div class="col-6 text-end"><span class="badge bg-primary"><%= models.length %></span></div>

<div class="col-6"><strong>Current model:</strong></div>

<div class="col-6 text-end"><span class="badge bg-success"><%= currentModel || 'None' %></span></div>

<div class="col-6"><strong>History:</strong></div>

<div class="col-6 text-end"><span class="badge bg-secondary"><%= history.length %></span></div>

<div class="col-6"><strong>Status:</strong></div>

<div class="col-6 text-end"><span class="badge bg-success">Online</span></div>

</div>

<hr class="my-2">

<div class="text-center">

<a href="/status" class="btn btn-outline-info btn-sm">

<i class="bi bi-heart-pulse me-1"></i> Detailed status

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

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

<script>

$('#prompt').on('input', function() {

const length = $(this).val().length;

$('#char-count').text(length + '/5000 characters');

if (length > 4500) {

$('#char-count').addClass('text-danger');

} else {

$('#char-count').removeClass('text-danger');

}

});

$('#model').on('change', function() {

const selected = $(this).val();

$('#selected-model-info').text(selected ? 'Current: ' + selected : 'No model selected');

});

$(document).ready(function() {

const selectedModel = $('#model').val();

if (selectedModel) {

$('#selected-model-info').text('Current: ' + selectedModel);

}

$('#prompt').focus();

});

function adjustTextareaHeight(textarea) {

textarea.style.height = 'auto';

textarea.style.height = (textarea.scrollHeight) + 'px';

}

document.addEventListener('DOMContentLoaded', function() {

const textarea = document.getElementById('prompt');

if (textarea) {

adjustTextareaHeight(textarea);

}

});

function restoreLastPrompt() {

<% if (history.length > 0) { %>

const lastPrompt = `<%= history[0].prompt.replace(/`/g, '\\`').replace(/\n/g, '\\n') %>`;

document.getElementById('prompt').value = lastPrompt;

adjustTextareaHeight(document.getElementById('prompt'));

document.getElementById('prompt').focus();

<% } %>

}

function useLastResponseAsPrompt() {

<% if (history.length > 0) { %>

const lastResponse = `<%= history[0].response.replace(/`/g, '\\`').replace(/\n/g, '\\n') %>`;

document.getElementById('prompt').value = "Explain this in more detail: " + lastResponse.substring(0, 200) + "...";

adjustTextareaHeight(document.getElementById('prompt'));

document.getElementById('prompt').focus();

<% } %>

}

</script>

</body>

</html>
## **5.5 Create status page**
**Create** views/pages/status.ejs **:**

ejs

<!DOCTYPE html>

<html lang="de">

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

.health-good {

background-color: #28a745;

}

.health-warning {

background-color: #ffc107;

}

.health-error {

background-color: #dc3545;

}

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

<i class="bi bi-heart-pulse text-primary"></i>System status

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

<i class="bi bi-robot"></i>Ollama status

</h5>

</div>

<div class="card-body">

<div class="d-flex align-items-center mb-3">

<span class="health-indicator health-good"></span>

<strong class="me-2">Connection:</strong>

<span class="badge bg-success">Connected</span>

</div>

<div class="mb-3">

<strong>Installed models:</strong>

<span class="badge bg-secondary ms-2"><%= models.length %></span>

</div>

<div class="mb-3">

<strong>Available models:</strong>

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

<i class="bi bi-cpu"></i>System Information

</h5>

</div>

<div class="card-body">

<div class="mb-3">

<strong>Chat history:</strong>

<span class="badge bg-secondary ms-2"><%= history.length %> / 10</span>

</div>

<div class="mb-3">

<strong>Current processing:</strong>

<span class="badge <%= isProcessing ? 'bg-warning' : 'bg-success' %> ms-2">

<%= isProcessing ? 'Active' : 'Inactive' %>

</span>

</div>

<div class="mb-3">

<strong>Server time:</strong>

<span class="text-muted ms-2" id="server-time"><%= new Date().toLocaleString('de-DE') %></span>

</div>

</div>

</div>

</div>

<!-- API Health Check -->

<div class="col-12">

<div class="card status-card border-0 shadow-sm">

<div class="card-header bg-secondary text-white">

<h5 class="card-title mb-0">

<i class="bi bi-plug"></i>API Health Check

</h5>

</div>

<div class="card-body">

<div class="mb-3">

<button class="btn btn-outline-primary me-2" onclick="testAPI()">

<i class="bi bi-play-circle"></i> Run API test

</button>

<button class="btn btn-outline-success" onclick="viewRawJSON()">

<i class="bi bi-code-slash"></i> Show raw data

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

<i class="bi bi-lightning"></i>Quick Actions

</h5>

</div>

<div class="card-body">

<div class="d-flex gap-2 flex-wrap">

<a href="/" class="btn btn-outline-primary">

<i class="bi bi-arrow-left"></i> Back to chat

</a>

<form action="/clear-history" method="POST" class="d-inline">

<button type="submit" class="btn btn-outline-danger"

onclick="return confirm('Do you really want to delete all history?')">

<i class="bi bi-trash"></i>Clear history

</button>

</form>

<button class="btn btn-outline-info" onclick="location.reload()">

<i class="bi bi-arrow-clockwise"></i> Reload page

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

const resultElement = document.getElementById('api-result-content');

const apiResult = document.getElementById('api-result');



resultElement.textContent = 'Loading raw data...';

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

// Update server time

function updateServerTime() {

const now = new Date();

document.getElementById('server-time').textContent = now.toLocaleString('de-DE');

}

// Update time every second

setInterval(updateServerTime, 1000);

</script>

</body>

</html>
##
## **6. Testing & Deployment**
### **6.1 Start Ollama Service**
**Terminal 1 - Ollama Service:**

bash

*# Make sure Ollama is running*

ollama serve

**Expected output:**

text

time=2025-01-20T10:00:00.000Z level=INFO source=images.go:697 msg="total blobs: 10"

time=2025-01-20T10:00:00.100Z level=INFO source=routes.go:1043 msg="Listening on [::]:11434"
### **6.2 Start the web server**
**Terminal 2 - Web Interface:**

bash

*# Development with auto-reload*

npm run dev

*# Or production*

npm start

**Success message:**

text

Ollama Web Interface launched!

Local: http://localhost:3000

Network: http://192.168.1.100:3000

Started at: 20.01.2025, 10:00:00

\----------------------------------------

Loading available models...

Available models loaded: ['llama2', 'gemma:2b', 'mistral']
### **6.3 Browser Test**
Open your browser and navigate to: http://localhost:3000
### **6.4 Health Check**
Test system status: http://localhost:3000/api/health

**Expected response:**

json

{   "status" : "healthy" ,   "ollama" : "connected" ,   "models" : 3 ,   "timestamp" : "2025-01-20T10:00:00.000Z" }
### **6.5 Deployment Options**
**Option 1: PM2 (production)**

bash

*# Install PM2*

npm install -g pm2

*# Start app*

pm2 start server.js --name "ollama-web"

*# Set up autostart*

pm2 startup pm2 save

**Option 2: Docker** \
Create Dockerfile :

dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package\*.json ./

RUN npm install

COPY . .

EXPOSURE 3000

CMD ["npm", "start"]

**Option 3: Environment Variables** \
Create .env file:

env

PORT=3000

OLLAMA\_HOST=http://localhost:11434

NODE\_ENV=production
## **7. Extensions**
### **7.1 Streaming Responses (Real Time)**
**Add to server.js:**

JavaScript

app . post ( '/stream-query' , async ( req , res ) => {   const { prompt , model } = req . body ; res . setHeader ( 'Content-Type' , 'text/plain; charset=utf-8' ); res . setHeader ( 'Transfer-Encoding' , 'chunked' );      try {     const response = await ollama . chat ({       model : model ,       messages : [{ role : 'user' , content : prompt }],       stream : true     });          for await ( const part of response ) { res . write ( part . message . content );       *// Artificial delay for better UX*       await new Promise ( resolve => setTimeout ( resolve , 50 ));     }   } catch ( error ) { res . write ( `Error: ${ error . message } ` );   } res . end ();});
### **7.2 Multiple Chat Sessions**
**Extended history function:**

JavaScript

let chatSessions = {}; app . post ( '/new-session' , ( req , res ) => {   const sessionId = Date . now (). toString (); chatSessions [ sessionId ] = {     history : [],     createdAt : new Date (),     title : 'New Conversation'   }; res . json ({ sessionId });});
### **7.3 Markdown Support**
**Installation:**

bash

npm install marked

**Integration:**

JavaScript

import { marked } from 'marked' ; *// In the invokeLLM function* modelResponse = marked . parse ( response . message . content );
## **8. Troubleshooting**
### **❌ Common problems & solutions**

|**problem**|**Solution**|
| :- | :- |
|**"Cannot find module 'ollama'"**|npm install ollama|
|**"Connection refused"**|Run ollama serve|
|**No models available**|ollama pull llama2|
|**Port 3000 occupied**|Change port in server.js|
|**Page does not load**|Check firewall settings|
|**Model very slow**|Use smaller models ( gemma:2b )|
### **🔍 Debugging Commands**
bash

*# Check Ollama status*

ollama list ollama ps

*# Node.js processes*

netstat -tulips | grep :3000 lsof -i :3000

*# Check dependencies*

npm list

npm audit
### **📊 Performance optimization**
**For slow systems:**

bash

*# Use smaller models*

ollama pull gemma:2b

ollama pull llama2:7b

` `*# Check GPU support*

ollama serve --help | grep gpu
### **Support resources:**
- [Ollama Documentation](https://ollama.ai/docs "https://ollama.ai/docs")
- [Express.js Guide](https://expressjs.com/ "https://expressjs.com/")
- [Bootstrap Docs](https://getbootstrap.com/ "https://getbootstrap.com/")
- [Community Forum](https://github.com/ollama/ollama/discussions "https://github.com/ollama/ollama/discussions")

\*Tutorial Version 2.0 - October 2025 - MIT License\*
