/* tslint:disable:no-sync-functions */

import * as path from 'path'
import * as cp from 'child_process'
import * as fs from 'fs-extra'
import * as packager from 'electron-packager'

const legalEagle: LegalEagle = require('legal-eagle')

const distInfo = require('./dist-info')
const getReleaseChannel: () => string = distInfo.getReleaseChannel
const getVersion: () => string = distInfo.getVersion
const getExecutableName: () => string = distInfo.getExecutableName

const projectRoot = path.join(__dirname, '..')
const outRoot = path.join(projectRoot, 'out')

const isPublishableBuild = getReleaseChannel() !== 'development'

console.log(`Building for ${getReleaseChannel()}…`)

console.log('Removing old distribution…')
fs.removeSync(path.join(projectRoot, 'dist'))

console.log('Copying dependencies…')
copyDependencies()

console.log('Packaging emoji…')
copyEmoji()

console.log('Copying static resources…')
copyStaticResources()

const isFork = process.env.CIRCLE_PR_USERNAME
if (process.platform === 'darwin' && process.env.CIRCLECI && !isFork) {
  console.log('Setting up keychain…')
  cp.execSync(path.join(__dirname, 'setup-macos-keychain'))
}

console.log('Updating our licenses dump…')
updateLicenseDump(err => {
  if (err) {
    console.error(
      'Error updating the license dump. This is fatal for a published build.'
    )
    console.error(err)

    if (isPublishableBuild) {
      process.exit(1)
      return
    }
  }

  console.log('Packaging…')
  packageApp((err, appPaths) => {
    if (err) {
      console.error(err)
      process.exit(1)
    } else {
      console.log(`Built to ${appPaths}`)
    }
  })
})

/**
 * The additional packager options not included in the existing typing.
 *
 * See https://github.com/desktop/desktop/issues/2429 for some history on this.
 */
interface IPackageAdditionalOptions {
  readonly protocols: ReadonlyArray<{
    readonly name: string
    readonly schemes: ReadonlyArray<string>
  }>
}

function packageApp(
  callback: (error: Error | null, appPaths: string | string[]) => void
) {
  // not sure if this is needed anywhere, so I'm just going to inline it here
  // for now and see what the future brings...
  const toPackagePlatform = (platform: NodeJS.Platform) => {
    if (platform === 'win32' || platform === 'darwin' || platform === 'linux') {
      return platform
    }
    throw new Error(
      `Unable to convert to platform for electron-packager: '${process.platform}`
    )
  }

  const options: packager.Options & IPackageAdditionalOptions = {
    name: getExecutableName(),
    platform: toPackagePlatform(process.platform),
    arch: 'x64',
    asar: false, // TODO: Probably wanna enable this down the road.
    out: path.join(projectRoot, 'dist'),
    icon: path.join(projectRoot, 'app', 'static', 'logos', 'icon-logo'),
    dir: outRoot,
    overwrite: true,
    tmpdir: false,
    derefSymlinks: false,
    prune: false, // We'll prune them ourselves below.
    ignore: [
      new RegExp('/node_modules/electron($|/)'),
      new RegExp('/node_modules/electron-packager($|/)'),
      new RegExp('/\\.git($|/)'),
      new RegExp('/node_modules/\\.bin($|/)'),
    ],
    appCopyright: 'Copyright © 2017 GitHub, Inc.',

    // macOS
    appBundleId: distInfo.getBundleID(),
    appCategoryType: 'public.app-category.developer-tools',
    osxSign: true,
    protocols: [
      {
        name: distInfo.getBundleID(),
        schemes: [
          isPublishableBuild
            ? 'x-github-desktop-auth'
            : 'x-github-desktop-dev-auth',
          'x-github-client',
          'github-mac',
        ],
      },
    ],

    // Windows
    win32metadata: {
      CompanyName: distInfo.getCompanyName(),
      FileDescription: '',
      OriginalFilename: '',
      ProductName: distInfo.getProductName(),
      InternalName: distInfo.getProductName(),
    },
  }

  packager(options, (err: Error, appPaths: string | string[]) => {
    if (err) {
      callback(err, appPaths)
    } else {
      callback(null, appPaths)
    }
  })
}

function removeAndCopy(source: string, destination: string) {
  fs.removeSync(destination)
  fs.copySync(source, destination)
}

function copyEmoji() {
  const emojiImages = path.join(projectRoot, 'gemoji', 'images', 'emoji')
  const emojiImagesDestination = path.join(outRoot, 'emoji')
  removeAndCopy(emojiImages, emojiImagesDestination)

  const emojiJSON = path.join(projectRoot, 'gemoji', 'db', 'emoji.json')
  const emojiJSONDestination = path.join(outRoot, 'emoji.json')
  removeAndCopy(emojiJSON, emojiJSONDestination)
}

