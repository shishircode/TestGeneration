var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["subject.js"];
	}
	var filePath = args[0];

	constraints(filePath);

	generateTestCases()

}

var engine = Random.engines.mt19937().autoSeed();

function createConcreteIntegerValue( greaterThan, constraintValue )
{
	if( greaterThan )
		return Random.integer(constraintValue,constraintValue+10)(engine);
	else
		return Random.integer(constraintValue-10,constraintValue)(engine);
}

function Constraint(properties)
{
	this.ident = properties.ident;
	this.expression = properties.expression;
	this.operator = properties.operator;
	this.value = properties.value;
	this.altvalue = properties.altvalue;
        this.params3 = properties.params3; 
	this.funcName = properties.funcName;
	// Supported kinds: "fileWithContent","fileExists"
	// integer, string, phoneNumber
	this.kind = properties.kind;
}

function fakeDemo()
{
	console.log( faker.phone.phoneNumber() );
	console.log( faker.phone.phoneNumberFormat() );
	console.log( faker.phone.phoneFormats() );
}

var functionConstraints =
{
}

var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists': {}
	},
	fileWithContent:
	{
		pathContent: 
		{	
  			file1: 'text content',
		}
	},
	pathExistsWithContent:
	{
		'path/fileExists':{'rand':''}
	},
	noFile:
	{
		pathContent:
		{
		}
	},
	fileWithoutContent:
	{
		pathContent:
		{
			file1:'',
		}
	}

};
function initalizeParams(constraints)
{
	var params = {};
	
	// initialize params
	for (var i =0; i < constraints.params.length; i++ )
	{
		var paramName = constraints.params[i];
		params[paramName] = '\'\'';
	}
	return params;	
}

function fillParams(constraints,params,property)
{
	// plug-in values for parameters
	for( var c = 0; c < constraints.length; c++ )
	{
		var constraint = constraints[c];
		if( params.hasOwnProperty( constraint.ident ) )
		{
			params[constraint.ident] = constraint[property];
		}
	}
}

function generateTestCases()
{

	var content = "var subject = require('./subject.js')\nvar mock = require('mock-fs');\n";
	for ( var funcName in functionConstraints )
	{

		var params = initalizeParams(functionConstraints[funcName])
		var altparams = initalizeParams(functionConstraints[funcName])
		var params3 = initalizeParams(functionConstraints[funcName])
		//console.log( params );

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {kind: 'fileWithContent' });
		var pathExists      = _.some(constraints, {kind: 'fileExists' });
                var pathExistsWithContent = _.some(constraints, {kind: 'fileExistsWithContent' });
                var noFile = _.some(constraints, {kind: 'noFile' });
                var fileWithoutContent = _.some(constraints, {kind: 'fileWithoutContent' });


		fillParams(constraints,params,"value")
		fillParams(constraints,altparams,"altvalue")
		fillParams(constraints, params3, "params3")
		//console.log("ALT",altparams)
		//console.log("P",params)

		// Prepare function arguments.
		var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
		var altargs = Object.keys(altparams).map( function(k) {return altparams[k]; }).join(",");
                var params3 = Object.keys(params3).map( function(k) {return params3[k]; }).join(",");
		
		if( pathExists || fileWithContent )
		{
			content += generateMockFsTestCases(pathExists,fileWithContent,pathExistsWithContent,funcName, !noFile, !fileWithoutContent,args);
			// Bonus...generate constraint variations test cases....
                        content += generateMockFsTestCases(pathExists,fileWithContent,pathExistsWithContent,funcName,noFile, !fileWithoutContent, args);
			content += generateMockFsTestCases(pathExists,!fileWithContent,pathExistsWithContent,funcName,!noFile, fileWithoutContent, args);
    			content += generateMockFsTestCases(pathExists,fileWithContent,pathExistsWithContent,funcName, !noFile, fileWithoutContent,args);
			content += generateMockFsTestCases(pathExists,fileWithContent,!pathExistsWithContent,funcName, !noFile, !fileWithoutContent,args);
			content += generateMockFsTestCases(!pathExists,fileWithContent,!pathExistsWithContent,funcName, !noFile, !fileWithoutContent,args);
			content += generateMockFsTestCases(pathExists,!fileWithContent,pathExistsWithContent,funcName, !noFile, !fileWithoutContent,args);
			content += generateMockFsTestCases(pathExists,!fileWithContent,!pathExistsWithContent,funcName, !noFile, !fileWithoutContent,args);
			content += generateMockFsTestCases(!pathExists,!fileWithContent,!pathExistsWithContent,funcName, !noFile, !fileWithoutContent,args);
		}
		else
		{

			console.log( altargs )
			// Emit simple test case.
			content += "subject.{0}({1});\n".format(funcName, args );
			content += "subject.{0}({1});\n".format(funcName, altargs );
			content += "subject.{0}({1});\n".format(funcName, params3 );
		}

	}


	fs.writeFileSync('test.js', content, "utf8");

}

