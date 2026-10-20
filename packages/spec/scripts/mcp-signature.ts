/**
 * The signature of a tool: what it takes, spelled the way
 * `RESPONSE_FORMAT.signature` asks — a star on what is required, an object with
 * its fields, a list of objects with the fields of one item, two levels down.
 * The build writes it into the manifest beside each tool, so a server quotes it
 * in a refusal and does not derive it from the schema itself; the eval stub
 * spells it the same way. A refusal that said only `view (object, required)`
 * sent an agent off to ask the person what a form looks like.
 */

export interface SignatureField {
  type?: string | string[];
  enum?: unknown[];
  items?: SignatureField;
  properties?: Record<string, SignatureField>;
  required?: string[];
  additionalProperties?: boolean | SignatureField;
}

const typesOf = (field: SignatureField): string[] => [field.type ?? []].flat().filter((t) => t !== 'null');
const nullable = (field: SignatureField): boolean => [field.type ?? []].flat().includes('null');

/** A tool without arguments says so: an empty signature would read «It takes: .» in a refusal. */
export const toolSignature = (schema: SignatureField): string => signatureOf(schema) || 'no arguments';

export const signatureOf = (schema: SignatureField, depth = 0): string =>
  Object.entries(schema.properties ?? {})
    .map(([name, field]) => `${name}${schema.required?.includes(name) ? '*' : ''} ${shapeOf(field, depth)}`)
    .join(', ');

const shapeOf = (field: SignatureField, depth: number): string => {
  if (field.enum) return `(${field.enum.join(' | ')})`;
  const types = typesOf(field);
  const orNull = nullable(field) ? ' or null' : '';
  if (types.includes('object') && field.properties && depth < 2) return `{${signatureOf(field, depth + 1)}}${orNull}`;
  // A map — keys the caller picks, such as the links of link previews — spells
  // the shape of one value, the way a list spells one item.
  if (types.includes('object') && !field.properties && field.additionalProperties && typeof field.additionalProperties === 'object') {
    return `{<key>: ${shapeOf(field.additionalProperties, depth)}}${orNull}`;
  }
  if (types.includes('array')) {
    const item = field.items ?? {};
    const itemTypes = typesOf(item);
    if (itemTypes.includes('object') && item.properties && depth < 2) return `[{${signatureOf(item, depth + 1)}}]${orNull}`;
    // A list of lists — the rows of buttons — spells its inner list the same way.
    if (itemTypes.includes('array')) return `[${shapeOf(item, depth)}]${orNull}`;
    return `[${itemTypes.join(' | ') || 'any'}]${orNull}`;
  }
  return `(${types.join(' | ') || 'any'}${orNull})`;
};
