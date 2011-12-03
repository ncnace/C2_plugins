﻿function GetPluginSettings()
{
	return {
		"name":			"Hash",
		"id":			"Rex_Hash",
		"description":	"Store value in a hash table",
		"author":		"Rex.Rainbow",
		"help url":		"",
		"category":		"Data & Storage",
		"type":			"object",			// not in layout
		"rotatable":	false,
		"flags":		0
	};
};

//////////////////////////////////////////////////////////////
// Conditions

//////////////////////////////////////////////////////////////
// Actions
AddStringParam("Key string", "The key string of the hash value to set.", '""');
AddAnyTypeParam("Value", "The value to store in the array.", "0");
AddAction(1, 0, "Set value by key string", "Hash", "Set value at <i>{0}</i> to <i>{1}</i>",
         "Set value by a key string.", "SetByKeyString");
AddStringParam("Key string", "The key string of the hash entry to get.", '""');
AddAction(2, 0, "Set current entry", "Entry", "Get hash entry from <i>{0}</i>",
         "Set current entry by key string.", "SetCurHashEntey");
AddStringParam("Key name", "The key of the hash value to set.", '""');
AddAnyTypeParam("Value", "The value to store in the array.", "0");
AddAction(3, 0, "Set value at current entry", "Entry", "Set value at <i>{0}</i> to <i>{1}</i> in current entry",
         "Set value at current entry.", "SetValueInCurHashEntey");
AddAction(4, 0, "Clean all", "Entry", "Clean all entries",
         "Clean all entries.", "CleanAll");         

//////////////////////////////////////////////////////////////
// Expressions
AddStringParam("Key string", "The key string of the hash to get.", '""');
AddExpression(0, ef_return_any | ef_variadic_parameters, "Get value at", "Hash", "Hash", 
              "Get value from the hash by key string.");
AddStringParam("Key name", "The key string of the hash value to get.", '""');
AddExpression(1, ef_return_any | ef_variadic_parameters, "Get value from current entry", "Entry", "Entry", 
              "Get value from current entry.");              


ACESDone();

// Property grid properties for this plugin
var property_list = [
    new cr.Property(ept_text, "Contains", "", 
                   'Set initial contains. ex:"{"a":10,"b":{"c":"d"}}".'),	     
	];
	
// Called by IDE when a new object type is to be created
function CreateIDEObjectType()
{
	return new IDEObjectType();
}

// Class representing an object type in the IDE
function IDEObjectType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new object instance of this type is to be created
IDEObjectType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance, this);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
	
	// Save the constructor parameters
	this.instance = instance;
	this.type = type;
	
	// Set the default property values from the property table
	this.properties = {};
	
	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
}

// Called by the IDE after all initialization on this instance has been completed
IDEInstance.prototype.OnCreate = function()
{
}

// Called by the IDE after a property has been changed
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
}
	
// Called by the IDE to draw this instance in the editor
IDEInstance.prototype.Draw = function(renderer)
{
}

// Called by the IDE when the renderer has been released (ie. editor closed)
// All handles to renderer-created resources (fonts, textures etc) must be dropped.
// Don't worry about releasing them - the renderer will free them - just null out references.
IDEInstance.prototype.OnRendererReleased = function()
{
}