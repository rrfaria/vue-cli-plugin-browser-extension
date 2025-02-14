const fs = require('fs')
const path = require('path')
const { generateKey } = require('../lib/signing-key')
const gitignoreSnippet = `
# Vue Browser Extension Output
*.pem
*.pub
*.zip
/artifacts
`

module.exports = (api, _options) => {
  const options = Object.assign({}, _options)
  options.componentOptions = {}
  if (options.components.background) {
    options.componentOptions.background = {
      entry: 'src/background.js'
    }
  }
  if (options.components.contentScripts) {
    options.componentOptions.contentScripts = {
      entries: {
        'content-script': ['src/content-scripts/content-script.js']
      }
    }
  }

  const appRootPath = process.cwd()
  const { name, description } = require(path.join(appRootPath, 'package.json'))
  const eslintConfig = { env: { webextensions: true } }
  const pkg = {
    private: true,
    scripts: {
      serve: 'vue-cli-service build --mode development --watch'
    },
    dependencies: {
      'vue-router': '^3.0.1',
      vuex: '^3.0.1'
    },
    vue: {
      pages: {},
      pluginOptions: {
        browserExtension: options
      }
    }
  }

  if (options.usePolyfill) {
    pkg.dependencies['webextension-polyfill'] = '^0.4.0'
    pkg.devDependencies = {
      'imports-loader': '^0.8.0'
    }
  }

  if (api.hasPlugin('eslint')) {
    pkg.eslintConfig = eslintConfig
  }

  api.extendPackage(pkg)
  api.render('./template/base-app', { name, description, ...options })

  if (options.components.background) {
    api.render('./template/background', { name, ...options })
  }

  if (options.components.popup) {
    api.render('./template/popup', { name, ...options })

    pkg.vue.pages['popup'] = {
      entry: 'src/popup/popup.js',
      template: 'src/popup/popup.html',
      title: 'Popup'
    }
  }

  if (options.components.options) {
    api.render('./template/options', { name, ...options })

    pkg.vue.pages['options'] = {
      entry: 'src/options/options.js',
      template: 'src/options/options.html',
      title: 'Options'
    }
  }

  if (options.components.override) {
    api.render('./template/override', { name, ...options })

    pkg.vue.pages['override'] = {
      entry: 'src/override/override.js',
      template: 'src/override/override.html',
      title: 'Override'
    }
  }

  if (options.components.standalone) {
    api.render('./template/standalone', { name, ...options })

    pkg.vue.pages['standalone'] = {
      entry: 'src/standalone/standalone.js',
      template: 'src/standalone/standalone.html',
      filename: 'index.html',
      title: name
    }
  }

  if (options.components.devtools) {
    api.render('./template/devtools', { name, ...options })

    pkg.vue.pages['devtools'] = {
      entry: 'src/devtools/devtools.js',
      template: 'src/devtools/devtools.html',
      title: 'Devtools'
    }
  }

  if (options.components.contentScripts) {
    api.render('./template/content-scripts', { ...options })
  }

  if (options.generateSigningKey === true) {
    api.render((files) => {
      files['key.pem'] = generateKey()
    })
  }

  api.onCreateComplete(() => {
    const gitignore = fs.readFileSync(api.resolve('./.gitignore'), 'utf8')
    fs.writeFileSync(api.resolve('./.gitignore'), gitignore + gitignoreSnippet)
  })
}
