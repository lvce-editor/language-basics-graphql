import { execaCommand } from 'execa'
import { createHash } from 'node:crypto'
import { copyFile, readdir, readFile, rm } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPOSITORY = 'https://github.com/graphql-compose/graphql-compose-examples'
const COMMIT = '8677f359f35a70d4a52c42b07cc30931ba78208f'

const getTestName = (rootFolder, line) => {
  return (
    'graphql-compose-examples-' +
    line
      .slice(rootFolder.length + 1)
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')
      .replaceAll('/', '-')
      .replaceAll('\\', '-')
      .replaceAll('_', '-')
      .replaceAll('.graphql', '.gql')
      .replaceAll(/\-+/g, '-')
  )
}

const getAllTestsInternal = async (
  allTests,
  seenHashes,
  rootFolder,
  folder
) => {
  const dirents = await readdir(folder, { withFileTypes: true })
  for (const dirent of dirents) {
    const filePath = `${folder}/${dirent.name}`
    if (dirent.isDirectory()) {
      await getAllTestsInternal(allTests, seenHashes, rootFolder, filePath)
      continue
    }
    if (!dirent.name.endsWith('.graphql') && !dirent.name.endsWith('.gql')) {
      continue
    }
    if (dirent.name.includes('.v')) {
      continue
    }
    const buffer = await readFile(filePath)
    const hash = createHash('sha1').update(buffer).digest('hex')
    if (seenHashes.includes(hash)) {
      continue
    }
    seenHashes.push(hash)
    const name = getTestName(rootFolder, filePath)
    const destinationPath = join(root, 'test', 'cases', name)
    allTests.push({ filePath, destinationPath })
  }
  return allTests
}

const getAllTests = async (folder) => {
  const allTests = []
  const seenHashes = []
  await getAllTestsInternal(allTests, seenHashes, folder, folder)
  return allTests
}

const main = async () => {
  process.chdir(root)
  await rm(`${root}/.tmp`, { recursive: true, force: true })
  await execaCommand(`git clone ${REPOSITORY} .tmp/graphql-compose-examples`, {
    stdio: 'inherit',
  })
  process.chdir(`${root}/.tmp/graphql-compose-examples`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  const allTests = await getAllTests(
    `${root}/.tmp/graphql-compose-examples/examples`
  )
  for (const test of allTests) {
    await copyFile(test.filePath, test.destinationPath)
  }
}

main()
