
/**
 * @description We strive to align with the JSON Schema specification
 * @see https://json-schema.org/specification
 */
export interface Schema {
  /**
   * @description The unique identifier for the schema
  */
  $id: string;

  /**
  * TODO: Not in spec atm
  */
  source: string;

  /**
  * @description The title of the schema (required by JSON Schema)
  */
  title: string;

  /**
  * TODO: Not in spec atm (should be optional)
  */
  version: string;

  /**
  * @description The description of the schema
  */
  description: string;

  /**
  * @description The type of the schema (required by JSON Schema) MUST be 'object'
  */
  type: 'object';

  /**
  * @description The properties of the schema (required by JSON Schema)
  */
  properties: { [key: string]: Attribute };

  /**
  * @description Required keys get listed in here for JSON schema validation
  */
  required?: string[];

  /**
  * @description Pattern properties get listed in here for JSON schema validation (each key is a regex pattern)
  */
  patternProperties?: { [key: string]: Attribute };
}

export interface Attribute {
  type: string;

  /**
  * @description The description of the attribute
  */
  description: string;

  /**
  * TODO: This needs to be moved to the JSON Schema required property format
  */
  isRequired: boolean;

  /**
  * @description An optional field specifying the format of the attribute - https://www.learnjsonschema.com/2020-12/format-assertion/format/
  */
  format?: string;

  /**
  * @description An optional field specifying which type of record to request from the resolver (text() or data())
  */
  recordType?: 'text' | 'data';
}
