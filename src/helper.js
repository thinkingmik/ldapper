import _ from 'lodash';
import binary from 'binary';

class Helper {
  static formatSID(buf) {
    const parser = binary.parse(buf)
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
    const version = parser.vars.version;
    const type = parser.vars.type;
    const domsid = parser.vars.sid;
    const output = ['S', version, outputSidType(type)].concat(domsid).join('-');
    return output;
  }

  static outputSidType(type) {
    const buf = new Buffer(6);
    let output = 0;
    type.copy(buf, 0);
    for (let i = 0; i < 6; i++) {
      output = output << 8;
      output = output | buf[i];
    }
    return output;
  }

  static unformatSID(sid) {
    const objSid = null;
    let version = 1;
    let type = new Buffer(6);
    let domsid = [];

    sid.split('-').some((item, index) => {
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

    const len = domsid.length + 2;
    const buf = new Buffer(len * 4);
    buf.writeUInt8(version, 0);
    buf.writeUInt8(len - 2, 1);
    type.copy(buf, 2, 0, 6);
    for (let i = 2; i < len; i++) {
      buf.writeUInt32LE(domsid[i - 2], i * 4);
    }

    return buf;
  }

  static inputType(type) {
    const tmpType = new Buffer(6);
    let value = type;
    for (let i = 0; i < 6; i++) {
      const octet = value & 0xff;
      value = value >> 8;
      tmpType.writeUInt8(octet, 5 - i);
    }
    return tmpType;
  }

  static formatGUID(buff, format) {
    const data = new Buffer(buff, 'binary');
    let template = '{3}{2}{1}{0}-{5}{4}-{7}{6}-{8}{9}-{10}{11}{12}{13}{14}{15}';
    if (!_.isNull(format) && !_.isUndefined(format)) {
      template = format;
    }

    for (let i = 0; i < data.length; i++) {
      let dataStr = data[i].toString(16);
      dataStr = data[i] >= 16 ? dataStr : `0${dataStr}`;
      template = template.replace(new RegExp(`\\{${i}\\}`, 'g'), dataStr);
    }
    return template;
  }

  static unformatGUID(guid, format) {
    let template = '{3}{2}{1}{0}-{5}{4}-{7}{6}-{8}{9}-{10}{11}{12}{13}{14}{15}';
    if (!_.isNull(format) && !_.isUndefined(format)) {
      template = format;
    }
    const cleanData = guid.replace(/-/g, "");
    const cleanFormat = template.replace(/[-\{]/g, "").split('}');
    const d = Array(16);

    for (let i = 0; i < cleanData.length; i = i + 2) {
      d[parseInt(cleanFormat[i / 2])] = cleanData[i] + cleanData[i + 1];
    }
    return new Buffer(d.join(''), 'hex');
  }
}

export default Helper;