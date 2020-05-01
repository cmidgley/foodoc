var template = require('./template');
var helper = require('jsdoc/util/templateHelper');
var markdown = require('jsdoc/util/markdown').getParser();

var supportsParams = function (doclet) {
	return doclet.kind === 'function' || doclet.kind === 'class' || (doclet.kind === 'typedef' && !!doclet.type && !!doclet.type.names && doclet.type.names.some(function (name) {
			return name.toLowerCase() === 'function';
		}));
};

var getLinkText = exports.getLinkText = function(doclet){
	var text = doclet.longname;
	if (["class", "module", "namespace", "mixin", "interface", "event"].indexOf(doclet.kind) !== -1) {
		text = text.replace("module:", "");
		if ("event" === doclet.kind) {
			text = text.replace("event:", "");
		}
		if ("module" === doclet.kind){
			text = text.split('>').pop();
		}
	} else if ("external" === doclet.kind) {
		text = doclet.name.replace(/(^"|"$)/g, "");
	} else if ("tutorial" === doclet.kind || "readme" === doclet.kind || "list" === doclet.kind) {
		text = doclet.title || doclet.name;
	}
	return text;
};

exports.getAttribs = function (doclet) {
	if (supportsParams(doclet) || doclet.kind === 'member' || doclet.kind === 'constant') {
		var attribs = helper.getAttribs(doclet);
		return attribs.length ? '<span class="signature-attribs">' + helper.htmlsafe('<' + attribs.join(', ') + '> ') + '</span>' : '';
	}
	return '';
};

exports.getSignature = function (doclet) {
	var signature = '';
	if (supportsParams(doclet)) {
		signature += '<span class="signature-params">(';
		if (doclet.params && doclet.params.length) {
			signature += ' ';

			var optionalClose = [];
			doclet.params.forEach(function (p, i) {
				if (p.name && p.name.indexOf('.') === -1) {
					if (!p.optional && optionalClose.length){
						signature += optionalClose.pop();
					}
					var name = '<span class="signature-param">' + (p.variable ? '...' + p.name : p.name) + '</span>',
						separator = i > 0 ? (p.optional ? ' [,&nbsp;' : ', ') : (p.optional ? '[&nbsp;' : '');
					signature += separator + name;
					if (p.optional) optionalClose.push('&nbsp;]');
				}
			});

			signature += optionalClose.join('') + '&nbsp;';
		}
		signature += ')</span>';
		if (template.options.methodHeadingReturns) {
			var returnTypes = helper.getSignatureReturns(doclet);
			signature += '<span class="signature-type">' + (returnTypes.length ? ' &rarr;&nbsp;{' + returnTypes.join('|') + '}' : '') + '</span>';
		}
	} else if (doclet.kind === 'member' || doclet.kind === 'constant') {
		var types = helper.getSignatureTypes(doclet);
		signature += '<span class="signature-type">' + (types.length ? ' :' + types.join('|') : '') + '</span>';
		//todo: check if this is required
		//doclet.kind = 'member';
	}
	return signature;
};

exports.getExamples = function (doclet) {
	if (!doclet.examples || !doclet.examples.length) return [];
	return doclet.examples.map(function (example) {
		// perform parsing of the example content to extract custom inner tags
		// create a new example object to return as the result of the mapping
		var result = {
			caption: '',
			code: '',
			lang: 'javascript',
			run: false
		};

		// parse caption supplied using the default <caption></caption> syntax
		if (example.match(/^\s*?<caption>([\s\S]+?)<\/caption>(\s*)([\s\S]+?)$/i)) {
			example = RegExp.$3;
			result.caption = markdown(RegExp.$1);
		}

		// parse caption supplied using the {@caption <markdown>} inner tag
		var caption = /^\s*?\{@caption\s(.*?)}\s*?/.exec(example);
		if (caption && caption[1]) {
			example = example.replace(caption[0], "");
			result.caption = markdown(caption[1]); // parse markdown and set result value
		}
		// parse lang supplied using the {@lang <string>} inner tag, this should be a prism.js supported language to get syntax highlighting.
		var lang = /\s*?\{@lang\s(.*?)}\s*?/.exec(example);
		if (lang && lang[1]) {
			example = example.replace(lang[0], "");
			result.lang = lang[1];
		}
		// parse run supplied using the {@run <boolean>} inner tag, this allows the example to be executed with any console.log calls being piped into a textarea.
		// NOTE: if lang !== 'javascript' the {@run} inner tag is simply removed from the example code, we only support running javascript.
		var run = /\s*?\{@run\s(.*?)}\s*?/.exec(example);
		if (run && run[1]) {
			example = example.replace(run[0], "");
			// if the run tag is supplied it is always true regardless of the value so just test if the lang is javascript and use that value
			result.run = result.lang === 'javascript';
		}
		// the example should now contain just the code
		result.code = example;
		return result;
	});
};

