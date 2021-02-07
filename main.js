'use strict';
Object.defineProperty(exports, '__esModule', { value: true });

var tcpp = require('tcp-ping');
const electron = require('electron');
const wpilib_NT = require('wpilib-nt-client');
const client = new wpilib_NT.Client();


if (require('electron-squirrel-startup')) return;

// The client will try to reconnect after 1 second
client.setReconnectDelay(1000);

/** Module to control application life. */
const app = electron.app;

/** Module to create native browser window.*/
const BrowserWindow = electron.BrowserWindow;

/** Module for receiving messages from the BrowserWindow */
const ipc = electron.ipcMain;

const globalShortcut = electron.globalShortcut;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
/**
 * The Main Window of the Program
 * @type {Electron.BrowserWindow}
 * */

let mainWindow;

let connectedFunc, ready = false;

// Foward NT values to BrowserWindow
let clientDataListener = (key, val, valType, mesgType, id, flags) => {
    // handle boolean value
    if (val === 'true' || val === 'false') {
        val = val === 'true';
    }

    // send data to BrowserWindow
    mainWindow.webContents.send(mesgType, {
        key,
        val,
        valType,
        id,
        flags
    });
};

// Start up the BrowserWindow
function createWindow() {
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
    });

    ipc.on('add', (ev, mesg) => {
        client.Assign(mesg.val, mesg.key, (mesg.flags & 1) === 1);
    }); // Handle add from BrowserWindow
    ipc.on('update', (ev, mesg) => {
        client.Update(mesg.id, mesg.val);
    }); // Handle update from BrowserWindow
    ipc.on('windowError', (ev, error) => {
        console.log(error);
    }); // Handle error from BrowserWindow

    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1450,
        height: 570,
        // The width and height of BrowserWindows

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


    globalShortcut.register('f5', function () {
        console.log('f5 is pressed')
        mainWindow.reload();
    })
    globalShortcut.register('CommandOrControl+R', function () {
        console.log('CommandOrControl+R is pressed')
        mainWindow.reload();
    })

    // Start NT connection processs
    startNTconnect();
}

let targetHost = "";

const teamNumber = process.env.teamNumber || "6083";

function startNTconnect() {
    let roboRioIP = "10.";
    if (teamNumber.length <= 2) {
        roboRioIP += "0." + teamNumber;
    } else {
        roboRioIP += teamNumber.substr(0, teamNumber.length - 2) + "." + teamNumber.substr(teamNumber.length - 2, 2);
    }
    roboRioIP += ".2";
    let NtAddress = ["172.22.11.2", roboRioIP, "roborio-" + teamNumber + "-frc.local", "127.0.0.1"]

    NtAddress.forEach(function (host) {
        if (targetHost === "") {
            tcpp.probe(host, 1735, function (_, available) {
                if (available) {
                    console.log("Set target to: " + host);
                    targetHost = host;
                }
            });
        }
    });
    // Scan ip to find roborio.

    setTimeout(function () {
        if (targetHost == "") {
            startNTconnect();
        }
        else {
            connectToNT(targetHost);
            setTimeout(function () {
                client.Update(client.getKeyID("/SmartDashboard/NT/ip"), targetHost);
                readPing();
            }, 1000);
        }
    }, 5000);
    // Wait 5 sec before connect
}

function readPing() {
    tcpp.ping({ address: targetHost, port: 1735 }, function (_, data) {
        client.Update(client.getKeyID("/SmartDashboard/NT/ping"), Math.round(parseFloat(data.avg)));
        setTimeout(function () {
            readPing();
        }, 3000);
    });
}

// Connect to NT with given address and port.
function connectToNT(address, port) {
    console.log(`Trying to connect to ${address}` + (port ? ':' + port : ''));
    let callback = (connected) => {
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