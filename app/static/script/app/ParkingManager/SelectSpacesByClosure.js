/**
 * @require ParkingManager.js
 */

ParkingManager.SelectSpacesByClosure = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_selectspacesbyclosure */
    ptype: "app_selectspacesbyclosure",
    
    /** api: config[spaceManager]
     *  ``String`` FeatureManager for the Spaces layer
     */
    
    /** api: config[closureManager]
     *  ``String`` FeatureManager for the Closures layer
    
    /** api: method[init]
     */
    init: function(target) {
        ParkingManager.SelectSpacesByClosure.superclass.init.apply(this, arguments);
        
        var closureManager = target.tools[this.closureManager];
        
        closureManager.on("layerchange", function() {
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
                    this.setSpaces(evt.feature);
                },
                scope: this
            });
        }, this);

        this.target.tools[this.spaceManager].showLayer(this.id);
    },
    
    setSpaces: function(feature) {
        var closureManager = this.target.tools[this.closureManager];
        var spaceManager = this.target.tools[this.spaceManager];
        var filter = new OpenLayers.Filter.Spatial({
            type: OpenLayers.Filter.Spatial.DWITHIN,
            value: feature.geometry,
            distance: 5
        });
        spaceManager.loadFeatures(filter, function(features) {
            var fids = new Array(features.length);
            for (var j=0,jj=features.length; j<jj; ++j) {
                fids[j] = features[j].fid;
            }
            var rec = closureManager.featureStore.getRecordFromFeature(feature);
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

Ext.preg(ParkingManager.SelectSpacesByClosure.prototype.ptype, ParkingManager.SelectSpacesByClosure);
