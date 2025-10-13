const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let flaskProcess = null;
let nextServer = null;

// Determine if running in production
const isDev = process.env.NODE_ENV === 'development';
const isPackaged = app.isPackaged;

// Flask configuration
const FLASK_HOST = '127.0.0.1';
const FLASK_PORT = 5001;
const HEALTH_CHECK_URL = `http://${FLASK_HOST}:${FLASK_PORT}/healthz`;
const HEALTH_CHECK_INTERVAL = 300; // ms
const HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds max wait

/**
 * Get the path to the Flask executable/script
 */
function getFlaskPath() {
  if (isPackaged) {
    // Production: Use bundled Flask binary
    const platform = process.platform;
    const binaryName = platform === 'win32' ? 'flask-backend.exe' : 'flask-backend';
    const resourcePath = process.resourcesPath;
    return path.join(resourcePath, binaryName);
  } else {
    // Development: Use Python script
    return null; // Will use serverPath with python command
  }
}

/**
 * Get the URL for the frontend
 */
function getFrontendURL() {
  if (isPackaged) {
    // Production: Load from standalone Next.js build
    const appPath = path.join(process.resourcesPath, 'app');
    return `file://${path.join(appPath, 'index.html')}`;
  } else {
    // Development: Load from Next.js dev server
    return 'http://localhost:3000';
  }
}

/**
 * Start the Flask backend process
 */
function startFlaskProcess() {
  return new Promise((resolve, reject) => {
    console.log('Starting Flask backend...');
    
    if (isPackaged) {
      // Production mode: Run Flask binary
      const flaskBinary = getFlaskPath();
      
      if (!fs.existsSync(flaskBinary)) {
        reject(new Error(`Flask binary not found at: ${flaskBinary}`));
        return;
      }
      
      console.log(`Running Flask binary: ${flaskBinary}`);
      
      flaskProcess = spawn(flaskBinary, [], {
        env: { ...process.env },
        stdio: 'pipe'
      });
    } else {
      // Development mode: Run Python script
      const serverPath = path.join(__dirname, '..', '..', 'server');
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      
      console.log(`Running Flask with Python: ${pythonCommand} app.py`);
      
      flaskProcess = spawn(pythonCommand, ['app.py'], {
        cwd: serverPath,
        env: { ...process.env },
        stdio: 'pipe'
      });
    }

    // Log Flask output
    flaskProcess.stdout.on('data', (data) => {
      console.log(`[Flask] ${data.toString().trim()}`);
    });

    flaskProcess.stderr.on('data', (data) => {
      console.error(`[Flask Error] ${data.toString().trim()}`);
    });

    flaskProcess.on('error', (error) => {
      console.error('Failed to start Flask:', error);
      reject(error);
    });

    flaskProcess.on('exit', (code, signal) => {
      console.log(`Flask process exited with code ${code} and signal ${signal}`);
      flaskProcess = null;
    });

    // Start health checking
    waitForFlaskReady()
      .then(() => resolve())
      .catch((error) => reject(error));
  });
}

/**
 * Wait for Flask to be ready by pinging the health endpoint
 */
function waitForFlaskReady() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkHealth = () => {
      // Check if we've exceeded timeout
      if (Date.now() - startTime > HEALTH_CHECK_TIMEOUT) {
        reject(new Error('Flask health check timeout after 30 seconds'));
        return;
      }

      http.get(HEALTH_CHECK_URL, (res) => {
        if (res.statusCode === 200) {
          console.log('✓ Flask backend is ready');
          resolve();
        } else {
          console.log(`Flask health check returned status ${res.statusCode}, retrying...`);
          setTimeout(checkHealth, HEALTH_CHECK_INTERVAL);
        }
      }).on('error', (err) => {
        // Connection refused is expected while Flask is starting
        console.log('Waiting for Flask to start...');
        setTimeout(checkHealth, HEALTH_CHECK_INTERVAL);
      });
    };

    // Start first health check
    checkHealth();
  });
}

/**
 * Kill Flask process gracefully
 */
function killFlaskProcess() {
  if (flaskProcess) {
    console.log('Terminating Flask backend...');
    flaskProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (flaskProcess) {
        console.log('Force killing Flask backend...');
        flaskProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

/**
 * Start Next.js standalone server (production only)
 */
function startNextServer() {
  if (!isPackaged) {
    return Promise.resolve(); // Skip in development
  }

  return new Promise((resolve, reject) => {
    console.log('Starting Next.js server...');
    
    const appPath = path.join(process.resourcesPath, 'app');
    const serverPath = path.join(appPath, 'server.js');
    
    if (!fs.existsSync(serverPath)) {
      console.warn('Next.js standalone server not found, will load static files');
      resolve();
      return;
    }
    
    nextServer = spawn('node', [serverPath], {
      cwd: appPath,
      env: { 
        ...process.env,
        PORT: '3000',
        HOSTNAME: 'localhost'
      },
      stdio: 'pipe'
    });

    nextServer.stdout.on('data', (data) => {
      console.log(`[Next.js] ${data.toString().trim()}`);
    });

    nextServer.stderr.on('data', (data) => {
      console.error(`[Next.js Error] ${data.toString().trim()}`);
    });

    nextServer.on('error', (error) => {
      console.error('Failed to start Next.js:', error);
      reject(error);
    });

    // Give Next.js a moment to start
    setTimeout(() => resolve(), 2000);
  });
}

/**
 * Kill Next.js server
 */
function killNextServer() {
  if (nextServer) {
    console.log('Terminating Next.js server...');
    nextServer.kill('SIGTERM');
    
    setTimeout(() => {
      if (nextServer) {
        nextServer.kill('SIGKILL');
      }
    }, 3000);
  }
}

/**
 * Create the main Electron window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the appropriate frontend
  const frontendURL = getFrontendURL();
  console.log(`Loading frontend from: ${frontendURL}`);
  
  if (isPackaged && frontendURL.startsWith('file://')) {
    // Load static HTML in production
    mainWindow.loadFile(frontendURL.replace('file://', ''));
  } else {
    // Load from server (dev or production with standalone server)
    mainWindow.loadURL(frontendURL);
  }

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize the application
 */
async function initialize() {
  try {
    // Start Flask backend first
    await startFlaskProcess();
    
    // In production, start Next.js server if needed
    if (isPackaged) {
      await startNextServer();
    }
    
    // Once backends are ready, create the window
    createWindow();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

// Wait for app to be ready, then start backends and create window
app.on('ready', initialize);

// Kill processes before quitting
app.on('before-quit', (event) => {
  killFlaskProcess();
  killNextServer();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (mainWindow === null && flaskProcess) {
    createWindow();
  } else if (mainWindow === null) {
    initialize();
  }
});
