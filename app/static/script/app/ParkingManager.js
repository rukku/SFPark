

var ParkingManager = Ext.extend(gxp.Viewer, {

    defaultSourceType: "gx_wmssource",

    constructor: function(config) {

        this.popupCache = {};

        config.mapItems = [{
            xtype: "gx_zoomslider",
            vertical: true,
            height: 100
        }];

        config.portalItems = [{
            region: "center",
            layout: "border",
            tbar: {
                id: "paneltbar",
                items: [{
                    iconCls: "icon-geoexplorer",
                    disabled: true
                }, "SFPark", "-"]
            },
            items: [{
                xtype: "tabpanel",
                region: "west",
                width: 200,
                collapsible: true,
                split: true,
                collapseMode: "mini",
                activeTab: 0,
                items: [{
                    id: "tree",
                    title: "Layers",
                    xtype: "container",
                    layout: "fit"
                }, {
                    title: "Legend",
                    xtype: "gx_legendpanel",
                    defaults: {style: {padding: "5px"}}
                }]
            }, "map"]
        }];

        config.tools = [{
            ptype: "gx_layertree",
            outputTarget: "tree"
        }, {
            ptype: "gx_featuremanager",
            id: "featuremanager"
        }, {
            ptype: "gx_featureeditor",
            featureManager: "featuremanager",
            autoLoadFeatures: true,
            actionTarget: "paneltbar"
        }];

        ParkingManager.superclass.constructor.apply(this, arguments);
    }

});