const fs = require('fs'), path = require('path'), d = __dirname;
const tpl = fs.readFileSync(path.join(d, 'index.tpl.html'), 'utf8');
const js  = fs.readFileSync(path.join(d, 'app.js'), 'utf8');
// replacer FUNCTION, not a string: minified bundles contain `$&` which
// String.replace would expand into the matched marker.
const out = tpl.replace('<!--APP-->', () => '<script type="module">\n' + js + '\n</script>');
fs.writeFileSync(path.join(d, 'index.html'), out);
const bad = out.indexOf('<!--APP--') >= 0;
console.log(d, (fs.statSync(path.join(d,'index.html')).size/1024).toFixed(0)+'KB', bad ? 'ERROR: marker leaked' : 'clean');