var expandLongnames = function(longnames, parent){
	var results = [];
	var generated = template.kinds.pages.indexOf(parent.kind) !== -1;
	var memberof = generated ? parent.longname : parent.memberof;
	var leftovers = longnames.slice();
	template.find({longname: longnames}).forEach(function(doclet){
		var linkText = getLinkText(doclet);
		if (doclet.memberof === memberof){
			linkText = linkText.split("~").pop();
		}
		leftovers.splice(leftovers.indexOf(doclet.longname), 1);
		results.push({
			link: template.linkto(doclet.longname, linkText),
			summary: doclet.summary
		});
	});
	leftovers.forEach(function(longname){
		results.push({
			link: template.linkto(longname),
			summary: ''
		});
	});
	return results;
};

exports.getFires = function(doclet){
	if (!doclet.fires) return [];
	return expandLongnames(doclet.fires, doclet);
};

exports.getRequires = function(doclet){
	if (!doclet.requires) return [];
	return expandLongnames(doclet.requires, doclet);
};

exports.getSummary = function (doclet) {
	if (!doclet.summary) return '';
	return markdown(doclet.summary);
};

exports.getParamsOrProps = function (doclet, type) {
	if (!doclet[type] || !doclet[type].length) return [];
	var sorted = {};
	sorted[type] = [];
	doclet[type].forEach(function(paramOrProp){
		if (!paramOrProp) { return; }
		var parts = paramOrProp.name.split("."), last = parts.length - 1, base = sorted, parentName = [];
		parts.forEach(function(part, i){
			var index;
			if (i === last){
				paramOrProp.name = paramOrProp.name.replace(parentName.join('.'), '').replace(/^\./, '');
				base[type] = base[type] || [];
				base[type].push(paramOrProp);
			} else if ((index = base[type].findIndex(function(p){ return p.name === part; })) !== -1) {
				base = base[type][index];
				parentName.push(part);
			}
		});
	});

	return sorted[type].filter(function (paramOrProp) {
		return !!paramOrProp;
	});
};

var checkParamsOrProps = exports.checkParamsOrProps = function (parent, type) {
	if (!parent || !parent[type] || !parent[type].length) return;
	/* determine if we need extra columns, "attributes" and "default" */
	parent[type + 'HasAttributes'] = false;
	parent[type + 'HasDefaults'] = false;
	parent[type + 'HasNames'] = false;

	parent[type].forEach(function (paramOrProp) {
		if (!paramOrProp) {
			return;
		}
		if (paramOrProp.optional || paramOrProp.nullable || paramOrProp.variable) {
			parent[type + 'HasAttributes'] = true;
		}
		if (paramOrProp.name) {
			parent[type + 'HasNames'] = true;
		}
		if (typeof paramOrProp.defaultvalue !== 'undefined') {
			parent[type + 'HasDefaults'] = true;
		}
		if (paramOrProp[type]) {
			checkParamsOrProps(paramOrProp, type);
		}
	});
};

exports.getPageTitle = function(doclet, sanitized){
	var parts = [];
	if (doclet.attribs){
		parts.push(doclet.attribs);
	}
	if (template.kinds.pages.indexOf(doclet.kind) !== -1 && template.kinds.custom.indexOf(doclet.kind) === -1 && doclet.ancestors && doclet.ancestors.length){
		parts.push('<span class="ancestors">'+doclet.ancestors.join('')+'</span>');
	}
	if (doclet.title){
		parts.push('<span class="title">' + doclet.title + '</span>');
	} else if (doclet.name) {
		var name = doclet.name;
		if (doclet.exported){
			name = name.replace('module:', '<span class="name-signature">(<span class="name-require">require</span>(<span class="name-string">"') + '"</span>))</span>';
		}
		parts.push('<span class="name">' + name + '</span>');
	}
	if (template.kinds.pages.indexOf(doclet.kind) === -1 && doclet.signature){
		parts.push(doclet.signature);
	}
	if (doclet.variation){
		parts.push('<sup class="variation">' + doclet.variation + '</sup>');
	}
	var result = parts.join('');
	// used to do the following, but that resulted in page titles with &amp; and other such side effects
	//	return sanitized ? template.sanitize(result) : result;
	if (sanitized)
		return doclet.title ? doclet.title : doclet.name;
	return result;
};

