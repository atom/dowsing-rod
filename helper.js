const childProcess = require('child_process')
const fs = require('fs')

function execFile(...args) {
  return new Promise((resolve, reject) => {
    childProcess.execFile(...args, (err, stdout, stderr) => {
      if (err) {
        reject(err)
        return
      }

      if (stderr) {
        console.error(stderr)
      }

      resolve(stdout)
    })
  })
}

function spawn(...args) {
  return new Promise((resolve, reject) => {
    let resolved = false
    const proc = childProcess.spawn(...args)

    proc.on('error', err => {
      if (!resolved) {
        resolved = true
        reject(err)
      } else {
        console.error(err)
      }
    })

    proc.on('exit', (code, signal) => {
      if (!resolved) {
        resolved = true
        resolve({code, signal})
      }
    })
  })
}

function access(filePath, mode) {
  return new Promise((resolve, reject) => {
    fs.access(filePath, mode, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, contents) => {
      if (err) {
        reject(err)
      } else {
        resolve(contents)
      }
    })
  })
}

function writeFile(filePath, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, contents, 'utf8', err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

module.exports = {
  execFile,
  access,
  readFile,
  writeFile
}
