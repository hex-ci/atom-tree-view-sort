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
      firstValue = first.stats && first.stats.size ? first.stats.size : 0;
      secondValue = second.stats && second.stats.size ? second.stats.size : 0;

      return compareNumeric(firstValue, secondValue, firstName, secondName) * descending;

      break;

    case 4:
      firstValue = first.stats && first.stats.atime ? first.stats.atime : 0;
      secondValue = second.stats && second.stats.atime ? second.stats.atime : 0;

      return compareNumeric(firstValue, secondValue, firstName, secondName) * descending;

      break;

    case 5:
      firstValue = first.stats && first.stats.ctime ? first.stats.ctime : 0;
      secondValue = second.stats && second.stats.ctime ? second.stats.ctime : 0;

      return compareNumeric(firstValue, secondValue, firstName, secondName) * descending;

      break;

    case 6:
      firstValue = first.stats && first.stats.mtime ? first.stats.mtime : 0;
      secondValue = second.stats && second.stats.mtime ? second.stats.mtime : 0;

      return compareNumeric(firstValue, secondValue, firstName, secondName) * descending;

      break;

    case 7:
      firstValue = first.stats && first.stats.birthtime ? first.stats.birthtime : 0;
      secondValue = second.stats && second.stats.birthtime ? second.stats.birthtime : 0;

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
