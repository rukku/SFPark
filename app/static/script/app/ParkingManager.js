

var ParkingManager = Ext.extend(gxp.Viewer, {

    defaultSourceType: "gx_wmssource",

    constructor: function(config) {

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
                width: 210,
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
                    layout: "fit",
                    tbar: []
                }, {
                    id: "group-editor",
                    title: "Group Management",
                    layout: "fit",
                    tbar: []
                }, {
                    id: "closure-editor",
                    title: "Closure Management",
                    layout: "fit",
                    tbar: []
                }]
            }, "map"]
        }];

        config.tools = [{
            ptype: "gx_zoomtoextent",
            actionTarget: "paneltbar"
        }, {
            ptype: "app_streetviewinfo",
            toggleGroup: "main",
            actionTarget: "paneltbar",
            infoActionTip: "Get Parking Space Info",
            layer: {
                source: "local",
                name: "sfpark:spaces"
            }
        }, {
            ptype: "gxp_googlegeocoder",
            outputTarget: "paneltbar",
            outputConfig: {
                emptyText: "Search for a location ...",
                listEmptyText: "- no matches -"
            }
        }, {
            ptype: "gx_layertree",
            outputTarget: "tree"
        }, {
            ptype: "gx_featuremanager",
            id: "space-manager",
            paging: false,
            autoSetLayer: false,
            maxFeatures: 250,
            layer: {
                source: "local",
                name: "sfpark:spaces"
            },
            symbolizer: {
                pointRadius: 6,
                fillColor: "red",
                strokeWidth: 2,
                strokeColor: "#ffcc33"
            }
        }, {
            ptype: "gx_snappingagent",
            id: "curb-snapping",
            targets: [{
                source: "local",
                name: "sfpark:city_curbs",
                maxResolution: 0.6,
                node: false,
                vertex: false
            }]
        }, {
            ptype: "gx_featureeditor",
            featureManager: "space-manager",
            snappingAgent: "curb-snapping",
            autoLoadFeatures: true,
            actionTarget: "space-editor.tbar",
            toggleGroup: "main"
        }, {
            ptype: "app_groupmanager",
            actionTarget: "group-editor.tbar",
            toggleGroup: "main",
            featureManager: "space-manager"
        }, {
            ptype: "gx_featuremanager",
            id: "closure-featuremanager",
            autoActivate: false,
            autoLoadFeatures: true,
            maxFeatures: 15,
            paging: true,
            autoZoomPage: true,
            layer: {
                source: "local",
                name: "sfpark:closures"
            }
        }, {
            ptype: "gx_featuregrid",
            featureManager: "closure-featuremanager",
            outputTarget: "closure-editor",
            alwaysDisplayOnMap: true,
        }, {
            ptype: "gx_featureeditor",
            excludeFields: ["spaces"],
            featureManager: "closure-featuremanager",
            snappingAgent: "curb-snapping",
            actionTarget: "closure-editor.tbar",
            toggleGroup: "main"
        }, {
            ptype: "app_closuremanager",
            spaceManager: "space-manager",
            closureManager: "closure-featuremanager"
        }, {
            ptype: "app_addremovespaces",
            spaceManager: "space-manager",
            featureManager: "closure-featuremanager"
        }];

        ParkingManager.superclass.constructor.apply(this, arguments);
    }

});
