const fs = require('fs/promises');
const path = require('path');
const config = require('../config');
const { MESS_BILLS_PREFIX } = require('./storageKey');

function getStorageRoot() {
  return path.resolve(config.messBillStorageDir);
}

function resolveLocalPath(storageKey) {
  const root = getStorageRoot();
  const relative = storageKey.startsWith(MESS_BILLS_PREFIX)
    ? storageKey.slice(MESS_BILLS_PREFIX.length)
    : storageKey;
  const resolved = path.resolve(root, relative);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (!resolved.startsWith(rootWithSep) && resolved !== root) {
    throw new Error('INVALID_FILE');
  }
  return resolved;
}

async function ensureParentDir(storageKey) {
  const filePath = resolveLocalPath(storageKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function saveFile({ buffer, storageKey }) {
  await ensureParentDir(storageKey);
  await fs.writeFile(resolveLocalPath(storageKey), buffer);
  return storageKey;
}

async function readFile(storageKey) {
  return fs.readFile(resolveLocalPath(storageKey));
}

async function removeFile(storageKey) {
  if (!storageKey) return;
  try {
    await fs.unlink(resolveLocalPath(storageKey));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[local-storage] Failed to delete file:', storageKey, err.message);
      throw err;
    }
  }
}

async function removeAllFiles() {
  const root = getStorageRoot();
  try {
    await fs.rm(root, { recursive: true, force: true });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[local-storage] Failed to clear storage directory:', err.message);
      throw err;
    }
  }
}

module.exports = {
  name: 'local',
  saveFile,
  readFile,
  removeFile,
  removeAllFiles,
};
