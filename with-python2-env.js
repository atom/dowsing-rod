#!/usr/bin/env node

const path = require('path')
const {spawn} = require('./helper')
const {getPythonBin} = require('.')

const rest = process.argv.slice(2)

getPythonBin({})
  .then(pythonBin => {
    const env = {}
    for (const k of Object.keys(process.env)) {
      env[k] = process.env[k]
    }
    env.PYTHON = pythonBin
    env.PATH = path.join(__dirname, 'bin') + path.delimiter + env.PATH

    if (rest.length === 0) {
      console.log(`PYTHON=${pythonBin}`)
      return {code: 0}
    }

    const cmd = rest[0]
    const args = rest.slice(1)

    return spawn(cmd, args, {env, stdio: 'inherit'})
  })
  .then(
    ({code}) => {
      process.exit(code !== null ? code : 1)
    },
    err => {
      console.error(err)
      process.exit(1)
    }
  )
