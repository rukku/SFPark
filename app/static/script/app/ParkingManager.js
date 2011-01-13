

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
                    layout: "fit"
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
            outputTarget: "group-editor",
            toggleGroup: "main",
            featureManager: "space-manager",
            layer: {
                source: "local",
                name: "sfpark:groups"
            }
        }, {
            ptype: "gx_featuremanager",
            id: "closure-manager",
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
            ptype: "gx_featureeditor",
            excludeFields: ["spaces"],
            featureManager: "closure-manager",
            snappingAgent: "curb-snapping",
            actionTarget: "closure-editor.tbar",
            toggleGroup: "main"
        }, {
            ptype: "app_closureeditor",
            spaceManager: "space-manager",
            closureManager: "closure-manager",
            outputTarget: "closure-editor"
        }, {
            ptype: "app_addremovespaces",
            spaceManager: "space-manager",
            featureManager: "closure-manager"
        }];

        ParkingManager.superclass.constructor.apply(this, arguments);
    }

});

// TODO: remove when http://trac.osgeo.org/openlayers/ticket/3010 is addressed
OpenLayers.Format.WFST.v1_1_0.prototype.writers.wfs.Value = function(obj) {
    var node;
    if(obj instanceof OpenLayers.Feature.Vector) {
        node = this.createElementNSPlus("wfs:Value");
        if (obj.geometry) {
            this.srsName = this.getSrsName(obj);
            var geom = this.writeNode("feature:_geometry", obj.geometry).firstChild;
            node.appendChild(geom);
        }
    } else {
        node = this.createElementNSPlus("wfs:Value", {value: obj});                
    }
    return node;
};
