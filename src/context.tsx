import { Component, createContext, useContext } from "react";

export type AppContextProps = {
  serverData: any | null;
  router: any | null;
  session: any | null
};

const defaultContextValues = {
  serverData: null,
  router: null,
  session: null
};

export const AppContext = createContext<AppContextProps>(defaultContextValues);

type Props = {
  children: any;
  router?: any;
  serverData: any;
  session: any
};

export class AppContextProvider extends Component<Props> {
  override state: AppContextProps;

  constructor(props: Props) {
    super(props);

    this.state = defaultContextValues;
  }

  private updateContext = (changes: Partial<Props>) => {
    this.setState(changes);
  };

  override render() {
    const ctxValues = {
      ...this.state,
      router: this.props.router,
      serverData: this.props.serverData,
      updateContext: this.updateContext,
    };

    return (
      <AppContext.Provider value={ctxValues}>
        {this.props.children}
      </AppContext.Provider>
    );
  }
}

export function useServerData<T = any>(): T {
  const ctx = useContext(AppContext);
  return ctx?.serverData || {};
}

export function useSession() {
  const ctx = useContext(AppContext);
  return ctx?.session || {};
}


export function useAppContext() {
  return useContext(AppContext);
}