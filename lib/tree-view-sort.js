'use babel';

export default {

  treeView: null,

  activate() {
    var me = this;

    atom.packages.activatePackage('tree-view').done(function(pkg){
      me.treeView = me.getTreeView();

      if (me.treeView) {
        me.treeView.roots[0].directory.constructor.prototype.sortEntries = me.sortEntries;

        me.treeView.updateRoots();
      }
    });
  },

  deactivate() {
  },

  getTreeView: function() {
    let treeViewPkg;

    if (this.treeView == null) {
      if (atom.packages.getActivePackage('tree-view') != null) {
        treeViewPkg = atom.packages.getActivePackage('tree-view');
      }
      if (treeViewPkg && treeViewPkg.mainModule && treeViewPkg.mainModule.treeView) {
        return treeViewPkg.mainModule.treeView;
      }
      else {
        return null;
      }
    }
    else {
      return this.treeView;
    }
  },

  sortEntries: function(combinedEntries) {
    let directories = [];
    let files = [];

    combinedEntries.forEach(function(item){
      if (item.constructor.name === 'Directory') {
        directories.push(item);
      }
      else {
        files.push(item);
      }
    });

    files.sort((function(_this) {
      return function(first, second) {
        let firstBaseName, firstExtName, firstFullName, firstName, secondBaseName, secondExtName, secondFullName, secondName;
        firstName = _this.normalizeEntryName(first);
        secondName = _this.normalizeEntryName(second);
        firstExtName = path.extname(firstName);
        secondExtName = path.extname(secondName);
        firstBaseName = path.basename(firstName, firstExtName);
        secondBaseName = path.basename(secondName, secondExtName);
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
          firstFullName = firstExtName + firstBaseName;
          secondFullName = secondExtName + secondBaseName;
          return firstFullName.localeCompare(secondFullName);
        }
      };
    })(this));

    combinedEntries = directories.concat(files);

    if (atom.config.get('tree-view.sortFoldersBeforeFiles')) {
      return combinedEntries;
    }
    else {
      return combinedEntries.sort((function(_this) {
        return function(first, second) {
          var firstName, secondName;
          firstName = _this.normalizeEntryName(first);
          secondName = _this.normalizeEntryName(second);
          return firstName.localeCompare(secondName);
        };
      })(this));
    }
  }
};
