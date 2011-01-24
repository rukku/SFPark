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

    /** api: config[nameColumnHeader]
     *  ``String``
     *  Header for the name column in details grid (i18n).
     */
    nameColumnHeader: "Name",

    /** api: config[valueColumnHeader]
     *  ``String``
     *  Header for the value column in details grid (i18n).
     */
    valueColumnHeader: "Value",
     
    /** api: config[detailsTitle]
     *  ``String``
     *  Title for details tab (i18n).
     */
    detailsTitle: "Details",

    /** api: config[fields]
     *  ``Array``
     *  List of field config objects corresponding to feature attributes.  If
     *  not provided, fields will be derived from attributes.
     */
    
    /** api: method[addActions]
     */
    addActions: function() {        

        if (!this.layer) {
            throw new Error("Configure StreetViewInfo with layer config.");
        }
        
        var action = new GeoExt.Action({
            tooltip: this.infoActionTip,
            iconCls: "gxp-icon-getfeatureinfo",
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
        
        this.target.createLayerRecord(this.layer, function(record) {
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
                maximizable: true,
                width: 310,
                height: 325,
                layout: "fit",
                items: [{
                    xtype: "tabpanel",
                    border: false,
                    activeTab: 0,
                    items: [{
                        xtype: "grid",
                        title: this.detailsTitle,
                        store: this.getAttributeStore(feature),
                        enableHdMenu: false,
                        columns: [
                            {header: this.nameColumnHeader, dataIndex: this.nameColumnHeader, sortable: false, width: 50},
                            {header: this.valueColumnHeader, dataIndex: this.valueColumnHeader, sortable: false}
                        ],
                        viewConfig: {
                            forceFit: true
                        }
                    }, {
                        xtype: "gxp_googlestreetviewpanel",
                        title: this.streetViewTitle,
                        zoom: 1
                    }]
                }]
            });
            this.popup.show();
        }
    },
    
    /** private: method[getAttributeStore]
     *  :arg feature:
     *
     *  Return a store with records corresponding to attribute names and 
     *  values.  Fields will be derived from the ``fields`` config property
     *  if given.  Only supporting field names now.  TODO: support field config.
     */
    getAttributeStore: function(feature) {
        var fields = this.fields;
        if (!fields) {
            fields = [];
            for (var name in feature.attributes) {
                fields.push(name);
            }
        }
        var len = fields.length;
        var data = new Array(len);
        for (var i=0; i<len; ++i) {
            name = fields[i];
            data[i] = [name, feature.attributes[name]];
        }
        
        return new Ext.data.ArrayStore({
            autoDestroy: true,
            fields: [this.nameColumnHeader, this.valueColumnHeader],
            data: data
        });
    }
    
});

Ext.preg(ParkingManager.StreetViewInfo.prototype.ptype, ParkingManager.StreetViewInfo);
