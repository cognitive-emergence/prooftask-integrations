import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Prooftask implements INodeType {
 description: INodeTypeDescription = {
  displayName: 'Prooftask', name: 'prooftask',
  icon: { light: 'file:prooftask.svg', dark: 'file:prooftask.dark.svg' },
  group: ['transform'], version: 1,
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Find delivery acceptance templates and read their exact versions',
  defaults: { name: 'Prooftask' }, usableAsTool: true,
  inputs: [NodeConnectionTypes.Main], outputs: [NodeConnectionTypes.Main],
  requestDefaults: { baseURL: 'https://prooftask.com/api/public', headers: { Accept: 'application/json' } },
  properties: [
   { displayName: 'Resource', name: 'resource', type: 'options', noDataExpression: true, options: [{ name: 'Specification', value: 'specification' }], default: 'specification' },
   { displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, displayOptions: { show: { resource: ['specification'] } }, options: [
    { name: 'Get', value: 'get', description: 'Read an exact public template version', action: 'Get a specification', routing: { request: { method: 'GET', url: '=/specifications/{{encodeURIComponent($parameter.specificationId)}}' } } },
    { name: 'Search', value: 'search', description: 'Find public templates by delivery scenario', action: 'Search specifications', routing: { request: { method: 'GET', url: '/specifications' }, output: { postReceive: [{ type: 'rootProperty', properties: { property: 'items' } }] } } },
   ], default: 'search' },
   { displayName: 'Search Query', name: 'query', type: 'string', default: '', placeholder: 'automation', description: 'Delivery scenario to match, up to 200 characters; leave empty to list the catalog', displayOptions: { show: { resource: ['specification'], operation: ['search'] } }, routing: { send: { type: 'query', property: 'q' } } },
   { displayName: 'Specification ID', name: 'specificationId', type: 'string', required: true, default: '', placeholder: 'business-automation', description: 'The exact slug or ID returned by Search', displayOptions: { show: { resource: ['specification'], operation: ['get'] } } },
   { displayName: 'Version', name: 'version', type: 'number', required: true, default: 2, typeOptions: { minValue: 1, numberPrecision: 0 }, description: 'The exact version returned by Search; retain its digest for reuse', displayOptions: { show: { resource: ['specification'], operation: ['get'] } }, routing: { send: { type: 'query', property: 'version' } } },
   { displayName: 'Public examples only. Review scope, criteria and evidence before reuse. Prepare an agreement at prooftask.com; private workflows need a separate scoped Agent connection.', name: 'notice', type: 'notice', default: '' },
  ],
 };
}
