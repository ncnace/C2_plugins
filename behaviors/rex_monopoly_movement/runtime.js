﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.Rex_MonopolyMovement = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.Rex_MonopolyMovement.prototype;
		
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
        this.group = null;    
	};
    
	/////////////////////////////////////
	// Behavior instance class
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;
		this.runtime = type.runtime;       
	};
	
	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{     
        this.square_dir = this.properties[0];
        this.hex_dir = this.properties[1];   
        this.forked_selection_mode = this.properties[2];		
        this.board = null; 
		this._is_square_grid = true;
        this._target_tile_uids = []; 
		this._dir_sequence = [];
        this._tile_info = {uid:0, dir:0};
		this.path_tiles_uid = [];
		this._forkedroad_dir = null;
		this._moving_cost = 1;
		
		this.exp_TileUID = (-1);		
		this.exp_TileLX = (-1);
		this.exp_TileLY = (-1);		
	};

	behinstProto.tick = function ()
	{
	};  
    
    var _dir_sequence_init = function (arr, dir_count)
	{
		var i;
		arr.length = 0;
		for (i=0; i<dir_count; i++)
		    arr.push(i);
	};
	
	behinstProto._board_get = function ()
	{
        var _xyz;
        if (this.board != null)
        {
            _xyz = this.board.uid2xyz(this.inst.uid);
            if (_xyz != null)
                return this.board;  // find out xyz on board
            else  // chess no longer at board
                this.board = null;
        }
            
        var plugins = this.runtime.types;
        var name, obj, dir_cnt;
        for (name in plugins)
        {
            obj = plugins[name].instances[0];
            if ((obj != null) && (obj.check_name == "BOARD"))
            {
                _xyz = obj.uid2xyz(this.inst.uid)
                if (_xyz != null)
                { 
                    this.board = obj;
					dir_cnt = obj.layout.GetDirCount();
					_dir_sequence_init(this._dir_sequence, dir_cnt);
					this._target_tile_uids.length = dir_cnt;
					this._is_square_grid = (dir_cnt == 4);					
                    return this.board;
                }
            }
        }
        return null;	
	};

    behinstProto._get_neighbor_tile_uids = function (tile_info)	
    {
        var i, cnt=this._target_tile_uids.length, dir;
        var board = this.board;
        var layout = board.layout;
        var tx, ty;
        for (i=0; i<cnt; i++)
            this._target_tile_uids[i] = board.dir2uid(tile_info.uid, i, 0);
        return this._target_tile_uids
    };
    
   var _get_valid_neighbor_tile_cnt = function (target_tile_uids)	
    {
        var i, cnt=target_tile_uids.length;
        var vaild_cnt = 0;        
        for (i=0; i<cnt; i++)
        {
            if (target_tile_uids[i] != null)
                vaild_cnt += 1;
        }
        return vaild_cnt;
    };    
    
    behinstProto._current_dir_get = function ()	
    {
        return (this._is_square_grid)?  this.square_dir:this.hex_dir;  
    };
    
    behinstProto._current_dir_set = function (dir)	
    {
        if (this._is_square_grid)
            this.square_dir = dir;
        else
            this.hex_dir = dir;
    };
    
    behinstProto._get_backward_dir = function (dir)	
    {
        var _half_dir_cnt = (this._target_tile_uids.length/2);
        var backdir = (dir >= _half_dir_cnt)? (dir - _half_dir_cnt):(dir + _half_dir_cnt);
        return backdir;
    };  
    
    behinstProto._tile_info_set = function (uid, dir)	
    {
		this._tile_info.uid = uid;	
		this._tile_info.dir = dir;
    };  
	
    
    behinstProto._get_backward_tile_info = function (tile_info, target_tile_uids)	
    {
        var dir = tile_info.dir;
		this._tile_info_set(target_tile_uids[dir], dir);
		return this._tile_info;
    };  
	
    behinstProto._get_forward_tile_info = function (tile_info, target_tile_uids, random_mode)
    {
	    // random_mode: 1=forward, then random, 2=all random
	    var dir = tile_info.dir;
		var tile_uid = target_tile_uids[dir];
		if ((tile_uid != null) && (random_mode != 2))
		{
		    this._tile_info_set(tile_uid, dir);
			return this._tile_info;
		}
		
        var backward_dir = this._get_backward_dir(dir);
        var i, cnt=target_tile_uids.length;
		if ((random_mode == 1) || (random_mode == 2))
		    _shuffle(this._dir_sequence);		
        for (i=0; i<cnt; i++)
        {
		    dir = this._dir_sequence[i];
		    tile_uid = target_tile_uids[dir];
            if ((tile_uid != null) && (dir != backward_dir))
			{
			    this._tile_info_set(tile_uid, dir);
                break;		    
		    }
        }
		return this._tile_info;
    };  	

    behinstProto._get_forkedroad_dir = function (tile_info, target_tile_uids)	
    {
	    this._forkedroad_dir = null;
		this.exp_TileUID = tile_info.uid;
		var tile_xyz = this.board.uid2xyz(tile_info.uid);
		this.exp_TileLX = tile_xyz.x;
		this.exp_TileLY = tile_xyz.y;			
		this.runtime.trigger(cr.behaviors.Rex_MonopolyMovement.prototype.cnds.OnForkedRoad, this.inst);
		if ((this._forkedroad_dir != null) && (target_tile_uids[this._forkedroad_dir] == null))
		    this._forkedroad_dir = null;
	    return this._forkedroad_dir;
    };
	
    behinstProto._get_forkedroad_tile_info = function (tile_info, target_tile_uids)	
    {
	    // custom dir
	    var dir = this._get_forkedroad_dir(tile_info, target_tile_uids);
		if (dir!= null)
		{
			this._tile_info.dir = dir;		
		    this._tile_info.uid = target_tile_uids[dir];
			return this._tile_info;
		}
		
		// default dir
        switch (this.forked_selection_mode)
        {
        case 0:    // Forwarding
		    tile_info = this._get_forward_tile_info(tile_info, target_tile_uids, 1);
            break;
        case 1:    // Random
		    tile_info = this._get_forward_tile_info(tile_info, target_tile_uids, 2);
            break;
        }
		return this._tile_info;
    };	
	
    behinstProto._get_target_tile_info = function (tile_info)	
    {        
        var target_tile_uids = this._get_neighbor_tile_uids(tile_info);
        var valid_cnt =  _get_valid_neighbor_tile_cnt(target_tile_uids);
        if (valid_cnt == 1)  // go backward
		    tile_info = this._get_backward_tile_info(tile_info, target_tile_uids);
        else if (valid_cnt == 2)  // go forward
            tile_info = this._get_forward_tile_info(tile_info, target_tile_uids);
        else
            tile_info = this._get_forkedroad_tile_info(tile_info, target_tile_uids);
        return tile_info;
    };
    
    behinstProto._get_cost = function (target_tile_uid)	
    {
	    this._moving_cost = 1;
		this.exp_TileUID = target_tile_uid;
		var tile_xyz = this.board.uid2xyz(target_tile_uid);
		this.exp_TileLX = tile_xyz.x;
		this.exp_TileLY = tile_xyz.y;			
		this.runtime.trigger(cr.behaviors.Rex_MonopolyMovement.prototype.cnds.OnGetMoving, this.inst);
	    return this._moving_cost;
    };
    
    behinstProto._tile_info_init = function ()	
    {
	    var current_tile_uid = this.board.lz2uid(this.inst.uid, 0);
		var current_dir = this._current_dir_get();
	    this._tile_info_set(current_tile_uid, current_dir);
		return this._tile_info;
    };	
    behinstProto.get_moving_path = function (moving_points)	
    {
		this.path_tiles_uid.length = 0;
        var tile_info, cost;
		var tile_info = this._tile_info_init();
        while (moving_points > 0)
        {
            tile_info = this._get_target_tile_info(tile_info);
            cost = this._get_cost(tile_info.uid);
            this.path_tiles_uid.push(tile_info.uid); 
            moving_points -= cost;
        }
        this._current_dir_set(tile_info.dir);
        // output: this.path_tiles_uid;
    };
	
	var _shuffle = function (arr)
	{
        var i = arr.length, j, temp, random_value;
		var random_gen = cr.behaviors.Rex_GridMove._random_gen;
        if ( i == 0 ) return;
        while ( --i ) 
        {
		    random_value = (random_gen == null)?
			               Math.random(): random_gen.random();
            j = Math.floor( random_value * (i+1) );
            temp = arr[i]; 
            arr[i] = arr[j]; 
            arr[j] = temp;
        }
    };	
	//////////////////////////////////////
	// Conditions
	function Cnds() {};
	behaviorProto.cnds = new Cnds();
	  
	Cnds.prototype.PopInstance = function (objtype)
	{
        if (!objtype)
            return;	    
		if  (this.path_tiles_uid.length > 0)
		{		    
		    var tile_uid = this.path_tiles_uid.shift();
			var insts = objtype.instances;
			var i, cnt=insts.length, inst;
			for (i=0; i<cnt; i++)
			{
			    inst = insts[i];
			    if (inst.uid == tile_uid)
				{
				    objtype.getCurrentSol().pick_one(inst);
                    objtype.applySolToContainer();
					return true;
				}
			}
			// can not pick
			return false;
		}
		else
		    return false;
	};
    
	Cnds.prototype.PopLastInstance = function (objtype)
	{
        if (!objtype)
            return;	    
		if  (this.path_tiles_uid.length > 0)
		{		    
		    var tile_uid = this.path_tiles_uid.pop();
			var insts = objtype.instances;
			var i, cnt=insts.length, inst;
			for (i=0; i<cnt; i++)
			{
			    inst = insts[i];
			    if (inst.uid == tile_uid)
				{
				    objtype.getCurrentSol().pick_one(inst);
                    objtype.applySolToContainer();
                    this.path_tiles_uid.length = 0;
					return true;
				}
			}
			// can not pick
			return false;
		}
		else
		    return false;
	};  

	Cnds.prototype.IsForwardingPathEmpty = function ()
	{
        return (this.path_tiles_uid.length == 0);
	}; 
	
	Cnds.prototype.OnGetMoving = function ()
	{
        return true;
	}; 	

	Cnds.prototype.OnForkedRoad = function ()
	{
        return true;
	}; 
    
	//////////////////////////////////////
	// Actions
	function Acts() {};
	behaviorProto.acts = new Acts();

	Acts.prototype.GetMovingPath = function (moving_points)	
	{
        if (this._board_get() == null)
            return;
	    this.get_moving_path(moving_points);
		// output: this.path_tiles_uid
	};	  	

	Acts.prototype.SetFace = function (dir)	
	{
        this._current_dir_set(dir);    
	};	
	
	Acts.prototype.SetMovingCost = function (cost)	
	{     
        this._moving_cost = cr.clamp(Math.floor(cost), 0, 1);
	}; 	
	
	Acts.prototype.SetFaceOnForkedRoad = function (dir)	
	{     
        this._forkedroad_dir = dir;	
	}; 

	Acts.prototype.SetDirectionSelection = function (mode)	
	{     
        this.forked_selection_mode = mode;
	}; 	
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	behaviorProto.exps = new Exps();
	
 	Exps.prototype.TileUID = function (ret)
	{
        ret.set_int(this.exp_TileUID);		
	};    
    
 	Exps.prototype.TileLX = function (ret)
	{
        ret.set_int(this.exp_TileLX);		
	};  	
    
 	Exps.prototype.TileLY = function (ret)
	{
        ret.set_int(this.exp_TileLY);		
	};
}());