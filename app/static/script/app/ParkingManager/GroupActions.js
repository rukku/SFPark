/**
 * @require ParkingManager.js
 */

ParkingManager.GroupActions = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_groupactions */
    ptype: "app_groupactions",
    
    /** api: config[groupManager]
     *  :class:`ParkingManager.GroupManager` The group manager to assign the
     *  actions to.
     */
    
    /** api: config[actions]
     *  ``Object`` Like actions in ``gxp.plugins.Tool``, but with two
     *  additional properties:
     *
     *  * urlTemplate - ``String`` template for the link to follow. To
     *    reference fields of the selected row of the grid, use "{fieldName}"
     *    in the template. In addition to the fields, "{fid}" is available for
     *    the feature id (primary key).
     *  * outputConfig - ``Object`` overrides this tool's outputConfig
     */
     
    /** api: config[actionTarget]
     *  Not required, will be auto-configured.
     */
    
    /** private: property[editor]
     *  ``gxp.plugins.FeatureEditor``
     */
    
    addActions: function() {
        var groupManager = this.target.tools[this.groupManager];
        var len = this.actions.length, actions = new Array(len);
        var tool = this;
        for (var i=0; i<len; ++i) {
            actions[i] = Ext.apply({
                iconCls: "app-icon-process",
                handler: function() {
                    var grid = groupManager.container.grid;
                    var rec = grid.getSelectionModel().getSelected();
                    var feature = rec.getFeature();
                    var tpl = new Ext.Template(this.urlTemplate);
                    var outputConfig = Ext.applyIf(this.outputConfig || {},
                        tool.initialConfig.outputConfig);
                    tool.outputConfig = Ext.apply(outputConfig, {
                        title: this.menuText,
                        bodyCfg: {
                            tag: "iframe",
                            src: tpl.apply(Ext.applyIf({
                                fid: feature.fid.split(".").pop()
                            }, feature.attributes)),
                            style: {border: "0px none"}
                        }
                    });
                    tool.addOutput();
                }
            }, this.actions[i]);
        }
        this.actionTarget = groupManager.container.id + ".contextMenu";
        ParkingManager.GroupActions.superclass.addActions.apply(this, [actions]);
    }
    
});

Ext.preg(ParkingManager.GroupActions.prototype.ptype, ParkingManager.GroupActions);
