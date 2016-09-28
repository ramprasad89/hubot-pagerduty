var fs, path;

fs = require('fs');

path = require('path');

module.exports = function(robot) {
  var category_file, category_path, file, i, len, ref, results, scripts_path;
  scripts_path = path.resolve(__dirname, 'src');
  if (fs.existsSync(scripts_path)) {
    ref = fs.readdirSync(scripts_path);
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      category_file = ref[i];
      category_path = path.resolve(scripts_path, category_file);
      if (fs.existsSync(category_path)) {
        results.push((function() {
          var j, len1, ref1, results1;
          ref1 = fs.readdirSync(category_path);
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            file = ref1[j];
            results1.push(robot.loadFile(category_path, file));
          }
          return results1;
        })());
      } else {
        results.push(void 0);
      }
    }
    return results;
  }
};