function copyStaticResources() {
  const dirName = process.platform
  const platformSpecific = path.join(projectRoot, 'app', 'static', dirName)
  const common = path.join(projectRoot, 'app', 'static', 'common')
  const destination = path.join(outRoot, 'static')
  fs.removeSync(destination)
  if (fs.existsSync(platformSpecific)) {
    fs.copySync(platformSpecific, destination)
  }
  fs.copySync(common, destination, { clobber: false })
}

function copyDependencies() {
  const originalPackage: Package = require(path.join(
    projectRoot,
    'app',
    'package.json'
  ))

  const commonConfig = require(path.resolve(__dirname, '../app/webpack.common'))
  const externals = commonConfig.externals
  const oldDependencies = originalPackage.dependencies
  const newDependencies: PackageLookup = {}

  for (const name of Object.keys(oldDependencies)) {
    const spec = oldDependencies[name]
    if (externals.indexOf(name) !== -1) {
      newDependencies[name] = spec
    }
  }

  const oldDevDependencies = originalPackage.devDependencies
  const newDevDependencies: PackageLookup = {}

  if (!isPublishableBuild) {
    for (const name of Object.keys(oldDevDependencies)) {
      const spec = oldDevDependencies[name]
      if (externals.indexOf(name) !== -1) {
        newDevDependencies[name] = spec
      }
    }
  }

  // The product name changes depending on whether it's a prod build or dev
  // build, so that we can have them running side by side.
  const updatedPackage = Object.assign({}, originalPackage, {
    productName: distInfo.getProductName(),
    dependencies: newDependencies,
    devDependencies: newDevDependencies,
  })

  if (isPublishableBuild) {
    delete updatedPackage.devDependencies
  }

  fs.writeFileSync(
    path.join(outRoot, 'package.json'),
    JSON.stringify(updatedPackage)
  )

  fs.removeSync(path.resolve(outRoot, 'node_modules'))

  if (
    Object.keys(newDependencies).length ||
    Object.keys(newDevDependencies).length
  ) {
    console.log('  Installing npm dependencies…')
    cp.execSync('npm install', { cwd: outRoot, env: process.env })
  }

  if (!isPublishableBuild) {
    console.log(
      '  Installing 7zip (dependency for electron-devtools-installer)'
    )

    const sevenZipSource = path.resolve(projectRoot, 'app/node_modules/7zip')
    const sevenZipDestination = path.resolve(outRoot, 'node_modules/7zip')

    fs.mkdirpSync(sevenZipDestination)
    fs.copySync(sevenZipSource, sevenZipDestination)
  }

  console.log('  Copying git environment…')
  const gitDir = path.resolve(outRoot, 'git')
  fs.removeSync(gitDir)
  fs.mkdirpSync(gitDir)
  fs.copySync(path.resolve(projectRoot, 'app/node_modules/dugite/git'), gitDir)

  if (process.platform === 'darwin') {
    console.log('  Copying app-path binary...')
    const appPathMain = path.resolve(outRoot, 'main')
    fs.removeSync(appPathMain)
    fs.copySync(
      path.resolve(projectRoot, 'app/node_modules/app-path/main'),
      appPathMain
    )
  }
}

function updateLicenseDump(callback: (err: Error | null) => void) {
  const appRoot = path.join(projectRoot, 'app')
  const outPath = path.join(outRoot, 'static', 'licenses.json')
  const licenseOverrides: LicenseLookup = require('./license-overrides')

  legalEagle(
    { path: appRoot, overrides: licenseOverrides, omitPermissive: true },
    (err, summary) => {
      if (err) {
        callback(err)
        return
      }

      if (Object.keys(summary).length > 0) {
        const overridesPath = path.join(__dirname, 'license-overrides.js')
        let licensesMessage = ''
        for (const key in summary) {
          const license = summary[key]
          licensesMessage += `${key} (${license.repository}): ${license.license}\n`
        }

        const message = `The following dependencies have unknown or non-permissive licenses. Check it out and update ${overridesPath} if appropriate:\n${licensesMessage}`
        callback(new Error(message))
      } else {
        legalEagle(
          { path: appRoot, overrides: licenseOverrides },
          (err, summary) => {
            if (err) {
              callback(err)
              return
            }

            // legal-eagle still chooses to ignore the LICENSE at the root
            // this injects the current license and pins the source URL before we
            // dump the JSON file to disk
            const licenseSource = path.join(projectRoot, 'LICENSE')
            const licenseText = fs.readFileSync(licenseSource, {
              encoding: 'utf-8',
            })
            const appVersion = getVersion()

            summary[`desktop@${appVersion}`] = {
              repository: 'https://github.com/desktop/desktop',
              license: 'MIT',
              source: `https://github.com/desktop/desktop/blob/release-${appVersion}/LICENSE`,
              sourceText: licenseText,
            }

            fs.writeFileSync(outPath, JSON.stringify(summary), {
              encoding: 'utf8',
            })
            callback(null)
          }
        )
      }
    }
  )
}
