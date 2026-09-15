const fs = require('fs'), path = require('path');
const d = __dirname;
const tpl = fs.readFileSync(path.join(d, 'index.tpl.html'), 'utf8');
const js = fs.readFileSync(path.join(d, 'app.js'), 'utf8');
fs.writeFileSync(path.join(d, 'index.html'), tpl.replace('<!--APP-->', '<script type="module">\n' + js + '\n</script>'));
console.log('built demo/index.html', (fs.statSync(path.join(d, 'index.html')).size / 1024).toFixed(0) + 'KB');