function generateMockFsTestCases (pathExists,fileWithContent,pathExistsWithContent,funcName,noFile,fileWithoutContent,args) 
{
	var testCase = "";
	// Build mock file system based on constraints.
	var mergedFS = {};
	if( pathExists )
	{
		for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
                if( pathExistsWithContent )
                {
 			for (var attrname in mockFileLibrary.pathExistsWithContent) { mergedFS[attrname] = mockFileLibrary.pathExistsWithContent[attrname];}
		}

	}
	if( noFile)
        {
                for (var attrname in mockFileLibrary.noFile) { mergedFS[attrname] = mockFileLibrary.noFile[attrname];}
        }
        if( fileWithoutContent)
        {
                for (var attrname in mockFileLibrary.fileWithoutContent) { mergedFS[attrname] = mockFileLibrary.fileWithoutContent[attrname];}
        }

	if( fileWithContent )
	{
		for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
	}

	testCase += 
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";

	testCase += "\tsubject.{0}({1});\n".format(funcName, args );
	testCase+="mock.restore();\n";
	return testCase;
}

function constraints(filePath)
{
   var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);

	traverse(result, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var funcName = functionName(node);
			console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};

			// Check for expressions using argument.
			traverse(node, function(child)
			{
				if( child.type === 'BinaryExpression' && child.operator == "==")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								altvalue: !rightHand,
								params3: rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				if( child.type === 'BinaryExpression' && child.operator == "<" )
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						// get expression from original source code:
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand) - 1,
								altvalue: parseInt(rightHand) +1,
								params3: parseInt(rightHand)+1, 
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}
				if( child.type === 'BinaryExpression' && child.operator == ">" )
                                {
                                        if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
                                        {
                                                // get expression from original source code:
                                                var expression = buf.substring(child.range[0], child.range[1]);
                                                var rightHand = buf.substring(child.right.range[0], child.right.range[1])

                                                functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: child.left.name,
                                                                value: parseInt(rightHand) + 1,
                                                                altvalue: parseInt(rightHand) -1,
								params3: parseInt(rightHand) +1,
                                                                funcName: funcName,
                                                                kind: "integer",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));
                                        }
                                }


				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{       
   							functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: params[p],
                                                                value:  "'pathContent/file1'",
                                                                funcName: funcName,
                                                                kind: "noFile",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));

							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file1'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));

							functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: params[p],
                                                                value:  "'pathContent/file1'",
                                                                funcName: funcName,
                                                                kind: "fileWithoutContent",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));
						}
					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								// A fake path to a file
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));

							functionConstraints[funcName].constraints.push(
                                                        new Constraint(
                                                        {
                                                                ident: params[p],
                                                                // A fake path to a file
                                                                value:  "'path/fileExists'",
                                                                funcName: funcName,
                                                                kind: "fileExistsWithContent",
                                                                operator : child.operator,
                                                                expression: expression
                                                        }));

						}
					}
				}

			});

			console.log( functionConstraints[funcName]);

		}
	});
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();
exports.main = main;
