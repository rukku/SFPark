

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
                    layout: "fit",
                    tbar: []
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
            ptype: "gx_zoomtoextent",
            actionTarget: "paneltbar",
            // TODO: make it so this works as map restrictedExtent
            extent: [-13650159, 4534735, -13609227, 4554724]
        }, {
            ptype: "app_parkinginfotool",
            toggleGroup: "main",
            actionTarget: "paneltbar"
        }, {
            ptype: "gx_layertree",
            outputTarget: "tree"
        }, {
            ptype: "gx_featuremanager",
            id: "space-manager",
            paging: false,
            autoSetLayer: false,
            layer: {
                source: "local",
                name: "sfpark:spaces"
            }
        }, {
            ptype: "gx_snappingagent",
            id: "curb-snapping",
            options: {
                node: false,
                vertex: false
            },
            targets: [{
                source: "local",
                name: "sfpark:city_curbs",
                maxResolution: 0.6
            }]
        }, {
            ptype: "gx_featureeditor",
            featureManager: "space-manager",
            snappingAgent: "curb-snapping",
            autoLoadFeatures: true,
            actionTarget: "space-editor.tbar",
            toggleGroup: "main"
        }, {
            ptype: "gx_featuremanager",
            id: "closure-manager",
            autoLoadFeatures: true,
            paging: false,
            autoSetLayer: false,
            layer: {
                source: "local",
                name: "sfpark:closures"
            }
        }, {
            ptype: "gx_featuregrid",
            featureManager: "closure-manager",
            outputTarget: "closure-editor"
        }, {
            ptype: "gx_featureeditor",
            excludeFields: ["spaces"],
            featureManager: "closure-manager",
            actionTarget: "closure-editor.tbar",
            toggleGroup: "main"
        }, {
            ptype: "app_selectspacesbyclosure",
            spaceManager: "space-manager",
            closureManager: "closure-manager"
        }, {
            ptype: "app_addremovespaces",
            spaceManager: "space-manager",
            featureManager: "closure-manager"
        }];

        ParkingManager.superclass.constructor.apply(this, arguments);
    }

});
