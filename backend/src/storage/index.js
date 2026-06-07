const config = require('../config');
const localStorageProvider = require('./localStorageProvider');
const googleDriveStorageProvider = require('./googleDriveStorageProvider');

function getMessBillStorage() {
  const provider = config.storageProvider || 'local';
  if (provider === 'google-drive') {
    return googleDriveStorageProvider;
  }
  return localStorageProvider;
}

function getStorageProviderByName(name) {
  if (name === 'google-drive') {
    return googleDriveStorageProvider;
  }
  return localStorageProvider;
}

module.exports = {
  getMessBillStorage,
  getStorageProviderByName,
};
