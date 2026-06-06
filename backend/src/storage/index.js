const localStorageProvider = require('./localStorageProvider');

function getMessBillStorage() {
  return localStorageProvider;
}

module.exports = {
  getMessBillStorage,
};
