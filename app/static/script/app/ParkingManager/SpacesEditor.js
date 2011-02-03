/**
 * @require ParkingManager.js
 */

ParkingManager.SpacesEditor = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_spaceseditor */
    ptype: "app_spaceseditor",
    
    /** private: property[editor]
     *  ``gxp.plugins.FeatureEditor`` This tool creates a FeatureEditor, which
     *  will be configured just by passing this tool's configuration object.
     */
    
    init: function(target) {
        ParkingManager.SpacesEditor.superclass.init.apply(this, arguments);
        this.editor = new gxp.plugins.FeatureEditor(this.initialConfig);
        this.editor.init(target);
    },
    
    addOutput: function() {
        Ext.getCmp(this.initialConfig.outputTarget).on({
            "beforecollapse": function() {
                this.editor.actions[0].control.deactivate();
                this.editor.actions[1].control.deactivate();
            },
            scope: this
        });
        // don't call super, because our real output is the FeatureEditor
    }

});

Ext.preg(ParkingManager.SpacesEditor.prototype.ptype, ParkingManager.SpacesEditor);
