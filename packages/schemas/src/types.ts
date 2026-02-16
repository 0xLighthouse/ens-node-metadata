export interface Schema {
  /*
  * @description The unique identifier for the schema.
  */
  $id: string;
  /*
  * TODO: Not in spec atm
  */
  source: string;
  /*
  * @deprecated Use title instead
  */
  name: string;
  /*
  * @description The title of the schema (required by JSON Schema)
 */
  title: string;
  /*
  * TODO: Not in spec atm (should be optional)
 */
  version: string;
  description: string;

  /*
  * @deprecated Use properties instead
  */
  attributes: Attribute[];
  type: 'object';
  /*
  * @description Required by JSON Schema
 */
  properties: { [key: string]: Attribute };
  /*
  * @description Required keys get listed in here for JSON schema validation
 */
  required?: string[];
  /*
  * @description Pattern properties get listed in here for JSON schema validation (each key is a regex pattern)
  */
  patternProperties?: { [key: string]: Attribute };
}

export interface Attribute {
  /*
  * @deprecated The name is the key of the property
  */
  name: string;
  type: string;
  /*
  * @deprecated The key is the key of the property
  */
  key: string;
  /*
  * @description The description of the attribute
  */
  description: string;
  /*
  * TODO: This needs to be moved to the JSON Schema required property format
 */
  isRequired: boolean;
  /*
  * @deprecated Not in spec
  */
  notes?: string;
  /*
  * @description An optional field specifying the format of the attribute - https://www.learnjsonschema.com/2020-12/format-assertion/format/
  */
  format?: string;
  /*
  * @description An optional field specifying which type of record to request from the resolver (text() or data())
  */
  recordType?: 'text' | 'data';
}