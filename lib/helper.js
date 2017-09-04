var _ = require('lodash');
var binary = require('binary');

var formatSID = function (buf) {
  var parser = binary.parse(buf)
  .word8lu('version')
  .word8lu('fields')
  .buffer('type', 6)
  .loop(function (end, vars) {
    vars.sid = vars.sid || new Array();
    vars.sid.push(this.word32lu('sid_field').vars.sid_field);
    if (vars.sid.length >= vars.fields) {
      end();
    }
  });
  var version = parser.vars.version;
  var type = parser.vars.type;
  var domsid = parser.vars.sid;
  var output = ['S', version, outputSidType(type)].concat(domsid).join('-');
  return output;
}

var outputSidType = function (type) {
  var buf = new Buffer(6);
  var output = 0;
  type.copy(buf, 0);
  for (var i = 0; i < 6; i++) {
    output = output << 8;
    output = output | buf[i];
  }
  return output;
}

var formatGUID = function (objectGUID) {
  var data = new Buffer(objectGUID, 'binary');
  var template = '{3}{2}{1}{0}-{5}{4}-{7}{6}-{8}{9}-{10}{11}{12}{13}{14}{15}';
  for (var i = 0; i < data.length; i++) {
    var dataStr = data[i].toString(16);
    dataStr = data[i] >= 16 ? dataStr : '0' + dataStr;
    template = template.replace(new RegExp('\\{' + i + '\\}', 'g'), dataStr);
  }
  return template;
}

var unformatGUID = function (format, data) {
  var cleanData = data.replace(/-/g, "");
  var cleanFormat = format.replace(/[-\{]/g, "").split('}');
  var d = Array(16);
  for (var i = 0; i < cleanData.length; i = i + 2) {
    d[parseInt(cleanFormat[i / 2])] = cleanData[i] + cleanData[i + 1];
  }
  return new Buffer(d.join(''), 'hex');
}

module.exports.formatSID = formatSID;
module.exports.formatGUID = formatGUID;
module.exports.unformatGUID = unformatGUID;