exports.getListTitle = function(doclet, sanitized){
	var parts = [], linkClose = false, url = doclet.kind === 'tutorial' ? helper.tutorialToUrl(doclet.longname) : helper.longnameToUrl[doclet.longname];
	// only generate links to kinds that have a page generated, others show content inline so there's no need
	if (url){
		parts.push('<a href="' + url + '">');
		linkClose = true;
	}
	if (doclet.kind === 'class'){
		parts.push('<span class="signature-new">new&nbsp;</span>');
	}
	if (doclet.ancestors && doclet.ancestors.length){
		parts.push('<span class="ancestors">'+template.sanitize(doclet.ancestors.join(''))+'</span>');
	}
	if (doclet.attribs){
		parts.push(doclet.attribs);
	}
	if (doclet.title){
		parts.push('<span class="title">' + doclet.title + '</span>');
	} else if (doclet.name) {
		var name = doclet.name;
		if (doclet.exported){
			name = name.replace('module:', '<span class="name-signature">(<span class="name-require">require</span>(<span class="name-string">"') + '"</span>))</span>';
		}
		parts.push('<span class="name">' + name + '</span>');
	}
	if (doclet.signature){
		parts.push(doclet.signature);
	}
	if (doclet.variation){
		parts.push('<sup class="variation">' + doclet.variation + '</sup>');
	}
	if (linkClose){
		parts.push('</a>');
	}
	var result = parts.join('');
	return sanitized ? template.sanitize(result) : result;
};

exports.getSymbolTitle = function(doclet, sanitized){
	var parts = [], linkClose = false, url = doclet.kind === 'tutorial' ? helper.tutorialToUrl(doclet.longname) : helper.longnameToUrl[doclet.longname];
	// only generate links to kinds that have a page generated, others show content inline so there's no need
	if (template.kinds.pages.indexOf(doclet.kind) !== -1 && url){
		parts.push('<a href="' + url + '">');
		linkClose = true;
	}
	if (doclet.kind === 'class'){
		parts.push('<span class="signature-new">new&nbsp;</span>');
	}
	if (doclet.attribs){
		parts.push(doclet.attribs);
	}
	if (doclet.title){
		parts.push('<span class="title">' + doclet.title + '</span>');
	} else if (doclet.name) {
		var name = doclet.name;
		if (doclet.exported){
			name = name.replace('module:', '<span class="name-signature">(<span class="name-require">require</span>(<span class="name-string">"') + '"</span>))</span>';
		}
		parts.push('<span class="name">' + name + '</span>');
	}
	if (doclet.signature){
		parts.push(doclet.signature);
	}
	if (doclet.variation){
		parts.push('<sup class="variation">' + doclet.variation + '</sup>');
	}
	if (linkClose){
		parts.push('</a>');
	}
	var result = parts.join('');
	return sanitized ? template.sanitize(result) : result;
};

exports.getPrimaryTitle = function(doclet, sanitized){
	var parts = [];
	if (doclet.kind === 'class'){
		parts.push('<span class="signature-new">new&nbsp;</span>');
	}
	if (doclet.attribs){
		parts.push(doclet.attribs);
	}
	if (doclet.title){
		parts.push('<span class="title">' + doclet.title + '</span>');
	} else if (doclet.name) {
		var name = doclet.name;
		if (doclet.exported){
			name = name.replace('module:', '<span class="name-signature">(<span class="name-require">require</span>(<span class="name-string">"') + '"</span>))</span>';
		}
		parts.push('<span class="name">' + doclet.name + '</span>');
	}
	if (doclet.signature){
		parts.push(doclet.signature);
	}
	if (doclet.variation){
		parts.push('<sup class="variation">' + doclet.variation + '</sup>');
	}
	var result = parts.join('');
	return sanitized ? template.sanitize(result) : result;
};

exports.getSymbols = function(doclet){
	var symbols = {};
	if (doclet.longname == helper.globalName){
		template.kinds.global.forEach(function(kind){
			symbols[kind] = template.find({kind: kind, memberof: { isUndefined: true }});
		});
	} else {
		template.kinds.symbols.forEach(function(kind){
			symbols[kind] = template.find({kind: kind, memberof: doclet.longname});
		});
	}
	return symbols;
};

