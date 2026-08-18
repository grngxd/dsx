declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }

  interface Element {
    type: any;
    props: any;
    children: any;
  }

  interface ElementChildrenAttribute {
    children: any;
  }
}

export { };

