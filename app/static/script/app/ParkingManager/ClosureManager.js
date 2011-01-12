/**
 * @require ParkingManager.js
 */

ParkingManager.ClosureManager = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_closuremanager */
    ptype: "app_closuremanager",
    
    /** api: config[spaceManager]
     *  ``String`` FeatureManager for the Spaces layer
     */
    
    /** api: config[closureFeatureManager]
     *  ``String`` FeatureManager for the Closures layer
     */
    
    /** private: property[geomModified]
     *  ``Object`` keys are feature ids of features with modified geometries;
     *  value is true
     */
    
    /** api: method[init]
     */
    init: function(target) {
        ParkingManager.ClosureManager.superclass.init.apply(this, arguments);
        
        var closureFeatureManager = target.tools[this.closureFeatureManager];
        this.geomModified = {};
        
        closureFeatureManager.on("layerchange", function() {
            closureFeatureManager.featureLayer.events.on({
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

        this.target.tools[this.spaceManager].showLayer(this.id);
    },
    
    setSpaces: function(feature) {
        var closureFeatureManager = this.target.tools[this.closureFeatureManager];
        var spaceManager = this.target.tools[this.spaceManager];
        var filter = new OpenLayers.Filter.Spatial({
            type: OpenLayers.Filter.Spatial.DWITHIN,
            value: feature.geometry,
            distance: 5
        });
        var rec = closureFeatureManager.featureStore.getRecordFromFeature(feature);
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

Ext.preg(ParkingManager.ClosureManager.prototype.ptype, ParkingManager.ClosureManager);
