import { Component, createContext, useContext } from "react";
import { useLocation } from "react-router-dom";

const defaultContextValues = {
  serverData: null,
  router: null,
  session: null,
  fetchServerData() {},
};

export const AppContext =
  createContext<RumboAppContextProps>(defaultContextValues);

type Props = {
  children: any;
  router?: any;
  serverData: any;
  session: any;
  routes?: { path: string; Component?: any; element?: any; props?: any }[];
};

var currentRoute: string;

export class AppContextProvider extends Component<Props> {
  override state: RumboAppContextProps;
  routeChangeListener: any;
  mouted = false;

  constructor(props: Props) {
    super(props);

    this.state = Object.assign({}, defaultContextValues, {
      serverData: props.serverData || {},
      session: props.session,
    });

    if (props.router) {
      this.routeChangeListener = props.router.subscribe(
        this.handleRouteChange.bind(this)
      );
      currentRoute = props.router.location?.pathname;
    }
  }

  componentDidMount(): void {
    this.mouted = true;
  }

  componentWillUnmount(): void {
    this.routeChangeListener && this.routeChangeListener();
  }

  private handleRouteChange(props: { location: Location }) {
    if (!this.mouted || !props) return;

    const path = props.location?.pathname;
    if (currentRoute !== path) {
      currentRoute = path;

      // TODO: flag if route has getServerProps
      // if not, skip checking
      if (path in this.state.serverData === false) {
        this.fetchData(path);
      }
    }
  }

  private fetchData(path: string) {
    fetch(`${path}?___json=true`)
      .then((rs) => {
        if (rs.headers.get("content-type")?.includes("application/json")) {
          return rs.json();
        }
      })
      .then((data) => {
        let serverData = this.state;
        // @ts-ignore
        serverData[path] = data || null;
        this.setState({ serverData });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  private updateContext = (changes: Partial<Props>) => {
    this.setState(changes);
  };

  override render() {
    const ctxValues = {
      ...this.state,
      router: this.props.router,
      serverData: this.state.serverData,
      updateContext: this.updateContext,
      publicSession: this.props.serverData?.__meta?.publicSession
    };

    return (
      <AppContext.Provider value={ctxValues}>
        {this.props.children}
      </AppContext.Provider>
    );
  }
}

/**
 * @deprecated Replaced with useServerProps
 */
export const userServerData = useServerProps;

export function useServerProps<T = any>(path?: string): T | null {
  const ctx = useContext(AppContext);
  if (ctx.serverData) {
    const r = path ? path : useLocation().pathname;

    if (r in ctx.serverData) {
      return ctx.serverData[r];
    }

    ctx.fetchServerData(path || "/");
  }
  return null;
}



export function useSession() {
  const ctx = useContext(AppContext);
  return ctx?.session || {};
}

export function useAppContext() {
  return useContext(AppContext);
}
