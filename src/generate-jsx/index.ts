const colors = require('colors');
import * as fs from 'fs-extra';
import * as path from 'path';
import xml2html from 'hi-xml2html';
import * as MondrianComponents from 'mondrian-components';
import Lb from './tags/lb';
import Body from './tags/body';
import Notes from './tags/notes';
import {xmlFiles, inputDir, outputDir} from "../constants";
import {Tag} from "../../../hi-xml2html/node_modules/@types/sax";

const postProcess = (state): string => {
	const tags = [...state.usedTags].join(', ');
	const output = state.output
		.replace(/\n/g, '')
		.replace(/\s+/g, ' ')
		.replace(/> </g, '><');

	return `import * as React from 'react'; import { ${tags} } from '${state.componentsPath}'; export default (props) => (${output});`;
};

export default async () => {
	let usedTags = new Set();
	const xmlPaths = xmlFiles.map((f) => `${inputDir}/${f}`);
	for (const xmlPath of xmlPaths) {
		const xml: string = fs.readFileSync(xmlPath, 'utf8');
		const jsxState = await xml2html(xml, {
			tagClass: 'jsx',
			componentsPath: 'mondrian-components',
			startFromTag: 'body',
			getComponent: (node: Tag) => {
				if (
					node.name === 'div' &&
					(
						node.attributes.type === 'origNotes' ||
						node.attributes.type === 'edsNotes'
					)
				) return Notes;

				const compByNodeName = {
					body: Body,
					lb: Lb,
				};

				return compByNodeName[node.name];
			}
		});
		const outputPath = xmlPath
			.replace(inputDir, outputDir)
			.replace('.xml', '.tsx');
		fs.ensureDirSync(path.dirname(outputPath));
		fs.writeFileSync(outputPath, postProcess(jsxState), 'utf8')
		usedTags = new Set([...usedTags, ...jsxState.usedTags]);
	}
	const definedTags = Object.keys(MondrianComponents);
	const undefinedTags = [...usedTags].filter((t) => definedTags.indexOf(t) === -1);
	if (undefinedTags.length) console.log(`\nUndefined tags: ${undefinedTags.join(', ')}`.red)
}
