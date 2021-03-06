"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const hi_xml2html_1 = require("hi-xml2html");
const constants_1 = require("../constants");
const lb_1 = require("./tags/lb");
const postProcess = (xmlPath, state) => state.output
    .replace(/"/g, '\"')
    .replace(/\s\s+/g, ' ')
    .split('{{{br}}}')
    .map((l, i) => ({
    id: constants_1.idByFilename[path.basename(xmlPath)] + '___' + i,
    line_t: l,
}))
    .slice(1);
exports.default = () => __awaiter(this, void 0, void 0, function* () {
    const xmlPaths = constants_1.xmlFiles.map((f) => `${constants_1.xmlDir}/${f}`);
    let list = [];
    for (const xmlPath of xmlPaths) {
        const xml = fs.readFileSync(xmlPath, 'utf8');
        const emptyState = yield hi_xml2html_1.default(xml, {
            parent: {
                name: 'body',
            },
            outputType: 'empty',
            getComponent: (node) => {
                if (node.name === 'lb')
                    return lb_1.default;
            },
            ignore: [{ name: 'c' }],
        });
        list = list.concat(postProcess(xmlPath, emptyState));
    }
    const outputPath = `${process.cwd()}/__solr__/input.json`;
    fs.ensureDirSync(path.dirname(outputPath));
    fs.writeJsonSync(outputPath, list);
});
