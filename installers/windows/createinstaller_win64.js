// Create installer for win64 system.

const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

function getInstallerConfig() {
  console.log('creating windows installer')
  const rootPath = path.join('./')
  const outPath = path.join(rootPath, 'release-builds')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'OverDashboard-win32-x64/'),
    authors: 'Overlooking 6083',
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    exe: 'OverDashboard.exe',
    setupExe: 'OverDashboard_win64_Setup.exe'
  })
}

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })