

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
                xtype: "panel",
                region: "west",
                layout: "accordion",
                width: 200,
                split: true,
                defaults: {
                    border: false
                },
                layoutConfig: {
                    animate: true,
                    fill: true
                },
                items: [{
                    id: "tree",
                    title: "Layers"
                }, {
                    id: "space-editor",
                    title: "Parking Spaces",
                    html: "parking space editor panel here"
                }, {
                    id: "group-editor",
                    title: "Group Management",
                    html: "group management panel here"
                }, {
                    id: "closure-editor",
                    title: "Closure Management",
                    layout: "fit",
                    tbar: []
                }]
            }, "map"]
        }];

        config.tools = [{
            ptype: "gx_layertree",
            outputTarget: "tree"
        }, {
            ptype: "gx_featuremanager",
            id: "featuremanager",
            paging: false
        }, {
            ptype: "gx_featureeditor",
            featureManager: "featuremanager",
            autoLoadFeatures: true,
            actionTarget: "paneltbar",
            toggleGroup: "main"
        }, {
            ptype: "app_parkinginfotool",
            toggleGroup: "main",
            actionTarget: "paneltbar"
        }, {
            ptype: "gx_featuremanager",
            id: "closuremanager",
            autoLoadFeatures: true,
            autoSetLayer: false,
            layer: {
                source: "local",
                name: "sfpark:closures"
            }
        }, {
            ptype: "gx_featuregrid",
            featureManager: "closuremanager",
            outputTarget: "closure-editor"
        }, {
            ptype: "gx_featureeditor",
            featureManager: "closuremanager",
            actionTarget: "closure-editor.tbar"
        }];
        

        ParkingManager.superclass.constructor.apply(this, arguments);
    }

});
