// userModel.js – simple JSON file based user storage
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const usersFile = path.join(__dirname, 'data', 'users.json');

async function _readUsers() {
  try {
    const data = await fs.readFile(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function _writeUsers(users) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

async function findByEmail(email) {
  const users = await _readUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

async function findById(id) {
  const users = await _readUsers();
  return users.find(u => u.id === id);
}

async function createUser(email, passwordHash, name) {
  const users = await _readUsers();
  const newUser = {
    id: uuidv4(),
    email,
    name: name || email.split("@")[0],
    passwordHash,
    downloads: [] // array of {downloadId, title, poster, size, addedAt, blobKey}
  };
  users.push(newUser);
  await _writeUsers(users);
  return newUser;
}

async function addDownload(userId, downloadInfo) {
  const users = await _readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  user.downloads.push(downloadInfo);
  await _writeUsers(users);
  return downloadInfo;
}

async function listDownloads(userId) {
  const user = await findById(userId);
  return user ? user.downloads : [];
}

async function removeDownload(userId, downloadId) {
  const users = await _readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  const originalLen = user.downloads.length;
  user.downloads = user.downloads.filter(d => d.downloadId !== downloadId);
  await _writeUsers(users);
  return user.downloads.length < originalLen;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  addDownload,
  listDownloads,
  removeDownload
};
