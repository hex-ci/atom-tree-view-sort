'use babel';

let oldSortEntries;
let getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export default {

  treeView: null,

  activate() {
    atom.packages.activatePackage('tree-view').then((pkg) => {
      if (pkg && pkg.mainModule && pkg.mainModule.treeView) {
        this.treeView = pkg.mainModule.treeView;

        oldSortEntries = this.treeView.roots[0].directory.constructor.prototype.sortEntries;
        this.treeView.roots[0].directory.constructor.prototype.sortEntries = this.sortEntries;

        this.treeView.updateRoots();
      }
    }, (reason) => {
      atom.notifications.addWarning('tree-view-sort active failure.', {
        description: reason.message
      });
    });
  },

  deactivate() {
  },

  sortEntries(combinedEntries) {
    return combinedEntries.sort((first, second) => {
      const firstName = this.normalizeEntryName(first);
      const secondName = this.normalizeEntryName(second);
      const firstExtName = getFileExtension(firstName);
      const secondExtName = getFileExtension(secondName);

      if (first.constructor.name === 'Directory') {
        if (second.constructor.name === 'Directory') {
          if (firstName.indexOf('.') === 0 && secondName.indexOf('.') !== 0) {
            return -1;
          }
          else if (firstName.indexOf('.') !== 0 && secondName.indexOf('.') === 0) {
            return 1;
          }
          else if (firstName.indexOf('.') === 0 && secondName.indexOf('.') === 0) {
            if (firstExtName.localeCompare(secondExtName) == 0) {
              return firstName.localeCompare(secondName);
            }
            else {
              return firstExtName.localeCompare(secondExtName);
            }
          }
          else {
            return firstName.localeCompare(secondName);
          }
        }
        else {
          return -1;
        }
      }
      else {
        if (second.constructor.name === 'Directory') {
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
            if (firstExtName.localeCompare(secondExtName) == 0) {
              return firstName.localeCompare(secondName);
            }
            else {
              return firstExtName.localeCompare(secondExtName);
            }
          }
        }
      }
    });
  }
};
