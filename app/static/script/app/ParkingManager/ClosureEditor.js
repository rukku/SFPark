/**
 * @require ParkingManager.js
 */

ParkingManager.ClosureEditor = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_closureeditor */
    ptype: "app_closureeditor",
    
    /** api: config[spaceManager]
     *  ``String`` FeatureManager for the Spaces layer
     */
    
    /** api: config[closureManager]
     *  ``String`` FeatureManager for the Closures layer
     */
    
    /** private: property[geomModified]
     *  ``Object`` keys are feature ids of features with modified geometries;
     *  value is true
     */
    
    /** api: method[init]
     */
    init: function(target) {
        ParkingManager.ClosureEditor.superclass.init.apply(this, arguments);
        
        var closureManager = target.tools[this.closureManager];
        this.geomModified = {};
        
        this.featureGridTarget = Ext.id();
        
        closureManager.on("layerchange", function() {
            target.tools[this.spaceManager].clearFeatures();
            closureManager.featureLayer.events.on({
                "featureselected": function(evt) {
                    evt.feature.state ?
                        this.setSpaces(evt.feature) :
                        this.selectSpaces(evt.feature);
                },
                "featureunselected": function(evt) {
                    target.tools[this.spaceManager].featureStore.removeAll();
                },
                "featureremoved": function(evt) {
                    target.tools[this.spaceManager].featureStore.removeAll();
                },
                "vertexmodified": function(evt) {
                    this.geomModified[evt.feature.id] = true;
                },
                "vertexremoved": function(evt) {
                    this.geomModified[evt.feature.id] = true;
                },
                scope: this
            });
            closureManager.featureStore.on({
                "update": function(store, record, operation) {
                    var feature = record.getFeature();
                    if (operation === Ext.data.Record.COMMIT) {
                        this.geomModified[feature.id] = true;
                    }
                    if (!feature.attributes.spaces || this.geomModified[feature.id]) {
                        delete this.geomModified[feature.id];
                        this.setSpaces(feature);
                    }
                },
                scope: this
            })
        }, this);

        // use the FeatureGrid plugin for this tool's feature grid
        new gxp.plugins.FeatureGrid({
            featureManager: this.closureManager,
            outputTarget: this.featureGridTarget,
            alwaysDisplayOnMap: true
        }).init(target);
    },
    
    addOutput: function(config) {
        var output = ParkingManager.ClosureEditor.superclass.addOutput.call(this, {
            xtype: "container",
            layout: "border",
            items: [{
                xtype: "form",
                region: "north",
                height: 163,
                labelWidth: 45,
                bodyStyle: "padding: 5px",
                items: [{
                    xtype: "textfield",
                    ref: "../description",
                    fieldLabel: "Search",
                    anchor: "100%"
                }, {
                    xtype: "fieldset",
                    title: "Date Range",
                    labelWidth: 80,
                    defaults: {anchor: "100%"},
                    items: [{
                        xtype: "datefield",
                        ref: "../../effectiveFrom",
                        fieldLabel: "Effective from",
                        format: "Y-m-d"
                    }, {
                        xtype: "datefield",
                        ref: "../../effectiveTo",
                        fieldLabel: "Effective to",
                        format: "Y-m-d"
                    }]                    
                }],
                buttons: [{
                    xtype: "button",
                    text: "Update list",
                    handler: function() {
                        var filters = [];
                        var description = output.description.getValue();
                        var effectiveFrom = output.effectiveFrom.getValue();
                        effectiveFrom = effectiveFrom instanceof Date ? effectiveFrom.format("Y-m-d\\Z") : "1970-01-01Z";
                        var effectiveTo = output.effectiveTo.getValue();
                        effectiveTo = effectiveTo instanceof Date ? effectiveTo.format("Y-m-d\\Z") : "2169-12-31Z";
                        if (output.description.getValue()) {
                            filters.push(new OpenLayers.Filter.Comparison({
                                type: OpenLayers.Filter.Comparison.LIKE,
                                property: "event_desc",
                                value: "*" + output.description.getValue() + "*"
                            }))
                        }
                        filters.push(new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Logical.OR,
                            filters: [
                                new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.BETWEEN,
                                    property: "eff_from_dt",
                                    lowerBoundary: effectiveFrom,
                                    upperBoundary: effectiveTo
                                }),
                                new OpenLayers.Filter.Comparison({
                                    type: OpenLayers.Filter.Comparison.BETWEEN,
                                    property: "eff_to_dt",
                                    lowerBoundary: effectiveFrom,
                                    upperBoundary: effectiveTo
                                })
                            ]
                        }))
                        var filter;
                        if (filters.length) {
                            filter = new OpenLayers.Filter.Logical({
                                type: OpenLayers.Filter.Logical.AND,
                                filters: filters
                            })
                        }
                        this.target.tools[this.closureManager].loadFeatures(filter);
                    },
                    scope: this
                }]
            }, {
                id: this.featureGridTarget,
                xtype: "container",
                region: "center",
                layout: "fit"
            }]
        });
        
        var container = Ext.getCmp(this.outputTarget) || this.target.portal[this.outputTarget];
        container.on({
            "expand": function() {
                this.target.tools[this.spaceManager].showLayer(this.id);
                this.target.tools[this.closureManager].activate();
            },
            "collapse": function() {
                this.target.tools[this.spaceManager].hideLayer(this.id);
                this.target.tools[this.closureManager].deactivate();
            },
            scope: this
        });
    },
    
    setSpaces: function(feature) {
        var closureManager = this.target.tools[this.closureManager];
        var spaceManager = this.target.tools[this.spaceManager];
        var filter = new OpenLayers.Filter.Spatial({
            type: OpenLayers.Filter.Spatial.DWITHIN,
            value: feature.geometry,
            distance: 5
        });
        var rec = closureManager.featureStore.getRecordFromFeature(feature);
        var currentFids = (rec.get("spaces") || "").split(",");
        spaceManager.loadFeatures(filter, function(features) {
            var fids = new Array(features.length);
            for (var i=features.length-1; i>=0; --i) {
                fids[i] = features[i].fid.replace("spaces.", "");
            }
            rec.set("spaces", fids.join(","));
        });
    },
    
    selectSpaces: function(feature) {
        if (feature.attributes.spaces) {
            var fids = feature.attributes.spaces.split(",");
            var filter = new OpenLayers.Filter.FeatureId({fids: fids});
            this.target.tools[this.spaceManager].loadFeatures(filter);
        }
    }
    
});

Ext.preg(ParkingManager.ClosureEditor.prototype.ptype, ParkingManager.ClosureEditor);
