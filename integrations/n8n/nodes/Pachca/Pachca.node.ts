import { VersionedNodeType } from 'n8n-workflow';
import type { INodeTypeBaseDescription } from 'n8n-workflow';
import { PachcaV1 } from './V1/PachcaV1.node';
import { PachcaV2 } from './V2/PachcaV2.node';

export class Pachca extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Pachca',
			name: 'pachca',
			icon: { light: 'file:pachca.svg', dark: 'file:pachca.dark.svg' },
			group: ['transform'],
			subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
			description: 'Interact with Pachca API',
			defaultVersion: 2,
		};

		const nodeVersions = {
			1: new PachcaV1(baseDescription),
			2: new PachcaV2(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
