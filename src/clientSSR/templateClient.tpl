import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useRouteError } from "react-router-dom";

import { AppContextProvider } from "rumbo/context";

{{imports}}

declare global {
  let __context: any;
}

type Props = {
  routes: { path: string, Component?: any, element?: any }[],
  data: any,
  settings: any
}

function ErrorBoundary() {
  let error = useRouteError();
  // Uncaught ReferenceError: path is not defined
  return <div>Error: {error?.toString()}</div>;
}

function ClientApp(props: Props) {
  const routes = props.routes.map((r) => ({
        path: r.path,
        element: r.element,
        Component: r.Component,
        errorElement: <ErrorBoundary />,
      }))

    if (props.settings.clientUseRouter) {
      const currentRoute = routes[0];
      return currentRoute.Component ? createElement(currentRoute.Component) : currentRoute.element
    }
  let router = createBrowserRouter(routes);


  const Children = <AppContextProvider router={router} serverData={props.data}>{{htmlComponent}}</AppContextProvider>;

  if (typeof __context !== "undefined") {
    return (<__context.Provider value={props.data}>{Children}</__context.Provider>)
  }


  return <>{Children}</>
}


if (typeof document !== "undefined") {
  const root = document.querySelector("#root");
  if (root) {
    const routes = [{{routes}}];
    const {data={},settings={}} = JSON.parse(document.querySelector("#ssr-data")?.innerHTML || "{}");
    hydrateRoot(root, <ClientApp routes={routes} settings={settings} data={data} />);
  }
}