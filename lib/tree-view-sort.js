'use babel';

import { CompositeDisposable } from 'atom';
import path from 'path';
import fs from 'fs';

let oldSortEntries,
  isDescending,
  isCaseSensitive,
  isSortFolder,
  sortType,
  oldSortType,
  sortFolders,
  dirsToApplyToRegEx;

const statSyncNoException = (path) => {
  try {
    return fs.statSync(path);
  }
  catch (e) {
    return false;
  }
};

const lstatSyncNoException = (path) => {
  try {
    return fs.lstatSync(path);
  }
  catch (e) {
    return false;
  }
};

const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

const getFileName = (filename) => {
  return filename.slice(0, (filename.lastIndexOf('.') - 1 >>> 0) + 1);
};

const getFileGroup = (filename) => {
  const groups = filename.split('.');

  return groups.length < 3 ? getFileExtension(filename) : groups[groups.length - 2];
};

const isDir = (obj) => {
  if (obj && obj.constructor) {
    return (obj.constructor.name === 'Directory' || obj.__sort__dir === true);
  }
  else {
    return false;
  }
};

const compareString = (first, second) => {
  if (/[^\x00-\x80]/.test(first + second)) {
    return first.localeCompare(second);
  }

  if (first < second) {
    return -1;
  }
  else if (first > second) {
    return 1;
  }
  else {
    return 0;
  }
};

const compareStats = (key, first, second, firstName, secondName) => {
  const firstValue = first.stats && first.stats[key] ? first.stats[key] : 0;
  const secondValue = second.stats && second.stats[key] ? second.stats[key] : 0;

  if (firstValue === secondValue) {
    return compareString(firstName, secondName);
  }
  else {
    return (firstValue > secondValue ? 1 : -1);
  }
};

const normalizeEntryName = (value) => {
  const normalizedValue = value.name;

  return normalizedValue == null ? value : (isCaseSensitive ? normalizedValue : normalizedValue.toLowerCase());
};

const sort = (first, second, firstName, secondName) => {
  const descending = isDescending ? -1 : 1;

  switch (sortType) {
    default:
    case 0:
    case 1:
      return compareString(firstName, secondName) * descending;

    case 9: {
      const firstMainName = getFileName(firstName);
      const secondMainName = getFileName(secondName);
      const result = compareString(firstMainName, secondMainName);

      if (result == 0) {
        const firstExtName = getFileExtension(firstName);
        const secondExtName = getFileExtension(secondName);

        return compareString(firstExtName, secondExtName) * descending;
      }
      else {
        return result * descending;
      }
    }

    case 2: {
      const firstExtName = getFileExtension(firstName);
      const secondExtName = getFileExtension(secondName);
      const result = compareString(firstExtName, secondExtName);

      if (result == 0) {
        return compareString(firstName, secondName) * descending;
      }
      else {
        return result * descending;
      }
    }

    case 3:
      return compareStats('size', first, second, firstName, secondName) * descending;

    case 4:
      return compareStats('atime', first, second, firstName, secondName) * descending;

    case 5:
      return compareStats('ctime', first, second, firstName, secondName) * descending;

    case 6:
      return compareStats('mtime', first, second, firstName, secondName) * descending;

    case 7:
      return compareStats('birthtime', first, second, firstName, secondName) * descending;

    case 8: {
      const firstGroupName = getFileGroup(firstName);
      const secondGroupName = getFileGroup(secondName);
      const result = compareString(firstGroupName, secondGroupName);

      if (result == 0) {
        return compareString(firstName, secondName) * descending;
      }
      else {
        return result * descending;
      }
    }
  }
};

const sortEntries = function(combinedEntries) {
  if (!dirsToApplyToRegEx.test(this.path)) {
    return oldSortEntries(combinedEntries);
  }

  combinedEntries.forEach((name, key) => {
    if (typeof name === 'string') {
      const fullPath = path.join(this.path, name);

      if (this.isPathIgnored(fullPath)) {
        return;
      }

      let stat = lstatSyncNoException(fullPath);

      if (stat.isSymbolicLink && stat.isSymbolicLink()) {
        stat = statSyncNoException(fullPath);
      }

      ['atime', 'birthtime', 'ctime', 'mtime'].forEach((value) => {
        const time = stat[value];

        stat[value] = time ? time.getTime() : 0;
      });

      if (stat.isDirectory && stat.isDirectory()) {
        combinedEntries[key] = {
          __sort__: true,
          __sort__dir: true,
          name: name,
          stats: stat
        };
      }
      else if (stat.isFile && stat.isFile()) {
        combinedEntries[key] = {
          __sort__: true,
          name: name,
          stats: stat
        };
      }
    }
  });

  const result = combinedEntries.sort((first, second) => {
    const firstName = normalizeEntryName(first);
    const secondName = normalizeEntryName(second);

    if (isDir(first) && sortFolders != 0) {
      if (isDir(second)) {
        if (!isSortFolder) {
          return 0;
        }
        else if (firstName.indexOf('.') === 0 && secondName.indexOf('.') !== 0) {
          return -1;
        }
        else if (firstName.indexOf('.') !== 0 && secondName.indexOf('.') === 0) {
          return 1;
        }
        else {
          return sort(first, second, firstName, secondName);
        }
      }
      else {
        return (sortFolders == 1) ? -1 : 1;
      }
    }
    else {
      if (isDir(second) && sortFolders != 0) {
        return (sortFolders == 1) ? 1 : -1;
      }
      else {
        if (firstName.indexOf('.') === 0 && secondName.indexOf('.') !== 0) {
          return -1;
        }
        else if (firstName.indexOf('.') !== 0 && secondName.indexOf('.') === 0) {
          return 1;
        }
        else {
          return sort(first, second, firstName, secondName);
        }
      }
    }
  });

  result.forEach((value, key) => {
    if (value.__sort__ === true) {
      result[key] = value.name;
    }
  });

  return result;
};

