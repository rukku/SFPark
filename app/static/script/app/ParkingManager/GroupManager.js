/**
 * @require ParkingManager.js
 */

ParkingManager.GroupManager = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_groupmanager */
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
    modifyActionText: "Select spaces",
    
    /** api: config[removeActionTip]
     *  ``String``
     *  Text for modify selection tooltip (i18n).
     */
    removeActionTip: "Remove group",

    /** api: config[removeTitle]
     *  ``String``
     *  Text for delete confirmation window title (i18n).
     */
    removeTitle: "Remove Group",

    /** api: config[removeMessage]
     *  ``String``
     *  Text for delete confirmation window text (i18n).
     */
    removeMessage: "Are you sure you want to remove this group?",

    /** api: config[searchLabel]
     *  ``String``
     *  Label for search input (i18n).
     */
    searchLabel: "Search",
    
    /** api: config[removeModifierKey]
     *  ``String``
     *  Modifier key to trigger removal of features from selected group.  
     *  Default is "shiftKey".
     */
    removeModifierKey: "shiftKey",

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
    
    /** api: config[layer]
     *  ``Object`` with source and name properties. The layer referenced here
     *  will be set as soon as it is added to the target's map. When this
     *  option is configured, ``autoSetLayer`` will be set to false.
     */

     /** api: config[symbolizer]
      *  ``Object`` An object with "Point", "Line" and "Polygon" properties,
      *  each with a valid symbolizer object for OpenLayers. Will be used to
      *  draw the selection lasso.
      */

    /** private: property[selectedGroup]
     */
    
    /** private: property[modify]
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
    
    addActions: function(config) {
        this.addOutput();
        
        var tool = this;
        var actions = ParkingManager.GroupManager.superclass.addActions.call(this, [{
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
                            var lastIndex = this.container.grid.getStore().getCount() - 1;
                            this.container.grid.getSelectionModel().selectRow(lastIndex, false);
                            this.container.grid.startEditing(lastIndex, 0);
                            this.modify.control.activate();
                        },
                        single: true
                    },
                    scope: this
                });
                
            },
            scope: this
        }, new GeoExt.Action({
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
                    this.handler = new OpenLayers.Handler.Polygon(this, {
                        done: function(result) {
                            tool.handleLassoResult(result, this.handler.evt);
                        }
                    }, {
                        freehand: true,
                        freehandToggle: false,
                        layerOptions: {
                            styleMap: new OpenLayers.StyleMap(tool.symbolizer)
                        },
                    });
                    OpenLayers.Control.prototype.initialize.apply(this, arguments);
                }
            }))()
        })]);
        
        this.modify = actions[1];
        return actions;
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
                layerchange: function(tool, store) {
                    if (store) {
                        // featureStore is set
                        this.addComponents();
                    } else {
                        // no featureStore, remove components
                        this.container.gridContainer.removeAll();
                    }
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
            layout: "border",
            items: [{
                layout: "form",
                region: "north",
                border: false,
                height: 55,
                labelAlign: "top",
                bodyStyle: {
                    padding: "5px"
                },
                items: [{
                    xtype: "textfield",
                    name: "keywords",
                    fieldLabel: this.searchLabel,
                    anchor: "100%",
                    validationDelay: 500,
                    listeners: {
                        valid: function(field) {
                            var filter = new OpenLayers.Filter.Comparison({
                                type: OpenLayers.Filter.Comparison.LIKE,
                                property: "title",
                                value: "*" + field.getValue() + "*"
                            });
                            console.log("querying");
                            this.groupFeatureManager.loadFeatures(filter);
                        },
                        focus: function(field) {
                            field.reset();
                        },
                        scope: this
                    }
                }]
            }, {
                xtype: "container",
                layout: "fit",
                region: "center",
                ref: "gridContainer"
            }],
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
                            this.groupFeatureManager.deactivate();
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
        var modify = this.modify;
        
        var grid = new Ext.grid.EditorGridPanel({
            ref: "../grid",
            autoScroll: true,
            border: false,
            store: this.groupFeatureManager.featureStore,
            selModel: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
                    rowselect: function(sm, rowIndex, record) {
                        this.selectedGroup = record;
                        this.fetchGroupSpaces(record);
                        modify.enable();
                    },
                    rowdeselect: function(sm, rowIndex, record) {
                        this.selectedGroup = null;
                        this.target.tools[this.featureManager].clearFeatures();
                        modify.control.deactivate();
                        modify.disable();
                    },
                    scope: this
                }
            }),
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
                    var count = 0;
                    if (value) {
                        var items = value.split(",");
                        count = items[0] ? items.length : 0;
                    }
                    return count;
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
                        Ext.Msg.confirm(this.removeTitle, this.removeMessage, function(btn) {
                            if (btn == "yes") {
                                if (grid.getSelectionModel().isSelected(rowIndex)) {
                                    modify.control.deactivate();
                                    modify.disable();
                                }
                                this.target.tools[this.featureManager].clearFeatures();
                                var store = grid.store;
                                store._removing = true; // TODO: remove after http://trac.geoext.org/ticket/141
                                store.getAt(rowIndex).getFeature().state = OpenLayers.State.DELETE; // TODO: remove after http://trac.geoext.org/ticket/141
                                store.removeAt(rowIndex);
                                delete store._removing; // TODO: remove after http://trac.geoext.org/ticket/141
                                store.save();
                            }
                        }, this);
                    },
                    scope: this
                }]
            }],
            autoExpandColumn: "title",
            listeners: {
                afteredit: function(event) {
                    if (event.value !== event.original) {
                        var feature = event.record.getFeature();
                        if (feature.state === OpenLayers.State.INSERT) {
                            // this should not happen if the insert succeeded
                            event.grid.startEditing(row, col);
                        } else {
                            event.grid.getStore().save();
                        }
                    }
                }
            }
        });
        
        this.container.gridContainer.add([grid]);
        
        if (this.container.gridContainer.rendered) {
            this.container.gridContainer.doLayout();
        }

    },
    
    fetchGroupSpaces: function(record) {
        var spaces = (record.get("spaces") || "").split(",");
        if (spaces.length && spaces[0]) {
            var filter = new OpenLayers.Filter.FeatureId({fids: spaces});
            this.target.tools[this.featureManager].loadFeatures(filter, function(features) {
                this.onFeatureLoad(features, record);
            }, this);
        }
    },

    /** api: method[addOutput]
     */
    addOutput: function() {
        return ParkingManager.GroupManager.superclass.addOutput.call(this, this.container);
    },
    
    handleLassoResult: function(result, event) {
        var filter;
        if (result.components[0].components.length == 2) {
            var minX, minY, maxX, maxY;
            var buffer = this.clickBuffer;
            minX = event.xy.x - buffer;
            minY = event.xy.y - buffer;
            maxX = event.xy.x + buffer;
            maxY = event.xy.y + buffer;
            var map = this.target.mapPanel.map;
            var tl = map.getLonLatFromPixel({x: minX, y: minY});
            var br = map.getLonLatFromPixel({x: maxX, y: maxY});
            filter = new OpenLayers.Filter.Spatial({
                type: OpenLayers.Filter.Spatial.BBOX,
                value: new OpenLayers.Bounds(tl.lon, br.lat, br.lon, tl.lat)
            });
        } else {
            filter = new OpenLayers.Filter.Spatial({
                type: OpenLayers.Filter.Spatial.WITHIN,
                value: result
            });
        }
        var spaces = (this.selectedGroup.get("spaces") || "").split(",");
        if (spaces.length && spaces[0]) {
            if (event[this.removeModifierKey]) {
                // remove from current selection
                filter = new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.AND,
                    filters: [
                        new OpenLayers.Filter.Logical({
                            type: OpenLayers.Filter.Logical.NOT,
                            filters: [filter]
                        }),
                        new OpenLayers.Filter.Logical({
                            type: OpenLayers.Filter.Logical.OR,
                            filters: [new OpenLayers.Filter.FeatureId({fids: spaces})]
                        })
                    ]
                });
            } else {
                // add to current selection
                filter = new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.OR,
                    filters: [
                        filter, new OpenLayers.Filter.FeatureId({fids: spaces})
                    ]
                });
            }
            
        }
        var featureManager = this.target.tools[this.featureManager];
        var group = this.selectedGroup;
        featureManager.loadFeatures(filter, function(features) {
            this.onFeatureLoad(features, group);
        }, this);
    },
    
    onFeatureLoad: function(features, group) {
        if (group !== this.selectedGroup) {
            // selection has changed, don't display spaces
            this.target.tools[this.featureManager].clearFeatures();
        } else {
            var existing = (group.get("spaces") || "").split(",");
            var len = features.length;
            var ids = new Array(len);
            var newIds = {};
            var id;
            for (var i=0; i<len; ++i) {
                id = features[i].fid.split(".").pop();
                newIds[id] = true;
                ids[i] = features[i].fid.split(".").pop();
            }
            var modified = (len !== existing.length);
            if (!modified) {
                for (i=0; i<len; ++i) {
                    if (!(existing[i] in newIds)) {
                        modified = true;
                        break;
                    }
                }
            }
            if (modified) {
                group.set("spaces", ids.join(","));
                this.groupFeatureManager.featureStore.save();
            }
        }
    }

});

Ext.preg(ParkingManager.GroupManager.prototype.ptype, ParkingManager.GroupManager);
