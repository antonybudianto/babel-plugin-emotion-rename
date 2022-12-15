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
    callee: {
      name: string;
    };
    specifiers: Specifier[];
    source: {
      value: string;
    };
  };
}

export interface Tag {
  _type: string;
  name: string;
  path: Path;
}
