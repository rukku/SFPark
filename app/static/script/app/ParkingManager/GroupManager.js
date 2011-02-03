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
    addActionText: "Add",
    
    /** api: config[modifyActionTip]
     *  ``String``
     *  Text for box selection tooltip (i18n).
     */
    modifyActionTip: "Add to or remove from group",
    
    /** api: config[modifyActionText]
     *  ``String``
     *  Text for box selection button (i18n).
     */
    modifyActionText: "Edit",
    
    /** api: config[searchLabel]
     *  ``String``
     *  Label for search input (i18n).
     */
    searchLabel: "Search",
    
    /** api: config[id]
     *  ``String`` identifier for this tool. If provided, the
     *  :class:`gxp.plugins.FeatureManager` for managing the ``layer`` will be
     *  assigned the provided id with "-groupfeaturemanager" appended.
     */
    
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
    
    /** api: config[safePanels]
     *  ``Array`` List of ids of panels on the same accordion that are
     *  safe to switch to while this tool is active. When switching to any
     *  other panel, this tool will be activated.
     */
    
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
    
    /** private override */
    autoActivate: false,
    
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
            id: this.id ? this.id + "-groupfeaturemanager" : undefined,
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
                        this.addLayerEvents();
                    } else {
                        // no featureStore, remove components
                        this.container.gridContainer.removeAll();
                        this.removeLayerEvents();
                    }
                },
                scope: this
            }
        });
        this.groupFeatureManager.init(this.target);
    },
    
    addLayerEvents: function() {
        this.groupFeatureManager.featureLayer.events.on({
            "featureselected": this.onGroupSelect,
            "featureunselected": this.onGroupUnselect,
            scope: this
        });
    },
    
    removeLayerEvents: function() {
        this.groupFeatureManager.featureLayer.events.un({
            "featureselected": this.onGroupSelect,
            "featureunselected": this.onGroupUnselect,
            scope: this
        });
    },

    /** private: method[initContainer]
     *  Create the primary output container.  All other items will be added to 
     *  this when the group feature store is ready.
     */
    initContainer: function() {
        this.container = new Ext.Container(Ext.apply({
            layout: "border",
            items: [{
                layout: "form",
                region: "north",
                border: false,
                height: 74,
                bodyStyle: "padding: 5px",
                items: [{
                    xtype: "fieldset",
                    title: this.searchLabel,
                    items: [{
                        xtype: "textfield",
                        name: "keywords",
                        anchor: "100%",
                        hideLabel: true,
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
                }]
            }, {
                xtype: "container",
                layout: "fit",
                region: "center",
                ref: "gridContainer"
            }],
            contextMenu: new Ext.menu.Menu({
                items: []
            }),
            listeners: {
                added: function(panel, container) {
                    container.on({
                        "expand": this.activate,
                        "collapse": function() {
                            if (!this.safe) {
                                this.deactivate();
                            }
                        },
                        scope: this
                    });

                    if (this.safePanels) {
                        for (var i=this.safePanels.length-1; i>=0; --i) {
                            Ext.getCmp(this.safePanels[i]).on({
                                "beforeexpand": function() {this.safe = true;},
                                "collapse": function(panel) {
                                    this.safe = false;
                                    var activeItem = container.ownerCt.layout.activeItem.id;
                                    if (activeItem != this.outputTarget && this.safePanels.indexOf(activeItem) == -1) {
                                        this.deactivate();
                                    }
                                },
                                scope: this
                            });
                        }
                    }
                },
                scope: this
            }
        }, this.outputConfig));
        delete this.outputConfig;
    },
    
    activate: function() {
        if (ParkingManager.GroupManager.superclass.activate.apply(this, arguments)) {
            this.groupFeatureManager.activate();
            var spacesManager = this.target.tools[this.featureManager];
            spacesManager.clearFeatures();
            spacesManager.showLayer(this.id);
        }
    },

    deactivate: function() {
        if (ParkingManager.GroupManager.superclass.deactivate.apply(this, arguments)) {
            this.groupFeatureManager.deactivate();
            var spacesManager = this.target.tools[this.featureManager];
            spacesManager.clearFeatures();
            spacesManager.hideLayer(this.id);
        }
    },

    /** private: method[addComponents]
     *  Called when the feature store is ready.  At this point, we can add 
     *  components to the container.
     */
    addComponents: function() {
        var modify = this.modify;
        var layer = this.groupFeatureManager.featureLayer;
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
                        var feature = record.getFeature();
                        layer.selectedFeatures.push(feature);
                        layer.events.triggerEvent("featureselected", {feature: feature});
                    },
                    rowdeselect: function(sm, rowIndex, record) {
                        this.selectedGroup = null;
                        var feature = record.getFeature();
                        layer.selectedFeatures.remove(feature);
                        layer.events.triggerEvent("featureunselected", {feature: feature});
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
                },
                contextmenu: function(event) {
                    var rowIndex = grid.getView().findRowIndex(event.getTarget());
                    grid.getSelectionModel().selectRow(rowIndex);
                    this.container.contextMenu.showAt(event.getXY());
                    event.stopEvent();
                },
                scope: this
            }
        });
        
        this.container.gridContainer.add([grid]);
        
        if (this.container.gridContainer.rendered) {
            this.container.gridContainer.doLayout();
        }

    },
    
    onGroupSelect: function(evt) {
        var record = this.groupFeatureManager.featureStore.getRecordFromFeature(evt.feature);
        var spaces = (record.get("spaces") || "").split(",");
        if (spaces.length && spaces[0]) {
            var filter = new OpenLayers.Filter.FeatureId({fids: spaces});
            this.target.tools[this.featureManager].loadFeatures(filter, function(features) {
                this.onFeatureLoad(features, record);
            }, this);
        }
        this.modify.enable();
    },
    
    onGroupUnselect: function(evt) {
        this.target.tools[this.featureManager].clearFeatures();
        this.modify.control.deactivate();
        this.modify.disable();
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
