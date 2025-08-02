export type Component = (props: ComponentProps) => VNode;
export type ComponentProps =  Record<string, any> & {
    children?: any;
}

export type VNode = {
    type: string | Component;
    props: Record<string, any>;
    children: any;
    key?: string | number;
};