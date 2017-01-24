'use babel';

import path from 'path';

let oldSortEntries;

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
    if (atom.config.get('tree-view.sortFoldersBeforeFiles')) {
      let directories = [];
      let files = [];

      combinedEntries.forEach((item) => {
        if (item.constructor.name === 'Directory') {
          directories.push(item);
        }
        else {
          files.push(item);
        }
      });

      files.sort((first, second) => {
        const firstName = this.normalizeEntryName(first);
        const secondName = this.normalizeEntryName(second);
        const firstExtName = path.extname(firstName);
        const secondExtName = path.extname(secondName);
        const firstBaseName = path.basename(firstName, firstExtName);
        const secondBaseName = path.basename(secondName, secondExtName);

        if (firstBaseName.indexOf('.') === 0 && secondBaseName.indexOf('.') !== 0) {
          return -1;
        }
        else if (firstBaseName.indexOf('.') !== 0 && secondBaseName.indexOf('.') === 0) {
          return 1;
        }
        else if (firstExtName === '' && secondExtName !== '') {
          return -1;
        }
        else if (firstExtName !== '' && secondExtName === '') {
          return 1;
        }
        else {
          const firstFullName = firstExtName + firstBaseName;
          const secondFullName = secondExtName + secondBaseName;

          return firstFullName.localeCompare(secondFullName);
        }
      });

      return directories.concat(files);
    }
    else {
      return combinedEntries.sort((first, second) => {
        const firstName = this.normalizeEntryName(first);
        const secondName = this.normalizeEntryName(second);

        return firstName.localeCompare(secondName);
      });
    }
  }
};
