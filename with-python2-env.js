#!/usr/bin/env node

const path = require('path')
const {spawn} = require('./helper')
const {setPythonEnv} = require('.')

const rest = process.argv.slice(2)

const env = Object.assign({}, process.env)
setPythonEnv({}, env)
  .then(() => {
    if (rest.length === 0) {
      console.log(`PYTHON=${env.CHOSEN_PYTHON2}`)
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
