import { routers } from './init';

export default function(app) {
  routers(app);

  //app.use(express.static(path.resolve(process.cwd(), 'client/build/')));
}
