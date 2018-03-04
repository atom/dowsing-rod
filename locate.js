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
    .then(stdout => stdout.trim().replace(/\+/g, '').replace(/rc.*$/ig, ''))
    .catch(() => null)
}

function findOnPath(options) {
  if (!process.env.PATH) {
    // ¯\_(ツ)_/¯
    return Promise.resolve(null)
  }

  const pathDirs = process.env.PATH.split(path.delimiter)
  const binaries = ['python', 'python2']
  const byVersion = new Map()

  function nextBinary(pathDir, i) {
    if (i >= binaries.length) {
      return Promise.resolve()
    }

    const candidate = path.join(pathDir, binaries[i])
    return checkPython(candidate)
      .then(version => {
        if (version !== null) {
          byVersion.set(version, candidate)
        }
        return nextBinary(pathDir, i + 1)
      })
  }

  function nextPath() {
    if (pathDirs.length <= 0) {
      return Promise.resolve()
    }
    const pathDir = pathDirs.shift()

    return nextBinary(pathDir, 0)
      .then(nextPath)
  }

  function bestCandidate() {
    return nextPath()
      .then(() => {
        const versions = Array.from(byVersion.keys())
        const max = semver.maxSatisfying(versions, '>=2.5.0 <3.0.0')
        if (max === null) {
          return null
        }
        return byVersion.get(max)
      })
  }

  return bestCandidate()
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
