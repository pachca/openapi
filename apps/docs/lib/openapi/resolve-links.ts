import type { Endpoint, Schema, Parameter, RequestBody, Response, MediaType } from './types';
import { generateUrlFromOperation } from './mapper';

export function resolveEndpointLinks(
  text: string,
  allEndpoints: Endpoint[],
  options?: { mdx?: boolean }
): string {
  const mdx = options?.mdx ?? false;

  return text.replace(
    /\[([^\]]+)\]\((GET|POST|PUT|DELETE|PATCH)\s+(\/[^)]+)\)/g,
    (match, description, method, path) => {
      if (path.startsWith('/guides/')) {
        return `[${description.trim()}](${path})`;
      }
      const endpoint = allEndpoints.find(
        (ep) => ep.method.toUpperCase() === method.toUpperCase() && ep.path === path
      );
      if (endpoint) {
        const url = generateUrlFromOperation(endpoint);
        if (mdx) {
          return `<EndpointLink method="${method}" href="${url}">${description.trim()}</EndpointLink>`;
        }
        return `[${description.trim()}](${method}:${url})`;
      }
      if (mdx) {
        const escapedPath = path.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
        return `<EndpointLink method="${method}">${description.trim()} (${escapedPath})</EndpointLink>`;
      }
      return `${description.trim()} (${method} ${path})`;
    }
  );
}

function processSchema(schema: Schema, allEndpoints: Endpoint[]): Schema {
  const result = { ...schema };

  if (result.description) {
    result.description = resolveEndpointLinks(result.description, allEndpoints);
  }

  if (result.properties) {
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([key, value]) => [
        key,
        processSchema(value, allEndpoints),
      ])
    );
  }

  if (result.items) {
    result.items = processSchema(result.items, allEndpoints);
  }

  if (result.allOf) {
    result.allOf = result.allOf.map((s) => processSchema(s, allEndpoints));
  }
  if (result.oneOf) {
    result.oneOf = result.oneOf.map((s) => processSchema(s, allEndpoints));
  }
  if (result.anyOf) {
    result.anyOf = result.anyOf.map((s) => processSchema(s, allEndpoints));
  }

  if (result.additionalProperties && typeof result.additionalProperties !== 'boolean') {
    result.additionalProperties = processSchema(result.additionalProperties, allEndpoints);
  }

  return result;
}

function processMediaType(mediaType: MediaType, allEndpoints: Endpoint[]): MediaType {
  return {
    ...mediaType,
    schema: processSchema(mediaType.schema, allEndpoints),
  };
}

function processRequestBody(body: RequestBody, allEndpoints: Endpoint[]): RequestBody {
  const result: RequestBody = {
    ...body,
    content: {},
  };
  if (body.description) {
    result.description = resolveEndpointLinks(body.description, allEndpoints);
  }
  for (const [key, value] of Object.entries(body.content)) {
    result.content[key] = processMediaType(value, allEndpoints);
  }
  return result;
}

function processResponse(response: Response, allEndpoints: Endpoint[]): Response {
  const result: Response = {
    ...response,
  };
  if (response.description) {
    result.description = resolveEndpointLinks(response.description, allEndpoints);
  }
  if (response.content) {
    result.content = {};
    for (const [key, value] of Object.entries(response.content)) {
      result.content[key] = processMediaType(value, allEndpoints);
    }
  }
  return result;
}

function processParameter(param: Parameter, allEndpoints: Endpoint[]): Parameter {
  const result: Parameter = {
    ...param,
    schema: processSchema(param.schema, allEndpoints),
  };
  if (param.description) {
    result.description = resolveEndpointLinks(param.description, allEndpoints);
  }
  return result;
}

export function resolveEndpointDescriptionLinks(
  endpoint: Endpoint,
  allEndpoints: Endpoint[]
): Endpoint {
  const result: Endpoint = { ...endpoint };

  if (endpoint.description) {
    result.description = resolveEndpointLinks(endpoint.description, allEndpoints);
  }

  if (endpoint.parameters) {
    result.parameters = endpoint.parameters.map((p) => processParameter(p, allEndpoints));
  }

  if (endpoint.requestBody) {
    result.requestBody = processRequestBody(endpoint.requestBody, allEndpoints);
  }

  if (endpoint.responses) {
    result.responses = {};
    for (const [code, response] of Object.entries(endpoint.responses)) {
      result.responses[code] = processResponse(response, allEndpoints);
    }
  }

  return result;
}
