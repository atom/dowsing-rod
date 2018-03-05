const path = require('path')
const fs = require('fs')

const {locatePython} = require('./locate')
const {locatePythonSync} = require('./locate-sync')
const {readFile, writeFile} = require('./helper')

const DEFAULTS = {
  npmBin: 'npm',
  pythonBinFile: path.join(process.cwd(), '.python2-bin')
}

function getPythonBin(options) {
  const opts = Object.assign({}, DEFAULTS, options)
  return readFile(opts.pythonBinFile)
    .then(
      contents => contents.trim(),
      () => {
        return locatePython(opts)
          .then(pythonBin => {
            return writeFile(opts.pythonBinFile, pythonBin)
              .then(() => pythonBin, () => pythonBin)
          })
      }
    )
}

function getPythonBinSync(options) {
  const opts = Object.assign({}, DEFAULTS, options)
  try {
    return fs.readFileSync(opts.pythonBinFile, {encoding: 'utf8'}).trim()
  } catch (e) {
    const pythonBin = locatePythonSync(opts)
    try {
      fs.writeFileSync(opts.pythonBinFile, pythonBin, {encoding: 'utf8'})
    } catch (e) {}
    return pythonBin
  }
}

// Detect an existing dowsing-rod PATH injection. If one is present, shuffle it to the front of the PATH and return
// true. Otherwise, return false.
function detectEnv(env) {
  if (!env.PATH) {
    return
  }

  const pathParts = env.PATH.split(path.delimiter)
  const pyBinIndex = pathParts.findIndex(part => path.resolve(part).endsWith(path.sep + 'py2-bin'))

  if (pyBinIndex === 0) {
    // Python environment already set as the highest priority
    return true
  }
  if (pyBinIndex > 0) {
    // Python environment already set, but not at the highest priority
    const newPathParts = [pathParts[pyBinIndex]]
    newPathParts.push(...pathParts.slice(0, pyBinIndex))
    newPathParts.push(...pathParts.slice(pyBinIndex + 1))
    env.PATH = newPathParts.join(path.delimiter)
    return true
  }
}

function modifyEnv(env, pythonBin) {
  env.CHOSEN_PYTHON2 = pythonBin

  const binPath = path.join(__dirname, 'py2-bin')
  if (env.PATH) {
    env.PATH = binPath + path.delimiter + env.PATH
  } else {
    env.PATH = binPath
  }
}

function setPythonEnv(options, env) {
  if (detectEnv(env)) {
    return Promise.resolve()
  }

  return getPythonBin(options)
    .then(pythonBin => modifyEnv(env, pythonBin))
}

function setPythonEnvSync(options, env) {
  if (detectEnv(env)) {
    return
  }

  const pythonBin = getPythonBinSync(options)
  modifyEnv(env, pythonBin)
}

module.exports = {
  detectEnv,
  modifyEnv,
  getPythonBin,
  getPythonBinSync,
  setPythonEnv,
  setPythonEnvSync
}
