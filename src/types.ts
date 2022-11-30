export interface Specifier {
  type: string;
}

export interface Body {
  argument: {
    tag: {
      name;
    };
    callee: {
      name;
    };
  };
}

export interface Path {
  scope: {
    block: {
      body: {
        body: Body[];
      };
    };
  };
  node: {
    specifiers: Specifier[];
    source: {
      value: string;
    };
  };
}

export interface Tag {
  name: string;
  path: Path;
}
