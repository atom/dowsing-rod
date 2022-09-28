##### Atom and all repositories under Atom will be archived on December 15, 2022. Learn more in our [official announcement](https://github.blog/2022-06-08-sunsetting-atom/)
 # Dowsing Rod

Dowse for Python 2.7 installations on your system and make them available to `node-gyp` subprocesses.

## Why?

`node-gyp` only works with Python 2, and this is unlikely to change in the near future.

Furthermore, while `node-gyp` allows you to override the Python executable it discovers itself by specifying a `PYTHON` environment variable or setting the `python` npm config option, certain `node-gyp` builds will _only_ work correctly if the python 2 executable is on the `${PATH}` with the exact name "python", because the Makefiles they generate execute generated files with a shebang line of `#!/usr/bin/env python`.

Fixing this upstream would be tricky and require changes to trickle through a number of dependent projects. Hence @atom/dowsing-rod, which exists to:

* Locate a compatible Python 2 executable _(a)_ from an existing `$PYTHON` variable _(b)_ as any `python`, `python2`, or `python2.7` executable on your `$PATH` or _(c)_ specified directly as a `.python2-bin` file.
* Set the `$PYTHON` environment variable to the discovered binary's path. Prepend a directory containing a wrapper script to your `$PATH` so that shebang scripts will execute your chosen Python binary properly.

## Install

```sh
$ npm install @atom/dowsing-rod
```

You'll also likely want to add `.python2-bin` to your `.gitignore`:

```sh
$ echo '.python2-bin' >> .gitignore
```

## Use

### From your package.json

To fix your `node-gyp rebuild` command, add the following to your `package.json`:

```json
{
  "scripts": {
    "install": "with-python2-env node-gyp rebuild"
  }
}
```

### From code

If you're launching node-gyp as a subprocess yourself (like we do within the :atom: build scripts, for example), you can modify your process' environment directly:

```js
const path = require('path')
const dowsingRod = require('@atom/dowsing-rod')

const options = {
  // npm binary used to read config settings
  npmBin: 'npm',

  // file to store located Python binary
  pythonBinFile: path.join(process.cwd(), '.python2-bin')
}

// Options are optional with the defaults shown.
const promise = dowsingRod.setPythonEnv(options, process.env)

// Any exec or spawn calls after the returned promise resolves will have the correct Python environments.
// Or, if you wish to do something with the path yourself:

dowsingRod.getPythonBin(options)
  .then(pythonBin => console.log(`Python binary: ${pythonBin}`))

// Synchronous variants are also exported:
dowsingRod.setPythonEnvSync(options, process.env)
const pythonBin = dowsingRod.getPythonBinSync(options)
```
