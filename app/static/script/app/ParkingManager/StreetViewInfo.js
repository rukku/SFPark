/**
 * @require ParkingManager.js
 */

ParkingManager.StreetViewInfo = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = app_streetviewinfo */
    ptype: "app_streetviewinfo",
    
    /** private: property[popup]
     *  ``GeoExt.Popup``
     */
    popup: null,

    /** api: config[infoActionTip]
     *  ``String``
     *  Text for feature info action tooltip (i18n).
     */
    infoActionTip: "Get Info",

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

        if (!this.layer) {
            throw new Error("Configure StreetViewInfo with layer config.");
        }
        
        var action = new GeoExt.Action({
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
        });
        
        this.target.getLayerRecord(this.layer, function(record) {
            action.control.layers = [record.getLayer()];
        });

        return ParkingManager.StreetViewInfo.superclass.addActions.call(this, [action]);
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
                        xtype: "container",
                        title: this.detailsTitle,
                        autoScroll: true,
                        items: [{
                            xtype: "propertygrid",
                            autoHeight: true,
                            source: feature.attributes
                        }]
                    }, {
                        xtype: "gx_googlestreetviewpanel",
                        title: this.streetViewTitle,
                        zoom: 1
                    }]
                }]
            });
            this.popup.show();
        }
    }
    
});

Ext.preg(ParkingManager.StreetViewInfo.prototype.ptype, ParkingManager.StreetViewInfo);
