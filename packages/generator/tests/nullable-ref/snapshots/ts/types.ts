export interface Address {
  city: string;
  zip?: string;
}

export interface Person {
  id: number;
  name: string;
  homeAddress: Address | null;
  workAddress?: Address;
}
