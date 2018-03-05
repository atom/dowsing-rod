const semver = require('semver')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

function readNpmConfigSync(options) {
  const stdout = childProcess.execFileSync(options.npmBin, ['config', 'get', 'python'], {encoding: 'utf8'})
  const value = stdout.trim()
  return value !== 'undefined' ? value : null
}

function checkPythonSync(candidate) {
  try {
    fs.accessSync(candidate, fs.constants.X_OK)
    const stdout = childProcess.execFileSync(
      candidate,
      ['-c', 'import platform; print(platform.python_version());'],
      {encoding: 'utf8', env: {TERM: 'dumb'}}
    )
    return stdout.trim().replace(/\+/g, '').replace(/rc.*$/ig, '')
  } catch (e) {
    return null
  }
}

function findOnPathSync(options) {
  if (!process.env.PATH) {
    return null
  }

  const pathDirs = process.env.PATH.split(path.delimiter)
  const binaries = ['python', 'python2']
  const byVersion = new Map()

  for (const pathDir of pathDirs) {
    for (const binary of binaries) {
      const candidate = path.join(pathDir, binary)
      const version = checkPythonSync(candidate)
      if (version !== null) {
        byVersion.set(version, candidate)
      }
    }
  }

  const versions = Array.from(byVersion.keys())
  const max = semver.maxSatisfying(versions, '>=2.5.0 <3.0.0')
  if (max === null) {
    return null
  }
  return byVersion.get(max)
}

function locatePythonSync(options) {
  if (process.env.PYTHON) {
    return process.env.PYTHON
  }

  const pythonBin = readNpmConfigSync(options)
  if (pythonBin) {
    return pythonBin
  }

  return findOnPathSync(options)
}

module.exports = {
  locatePythonSync
}
