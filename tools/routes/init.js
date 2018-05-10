import options from './../options';

const { modules } = options;
const DEFAULT_ORDER_WEIGHT = 100;

export function routers(app) {
  const routes = [];
  Object.keys(modules).forEach(moduleName => {
    if (
      modules[moduleName] &&
      modules[moduleName].hasOwnProperty('router')
    ) {
      routes.push(modules[moduleName].router);
    }
  });
  const ordered = routes.sort((a, b) => {
    const aWeight = a.orderWeight || DEFAULT_ORDER_WEIGHT;
    const bWeight = b.orderWeight || DEFAULT_ORDER_WEIGHT;
    if (aWeight > bWeight) return 1;
    if (aWeight < bWeight) return -1;
    return 0;
  });

  ordered.forEach(routeInfo => {
    const { route, router } = routeInfo;
    app.use(options.config.rootApi + route, router);
  });
}
