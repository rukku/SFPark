/**
 * @require ParkingManager.js
 */

ParkingManager.ParkingInfoTool = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gx_wmsgetfeatureinfo */
    ptype: "app_parkinginfotool",
    
    /** api: config[outputTarget]
     *  ``String`` Popups created by this tool are added to the map by default.
     */
    outputTarget: "map",

    /** private: property[popup]
     *  ``GeoExt.Popup``
     */
    popup: null,

    /** api: config[infoActionTip]
     *  ``String``
     *  Text for feature info action tooltip (i18n).
     */
    infoActionTip: "Get Parking Space Info",

    /** api: config[streetViewTitle]
     *  ``String``
     *  Title for street view tab (i18n).
     */
    streetViewTitle: "Street View",
     
    /** api: config[detailsTitle]
     *  ``String``
     *  Title for details tab (i18n).
     */
    detailsTitle: "Details",
     
    /** api: method[addActions]
     */
    addActions: function() {
        
        var actions = ParkingManager.ParkingInfoTool.superclass.addActions.call(this, [
            new GeoExt.Action({
                tooltip: this.infoActionTip,
                iconCls: "gx-icon-getfeatureinfo",
                toggleGroup: this.toggleGroup,
                enableToggle: true,
                allowDepress: true,
                map: this.target.mapPanel.map,
                control: new OpenLayers.Control.WMSGetFeatureInfo({
                    maxFeatures: 1,
                    infoFormat: "application/vnd.ogc.gml",
                    queryVisible: false,
                    layers: [],
                    eventListeners: {
                        getfeatureinfo: this.displayPopup,
                        scope: this
                    }
                })
            })
        ]);

        this.target.on({
            ready: function() {
                // TODO: give the app a reference to spaces layer
                var store = this.target.mapPanel.layers;
                var index = store.findExact("name", "sfpark:spaces");
                var record = store.getAt(index);
                var layer = record.getLayer();
                this.actions[0].control.layers = [layer];
            },
            scope: this
        });
        
        return actions;
    },

    /** private: method[displayPopup]
     * :arg evt: the event object from a 
     *     :class:`OpenLayers.Control.GetFeatureInfo` control
     */
    displayPopup: function(event) {
        if (this.popup) {
            this.popup.close();
        }
        var feature = event.features && event.features[0];
        if (feature) {
            this.popup = new GeoExt.Popup({
                location: event.xy,
                map: this.target.mapPanel,
                items: [{
                    xtype: "tabpanel",
                    border: false,
                    activeTab: 0,
                    width: 300,
                    height: 300,
                    items: [{
                        xtype: "gx_googlestreetviewpanel",
                        title: this.streetViewTitle,
                        zoom: 1
                    }, {
                        xtype: "container",
                        title: this.detailsTitle,
                        autoScroll: true,
                        items: [{
                            xtype: "propertygrid",
                            autoHeight: true,
                            source: feature.attributes
                        }]
                    }]
                }]
            });
            this.popup.show();
        }
    }
    
});

Ext.preg(ParkingManager.ParkingInfoTool.prototype.ptype, ParkingManager.ParkingInfoTool);
