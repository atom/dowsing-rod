const semver = require('semver')
const fs = require('fs')
const path = require('path')
const {execFile, access} = require('./helper')

function readNpmConfig(options) {
  return execFile(options.npmBin, ['config', 'get', 'python'], {encoding: 'utf8'})
    .then(stdout => {
      const value = stdout.trim()
      return value !== 'undefined' ? value : null
    })
}

function checkPython(candidate) {
  return access(candidate, fs.constants.X_OK)
    .then(() => {
      return execFile(
        candidate,
        ['-c', 'import platform; print(platform.python_version());'],
        {encoding: 'utf8', env: {TERM: 'dumb'}}
      )
    })
    .then(stdout => {
      const version = stdout.trim()
        .replace(/\+/g, '')
        .replace(/rc.*$/ig, '')
      return semver.satisfies(version, '>=2.5.0 <3.0.0')
    })
    .catch(() => false)
}

function findOnPath(options) {
  if (!process.env.PATH) {
    // ¯\_(ツ)_/¯
    return Promise.resolve(null)
  }

  const pathDirs = process.env.PATH.split(path.delimiter)
  const binaries = ['python2.7', 'python2', 'python']

  function nextBinary(pathDir, i) {
    if (i >= binaries.length) {
      return Promise.resolve(null)
    }

    const candidate = path.join(pathDir, binaries[i])
    return checkPython(candidate)
      .then(ok => {
        return ok ? candidate : nextBinary(pathDir, i + 1)
      })
  }

  function nextPath() {
    if (pathDirs.length <= 0) {
      return Promise.resolve(null)
    }
    const pathDir = pathDirs.shift()

    return nextBinary(pathDir, 0)
      .then(candidate => {
        return candidate !== null ? candidate : nextPath()
      })
  }

  return nextPath()
}

function locatePython(options) {
  if (process.env.PYTHON) {
    return Promise.resolve(process.env.PYTHON)
  }

  return readNpmConfig(options)
    .then(pythonBin => {
      if (pythonBin) {
        return pythonBin
      }

      return findOnPath(options)
    })
}

module.exports = {
  locatePython
}
