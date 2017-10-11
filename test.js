var subject = require('./subject.js')
var mock = require('mock-fs');
subject.inc(-1,undefined);
subject.inc(1,false);
subject.inc(1,undefined);
subject.weird(8,-1,41,"strict");
subject.weird(6,1,43,false);
subject.weird(8,1,43,"strict");
mock({"path/fileExists":{"rand":""},"pathContent":{"file1":"text content"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{"rand":""},"pathContent":{"file1":"text content"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{"rand":""},"pathContent":{"file1":""}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{"rand":""},"pathContent":{"file1":"text content"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{},"pathContent":{"file1":"text content"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"pathContent":{"file1":"text content"}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{"rand":""}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({"path/fileExists":{}});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
mock({});
	subject.fileTest('path/fileExists','pathContent/file1');
mock.restore();
subject.normalize('');
subject.normalize('');
subject.normalize('');
subject.format('','','');
subject.format('','','');
subject.format('','','');
subject.blackListNumber('');
subject.blackListNumber('');
subject.blackListNumber('');
