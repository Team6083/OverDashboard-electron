'use strict';
Object.defineProperty(exports, '__esModule', { value: true });

var tcpp = require('tcp-ping');
const electron = require('electron');
const wpilib_NT = require('wpilib-nt-client');
const client = new wpilib_NT.Client();

// The client will try to reconnect after 1 second
client.setReconnectDelay(1000)

if (handleSquirrelEvent()) {
    return;
}
function handleSquirrelEvent() {
    if (process.argv.length === 1) {
        return false;
    }

    const ChildProcess = require('child_process');
    const path = require('path');

    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);

    const spawn = function (command, args) {
        let spawnedProcess, error;

        try {
            spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
        } catch (error) { }

        return spawnedProcess;
    };

    const spawnUpdate = function (args) {
        return spawn(updateDotExe, args);
    };

    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
            // Optionally do things such as:
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus

            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers

            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);

            setTimeout(app.quit, 1000);
            return true;

        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated

            app.quit();
            return true;
    }
};

/** Module to control application life. */
const app = electron.app;

/** Module to create native browser window.*/
const BrowserWindow = electron.BrowserWindow;

/** Module for receiving messages from the BrowserWindow */
const ipc = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
/**
 * The Main Window of the Program
 * @type {Electron.BrowserWindow}
 * */

let mainWindow;

let connectedFunc,
    ready = false;

let clientDataListener = (key, val, valType, mesgType, id, flags) => {
    if (val === 'true' || val === 'false') {
        val = val === 'true';
    }
    mainWindow.webContents.send(mesgType, {
        key,
        val,
        valType,
        id,
        flags
    });
};
function createWindow() {
    // Attempt to connect to the localhost
    client.start((con, err) => {

        let connectFunc = () => {
            console.log('Sending status');
            mainWindow.webContents.send('connected', con);

            // Listens to the changes coming from the client
        };

        // If the Window is ready than send the connection status to it
        if (ready) {
            connectFunc();
        }
        connectedFunc = connectFunc;
    });
    // When the script starts running in the window set the ready variable
    ipc.on('ready', (ev, mesg) => {
        console.log('NetworkTables is ready');
        ready = mainWindow != null;

        // Remove old Listener
        client.removeListener(clientDataListener);

        // Add new listener with immediate callback
        client.addListener(clientDataListener, true);

        // Send connection message to the window if if the message is ready
        if (connectedFunc) connectedFunc();

        startNTconnect();
    });
    ipc.on('add', (ev, mesg) => {
        client.Assign(mesg.val, mesg.key, (mesg.flags & 1) === 1);
    });
    ipc.on('update', (ev, mesg) => {
        client.Update(mesg.id, mesg.val);
    });
    ipc.on('windowError', (ev, error) => {
        console.log(error);
    });
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1450,
        height: 570,

        show: false,
        icon: __dirname + '/../images/icon.png'
    });
    // Move window to top (left) of screen.
    mainWindow.setPosition(0, 0);
    // Load window.
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    // Once the python server is ready, load window contents.
    mainWindow.once('ready-to-show', () => {
        console.log('main window is ready to be shown');
        mainWindow.show();
    });

    // Remove menu
    //mainWindow.setMenu(null);
    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        console.log('main window closed');
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        ready = false;
        connectedFunc = null;
        client.removeListener(clientDataListener);
    });
    mainWindow.on('unresponsive', () => {
        console.log('Main Window is unresponsive');
    });
    mainWindow.webContents.on('did-fail-load', () => {
        console.log('window failed load');
    });
}

var targetHost = "";

function startNTconnect() {
    let NtAddress = ["172.22.11.2", "10.60.83.2", "roborio-6083-frc.local", "127.0.0.1"]

    NtAddress.forEach(function (host) {
        tcpp.probe(host, 1735, function (err, available) {
            if (available) {
                console.log(host);
                targetHost = host;
            }
        });
    });

    setTimeout(function () {
        if (targetHost == "") {
            startNTconnect();
        }
        else {
            connectToNT(targetHost);
        }
    }, 5000);
}

function connectToNT(address, port) {
    console.log(`Trying to connect to ${address}` + (port ? ':' + port : ''));
    let callback = (connected, err) => {
        console.log('Sending status');
        mainWindow.webContents.send('connected', connected);
    };

    if (port) {
        client.start(callback, address, port);
    } else {
        client.start(callback, address);
    }
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
    console.log('app is ready');
    createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q.
    // Not like we're creating a consumer application though.
    // Let's just kill it anyway.
    // If you want to restore the standard behavior, uncomment the next line.

    // if (process.platform !== 'darwin')
    app.quit();
});

app.on('quit', function () {
    console.log('Application quit.');
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow == null) createWindow();
});