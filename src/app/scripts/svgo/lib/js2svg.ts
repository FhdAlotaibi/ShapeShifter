import * as EXTEND from 'whet.extend';

const EOL = '\n';

const defaults = {
  doctypeStart: '<!DOCTYPE',
  doctypeEnd: '>',
  procInstStart: '<?',
  procInstEnd: '?>',
  tagOpenStart: '<',
  tagOpenEnd: '>',
  tagCloseStart: '</',
  tagCloseEnd: '>',
  tagShortStart: '<',
  tagShortEnd: '/>',
  attrStart: '="',
  attrEnd: '"',
  commentStart: '<!--',
  commentEnd: '-->',
  cdataStart: '<![CDATA[',
  cdataEnd: ']]>',
  textStart: '',
  textEnd: '',
  indent: 4,
  regEntities: /[&'"<>]/g,
  regValEntities: /[&"<>]/g,
  encodeEntity: encodeEntity,
  pretty: false,
  useShortTags: true,
};

const entities = {
  '&': '&amp;',
  '\'': '&apos;',
  '"': '&quot;',
  '>': '&gt;',
  '<': '&lt;',
};

const textElem = [
  'altGlyph',
  'altGlyphDef',
  'altGlyphItem',
  'glyph',
  'glyphRef',
  'textPath',
  'text',
  'title',
  'tref',
  'tspan',
];

/**
 * Convert SVG-as-JS object to SVG (XML) string.
 * @param {Object} data input data
 * @param {Object} config config
 * @return {Object} output data
 */
export function jsToSvg(data, config) {
  return new JS2SVG(config).convert(data);
}

function JS2SVG(config) {
  if (config) {
    this.config = EXTEND(true, {}, defaults, config);
  } else {
    this.config = defaults;
  }

  const indent = this.config.indent;
  if (typeof indent === 'number' && !isNaN(indent)) {
    this.config.indent = '';
    for (let i = indent; i > 0; i--) {
      this.config.indent += ' ';
    }
  } else if (typeof indent !== 'string') {
    this.config.indent = '    ';
  }

  if (this.config.pretty) {
    this.config.doctypeEnd += EOL;
    this.config.procInstEnd += EOL;
    this.config.commentEnd += EOL;
    this.config.cdataEnd += EOL;
    this.config.tagShortEnd += EOL;
    this.config.tagOpenEnd += EOL;
    this.config.tagCloseEnd += EOL;
    this.config.textEnd += EOL;
  }

  this.indentLevel = 0;
  this.textContext = null;
}

function encodeEntity(char) {
  return entities[char];
}

/**
 * Start conversion.
 * @param {Object} data input data
 * @return {String}
 */
JS2SVG.prototype.convert = function(data) {
  let svg = '';

  if (data.content) {
    this.indentLevel++;
    data.content.forEach(function (item) {
      if (item.elem) {
        svg += this.createElem(item);
      } else if (item.text) {
        svg += this.createText(item.text);
      } else if (item.doctype) {
        svg += this.createDoctype(item.doctype);
      } else if (item.processinginstruction) {
        svg += this.createProcInst(item.processinginstruction);
      } else if (item.comment) {
        svg += this.createComment(item.comment);
      } else if (item.cdata) {
        svg += this.createCDATA(item.cdata);
      }
    }, this);
  }
  this.indentLevel--;
  return {
    data: svg,
    info: {
      width: this.width,
      height: this.height
    }
  };
};

/**
 * Create indent string in accordance with the current node level.
 * @return {String}
 */
JS2SVG.prototype.createIndent = function() {
  let indent = '';
  if (this.config.pretty && !this.textContext) {
    for (let i = 1; i < this.indentLevel; i++) {
      indent += this.config.indent;
    }
  }
  return indent;
};

/**
 * Create doctype tag.
 * @param {String} doctype doctype body string
 * @return {String}
 */
JS2SVG.prototype.createDoctype = function(doctype) {
  return this.config.doctypeStart + doctype + this.config.doctypeEnd;
};

/**
 * Create XML Processing Instruction tag.
 * @param {Object} instruction instruction object
 * @return {String}
 */
JS2SVG.prototype.createProcInst = function(instruction) {
  return this.config.procInstStart
    + instruction.name
    + ' '
    + instruction.body
    + this.config.procInstEnd;
};

/**
 * Create comment tag.
 * @param {String} comment comment body
 * @return {String}
 */
JS2SVG.prototype.createComment = function(comment) {
  return this.config.commentStart
    + comment
    + this.config.commentEnd;
};

/**
 * Create CDATA section.
 * @param {String} cdata CDATA body
 * @return {String}
 */
JS2SVG.prototype.createCDATA = function(cdata) {
  return this.createIndent()
    + this.config.cdataStart
    + cdata
    + this.config.cdataEnd;
};

/**
 * Create element tag.
 * @param {Object} data element object
 * @return {String}
 */
JS2SVG.prototype.createElem = function(data) {
  if (data.isElem('svg') && data.hasAttr('width') && data.hasAttr('height')) {
    this.width = data.attr('width').value;
    this.height = data.attr('height').value;
  }
  if (data.isEmpty()) {
    if (this.config.useShortTags) {
      return this.createIndent()
        + this.config.tagShortStart
        + data.elem
        + this.createAttrs(data)
        + this.config.tagShortEnd;
    } else {
      return this.createIndent()
        + this.config.tagShortStart
        + data.elem
        + this.createAttrs(data)
        + this.config.tagOpenEnd
        + this.config.tagCloseStart
        + data.elem
        + this.config.tagCloseEnd;
    }
  } else {
    let tagOpenStart = this.config.tagOpenStart;
    let tagOpenEnd = this.config.tagOpenEnd;
    let tagCloseStart = this.config.tagCloseStart;
    let tagCloseEnd = this.config.tagCloseEnd;
    let openIndent = this.createIndent();
    let textIndent = '';
    let processedData = '';
    let dataEnd = '';

    if (this.textContext) {
      tagOpenStart = defaults.tagOpenStart;
      tagOpenEnd = defaults.tagOpenEnd;
      tagCloseStart = defaults.tagCloseStart;
      tagCloseEnd = defaults.tagCloseEnd;
      openIndent = '';
    } else if (data.isElem(textElem)) {
      if (this.config.pretty) {
        textIndent += openIndent + this.config.indent;
      }
      this.textContext = data;
    }

    processedData += this.convert(data).data;

    if (this.textContext === data) {
      this.textContext = null;
      if (this.config.pretty) {
        dataEnd = EOL;
      }
    }
    return openIndent
      + tagOpenStart
      + data.elem
      + this.createAttrs(data)
      + tagOpenEnd
      + textIndent
      + processedData
      + dataEnd
      + this.createIndent()
      + tagCloseStart
      + data.elem
      + tagCloseEnd;
  }
};

/**
 * Create element attributes.
 * @param {Object} elem attributes object
 * @return {String}
 */
JS2SVG.prototype.createAttrs = function(elem) {
  let attrs = '';
  elem.eachAttr(function (attr) {
    if (attr.value !== undefined) {
      attrs += ' '
        + attr.name
        + this.config.attrStart
        + String(attr.value).replace(this.config.regValEntities, this.config.encodeEntity)
        + this.config.attrEnd;
    } else {
      attrs += ' ' + attr.name;
    }
  }, this);
  return attrs;
};

/**
 * Create text node.
 * @param {String} text text
 * @return {String}
 */
JS2SVG.prototype.createText = function(text) {
  return this.createIndent()
    + this.config.textStart
    + text.replace(this.config.regEntities, this.config.encodeEntity)
    + (this.textContext ? '' : this.config.textEnd);
};