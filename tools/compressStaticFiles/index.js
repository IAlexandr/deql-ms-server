import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
var useragent = require('useragent');
var originalFiles = {};
var deflateFiles = {};
var gzipFiles = {};

// папки которые нужно сжимать в папке deck\client\build\static
const Folders = ['js', 'css'];
var constPath = './';

//чтение файлов
if (
  fs.existsSync(path.resolve(process.cwd(), constPath + 'build')) &&
  fs.existsSync(path.resolve(process.cwd(), constPath + 'build/static'))
) {
  Folders.forEach(folder => {
    if (
      fs.existsSync(
        path.resolve(process.cwd(), constPath + 'build/static/' + folder)
      )
    ) {
      fs
        .readdirSync(
          path.resolve(process.cwd(), constPath + 'build/static/' + folder)
        )
        .forEach(fileName => {
          if (fileName.split('.').length > 2) {
            originalFiles[folder + '/' + fileName] = fs.readFileSync(
              path.resolve(
                process.cwd(),
                constPath + 'build/static/' + folder + '/' + fileName
              ),
              'utf-8'
            );
          }
        });
    } else {
      console.error(
        'Не найдена папка ',
        constPath + 'build/static/' + folder,
        'поиск в ',
        path.resolve(process.cwd(), constPath + 'build/static/')
      );
    }
  });
}

var infoOrig = 0;
var infoZip = 0;

//сжатие файлов
Object.keys(originalFiles).forEach(fileName => {
  deflateFiles[fileName] = zlib.deflateSync(originalFiles[fileName]);
  gzipFiles[fileName] = zlib.deflateSync(originalFiles[fileName]);
  //для инфо
  infoOrig += originalFiles[fileName].length;
  infoZip += gzipFiles[fileName].length;
});
console.log(
  'Было сжато',
  Object.keys(originalFiles).length,
  'файла.',
  'Оригинальный размер:',
  infoOrig / (1024 * 1024),
  'MB. Сжатый размер:',
  infoZip / (1024 * 1024),
  'MB.'
);

//добавление роутов в сервер
export default function(app) {
  Object.keys(originalFiles).forEach(fileName => {
    app.use('/static/' + fileName, (req, res, next) => {
      try {
        if (useragent.parse(req.headers['user-agent']).family === 'IE') {
          return next();
        }
        var acceptEncoding = req.headers['accept-encoding'];

        if (acceptEncoding && acceptEncoding.indexOf('deflate') > -1) {
          res.set('Content-Encoding', 'deflate');

          return res.end(deflateFiles[fileName]);
        } else {
          if (acceptEncoding && acceptEncoding.indexOf('gzip') > -1) {
            res.set('Content-Encoding', 'gzip');
            return res.end(gzipFiles[fileName]);
          } else {
            return res.end(originalFiles[fileName]);
          }
        }
      } catch (e) {
        console.error(e);
        next();
      }
    });
  });
}
