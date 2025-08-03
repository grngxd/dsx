export type Component<P = {}> = (props: P) => VNode<P>;

export type VNode<P = {}> = {
    type: string | Component<P>;
    props: P;
    children: any;
    key?: string | number;
};