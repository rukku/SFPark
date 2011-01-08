/**
 * @require ParkingManager.js
 */

ParkingManager.GroupManager = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gx_wmsgetfeatureinfo */
    ptype: "app_groupmanager",
    
    /** api: config[boxActionTip]
     *  ``String``
     *  Text for box selection tooltip (i18n).
     */
    boxActionTip: "Select Features in a Box",
    
    /** api: config[clickBuffer]
     *  ``Number``
     *  Clicks will be treated as boxes with pixel width and height that is twice
     *  this value.  Default is 3 (meaning a 6x6 pixel box will be used).
     */
    clickBuffer: 3,

    /** api: method[addActions]
     */
    addActions: function() {

        var tool = this;

        var box = new GeoExt.Action({
            tooltip: this.boxActionTip,
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
                },
                eventListeners: {
                    activate: function() {
                        var manager = tool.target.tools[tool.featureManager];
                        manager.clearFeatures();
                    },
                    deactivate: function() {
                        var manager = tool.target.tools[tool.featureManager];
                        manager.clearFeatures();
                    }
                }
            }))()
        });

        return ParkingManager.GroupManager.superclass.addActions.call(this, [box]);

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
    }

});

Ext.preg(ParkingManager.GroupManager.prototype.ptype, ParkingManager.GroupManager);
