//TODO configure this in index.html instead of making this global change once
// https://github.com/opengeo/gxp/issues#issue/14 is resolved.
OpenLayers.Layer.Google.v3.animationEnabled = false;

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
            },
            fields: [
                "status", "postid", "spaceid", "msid", "msspcnum", "cap color", 
                "streetname", "sensor", "sensorid", "sfparkarea", "onoffstr", 
                "cnn", "olstreetid", "blocfaceid", "jurisdict", "pmd", "pmd_name", 
                "enforbeat", "subroute", "olratearea", "numeter", "olmetertyp", 
                "numetertyp", "oltimelimt", "opsch1fm", "opsch1to", "opsch1day", 
                "opsch1tl", "opsch1ppy", "opsch2fm", "opsch2to", "opsch2day", 
                "opsch2tl", "opsch2ppy", "tow1fm", "tow1to", "tow1days", "tow2fm", 
                "tow2to", "tow2days", "altsch1clr", "altsch1des", "altsch1fm", 
                "altsch1to", "altsch1day", "altsch1tl", "altsch2clr", "altsch2des", 
                "altsch2fm", "altsch2to", "altsch2day", "altsch2tl", "altsch3clr", 
                "altsch3des", "altsch3fm", "altsch3to", "altsch3day", "altsch3tl", 
                "altsch4clr", "altsch4des", "altsch4fm", "altsch4to", "altsch4day", 
                "altsch4tl", "altsch5clr", "altsch5des", "altsch5fm", "altsch5to", 
                "altsch5day", "altsch5tl"
            ]
        }, {
            ptype: "gxp_googlegeocoder",
            outputTarget: "paneltbar",
            outputConfig: {
                emptyText: "Search for a location ...",
                listEmptyText: "- no matches -"
            }
        }, {
            ptype: "gx_layertree",
            outputConfig: {
                id: "layertree",
                tbar: []
            },
            outputTarget: "tree"
        }, {
            ptype: "gxp_addlayers",
            actionTarget: "layertree.tbar"
        }, {
            ptype: "gx_removelayer",
            actionTarget: ["layertree.tbar", "layertree.contextMenu"]
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
            toggleGroup: "main",
            createFeatureActionText: "new space",
            editFeatureActionText: "modify space"
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
            toggleGroup: "main",
            createFeatureActionText: "new closure",
            editFeatureActionText: "modify closure"
        }, {
            ptype: "app_closureeditor",
            spaceManager: "space-manager",
            closureManager: "closure-manager",
            outputTarget: "closure-editor"
        }/*, {
            ptype: "app_addremovespaces",
            spaceManager: "space-manager",
            featureManager: "closure-manager"
        }*/];

        ParkingManager.superclass.constructor.apply(this, arguments);
    }

});

// TODO: remove when this is addressed http://trac.osgeo.org/openlayers/ticket/3012
OpenLayers.Filter.FeatureId.prototype.type = "FID";
OpenLayers.Format.WFST.v1_1_0.prototype.writeFeatureIdNodes = function(filter, node) {
    for (var i=0, ii=filter.fids.length; i<ii; ++i) {
        this.writeNode("FeatureId", filter.fids[i], node);
    }
};
OpenLayers.Util.extend(OpenLayers.Format.WFST.v1_1_0.prototype.writers.ogc, {
    "Filter": function(filter) {
        var node = this.createElementNSPlus("ogc:Filter");
        if (filter.type === "FID") {
            this.writeFeatureIdNodes(filter, node);
        } else {
            this.writeNode(this.getFilterType(filter), filter, node);
        }
        return node;
    },
    "And": function(filter) {
        var node = this.createElementNSPlus("ogc:And");
        var childFilter;
        for (var i=0, ii=filter.filters.length; i<ii; ++i) {
            childFilter = filter.filters[i];
            if (childFilter.type === "FID") {
                this.writeFeatureIdNodes(childFilter, node);
            } else {
                this.writeNode(
                    this.getFilterType(childFilter), childFilter, node
                );
            }
        }
        return node;
    },
    "Or": function(filter) {
        var node = this.createElementNSPlus("ogc:Or");
        var childFilter;
        for (var i=0, ii=filter.filters.length; i<ii; ++i) {
            childFilter = filter.filters[i];
            if (childFilter.type === "FID") {
                this.writeFeatureIdNodes(childFilter, node);
            } else {
                this.writeNode(
                    this.getFilterType(childFilter), childFilter, node
                );
            }
        }
        return node;
    },
    "Not": function(filter) {
        var node = this.createElementNSPlus("ogc:Not");
        var childFilter = filter.filters[0];
        if (childFilter.type === "FID") {
            this.writeFeatureIdNodes(childFilter, node);
        } else {
            this.writeNode(
                this.getFilterType(childFilter), childFilter, node
            );
        }
        return node;
    }    
});
