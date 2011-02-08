//TODO configure this in index.html instead of making this global change once
// https://github.com/opengeo/gxp/issues#issue/14 is resolved.
OpenLayers.Layer.Google.v3.animationEnabled = false;

var ParkingManager = Ext.extend(gxp.Viewer, {

    defaultSourceType: "gxp_wmssource",

    constructor: function(config) {
        
        Ext.applyIf(config.map, {
            id: "map",
            region: "center",
            controls: [
                new OpenLayers.Control.Navigation({zoomWheelOptions: {interval: 250}}),
                new OpenLayers.Control.PanPanel({slideRatio: .5}),
                new OpenLayers.Control.ZoomPanel(),
                new OpenLayers.Control.Attribution()
            ]
        });
        
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
                }, "SFPark", "-", "-"]
            },
            items: [{
                xtype: "panel",
                region: "west",
                layout: "accordion",
                width: 210,
                split: true,
                collapsible: true,
                collapseMode: "mini",
                header: false,
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
                    tbar: {
                        id: "spacetbar",
                        cls: "sfpark",
                        items: ["->"]
                    }
                }, {
                    id: "group-editor",
                    title: "Group Management",
                    layout: "fit",
                    tbar: ["->"]
                }, {
                    id: "closure-editor",
                    title: "Closure Management",
                    layout: "fit",
                    tbar: {
                        id: "closuretbar",
                        cls: "sfpark",
                        items: ["->"]
                    }
                }]
            }, {
                region: "south",
                id: "grid",
                layout: "fit",
                height: 200,
                border: false,
                split: true,
                collapsible: true,
                collapsed: true,
                collapseMode: "mini",
                header: false,
                //TODO move this to its own component - no js code in this
                // config object please
                listeners: {
                    collapse: function() {
                        this.tools["generic-featuremanager"].clearFeatures();
                    },
                    beforeexpand: function() {
                        var featureStore = this.tools["generic-featuremanager"].featureStore;
                        if (!(featureStore && featureStore.getCount())) {
                            //TODO use action's handler in gxp.plugins.Tool to
                            // de-uglify this.
                            featureStore && this.tools["query-form"].actions[0].items[0].fireEvent("click");
                            return false;
                        }
                    },
                    scope: this
                }
            }, "map"]
        }];

        config.tools = [{
            ptype: "gxp_zoomtoextent",
            actionTarget: {target: "paneltbar", index: 3}
        }, {
            ptype: "gxp_navigationhistory",
            actionTarget: {target: "paneltbar", index: 4}
        }, {
            ptype: "gxp_measure",
            actionTarget: {target: "paneltbar", index: 6},
            toggleGroup: "main"
        }, {
            ptype: "app_streetviewinfo",
            toggleGroup: "main",
            actionTarget: "paneltbar",
            outputConfig: {width: 450, height: 425},
            infoActionTip: "Get Parking Space Info",
            headingAttribute: "orientatio",
            layer: {
                source: "local",
                name: "sfpark:spaces"
            },
            fields: config.spacesFields,
            tolerance: 6 // pixel radius around center point
        }, {
            ptype: "gxp_googlegeocoder",
            outputTarget: "paneltbar",
            outputConfig: {
                emptyText: "Search for a location ...",
                listEmptyText: "- no matches -"
            }
        }, {
            ptype: "gxp_layertree",
            outputConfig: {
                id: "layertree",
                tbar: []
            },
            outputTarget: "tree"
        }, {
            ptype: "gxp_addlayers",
            actionTarget: "layertree.tbar"
        }, {
            ptype: "gxp_removelayer",
            actionTarget: ["layertree.tbar", "layertree.contextMenu"]
        }, {
            ptype: "gxp_featuremanager",
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
                fillColor: "#ff0000",
                strokeWidth: 2,
                strokeColor: "#ffcc33"
            }
        }, {
            ptype: "gxp_snappingagent",
            id: "curb-snapping",
            targets: [{
                source: "local",
                name: "sfpark:city_curbs",
                maxResolution: 0.6,
                node: false,
                vertex: false,
                tolerance: 10 // in pixels - default is 10
            }]
        }, {
            ptype: "app_spaceseditor",
            featureManager: "space-manager",
            snappingAgent: "curb-snapping",
            autoLoadFeatures: true,
            actionTarget: {target: "spacetbar", index: 0},
            outputTarget: "space-editor",
            outputConfig: {title: "Parking Space"},
            toggleGroup: "main",
            createFeatureActionText: "Add",
            createFeatureActionTip: "Create a new parking space",
            editFeatureActionText: "Edit",
            editFeatureActionTip: "Select and edit an existing parking space",
            fields: config.spacesFields,
            tolerance: 6 // pixel radius around center point
        }, {
            ptype: "gxp_deleteselectedfeatures",
            featureManager: "space-manager",
            buttonText: "Delete",
            tooltip: "Delete the selected parking space",
            deleteFeatureMsg: "Are you sure you want to delete this parking space?",
            actionTarget: {target: "spacetbar", index: 2}
        }, {
            ptype: "gxp_zoomtoselectedfeatures",
            featureManager: "space-manager",
            actionTarget: "spacetbar",
            tooltip: "Zoom to selected parking space"
        }, {
            ptype: "app_groupmanager",
            id: "group-manager",
            safePanels: ["tree"],
            outputTarget: "group-editor",
            outputConfig: {
                id: "groupgridcontainer"
            },
            actionTarget: {target: "group-editor.tbar", index: 0},
            toggleGroup: "main",
            featureManager: "space-manager",
            layer: {
                source: "local",
                name: "sfpark:groups"
            },
            symbolizer: {
                strokeColor: "#000000",
                strokeWidth: 1,
                strokeDashstyle: "dot",
                fillColor: "#ff0000",
                fillOpacity: 0.2
            }
        }, {
            ptype: "gxp_deleteselectedfeatures",
            featureManager: "group-manager-groupfeaturemanager",
            buttonText: "Delete",
            tooltip: "Delete the selected group",
            deleteFeatureMsg: "Are you sure you want to delete this group?",
            actionTarget: {target: "group-editor.tbar", index: 2}
        }, {
            ptype: "gxp_zoomtodataextent",
            featureManager: "space-manager",
            actionTarget: "group-editor.tbar",
            tooltip: "Zoom to selected group"
        }, {
            ptype: "gxp_featuremanager",
            id: "closure-manager",
            autoActivate: false,
            maxFeatures: 50,
            autoLoadFeatures: true,
            paging: true,
            layer: {
                source: "local",
                name: "sfpark:closures"
            }
        }, {
            ptype: "gxp_featureeditor",
            excludeFields: ["spaces"],
            featureManager: "closure-manager",
            snappingAgent: "curb-snapping",
            actionTarget: {target: "closuretbar", index: 0},
            outputConfig: {title: "Closure"},
            toggleGroup: "main",
            createFeatureActionText: "Add",
            createFeatureActionTip: "Create a new closure",
            editFeatureActionText: "Edit",
            editFeatureActionTip: "Select and edit an existing closure"
        }, {
            ptype: "gxp_deleteselectedfeatures",
            featureManager: "closure-manager",
            buttonText: "Delete",
            tooltip: "Delete the selected closure",
            deleteFeatureMsg: "Are you sure you want to delete this closure?",
            actionTarget: {target: "closuretbar", index: 2}
        }, {
            ptype: "gxp_zoomtoselectedfeatures",
            featureManager: "closure-manager",
            actionTarget: "closuretbar",
            tooltip: "Zoom to selected closure"
        }, {
            ptype: "app_closureeditor",
            id: "closureeditor",
            safePanels: ["tree"],
            spacesManager: "space-manager",
            closureManager: "closure-manager",
            outputTarget: "closure-editor"
        }, {
            ptype: "gxp_featuremanager",
            id: "generic-featuremanager",
            maxFeatures: 50,
            symbolizer: {
                pointRadius: 6,
                graphicName: "circle",
                fillColor: "#ff0000",
                fillOpacity: 0.4,
                strokeWidth: 2,
                strokeColor: "#ffcc33",
                strokeOpacity: 0.8
            }
        }, {
            ptype: "gxp_wmsfilterview",
            featureManager: "generic-featuremanager"
        }, {
            ptype: "gxp_featuregrid",
            id: "featuregrid",
            featureManager: "generic-featuremanager",
            outputTarget: "grid",
            outputConfig: {id: "featuregrid-output"},
            showDisplayButton: false,
            selectOnMap: true,
            autoExpand: true,
            autoCollapse: true,
            tolerance: 6 // pixel radius around point/line center
        }, {
            ptype: "gxp_zoomtoselectedfeatures",
            featureManager: "generic-featuremanager",
            actionTarget: "featuregrid-output.bbar",
            buttonText: "Zoom to selection"
        }, {
            ptype: "gxp_queryform",
            id: "query-form",
            featureManager: "generic-featuremanager",
            autoHide: true,
            actionTarget: ["layertree.tbar", "layertree.contextMenu"],
            outputConfig: {
                width: 350,
                title: "Query Layer",
                modal: true,
                closeAction: "hide"
            }
        }].concat(config.tools);

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
