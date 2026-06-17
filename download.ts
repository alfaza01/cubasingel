import https from 'https';
import fs from 'fs';

const file = fs.createWriteStream('./public/logo.png');

https.get('https://i.postimg.cc/Y9C1pwyn/file-00000000013871fa95757ef4e0b767fa.png', (res) => {
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download Completed');
  });
});
