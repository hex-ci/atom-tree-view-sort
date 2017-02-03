'use babel';

let oldSortEntries, sortType, isDescending, isCaseSensitive;

let getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

let isDir = (obj) => {
  if (obj && obj.constructor) {
    return (obj.constructor.name === 'Directory');
  }
  else {
    return false;
  }
};

let compareString = (first, second) => {
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

let compareStats = (key, first, second, firstName, secondName) => {
  const firstValue = first.stats && first.stats[key] ? first.stats[key] : 0;
  const secondValue = second.stats && second.stats[key] ? second.stats[key] : 0;

  if (firstValue === secondValue) {
    return compareString(firstName, secondName);
  }
  else {
    return (firstValue > secondValue ? 1 : -1);
  }
};

let normalizeEntryName = (value) => {
  let normalizedValue = value.name;

  return normalizedValue == null ? value : (isCaseSensitive ? normalizedValue : normalizedValue.toLowerCase());
};

let sort = (first, second, firstName, secondName) => {
  const descending = isDescending ? -1 : 1;

  switch (sortType) {
    default:
    case 0:
    case 1:
      return compareString(firstName, secondName) * descending;

      break;

    case 2:
      const firstExtName = getFileExtension(firstName);
      const secondExtName = getFileExtension(secondName);
      const result = compareString(firstExtName, secondExtName);

      if (result == 0) {
        return compareString(firstName, secondName) * descending;
      }
      else {
        return result * descending;
      }

      break;

    case 3:
      return compareStats('size', first, second, firstName, secondName) * descending;

      break;

    case 4:
      return compareStats('atime', first, second, firstName, secondName) * descending;

      break;

    case 5:
      return compareStats('ctime', first, second, firstName, secondName) * descending;

      break;

    case 6:
      return compareStats('mtime', first, second, firstName, secondName) * descending;

      break;

    case 7:
      return compareStats('birthtime', first, second, firstName, secondName) * descending;

      break;
  }
};

let sortEntries = function(combinedEntries) {
  return combinedEntries.sort((first, second) => {
    const firstName = normalizeEntryName(first);
    const secondName = normalizeEntryName(second);

    if (isDir(first)) {
      if (isDir(second)) {
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
      else {
        return -1;
      }
    }
    else {
      if (isDir(second)) {
        return 1;
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
};

export default {

  treeView: null,
  initialized: false,

  activate() {
    atom.packages.activatePackage('tree-view').then((pkg) => {
      if (pkg && pkg.mainModule && pkg.mainModule.treeView) {
        this.treeView = pkg.mainModule.treeView;

        if (!this.treeView.roots[0] || !this.treeView.roots[0].directory) {
          atom.project.onDidChangePaths(() => {
            this.initialize();
          });

          return;
        }

        this.initialize();
      }
    }, (reason) => {
      atom.notifications.addWarning('tree-view-sort active failure.', {
        description: reason.message
      });
    });
  },

  deactivate() {
  },

  initialize() {
    if (this.initialized) {
      return;
    }

    sortType = atom.config.get('tree-view-sort.type');
    isDescending = atom.config.get('tree-view-sort.descending');
    isCaseSensitive = atom.config.get('tree-view-sort.caseSensitive');

    oldSortEntries = this.treeView.roots[0].directory.constructor.prototype.sortEntries;

    if (sortType) {
      this.setSortEntries();
      this.reload();
    }

    atom.config.onDidChange('tree-view-sort.type', ({newValue, oldValue}) => {
      sortType = newValue;

      if (sortType) {
        this.setSortEntries();
      }
      else {
        this.unsetSortEntries();
      }

      this.reload();
    });

    atom.config.onDidChange('tree-view-sort.descending', ({newValue, oldValue}) => {
      isDescending = newValue;

      if (sortType) {
        this.reload();
      }
    });

    atom.config.onDidChange('tree-view-sort.caseSensitive', ({newValue, oldValue}) => {
      isCaseSensitive = newValue;

      if (sortType) {
        this.reload();
      }
    });

    this.initialized = true;
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
