/*
    Change tuning profile (Version 1), an extension for the gnome-shell.
    (C) 2014 Langdon White; 
    Gnome Shell Extensions: <https://extensions.gnome.org/>

    Thanks to: Kurt Fleisch; <http://www.bananenfisch.net/gnome/> for 
    RECENT ITEMS (Version 6) for much of this code.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version. <http://www.gnu.org/licenses/>

*/

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Main = imports.ui.main;
const Util = imports.misc.util;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;

function sortfunc(x,y)
{
  return y - x;
}

function MyPopupMenuItem()
{
  this._init.apply(this, arguments);
}

MyPopupMenuItem.prototype =
{
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(gicon, showDot, text, params)
    {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, params);

        this.box = new St.BoxLayout({ style_class: 'popup-combobox-item' });

        if (gicon)
	{
	    this.icon = new St.Icon({ gicon: gicon, style_class: 'popup-menu-icon' });
	    this.box.add(this.icon);
	}
	
        this.setShowDot(showDot);
        this.label = new St.Label({ text: text });
        this.box.add(this.label);
        this.addActor(this.box);
    }
};

function ChangeTuned()
{
  this._init.apply(this, arguments);
}

ChangeTuned.prototype =
{
    __proto__: PanelMenu.Button.prototype,
 
    _init: function()
    {
        PanelMenu.Button.prototype._init.call(this, 0.0);
        this.connect('destroy', Lang.bind(this, this._onDestroy));
        this._iconActor = new St.Icon({ icon_name: 'system-run-symbolic',
                                        style_class: 'system-status-icon' });
        this.actor.add_actor(this._iconActor);
        this.actor.add_style_class_name('panel-status-button');

	this.tunedadm_path = GLib.find_program_in_path('tuned-adm');
	log("tunedadm= " + this.tunedadm_path);
	this.pkexec_path = GLib.find_program_in_path('pkexec');
	log("pkexec= " + this.pkexec_path);

        this._display();

        Main.panel.addToStatusArea('change-tuned', this);
    },

    _onDestroy: function() {
        //placeholder
    },

   _display: function()
   {
       log("in display: " + this.tunedadm_path)
       if (!this.tunedadm_path) 
       {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            let menuItem = new MyPopupMenuItem(false, false, 'Tuned not (apparently) available', {});
            this.menu.addMenuItem(menuItem);
       } 
       else 
       {
           let profiles = this._getItems();
	   
           profiles.sort(sortfunc);

           let id = 0;
	   let active = this._currentProfile();

           for(id =0; id < profiles.length; id++)
           {   //let itemtype = items[modlist[id][1]].get_mime_type();
               //let gicon = Gio.content_type_get_icon(itemtype);
               //let menuItem = new MyPopupMenuItem(gicon, items[profiles[id][1]].get_display_name(), {});
               let menuItem = new MyPopupMenuItem(null, (active == profiles[id]), profiles[id], {});
               this.menu.addMenuItem(menuItem);
               menuItem.connect('activate', Lang.bind(this, this._changeProfile, profiles[id]));
           }
       }
    },
    _redisplay: function()
    {
        this.menu.removeAll();
        this._display();
    },
    _changeProfile: function(a, b, c)
    {
	log("attempting: " + this.pkexec_path + " " + this.tunedadm_path  + " profile " + c);
	//let change_result = "";
	//let change_result = GLib.spawn_command_line_async(this.pkexec_path + " " + this.tunedadm_path  + " profile " + c).toString().trim();
	let change_result = Util.trySpawnCommandLine(this.pkexec_path + " " + this.tunedadm_path  + " profile " + c)
	log("result of attempting profile change: " + change_result);
    },
    _getItems: function()
    {
	let profiles;
	log("exec-line=" + this.pkexec_path + " " + this.tunedadm_path  + " list");
	let profile_list = GLib.spawn_command_line_sync(this.tunedadm_path  + " list")
	log("profile_list= " + profile_list);
	if (profile_list.length > 0) 
	{
	    let profiles_tmp = profile_list[1].toString().trim().split('\n');
	    if (profiles_tmp.length > 0)
	    {
		//remove the "commentary"; first and last items 
		let index = 1;
		profiles = [];
		for (index; index < profiles_tmp.length - 1; index++) {
		    let str = profiles_tmp[index].replace('-','').trim();
		    profiles.push(str);
		    log("profiles[" + profiles.length + "]= " + str + "; charCode0: " + str.charCodeAt(0) +
			"; charCode1: " + str.charCodeAt(1) +
			"; charCode2: " + str.charCodeAt(2) +
			"; charCode3: " + str.charCodeAt(3)
		   );
		}
	    }
	}
	return profiles;
    },
    _currentProfile: function()
    {
	let active;
	let active_result = GLib.spawn_command_line_sync(this.tunedadm_path  + " active")[1]
	log("active_result = " + active_result);
	if (active_result.length > 0) 
	{
	    active_result = active_result.toString().trim().split(" ");
	    active = active_result[active_result.length - 1];
	}
	log("active: " + active);
	return active;
    },
};

function init()
{
}

let changer;

function enable()
{
  changer = new ChangeTuned();
}
function disable()
{
  changer.destroy();
}
