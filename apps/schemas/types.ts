export interface Schema {
  github: string;
  name: string;
  version: string;
  description: string;
  attributes: Attribute[];
}

export interface Attribute {
  name: string;
  type: string;
  key: string;
  description: string;
  isRequired: boolean;
  notes?: string;
}
