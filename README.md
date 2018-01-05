Ldapper 2.x
================
Node module that provides wrapper methods for [`ldapjs`](http://ldapjs.org/client.html) client.

* [Installation](#install)
* [Example](#usage)
* [Documentation](#documentation)
  * [Construction](#construction)
  * [Methods](#methods)
    * [find](#find)
    * [findOne](#findOne)
    * [findGuid](#findGuid)
    * [findSid](#findSid)
    * [add](#add)
    * [change](#change)
    * [rename](#rename)
    * [delete](#delete)
    * [authenticate](#authenticate)
* [License](#license)

# <a name="install"></a>Installation
In your project root run from command line:
```
$ npm install -save ldapper
```

# <a name="usage"></a>Example
Let's start! Include in your node application `ldapper` module:

```javascript
//import ldapper
import { Ldapper } from 'ldapper';

//create options
const options = {
  domainControllers: ['192.168.99.100'],
  searchScope: 'ou=users,dc=acme,dc=com',
  root: {
    dn: 'cn=admin,dc=acme,dc=com',
    password: 'admin'
  }     
};

//create an instance
let ldapper = new Ldapper(options);

ldapper.find('|(cn=test*)(sn=test*)')
.then(res => {
  console.log(res);
});
```

# <a name="documentation"></a>Documentation
# <a name="construction"></a>Construction
A `Ldapper` instance can be created using factory or using the `new` keyword.
```javascript
import factory from 'ldapper';
let ldapper = factory.create();
//or
import { Ldapper } from 'ldapper';
let ldapper = new Ldapper();
```

### <a name="require"/>new Ldapper( [options] ) : Object
The `ldapper` module can be initialized with a configuration object.

__Arguments__

```javascript
[options] {Object} Optional configuration
```

__Returns__

```javascript
{Object} Get an instance
```

The configuration object allows you to overrides default values. If you don't specify any configuration, it uses a default object:
```javascript
{
  domainControllers: [],
  searchScope: null,
  searchOptions: {
    scope: 'sub',
    filter: '(objectclass=*)',
    attributes: [],
    sizeLimit: 0,
    paged: false
  },
  root: {
    dn: null,
    password: null
  }
  ssl: false,
  timeout: null,
  connectTimeout: null,
  strictdn: false
}
```

## <a name="methods"></a>Methods
### <a name="find"/>find( [filter], [attributes], [searchDn], [options] ) : Promise( Array )
Search entries from ldap.

__Arguments__

```code
[filter]      {string} An ldap filter
[attributes]  {Array} Specify returned attributes
[searchDn]    {string} Search path
[options]     {object} Overrides configuration for searchOptions
```

__Returns__

```code
{Array} Returns a list of entries
```

__Throws__

```code
{LDAPSearchError}
```
---------------------------------------

### <a name="findOne"/>findOne( dn, [attributes], [options] ) : Promise( Object )
Get an entry from ldap.

__Arguments__

```code
dn            {string} Distinguished name
[attributes]  {Array} Specify returned attributes
[options]     {object} Overrides configuration for searchOptions
```

__Returns__

```code
{Object} Returns the entry
```

__Throws__

```code
{LDAPSearchError}
```
---------------------------------------

### <a name="findGuid"/>findGuid( guid, [attributes], [options] ) : Promise( Object )
Get an entry from Active Directory by objectGuid.

__Arguments__

```code
guid          {string|Buffer} Object guid
[attributes]  {Array} Specify returned attributes
[options]     {object} Overrides configuration for searchOptions
```

__Returns__

```code
{Object} Returns the entry
```

__Throws__

```code
{LDAPSearchError}
```
---------------------------------------

### <a name="findSid"/>findSid( sid, [attributes], [options] ) : Promise( Object )
Get an entry from Active Directory by objectSid.

__Arguments__

```code
sid           {string|Buffer} Object sid
[attributes]  {Array} Specify returned attributes
[options]     {object} Overrides configuration for searchOptions
```

__Returns__

```code
{Object} Returns the entry
```

__Throws__

```code
{LDAPSearchError}
```
---------------------------------------

### <a name="add"/>add( dn, [entry] ) : Promise( bool )
Create a new entry into ldap.

__Arguments__

```code
dn      {string} Distinguished name to create
[entry] {Object} Attributes to set on ldap for entry
```

__Returns__

```code
{bool} Returns success
```

__Throws__

```code
{LDAPAddError}
```
---------------------------------------

### <a name="change"/>change( dn, changes ) : Promise( Object )
Change an entry into ldap. The list of changes must be an object with these attributes:
* `op` one of these values [`write` | `append` | `delete`]
* `attr` the ldap attribute name to change
* `val` the ldap value to add/replace

```javascript
//Example:
var changes = [
  //Add a new value or replace the old value if exists
  { op: 'write', attr: 'cn', val: 'test' },
  //Append values to the attribute
  { op: 'append', attr: 'mail', val: 'test.02@acme.com' },
  { op: 'append', attr: 'mail', val: 'test.03@acme.com' },
  //Delete all values for the given attribute
  { op: 'delete', attr: 'loginShell' }
  //Delete only the value specified
  { op: 'delete', attr: 'mail', val: 'test.02@acme.com' }
]
```

__Arguments__

```code
dn        {string} Distinguished name to change
[changes] {Array|Object} A list of changes or a single change
```

__Returns__

```code
{Object} Returns the changed entry
```

__Throws__

```code
{LDAPChangeError}
```
---------------------------------------

### <a name="rename"/>rename( dn, newDn ) : Promise( bool )
Rename an entry into ldap.

__Arguments__

```code
dn      {string} Old distinguished name
newDn   {string} New distinguished name
```

__Returns__

```code
{bool} Returns success
```

__Throws__

```code
{LDAPRenameError}
```
--------------------------------

### <a name="delete"/>delete( dn ) : Promise( bool )
Delete an entry from ldap.

__Arguments__

```code
dn  {string} Distinguished name to delete
```

__Returns__

```code
{bool} Returns success
```

__Throws__

```code
{LDAPDeleteError}
```
---------------------------------------

### <a name="authenticate"/>authenticate( username, password, [authAttributes], [retAttribute], [searchDn] ) : Promise( Object )
Check if given credentials are valid on ldap.

__Arguments__

```code
username          {string} The username
password          {string} The password
[authAttributes]  {Array|string} Specify which attributes using for authentication
[retAttribute]    {Array|string} Specify returned attributes
[searchDn]        {string} Search path

```

__Returns__

```code
{Object} Returns an object
```

__Throws__

```code
{LDAPAuthenticationError}
```

# <a name="license"></a>License
The [MIT License](https://github.com/thinkingmik/ldapper/blob/master/LICENSE)

Copyright (c) 2018 Michele Andreoli <http://thinkingmik.com>
