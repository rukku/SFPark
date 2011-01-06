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
            closureManager.featureStore.on({
                "add": function(store, records) {
                    var feature;
                    for (var i=records.length-1; i>=0; --i) {
                        feature = records[i].getFeature();
                        if (feature.state == OpenLayers.State.INSERT) {
                            this.setSpaces(store, records[i]);
                        }
                    }
                },
                "update": this.setSpaces,
                scope: this
            });
        }, this);
    },
    
    setSpaces: function(store, rec) {
        var spaceManager = this.target.tools[this.spaceManager];
        var feature = rec.getFeature();
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
            rec.set("spaces", fids.join(","));
        });
    }
    
});

Ext.preg(ParkingManager.SelectSpacesByClosure.prototype.ptype, ParkingManager.SelectSpacesByClosure);
