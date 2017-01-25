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

let sort = (first, second, firstName, secondName) => {
  const descending = isDescending ? -1 : 1;

  switch (sortType) {
    default:
    case 0:
    case 1:
      return firstName.localeCompare(secondName) * descending;

      break;

    case 2:
      const firstExtName = getFileExtension(firstName);
      const secondExtName = getFileExtension(secondName);

      if (firstExtName.localeCompare(secondExtName) == 0) {
        return firstName.localeCompare(secondName) * descending;
      }
      else {
        return firstExtName.localeCompare(secondExtName) * descending;
      }

      break;

    case 3:
      if (first.stats.size === second.stats.size) {
        return firstName.localeCompare(secondName) * descending;
      }
      else {
        return (first.stats.size > second.stats.size ? 1 * descending : -1 * descending);
      }

      break;

    case 4:
      if (first.stats.atime === second.stats.atime) {
        return firstName.localeCompare(secondName) * descending;
      }
      else {
        return (first.stats.atime > second.stats.atime ? 1 * descending : -1 * descending);
      }

      break;

    case 5:
      if (first.stats.ctime === second.stats.ctime) {
        return firstName.localeCompare(secondName) * descending;
      }
      else {
        return (first.stats.ctime > second.stats.ctime ? 1 * descending : -1 * descending);
      }

      break;

    case 6:
      if (first.stats.mtime === second.stats.mtime) {
        return firstName.localeCompare(secondName) * descending;
      }
      else {
        return (first.stats.mtime > second.stats.mtime ? 1 * descending : -1 * descending);
      }

      break;
  }
};

let sortEntries = function(combinedEntries) {
  return combinedEntries.sort((first, second) => {
    const firstName = this.normalizeEntryName(first);
    const secondName = this.normalizeEntryName(second);

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
