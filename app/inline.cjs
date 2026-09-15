const fs=require('fs'),path=require('path'),d=__dirname;
const tpl=fs.readFileSync(path.join(d,'index.tpl.html'),'utf8');
const js=fs.readFileSync(path.join(d,'app.js'),'utf8');
const out=tpl.replace('<!--APP-->',()=>'<script type="module">\n'+js+'\n</script>');
fs.writeFileSync(path.join(d,'index.html'),out);
console.log('built',(fs.statSync(path.join(d,'index.html')).size/1024).toFixed(0)+'KB',
  out.indexOf('<!--APP--')>=0?'ERROR marker leaked':'clean');
