/**
 * @require ParkingManager.js
 */

ParkingManager.SpacesEditor = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_spaceseditor */
    ptype: "app_spaceseditor",
    
    /** private: property[editor]
     *  ``gxp.plugins.FeatureEditor``
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
        ParkingManager.SpacesEditor.superclass.addOutput.apply(this, arguments);
    }

});

Ext.preg(ParkingManager.SpacesEditor.prototype.ptype, ParkingManager.SpacesEditor);
