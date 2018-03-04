const path = require('path')

const {locatePython} = require('./locate')
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

function setPythonEnv(options) {
  return getPythonBin(options)
    .then(pythonBin => {
      process.env.PYTHON = pythonBin
      process.env.PATH = path.join(__dirname, 'bin') + path.delimiter + process.env.PATH
    })
}

module.exports = {
  getPythonBin,
  setPythonEnv
}
