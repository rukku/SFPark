/**
 * @require ParkingManager.js
 */

ParkingManager.GroupManager = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gx_wmsgetfeatureinfo */
    ptype: "app_groupmanager",

    /** api: config[addActionTip]
     *  ``String``
     *  Text for box selection tooltip (i18n).
     */
    addActionTip: "Add a new group",
    
    /** api: config[addActionText]
     *  ``String``
     *  Text for box selection button (i18n).
     */
    addActionText: "New group",
    
    /** api: config[modifyActionTip]
     *  ``String``
     *  Text for box selection tooltip (i18n).
     */
    modifyActionTip: "Add or remove from group",
    
    /** api: config[modifyActionText]
     *  ``String``
     *  Text for box selection button (i18n).
     */
    modifyActionText: "Modify selected",
    
    /** api: config[removeActionTip]
     *  ``String``
     *  Text for modify selection tooltip (i18n).
     */
    removeActionTip: "Remove group",

    /** api: config[clickBuffer]
     *  ``Number``
     *  Clicks will be treated as boxes with pixel width and height that is twice
     *  this value.  Default is 3 (meaning a 6x6 pixel box will be used).
     */
    clickBuffer: 3,
    
    /** api: config[maxFeatures]
     *  ``Number``
     *  Maximum number of groups to request.  Default is 100.  Set to ``null`` 
     *  for unlimited groups.
     */
    maxFeatures: 100,
    
    /** private: property[selectedGroup]
     */
    
    /** api: method[init]
     *  :arg target: ``gxp.Viewer``
     *  Initialize the plugin.
     */
    init: function(target) {
        ParkingManager.GroupManager.superclass.init.apply(this, arguments);
        
        this.initGroupFeatureManager();
        this.initContainer();
    },
    
    /** private: method[initGroupFeatureManager]
     *  Create the feature manager for group features.
     */
    initGroupFeatureManager: function() {
        this.groupFeatureManager = new gxp.plugins.FeatureManager({
            maxFeatures: this.maxFeatures,
            paging: false,
            autoLoadFeatures: true,
            autoActivate: false,
            layer: this.layer,
            listeners: {
                layerchange: function() {
                    // featureStore is set
                    this.addComponents();
                },
                scope: this
            }
        });
        this.groupFeatureManager.init(this.target);
    },
    
    /** private: method[initContainer]
     *  Create the primary output container.  All other items will be added to 
     *  this when the group feature store is ready.
     */
    initContainer: function() {
        this.container = new Ext.Container({
            layout: "vbox",
            layoutConfig: {
                align: "stretch",
                pack: "start"
            },
            items: [],
            listeners: {
                added: function(panel, container) {
                    container.on({
                        expand: function() {
                            this.groupFeatureManager.activate();
                            var spacesManager = this.target.tools[this.featureManager];
                            spacesManager.clearFeatures();
                            spacesManager.showLayer(this.id);
                        },
                        collapse: function() {
                            this.groupFeatureManager.activate();
                            var spacesManager = this.target.tools[this.featureManager];
                            spacesManager.clearFeatures();
                            spacesManager.hideLayer(this.id);
                        },
                        scope: this
                    });
                },
                scope: this
            }
        });
    },
    
    /** private: method[addComponents]
     *  Called when the feature store is ready.  At this point, we can add 
     *  components to the container.
     */
    addComponents: function() {

        var tool = this;
        
        var add = new Ext.Action({
            tooltip: this.addActionTip,
            text: this.addActionText,
            iconCls: "app-icon-addgroup",
            handler: function() {
                // create a new feature
                var feature = new OpenLayers.Feature.Vector();
                feature.state = OpenLayers.State.INSERT;
                var manager = this.groupFeatureManager;
                manager.featureLayer.addFeatures([feature]);
                this.container.disable();
                var store = manager.featureStore;
                
                // save the new feature
                store.save();
                store.on({
                    write: {
                        fn: function() {
                            this.container.enable();
                            grid.getSelectionModel().selectLastRow(false);
                            modify.control.activate();
                        },
                        single: true
                    },
                    scope: this
                });
                
            },
            scope: this
        });

        var modify = new GeoExt.Action({
            tooltip: this.modifyActionTip,
            disabled: true,
            text: this.modifyActionText,
            iconCls: "app-icon-boxselect",
            toggleGroup: this.toggleGroup,
            enableToggle: true,
            allowDepress: true,
            map: this.target.mapPanel.map,
            control: new (OpenLayers.Class(OpenLayers.Control, {
                initialize: function() {
                    this.handler = new OpenLayers.Handler.Box(this, {
                        done: function(result) {
                            tool.handleBoxResult(result);
                        }
                    });
                    OpenLayers.Control.prototype.initialize.apply(this, arguments);
                }
            }))()
        });

        var grid = new Ext.grid.EditorGridPanel({
            border: false,
            store: this.groupFeatureManager.featureStore,
            selModel: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
                    rowselect: function(sm, rowIndex, record) {
                        this.selectedGroup = record;
                        modify.enable();
                    },
                    rowdeselect: function(sm, rowIndex, record) {
                        this.selectedGroup = null;
                        modify.disable();
                    },
                    scope: this
                }
            }),
            autoHeight: true,
            columns: [{
                id: "title",
                header: "Title",
                dataIndex: "title",
                sortable: true,
                editor: {
                    xtype: "textfield",
                    allowBlank: false
                }
            }, {
                id: "count",
                header: "Count",
                align: "center",
                dataIndex: "spaces",
                menuDisabled: true,
                width: 50,
                editable: false,
                renderer: function(value) {
                    return value && value.split(",").length;
                }
            }, {
                xtype: "actioncolumn",
                width: 30,
                fixed: true,
                menuDisabled: true,
                hideable: false,
                items: [{
                    iconCls: "app-icon-removegroup",
                    tooltip: this.removeActionTip,
                    handler: function(grid, rowIndex) {
                        var store = grid.store;
                        store._removing = true; // TODO: remove after http://trac.geoext.org/ticket/141
                        store.getAt(rowIndex).getFeature().state = OpenLayers.State.DELETE; // TODO: remove after http://trac.geoext.org/ticket/141
                        store.removeAt(rowIndex);
                        delete store._removing; // TODO: remove after http://trac.geoext.org/ticket/141
                        store.save();
                    }
                }]
            }],
            autoExpandColumn: "title",
            bbar: ["->", add, modify]
        });
        
        this.container.add([{
            layout: "form",
            border: false,
            labelAlign: "top",
            style: {
                padding: "10px"
            },
            items: [{
                xtype: "textfield",
                name: "keywords",
                fieldLabel: "Search",
                anchor: "95%"
            }]
        }, grid]);
        
        if (this.container.rendered) {
            this.container.doLayout();
        }

    },

    /** api: method[addOutput]
     */
    addOutput: function() {
        return ParkingManager.GroupManager.superclass.addOutput.call(this, this.container);
    },
    
    handleBoxResult: function(result) {
        var minX, minY, maxX, maxY;
        var buffer = this.clickBuffer;
        if (result instanceof OpenLayers.Pixel) {
            minX = result.x - buffer;
            minY = result.y - buffer;
            maxX = result.x + buffer;
            maxY = result.y + buffer;
        } else {
            minX = result.left;
            minY = result.top;
            maxX = result.right;
            maxY = result.bottom;
        }
        var map = this.target.mapPanel.map;
        var tl = map.getLonLatFromPixel({x: minX, y: minY});
        var br = map.getLonLatFromPixel({x: maxX, y: maxY});
        var filter = new OpenLayers.Filter.Spatial({
            type: OpenLayers.Filter.Spatial.BBOX,
            value: new OpenLayers.Bounds(tl.lon, br.lat, br.lon, tl.lat),
            projection: map.getProjectionObject()
        });
        var featureManager = this.target.tools[this.featureManager];
        featureManager.loadFeatures(filter, this.onFeatureLoad, this);
    },
    
    onFeatureLoad: function(features) {
        var group = this.selectedGroup;
        if (group) {
            // gather existing ids
            var spaceIds = {};
            var existing = group.get("spaces");
            if (existing) {
                Ext.each(existing.split(","), function(id) {
                    id = id.trim().split(".").pop();
                    spaceIds[id] = true;
                });
            }
            
            // add new ids
            var modified = false;
            Ext.each(features, function(feature) {
                var id = feature.fid.split(".").pop();
                if (!spaceIds[id]) {
                    modified = true;
                    spaceIds[id] = true;
                }
            });
            
            // set new spaces property
            var values = [];
            for (var id in spaceIds) {
                values.push(id);
            }            
            if (modified) {
                group.set("spaces", values.join(","));
                // TODO: remove when http://trac.geoext.org/ticket/397 is in
                var feature = group.getFeature();
                if (feature.state !== OpenLayers.State.INSERT) {
                    feature.state = OpenLayers.State.UPDATE;
                }
                // end workaround for http://trac.geoext.org/ticket/397
                this.groupFeatureManager.featureStore.save();
            }
        }
    }

});

Ext.preg(ParkingManager.GroupManager.prototype.ptype, ParkingManager.GroupManager);
