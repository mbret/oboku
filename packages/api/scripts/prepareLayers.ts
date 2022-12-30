import packageJson from '../package.json'
import * as fs from 'fs'
import * as util from 'util'
import { exec as _exec } from 'child_process'
import * as serverlessConfiguration from '../serverless'

const exec = util.promisify(_exec)

const externals: string[] = (serverlessConfiguration as any).custom.bundle.externals;

(async () => {
  // clean layers folder
  console.log(await exec(`rm -rf layers/nodejs/node_modules`))

  const keepDependencies: any = {}

  const dependencies = packageJson.dependencies

  Object.keys(dependencies).forEach(key => {
    if (externals.find(external => (key.match(external) ?? []).length > 0)) {
      keepDependencies[key] = dependencies[key as keyof typeof dependencies]
    }
  })

  console.log(`keepDependencies`, keepDependencies)

  // create smaller package.json with externals
  fs.writeFileSync(`layers/nodejs/package.json`, JSON.stringify({
    dependencies: keepDependencies
  }))

  // install new deps
  console.log(await exec(`cd layers/nodejs && npm install`))
})()