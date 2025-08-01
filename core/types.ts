export type Component = (props: Record<string, any>) => VNode;

export type VNode = {
    type: string | Component;
    props: Record<string, any>;
    children: Array<VNode | string | number>;
    key?: string | number;
};