exports.getShowAccessFilter = function(doclet){
	var result = typeof doclet.showAccessFilter != 'boolean' ? template.options.showAccessFilter : doclet.showAccessFilter;
	if (result){

		// when generating class pages, if the classDiagram is being used then the superclasses might
		// have members that need access filteres, so we need to look down the augments chain to
		// understand all available access types.  
		var docletLongnames;
		if (doclet.kind === 'class' && template.options.includeClassDiagrams)
			docletLongnames = gatherAugments(doclet);
		else
			docletLongnames = [doclet.longname];

			// if we can show the filter check if we should actually show it
		doclet.has = {
			inherited: template.find({kind: template.kinds.symbols, memberof: docletLongnames, inherited: true}).length > 0,
			public: template.find({kind: template.kinds.symbols, memberof: docletLongnames, access: "public"}).length > 0,
			protected: template.find({kind: template.kinds.symbols, memberof: docletLongnames, access: "protected"}).length > 0,
			private: template.find({kind: template.kinds.symbols, memberof: docletLongnames, access: "private"}).length > 0
		};
		var count = (doclet.has.inherited ? 1 : 0) + (doclet.has.public ? 1 : 0) + (doclet.has.protected ? 1 : 0) + (doclet.has.private ? 1 : 0);
		// only show the filter if there are two or more accessors available
		result = count > 1;
	}
	return result;
};

function gatherAugments(doclet) {
	let arrayOfLongnames = [];
	arrayOfLongnames.push(doclet.longname);
	template.raw.data({longname: doclet.augments}).each(doc => {
		arrayOfLongnames.push(doc.longname);
		arrayOfLongnames.push(...gatherAugments(doc, arrayOfLongnames));
	});
	return arrayOfLongnames;
}

exports.isInherited = function(doclet){
	return !!doclet.inherited;
};

exports.hasDetails = function (doclet) {
	return !!(doclet.version
	|| doclet.since
	|| (doclet.inherited && doclet.inherits)
	|| doclet.since
	|| (doclet.implementations && doclet.implementations.length)
	|| (doclet.implements && doclet.implements.length)
	|| (doclet.mixes && doclet.mixes.length)
	|| doclet.deprecated
	|| (doclet.author && doclet.author.length)
	|| doclet.copyright
	|| doclet.license
	|| doclet.defaultvalue
	|| doclet.hasSource
	|| (doclet.tutorials && doclet.tutorials.length)
	|| (doclet.see && doclet.see.length)
	|| (doclet.todo && doclet.todo.length))
};

/**
 * Build a Mermaid compliant diagram of class members and inheritance
 * 
 * This function walks the doclet chains for superclasses (following doclet.augments) and the subclasses (scanning the doclet database for classes that are members of the class) and then constructs a Mermaid complaint classDiagram.  Member information is included for all subclasses, whereas superclasses are just listed by name.
 * 
 * For example, a mermaid section might look like this (without extra decorations for members and whatnot):
 * ```
 * classDiagram
 *   InheritedClass <| -- BaseClass
 *   AnotherInheritedClass <| -- BaseClass
 *   TwiceInheritedClass <| -- AnotherInheritedClass
 * ```
 * 
 * @private
 * @param {Doclet} doclet doclet to to build class diagram for
 */
exports.classDiagram = function (doclet) {
	// if no class diagrams, or not class, ignore
	if (doclet.kind !== 'class' || !template.options.includeClassDiagrams)
		return;

	// gather all subclasses and superclasses
	let subClasses = findSubClasses(doclet);
	let superClasses = findSuperClasses(doclet);

	// now build the diagram
	let mermaid = "classDiagram\n";
	mermaid += "%% superclasses\n";
	mermaid += renderMermaidClassDiagram(doclet, superClasses, true, true);
	mermaid += "%% this class\n";
	mermaid += renderMermaidClassDiagram(null, [{ doclet: doclet, nestedClasses: []}], true, true);
	mermaid += `style ${sanitizeMermaidName(doclet.name)} class-diagram-primary\n`;
	mermaid += "%% subclasses\n";
	mermaid += renderMermaidClassDiagram(doclet, subClasses, false, false);

//	return `<pre><code>${mermaid}</code></pre><pre class='language-mermaid'><code>${mermaid}</code></pre>`;
	return `<pre class='language-mermaid'><code>${mermaid}</code></pre>`;
}

/**
 * Build a Mermaid compliant diagram from a class diagram
 * 
 * @param {Doclet} doclet parent doclet starting this class tree
 * @param {Object[]} classTree tree of super/subclasses (array containing objects with doclet and nestedClasses array members)
 * @param {boolean} includeMembers true if members should be included in the mermaid class, false if empty class
 * @param {boolean} isSuperclassTree true if this is a superclass tree (used to determine inheritance direction)
 */
