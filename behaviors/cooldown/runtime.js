﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.TimerCooldown = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.TimerCooldown.prototype;
		
	/////////////////////////////////////
	// Behavior type class
	behaviorProto.Type = function(behavior, objtype)
	{
		this.behavior = behavior;
		this.objtype = objtype;
		this.runtime = behavior.runtime;
	};

	var behtypeProto = behaviorProto.Type.prototype;

	behtypeProto.onCreate = function()
	{
        this.timeline = null;      
	};

	/////////////////////////////////////
	// Behavior instance class
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;				// associated object instance to modify
		this.runtime = type.runtime;
	};

	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{      
        this.timer = null;
        this.activated = this.properties[0];
        this.cd_interval = 0;
        this.is_accept = false;
	};
    
	behinstProto.onDestroy = function()
	{
        if (this.timer)
        {
            this.timer.Remove();
        }
	};    
    
	behinstProto.tick = function ()
	{        
        var is_running = (this.timer)?
                         this.timer.IsActive():
                         false;

        if (is_running)
        {
            this.runtime.trigger(cr.behaviors.TimerCooldown.prototype.cnds.OnCD, this.inst); 
        }
	};
    
    behinstProto._on_cooldown_finished = function()
    {    
        this.runtime.trigger(cr.behaviors.TimerCooldown.prototype.cnds.OnCDFinished, this.inst); 
    };

	//////////////////////////////////////
	// Conditions
	behaviorProto.cnds = {};
	var cnds = behaviorProto.cnds;
    
	cnds.OnCallAccepted = function ()
	{  
		return true;  
	};
    
	cnds.OnCallRejected = function ()
	{  
		return true;  
	}; 
    
	cnds.OnCD = function ()
	{  
		return true;  
	};    

	cnds.OnCDFinished = function ()
	{  
		return true;  
	};
    
	cnds.IsCallAccepted = function ()
	{  
		return this.is_accept;  
	};
    
	cnds.IsCallRejected = function ()
	{  
		return (!this.is_accept); 
	}; 
    
	cnds.IsAtCD = function ()
	{  
        var is_running = false;
        if (this.timer)
        {
            is_running = this.timer.IsActive();
        }
		return is_running; 
	};  
    
	//////////////////////////////////////
	// Actions
	behaviorProto.acts = {};
	var acts = behaviorProto.acts;

    acts.Setup = function (timeline_objs, cd_interval)
	{
        this.type.timeline = timeline_objs.instances[0];
        this.cd_interval = cd_interval;       
	};    
    
    acts.Request = function ()
	{
        if (this.activated == 0)
            return;
            
        if ( this.timer == null )
        {
            this.is_accept = true;
            this.timer = this.type.timeline.CreateTimer(this, this._on_cooldown_finished);
        }
        else 
        {
           this.is_accept = (!this.timer.IsActive());
        }
        
        if ( this.is_accept )
        {
            this.runtime.trigger(cr.behaviors.TimerCooldown.prototype.cnds.OnCallAccepted, this.inst); 
            this.timer.Start(this.cd_interval);
        }
        else
        {
            this.runtime.trigger(cr.behaviors.TimerCooldown.prototype.cnds.OnCallRejected, this.inst); 
        }
	}; 
    
    acts.SetCDInterval = function (cd_interval)
	{
        this.cd_interval = cd_interval;       
	};  
    
    acts.Pause = function ()
	{
        if (this.timer)
        {
            this.timer.Suspend();
        }
	};   

    acts.Resume = function ()
	{
        if (this.timer)
        {
            this.timer.Resume();
        }
	};    

	//////////////////////////////////////
	// Expressions
	behaviorProto.exps = {};
	var exps = behaviorProto.exps;

    exps.Remainder = function (ret)
	{
        var val = (this.timer)? this.timer.RemainderTimeGet():0;     
	    ret.set_float(val);
	};
    
	exps.Elapsed = function (ret, timer_name)
	{
        var val = (this.timer)? this.timer.ElapsedTimeGet():0;     
	    ret.set_float(val);
	};  

    exps.RemainderPercent = function (ret)
	{
        var val = (this.timer)? this.timer.RemainderTimePercentGet():0;     
	    ret.set_float(val);
	};
    
	exps.ElapsedPercent = function (ret, timer_name)
	{
        var val = (this.timer)? this.timer.ElapsedTimePercentGet():0;     
	    ret.set_float(val);
	};        
}());