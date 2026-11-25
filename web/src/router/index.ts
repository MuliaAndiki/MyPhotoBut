import { authRouteTree } from './auth.routes'
import { privateRouteTree } from './private.routes'
import { publicRouteTree } from './public.routes'
import { rootRoute } from './root'

export const routeTree = rootRoute.addChildren([
  publicRouteTree,
  authRouteTree,
  privateRouteTree,
])

export { authRouteTree, privateRouteTree, publicRouteTree, rootRoute }
