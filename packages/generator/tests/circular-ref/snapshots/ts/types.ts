export interface Category {
  id: number;
  name: string;
  parent?: Category;
  children?: Category[];
}

export interface TreeNode {
  value: string;
  left?: TreeNode;
  right?: TreeNode;
}
