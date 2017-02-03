'use babel';

let oldSortEntries;
let sortType, isDescending;

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

let compareNumeric = (first, second, firstName, secondName) => {
  if (first === second) {
    return compareString(firstName, secondName);
  }
  else {
    return (first > second ? 1 : -1);
  }
};

let normalizeEntryName = (value) => {
  let normalizedValue = value.name;

  return normalizedValue == null ? value : normalizedValue;
};

let getStatsValue = (stats, key) => {
  return stats && stats[key] ? stats[key] : 0;
};

let sort = (first, second, firstName, secondName) => {
  const descending = isDescending ? -1 : 1;
  let firstValue, secondValue;

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
      firstValue = getStatsValue(first.stats, 'size');
      secondValue = getStatsValue(second.stats, 'size');

      return compareNumeric(firstValue, secondValue, firstName, secondName) * descending;

      break;

    case 4:
      firstValue = getStatsValue(first.stats, 'atime');
      secondValue = getStatsValue(second.stats, 'atime');

      return compareNumeric(firstValue, secondValue, firstName, secondName) * descending;

      break;

    case 5:
      firstValue = getStatsValue(first.stats, 'ctime');
      secondValue = getStatsValue(second.stats, 'ctime');

      return compareNumeric(firstValue, secondValue, firstName, secondName) * descending;

      break;

    case 6:
      firstValue = getStatsValue(first.stats, 'mtime');
      secondValue = getStatsValue(second.stats, 'mtime');

      return compareNumeric(firstValue, secondValue, firstName, secondName) * descending;

      break;

    case 7:
      firstValue = getStatsValue(first.stats, 'birthtime');
      secondValue = getStatsValue(second.stats, 'birthtime');

      return compareNumeric(firstValue, secondValue, firstName, secondName) * descending;

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

  activate() {
    atom.packages.activatePackage('tree-view').then((pkg) => {
      if (pkg && pkg.mainModule && pkg.mainModule.treeView) {
        this.treeView = pkg.mainModule.treeView;

        if (!this.treeView.roots[0] || !this.treeView.roots[0].directory) {
          atom.notifications.addWarning('tree-view-sort active failure.');

          return;
        }

        sortType = atom.config.get('tree-view-sort.type');
        isDescending = atom.config.get('tree-view-sort.descending');

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
      }
    }, (reason) => {
      atom.notifications.addWarning('tree-view-sort active failure.', {
        description: reason.message
      });
    });
  },

  deactivate() {
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
