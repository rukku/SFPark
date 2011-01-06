/**
 * @require ParkingManager.js
 */

ParkingManager.AddRemoveSpaces = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_addremovespaces */
    ptype: "app_addremovespaces",
    
    /** api: config[spaceManager]
     *  ``String``
     */
    
     /** api: config[featureManager]
      *  ``String`` A FeatureManager with a selected layer with a spaces field
      *  that contains a comma separated list of fids
      */

    /** api: method[init]
     */
    init: function(target) {
        ParkingManager.AddRemoveSpaces.superclass.init.apply(this, arguments);

        var featureManager = this.target.tools[this.featureManager];
        featureManager.featureLayer.events.on({
            "beforefeaturemodified": function() {
                target.mapPanel.map.events.register("click", this, this.click);
            },
            "afterfeaturemodified": function() {
                target.mapPanel.map.events.unregister("click", this, this.click);
            },
            scope: this
        });
    },
    
    /** private: method[click]
     *  :arg evt: ``Object``
     */
    click: function(evt) {
        var spaceManager = this.target.tools[this.spaceManager];
        var featureManager = this.target.tools[this.featureManager];
        var size = this.target.mapPanel.map.getSize();
        var layer = spaceManager.layerRecord.getLayer();
        var store = new GeoExt.data.FeatureStore({
            fields: {},
            proxy: new GeoExt.data.ProtocolProxy({
                protocol: new OpenLayers.Protocol.HTTP({
                    url: layer.getFullRequestString({
                        REQUEST: "GetFeatureInfo",
                        BBOX: this.target.mapPanel.map.getExtent().toBBOX(),
                        WIDTH: size.w,
                        HEIGHT: size.h,
                        X: evt.xy.x,
                        Y: evt.xy.y,
                        QUERY_LAYERS: layer.params.LAYERS,
                        INFO_FORMAT: "application/vnd.ogc.gml",
                        EXCEPTIONS: "application/vnd.ogc.se_xml",
                        FEATURE_COUNT: 1
                    }),
                    format: new OpenLayers.Format.WMSGetFeatureInfo()
                })
            }),
            autoLoad: true,
            listeners: {
                "load": function(store, records) {
                    var selectedFeature = featureManager.featureLayer.selectedFeatures[0];
                    var spaces = selectedFeature.attributes.spaces;
                    var fids = spaces ? spaces.split(",") : [];
                    var feature, existingFeature;
                    for (var i=records.length-1; i>=0; --i) {
                        feature = records[i].getFeature();
                        if (spaceManager.featureLayer.getFeatureByFid(feature.fid)) {
                            fids.remove(feature.fid);
                        } else {
                            fids.push(feature.fid);
                        }
                    }
                    var rec = featureManager.featureStore.getRecordFromFeature(selectedFeature);
                    rec.set("spaces", fids.join(","));
                    var filter = new OpenLayers.Filter.FeatureId({fids: fids});
                    spaceManager.loadFeatures(filter);
                },
                scope: this
            }
        });
    }

});

Ext.preg(ParkingManager.AddRemoveSpaces.prototype.ptype, ParkingManager.AddRemoveSpaces);
