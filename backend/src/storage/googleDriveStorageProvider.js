const { google } = require('googleapis');
const config = require('../config');
const { MONTH_NAMES } = require('../utils/messBillFormat');
const { Readable } = require('stream');

let driveInstance = null;

function getDriveClient() {
  if (driveInstance) return driveInstance;

  const oauth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleRedirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: config.googleRefreshToken,
  });

  driveInstance = google.drive({ version: 'v3', auth: oauth2Client });
  return driveInstance;
}

/**
 * Find or create a folder in Google Drive
 */
async function getOrCreateFolder(drive, name, parentId = null) {
  const parentQuery = parentId ? `'${parentId}' in parents` : "'root' in parents";
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}' and ${parentQuery} and trashed = false`;

  const response = await drive.files.list({
    q: query,
    spaces: 'drive',
    fields: 'files(id, name)',
  });

  const folders = response.data.files;
  if (folders && folders.length > 0) {
    return folders[0].id;
  }

  const fileMetadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return folder.data.id;
}

/**
 * Save file to Google Drive and return metadata
 */
async function saveFile({ buffer, fileName, mimeType, month, year }) {
  const drive = getDriveClient();
  const monthName = MONTH_NAMES[month - 1] || String(month);

  // Resolve folder structure
  const rootFolderId = await getOrCreateFolder(drive, 'MH App Bills');
  const yearFolderId = await getOrCreateFolder(drive, String(year), rootFolderId);
  const monthFolderId = await getOrCreateFolder(drive, monthName, yearFolderId);

  // Upload file
  const media = {
    mimeType: mimeType,
    body: Readable.from(buffer),
  };

  const fileMetadata = {
    name: fileName,
    parents: [monthFolderId],
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  const fileId = response.data.id;

  // Set file permissions so anyone with link can view/download
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  const viewUrl = response.data.webViewLink;
  const downloadUrl = response.data.webContentLink || `https://docs.google.com/uc?id=${fileId}&export=download`;

  return {
    storageKey: fileId,
    fileId,
    viewUrl,
    downloadUrl,
  };
}

/**
 * Read file from Google Drive
 */
async function readFile(fileId) {
  const drive = getDriveClient();
  const response = await drive.files.get(
    {
      fileId: fileId,
      alt: 'media',
    },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(response.data);
}

/**
 * Delete file from Google Drive
 */
async function removeFile(fileId) {
  if (!fileId) return;
  const drive = getDriveClient();
  try {
    await drive.files.delete({ fileId });
  } catch (err) {
    if (err.status === 404 || err.code === 404) {
      console.warn('[google-drive] File already deleted on Google Drive:', fileId);
    } else {
      console.error('[google-drive] Failed to delete file:', fileId, err.message);
      throw err;
    }
  }
}

/**
 * Remove all mess bill files (triggered on Year-End Reset)
 */
async function removeAllFiles(options = {}) {
  if (options.deleteDriveFiles) {
    const drive = getDriveClient();
    try {
      const query = "mimeType = 'application/vnd.google-apps.folder' and name = 'MH App Bills' and 'root' in parents and trashed = false";
      const response = await drive.files.list({
        q: query,
        spaces: 'drive',
        fields: 'files(id)',
      });
      const folders = response.data.files;
      if (folders && folders.length > 0) {
        for (const folder of folders) {
          console.log('[google-drive] Deleting root folder:', folder.id);
          await drive.files.delete({ fileId: folder.id });
        }
      }
    } catch (err) {
      console.error('[google-drive] Failed to clear files:', err.message);
      throw err;
    }
  }
}

module.exports = {
  name: 'google-drive',
  saveFile,
  readFile,
  removeFile,
  removeAllFiles,
};