export default {

  treeView: null,
  _initialized: false,
  _actived: false,
  timer: null,

  activate() {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'tree-view-sort:toggle': () => {
        const value = atom.config.get('tree-view-sort.type');

        if (value) {
          oldSortType = value;
          atom.config.set('tree-view-sort.type', 0);
        }
        else {
          atom.config.set('tree-view-sort.type', oldSortType);
        }
      }
    }));

    this.subscriptions.add(atom.packages.onDidActivateInitialPackages(() => {
      this._activate();
    }));

    this.timer = setInterval((() => {
      this._activate();
    }), 1000);

    this._activate();

    // atom.packages.activatePackage('tree-view').then((pkg) => {
    //   this._activate(pkg);
    // }, (reason) => {
    //   atom.notifications.addWarning('tree-view-sort active failure.', {
    //     description: reason.message
    //   });
    // });
  },

  deactivate() {
    this.timer = clearInterval(this.timer);
    this.unsetSortEntries();
    this.reload();
    this.subscriptions.dispose();
    this._initialized = false;
    this._actived = false;
  },

  _activate() {
    if (this._actived) {
      return;
    }

    let pkg;

    if (atom.packages.getActivePackage('tree-view')) {
      pkg = atom.packages.getActivePackage('tree-view');
    }

    if (pkg && pkg.mainModule && pkg.mainModule.getTreeViewInstance) {
      this.treeView = pkg.mainModule.getTreeViewInstance();
    }
    else if (pkg && pkg.mainModule && pkg.mainModule.treeView) {
      this.treeView = pkg.mainModule.treeView;
    }

    if (this.treeView) {
      clearInterval(this.timer);

      this._actived = true;

      if (!this.treeView.roots[0] || !this.treeView.roots[0].directory) {
        atom.project.onDidChangePaths(() => {
          this._initialize();
        });

        return;
      }

      this._initialize();
    }
  },

  _initialize() {
    if (this._initialized) {
      return;
    }

    isDescending = atom.config.get('tree-view-sort.descending');
    isCaseSensitive = atom.config.get('tree-view-sort.caseSensitive');
    isSortFolder = atom.config.get('tree-view-sort.isSortFolder');
    sortType = atom.config.get('tree-view-sort.type');
    sortFolders = atom.config.get('tree-view-sort.sortFolders');
    this.setDirsToApplyToRegEx(atom.config.get('tree-view-sort.dirsToApplyToRegEx'));

    // compatible with older versions
    const sortFoldersBeforeFiles = atom.config.get('tree-view-sort.sortFoldersBeforeFiles');
    if (typeof sortFoldersBeforeFiles != 'undefined') {
      const settings = atom.config.get('tree-view-sort');
      delete settings.sortFoldersBeforeFiles;
      settings.sortFolders = (sortFoldersBeforeFiles) ? 1 : 0;
      atom.config.set('tree-view-sort', settings);
      sortFolders = settings.sortFolders;
    }

    oldSortEntries = this.treeView.roots[0].directory.constructor.prototype.sortEntries;

    if (sortType) {
      this.setSortEntries();
      this.reload();
    }

    this.subscriptions.add(atom.config.onDidChange('tree-view-sort.type', ({newValue}) => {
      sortType = newValue;

      if (sortType) {
        this.setSortEntries();
      }
      else {
        this.unsetSortEntries();
      }

      this.reload();
    }));

    this.subscriptions.add(atom.config.onDidChange('tree-view-sort.descending', ({newValue}) => {
      isDescending = newValue;

      if (sortType) {
        this.reload();
      }
    }));

    this.subscriptions.add(atom.config.onDidChange('tree-view-sort.caseSensitive', ({newValue}) => {
      isCaseSensitive = newValue;

      if (sortType) {
        this.reload();
      }
    }));

    this.subscriptions.add(atom.config.onDidChange('tree-view-sort.isSortFolder', ({newValue}) => {
      isSortFolder = newValue;

      if (sortType) {
        this.reload();
      }
    }));

    this.subscriptions.add(atom.config.onDidChange('tree-view-sort.sortFolders', ({newValue}) => {
      sortFolders = newValue;

      if (sortType) {
        this.reload();
      }
    }));

    this.subscriptions.add(atom.config.onDidChange('tree-view-sort.dirsToApplyToRegEx', ({newValue}) => {
      this.setDirsToApplyToRegEx(newValue);

      if (sortType) {
        this.reload();
      }
    }));

    this._initialized = true;
  },

  setDirsToApplyToRegEx(regExString) {
    try {
      dirsToApplyToRegEx = new RegExp(regExString);
    }
    catch (err) {
      dirsToApplyToRegEx = new RegExp('^/dev/null$');

      console.error(`Unable to parse regex "${regExString}"`);

      atom.notifications.addWarning('Tree View Sort Configuration Error', {
        detail: '"Directories to apply to" Reg Ex is invalid',
        dismissable: true
      });
    }
  },

  setSortEntries() {
    this.treeView.roots[0].directory.constructor.prototype.sortEntries = sortEntries;
  },

  unsetSortEntries() {
    this.treeView.roots[0].directory.constructor.prototype.sortEntries = oldSortEntries;
  },

  reload() {
    if (this.treeView) {
      this.treeView.updateRoots();
    }
  }
};
