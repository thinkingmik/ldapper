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

var unformatSID = function (sid) {
  var objSid = null;
  var version = 1;
  var type = new Buffer(6);
  var domsid = [];

  sid.split('-').some(function (item, index) {
    switch (index) {
      case 0:
        if (item != 'S') {
          return true;
        }
        break;
      case 1:
        version = item;
        break;
      case 2:
        type = inputType(item);
        domsid = new Array();
        break;
      default:
        domsid.push(item)
        break;
    }
  });

  var len = domsid.length + 2;
  var buf = new Buffer(len * 4);
  buf.writeUInt8(version, 0);
  buf.writeUInt8(len - 2, 1);
  type.copy(buf, 2, 0, 6);
  for (var i = 2; i < len; i++) {
    buf.writeUInt32LE(domsid[i - 2], i * 4);
  }

  return buf;
}

var inputType = function (type) {
  var tmpType = new Buffer(6);
  var value = type;
  for (var i = 0; i < 6; i++) {
    var octet = value & 0xff;
    value = value >> 8;
    tmpType.writeUInt8(octet, 5 - i);
  }
  return tmpType;
}

var formatGUID = function (buff, format) {
  var data = new Buffer(buff, 'binary');
  var template = '{3}{2}{1}{0}-{5}{4}-{7}{6}-{8}{9}-{10}{11}{12}{13}{14}{15}';
  if (!_.isNull(format) && !_.isUndefined(format)) {
    template = format;
  }

  for (var i = 0; i < data.length; i++) {
    var dataStr = data[i].toString(16);
    dataStr = data[i] >= 16 ? dataStr : '0' + dataStr;
    template = template.replace(new RegExp('\\{' + i + '\\}', 'g'), dataStr);
  }
  return template;
}

var unformatGUID = function (guid, format) {
  var template = '{3}{2}{1}{0}-{5}{4}-{7}{6}-{8}{9}-{10}{11}{12}{13}{14}{15}';
  if (!_.isNull(format) && !_.isUndefined(format)) {
    template = format;
  }
  var cleanData = guid.replace(/-/g, "");
  var cleanFormat = template.replace(/[-\{]/g, "").split('}');
  var d = Array(16);

  for (var i = 0; i < cleanData.length; i = i + 2) {
    d[parseInt(cleanFormat[i / 2])] = cleanData[i] + cleanData[i + 1];
  }
  return new Buffer(d.join(''), 'hex');
}

module.exports.formatSID = formatSID;
module.exports.unformatSID = unformatSID;
module.exports.formatGUID = formatGUID;
module.exports.unformatGUID = unformatGUID;