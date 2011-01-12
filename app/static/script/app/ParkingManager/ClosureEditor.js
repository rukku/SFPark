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
                "featuremodified": function(evt) {
                    if (!evt.feature.attributes.spaces || this.geomModified[evt.feature.id]) {
                        delete this.geomModified[evt.feature.id];
                        this.setSpaces(evt.feature);
                    }
                },
                "vertexmodified": function(evt) {
                    this.geomModified[evt.feature.id] = true;
                },
                scope: this
            });
        }, this);

        // use the FeatureGrid plugin for this tool's feature grid
        new gxp.plugins.FeatureGrid({
            featureManager: this.closureManager,
            outputTarget: this.outputTarget,
            alwaysDisplayOnMap: true
        }).init(target);
    },
    
    addOutput: function(config) {
        ParkingManager.ClosureEditor.superclass.addOutput.apply(this, arguments);
        
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
            for (var j=0,jj=features.length; j<jj; ++j) {
                fids[j] = features[j].fid;
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
