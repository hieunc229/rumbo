import fs from "fs";
import path from "path";
import { ClientRouteProps } from "../clientSSR/utils";
import { formatClassName } from "./text";

export type ResolveImportProps = {
  filePath: string;
  handlePath: string;
};

export type RumboStaticRoute<T = ResolveImportProps> = T & {
  staticImport: any;
  appComponent?: any;
};

export type ResolveImportServerProps = ResolveImportProps & {
  method: string;
};

export function resolveImports<T = ResolveImportProps>(options: {
  route: string;
  location: string;
  type: "server" | "client";
}): T[] {
  const { route, location, type } = options;

  let paths: T[] = [];

  const pathTransform =
    type === "server" ? getRegisterServerPath : getRegisterClientPath;
  const partSort = type === "server" ? sortServerPath : sortClientPath;

  function registerPath(pathRoute: string, _path: string) {
    for (let p of fs.readdirSync(_path)) {
      const fileAbsPath = path.join(_path, p);
      const filePath = path.join(route, pathRoute.replace(route, ""), p);

      if (fs.statSync(fileAbsPath).isDirectory()) {
        registerPath(filePath, fileAbsPath);
        continue;
      }

      if (fileAbsPath.match(/\.(js|ts|tsx|jsx)$/)) {
        paths.push(
          pathTransform({
            filePath: fileAbsPath,
            routePath: filePath,
          }) as any
        );
      }
    }
  }

  registerPath("", location);

  return paths.sort(partSort as any);
}

export function toStaticRoute<T = ResolveImportProps>(
  item: T
): RumboStaticRoute<T> {
  return {
    ...item,
    // @ts-ignore
    staticImport: require(item.filePath),
  };
}

function sortClientPath(a: ResolveImportProps, b: ResolveImportProps) {
  return a.handlePath.localeCompare(b.handlePath);
}

function sortServerPath(
  a: ResolveImportServerProps,
  b: ResolveImportServerProps
) {
  if (a.handlePath === b.handlePath && a.method === "use") {
    return -1;
  }
  return a.handlePath.localeCompare(b.handlePath);
}

function getRegisterClientPath(options: {
  filePath: string;
  routePath: string;
}): ResolveImportProps {
  const { filePath, routePath } = options;
  let [name = ""] = routePath.split(".");
  const handlePath = name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1");

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    filePath,
  };
}

function getRegisterServerPath(options: {
  filePath: string;
  routePath: string;
}): ResolveImportServerProps {
  const { filePath, routePath } = options;
  let parts = (routePath.split(".").shift() || "").split("/");
  let method = parts.pop();
  const name = parts.join("/");

  if (!method || method === "index") {
    method = "get";
  } else if (method === "_middleware") {
    method = "use";
  }

  const handlePath =
    name.replace("index", "").replace(/\[([a-z]+)\]/gi, ":$1") || "/";

  return {
    handlePath: handlePath === "/" ? handlePath : handlePath.replace(/\/$/, ""),
    method,
    filePath,
  };
}

export const layoutRegex = /_layout$/i;
export function importPathsToClientRoutes(props: {
  paths: RumboStaticRoute[];
}) {
  let routes: {
    [path: string]: ClientRouteProps;
  } = {};

  for (let p of props.paths) {
    const pHandlePath = p.handlePath;

    if (!pHandlePath || pHandlePath === "/_context") {
      continue;
    }

    // debug &&
    //   console.log(
    //     `staticImports ssr ${formatClassName(pHandlePath)} (${pFilePath})`
    //   );
    const handler = p.staticImport;
    // (staticImports && staticImports[formatClassName(pHandlePath)]?.import) ||
    // require(pFilePath);
    const isLayout = layoutRegex.test(pHandlePath);
    let data = {};

    let rname = pHandlePath;

    if (isLayout) {
      // rname = pHandlePath.replace(layoutRegex, "");
      data = {
        layout: handler,
        layoutName: formatClassName(p.handlePath),
        layoutPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
      };
    } else {
      data = {
        handler,
        handlerName: formatClassName(p.handlePath),
        handlerPath: p.filePath.replace(/\.(js|ts|tsx)$/g, ""),
      };
    }

    routes[rname] = Object.assign({}, routes[rname], data);
  }

  return routes;
}