function renderMermaidClassDiagram(doclet, classTree, includeMembers, isSuperclassTree) {
	let result = "";
	classTree.forEach(item => {
		result += renderMermaidClassNode(item.doclet, includeMembers);
		if (doclet != null)
			if (isSuperclassTree)
				result += `  ${sanitizeMermaidName(doclet.name)} <| -- ${sanitizeMermaidName(item.doclet.name)}\n`;
			else
				result += `  ${sanitizeMermaidName(item.doclet.name)} <| -- ${sanitizeMermaidName(doclet.name)}\n`;
			result += renderMermaidClassDiagram(item.doclet, item.nestedClasses, includeMembers, isSuperclassTree);
	});
	return result;
}

/**
 * Renders a single class element in Mermaid syntax
 * 
 * @private
 * @param {Doclet} doclet doclet to render 
 * @param {boolean} includeMembers true if members are to be included, false if just the class 
 */
function renderMermaidClassNode(doclet, includeMembers) {
	const memberTypes = [ 'member', 'function', 'constant'];

	// render the class spec itself
	let member = `  class ${sanitizeMermaidName(doclet.name)} {\n`;
	// process inside members
	if (includeMembers) {
		// grab the doclets that are part of this class
		let memberDoclets = template.raw.data({ memberof: doclet.longname, kind: memberTypes});
		memberDoclets.each(memberDoclet => {
			switch (memberDoclet.kind) {
				case 'member':
				case 'constant':
					member += `    ${sanitizeMermaidName(memberDoclet.name)}\n`;
					break;
				case 'function':
					member += `    ${sanitizeMermaidName(memberDoclet.name)}()\n`;
					break;
			}
		});
	}
	member += "  }\n";
	if (includeMembers) {
		// set the filters for the access level of the members
		let memberDoclets = template.raw.data({ memberof: doclet.longname, kind: memberTypes});
		memberDoclets.each(memberDoclet => {
			switch (memberDoclet.access) {
				case 'private':
					member += `filter ${sanitizeMermaidName(doclet.name)}.${sanitizeMermaidName(memberDoclet.name)} !private\n`;
					break;
				case 'protected':
					member += `filter ${sanitizeMermaidName(doclet.name)}.${sanitizeMermaidName(memberDoclet.name)} !protected\n`;
					break;
				default:
					member += `filter ${sanitizeMermaidName(doclet.name)}.${sanitizeMermaidName(memberDoclet.name)} !public\n`;
					break;
			}
			if (memberDoclet.inherited)
				member += `filter ${sanitizeMermaidName(doclet.name)}.${sanitizeMermaidName(memberDoclet.name)} !inherited\n`;
		});
	}
	return member;
}

/**
 * Sanitizes names to be mermaid friendly
 * 
 * Mermaid does not accept all supported naming that JSDoc uses, so this method replaces unwanted characters with Mermaid legal ones.
 * 
 * @param {string} name Name to sanitize
 * @returns {string} Sanitized name 
 */
function sanitizeMermaidName(name) {
	return name.replace(/[//\\#]/g, '_');
}

/**
 * Locate all subclasses of this doclet, using recursion to the root
 * 
 * @param {Doclet} doclet doclet to scan for subclasses
 * @returns {Object[]} Array of objects containing members doclet and nestedClasses with array of it's subclasses 
 */
function findSubClasses(doclet) {
	let subClasses = [];
	// find any superclasses of us
	template.raw.data(function() {
		return (this.kind == 'class' && this.augments && this.augments.includes(doclet.longname)) ? true : false;
	}).each(subDoclet => {
		let subClass = { doclet: subDoclet };
		// recurse to follow the chain
		subClass.nestedClasses = findSubClasses(subDoclet);
		// add to the subClasses array
		subClasses.push(subClass);
	});

	return subClasses;
}

/**
 * Locate all superclasses of this doclet, using recursion to find them all
 * 
 * @param {Doclet} doclet doclet to scan for superclasses
 * @returns {Object[]} Array of objects containing members doclet and nestedClasses with array of it's superclasses
 */
function findSuperClasses(doclet) {
	let superClasses = [];
	// follow the augments chain for our immediate parents
	if (doclet.augments) {
		doclet.augments.forEach(inheritedClassName => {
			// locate this class
			template.raw.data({longname: inheritedClassName, kind: 'class'}).each(superDoclet => {
				let superClass = { doclet: superDoclet };
				// recurse to follow the chain
				superClass.nestedClasses = findSuperClasses(superDoclet);
				// add to the subClasses array
				superClasses.push(superClass);
			});
		});
	}
	return superClasses;
}

